from database_client import DatabaseClient
from source_storage import SourceStorage
from typing import Dict, List, Optional, TypedDict

class ColumnMetadata(TypedDict):
    column_name: str

TableMetadata = Dict[str, List[ColumnMetadata]]

class DatabaseReplicator:
    def __init__(self, source: SourceStorage, client: DatabaseClient):
        self.source = source
        self.client = client

    def create_tables_from_parquet(self) -> None:
        parquet_files = self.source.list_files_dataset(".parquet") # List parquet files in storage
        for parquet_file in parquet_files:
            table_name = parquet_file.split("/")[-1].split(".")[0]

            tmp_path = self.source.download_file_dataset(f"{table_name}.parquet") # Make tmp path and download file to tmp path
            self.client.execute(f'CREATE OR REPLACE TABLE "{table_name}" AS SELECT * FROM read_parquet("{tmp_path}")') # Create table from parquet file
            self.source.cleanup_tmp_file_dataset(f"{table_name}.parquet") # Cleanup tmp file
        self.client.close()

    def export_tables_to_parquet(self, tables_metadata: Optional[TableMetadata] = None) -> None:
        if tables_metadata is None:
            return

        for table_name, columns in tables_metadata.items():
            column_names = ", ".join(f'"{column["column_name"]}"' for column in columns)

            result = self.client.execute(f'SELECT {column_names} FROM db."{table_name}"')
            result_df = result.fetchdf()

            tmp_path = self.source.make_tmp_file_dataset(f"{table_name}.parquet") # Make tmp path
            result_df.to_parquet(tmp_path) # Save parquet to tmp path
            self.source.upload_file_dataset(f"{table_name}.parquet") # Upload file to storage and cleanup tmp path
        self.client.close()
