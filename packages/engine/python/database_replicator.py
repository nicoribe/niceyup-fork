from database_client import DatabaseClient

class DatabaseReplicator:
    def __init__(self, client: DatabaseClient):
        self.client = client

    def replicate(self, tables_metadata):
        self.client.connect()

        for table_name, column_names in tables_metadata.items():
            self.client.export_table_to_parquet(table_name, column_names)

        self.client.close()
