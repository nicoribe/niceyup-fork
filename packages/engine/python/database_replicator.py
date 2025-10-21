from typing import List, Optional, TypedDict

from source_storage import SourceStorage
from database_client import DatabaseClient

class ColumnMetadata(TypedDict):
    name: str

class TableMetadata(TypedDict):
    name: str
    columns: List[ColumnMetadata]

class DatabaseReplicator:
    def __init__(self, source: SourceStorage, db_client: DatabaseClient):
        self.source = source
        self.db_client = db_client

    # ----------------- #
    #  Parquet methods  #
    # ----------------- #

    def create_tables_from_parquet(self, table_names: Optional[List[str]] = None) -> None:
        if table_names is None or len(table_names) == 0:
            table_names = []

            parquet_files = self.source.list_dataset_files(".parquet") # List parquet files in storage

            for parquet_file in parquet_files:
                table_names.append(parquet_file.split("/")[-1].split(".")[0])

        for table_name in table_names:
            file_path = self.source.download_dataset_file(f"{table_name}.parquet")

            self.db_client.execute(f'CREATE OR REPLACE TABLE "{table_name}" AS SELECT * FROM read_parquet("{file_path}")') # Create table from parquet file

            # self.source.cleanup_dataset_file_path(f"{table_name}.parquet")

        self.db_client.close()

    def export_tables_to_parquet(self, tables_metadata: Optional[List[TableMetadata]] = None) -> None:
        if tables_metadata is None:
            return

        for table in tables_metadata:
            column_names = ", ".join(f'"{column["name"]}"' for column in table["columns"])

            result = self.db_client.execute(f'SELECT {column_names} FROM db."{table["name"]}"')
            result_df = result.fetchdf()

            file_path = self.source.make_dataset_file_path(f'{table["name"]}.parquet')
            result_df.to_parquet(file_path)
            self.source.upload_dataset_file(f'{table["name"]}.parquet')

        self.db_client.close()
