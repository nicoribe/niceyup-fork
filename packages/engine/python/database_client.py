import duckdb
import uuid
import os
from typing import List, Optional, TypedDict
from sqlalchemy import create_engine, inspect, Engine

class ColumnMetadata(TypedDict):
    name: str
    data_type: str
    foreign_table: Optional[str]
    foreign_column: Optional[str]

class TableMetadata(TypedDict):
    name: str
    columns: List[ColumnMetadata]

class DatabaseClient:
    def __init__(
        self,
        dialect: Optional[str] = None,
        host: Optional[str] = None,
        port: Optional[str] = None,
        user: Optional[str] = None,
        password: Optional[str] = None,
        database: Optional[str] = None,
        schema: Optional[str] = None,
        file_path: Optional[str] = None,
        tmp_dir: str = "/tmp",
    ):
        self.dialect = dialect
        self.host = host
        self.port = port
        self.user = user
        self.password = password
        self.database = database
        self.schema = schema
        self.file_path = file_path

        self._uuid = str(uuid.uuid4())
        if os.environ["PYTHON_ENV"] == "development":
            tmp_dir = "./tmp"
        self.tmp_dir = tmp_dir
        self.conn: Optional[duckdb.DuckDBPyConnection] = None

    def db_tmp_path(self) -> str:
        return f"{self.tmp_dir}/{self._uuid}.db"

    def uri(self) -> str:
        return f"duckdb:///{self.db_tmp_path()}"

    def create_engine(self) -> Engine:
        if self.dialect == "sqlite":
            return create_engine(f"sqlite:///{self.file_path}")
        
        elif self.dialect == "mysql":
            return create_engine(f"mysql+pymysql://{self.user}:{self.password}@{self.host}:{self.port}/{self.database}")
        
        elif self.dialect == "postgresql":
            return create_engine(f"postgresql+pg8000://{self.user}:{self.password}@{self.host}:{self.port}/{self.database}")
        
        else:
            return create_engine(self.uri())

    def get_db_schema(self) -> List[TableMetadata]:
        engine = self.create_engine()
        inspector = inspect(engine)

        tables_metadata_dict = {}
        for table_name in inspector.get_table_names(schema=self.schema):
            columns = inspector.get_columns(table_name)
            foreign_keys = inspector.get_foreign_keys(table_name)
            tables_metadata_dict[table_name] = {
                "name": table_name,
                "columns": [],
            }
            for col in columns:
                column_name = col['name']
                data_type = str(col['type'])
                fk = next((fk for fk in foreign_keys if column_name in fk['constrained_columns']), None)
                foreign_table = fk['referred_table'] if fk else None
                foreign_column = fk['referred_columns'][0] if fk else None
                tables_metadata_dict[table_name]["columns"].append({
                    "name": column_name,
                    "data_type": data_type,
                    "foreign_table": foreign_table,
                    "foreign_column": foreign_column,
                })
        tables_metadata = list(tables_metadata_dict.values())

        engine.dispose()
        return tables_metadata

    def execute(self, sql: str) -> duckdb.DuckDBPyConnection:
        if self.conn is None:
            self.connect()
        
        if self.conn is None:
            raise RuntimeError("Database connection not established.")
        
        return self.conn.execute(sql)

    def connect(self) -> None:
        if self.conn is not None:
            return
        
        self.make_tmp_path()
        self.conn = duckdb.connect(database=self.db_tmp_path())
        
        if self.dialect == "sqlite":
            self.conn.install_extension("sqlite")
            self.conn.load_extension("sqlite")
            self.conn.execute(f"ATTACH '{self.file_path}' AS db (TYPE sqlite, READ_ONLY)")
        
        elif self.dialect == "mysql":
            self.conn.install_extension("mysql")
            self.conn.load_extension("mysql")
            self.conn.execute(f"ATTACH 'host={self.host} port={self.port} user={self.user} password={self.password} database={self.database}' AS db (TYPE mysql, READ_ONLY)")
        
        elif self.dialect == "postgresql":
            self.conn.install_extension("postgres")
            self.conn.load_extension("postgres")
            self.conn.execute(f"ATTACH 'host={self.host} port={self.port} user={self.user} password={self.password} dbname={self.database}' AS db (TYPE postgres, SCHEMA '{self.schema}', READ_ONLY)")

    def close(self) -> None:
        if self.conn is not None:
            self.conn.close()
            self.conn = None

    def make_tmp_path(self) -> None:
        if not os.path.exists(self.tmp_dir):
            os.makedirs(self.tmp_dir)

    def cleanup_tmp_path(self) -> None:
        if os.path.exists(self.db_tmp_path()):
            os.remove(self.db_tmp_path())

    def dispose(self) -> None:
        self.close()
        self.cleanup_tmp_path()
