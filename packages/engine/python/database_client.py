import duckdb
from sqlalchemy import create_engine, inspect
from typing import Optional

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
    ):
        self.dialect = dialect
        self.host = host
        self.port = port
        self.user = user
        self.password = password
        self.database = database
        self.schema = schema
        self.file_path = file_path
        self.conn = None

    def _create_engine(self):
        if self.dialect == "sqlite":
            return create_engine(f"sqlite:///{self.file_path}")
        
        elif self.dialect == "mysql":
            return create_engine(f"mysql+pymysql://{self.user}:{self.password}@{self.host}:{self.port}/{self.database}")
        
        elif self.dialect == "postgresql":
            return create_engine(f"postgresql+pg8000://{self.user}:{self.password}@{self.host}:{self.port}/{self.database}")
        
        raise ValueError(f"Invalid dialect: {self.dialect}")

    def get_db_schema(self):
        engine = self._create_engine()
        inspector = inspect(engine)

        tables_metadata = []
        for table_name in inspector.get_table_names(schema=self.schema):
            columns = inspector.get_columns(table_name)
            foreign_keys = inspector.get_foreign_keys(table_name)
            for col in columns:
                column_name = col['name']
                data_type = str(col['type'])
                fk = next((fk for fk in foreign_keys if column_name in fk['constrained_columns']), None)
                foreign_table = fk['referred_table'] if fk else None
                foreign_column = fk['referred_columns'][0] if fk else None
                tables_metadata.append({
                    "table_name": table_name,
                    "column_name": column_name,
                    "data_type": data_type,
                    "foreign_table": foreign_table,
                    "foreign_column": foreign_column,
                })
        return tables_metadata

    def connect(self):
        if self.conn is not None:
            return
        
        self.conn = duckdb.connect()
        
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

    def execute(self, sql):
        if self.conn is None:
            self.connect()
        
        if self.conn is None:
            raise RuntimeError("Database connection not established.")
        
        return self.conn.execute(sql)

    def close(self):
        if self.conn is not None:
            self.conn.close()
            self.conn = None
