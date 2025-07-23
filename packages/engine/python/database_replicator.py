from typing import List, Optional, TypedDict
from database_client import DatabaseClient
from source_storage import SourceStorage

class ColumnMetadata(TypedDict):
    name: str

class TableMetadata(TypedDict):
    name: str
    columns: List[ColumnMetadata]

class DatabaseReplicator:
    def __init__(self, source: SourceStorage, client: DatabaseClient):
        self.source = source
        self.client = client

    def create_tables_from_parquet(self, table_names: Optional[List[str]] = None) -> None:
        if table_names is None:
            table_names = []
            parquet_files = self.source.list_files_dataset(".parquet") # List parquet files in storage
            for parquet_file in parquet_files:
                table_names.append(parquet_file.split("/")[-1].split(".")[0])

        for table_name in table_names:
            tmp_path = self.source.download_file_dataset(f"{table_name}.parquet") # Make tmp path and download file to tmp path
            self.client.execute(f'CREATE OR REPLACE TABLE "{table_name}" AS SELECT * FROM read_parquet("{tmp_path}")') # Create table from parquet file
            self.source.cleanup_tmp_file_dataset(f"{table_name}.parquet") # Cleanup tmp file
        self.client.close()

    def export_tables_to_parquet(self, tables_metadata: Optional[List[TableMetadata]] = None) -> None:
        if tables_metadata is None:
            return

        for table in tables_metadata:
            column_names = ", ".join(f'"{column["name"]}"' for column in table["columns"])

            result = self.client.execute(f'SELECT {column_names} FROM db."{table["name"]}"')
            result_df = result.fetchdf()

            tmp_path = self.source.make_tmp_file_dataset(f'{table["name"]}.parquet') # Make tmp path
            result_df.to_parquet(tmp_path) # Save parquet to tmp path
            self.source.upload_file_dataset(f'{table["name"]}.parquet') # Upload file to storage and cleanup tmp path
        self.client.close()
