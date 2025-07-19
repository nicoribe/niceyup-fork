import os
from typing import Optional
from storage_provider import StorageProvider

class SourceStorage:
    def __init__(
        self,
        workspace_id: str,
        source_id: str,
        storage: StorageProvider,
    ):
        self.workspace_id = workspace_id
        self.source_id = source_id
        self.storage = storage

    def root_path(self) -> str:
        return f"workspace/{self.workspace_id}/sources/{self.source_id}"

    def make_tmp_path(self, path: Optional[str] = None) -> str:
        tmp_path = os.path.join(self.root_path(), path or "")
        self.storage.make_tmp_path(tmp_path)
        return tmp_path

    def cleanup_tmp_path(self, path: Optional[str] = None) -> None:
        tmp_path = os.path.join(self.root_path(), path or "")
        self.storage.cleanup_tmp_path(tmp_path)

    def upload_file_dataset(self, file_name: str) -> None:
        file_path = os.path.join(self.root_path(), f"datasets/{file_name}")
        self.storage.upload_tmp_file(file_path)

    def download_file_dataset(self, file_name: str) -> str:
        full_path = os.path.join(self.root_path(), f"datasets/{file_name}")
        return self.storage.client.download_tmp_file(full_path)
    
    def cleanup_tmp_file_dataset(self, file_name: str) -> None:
        self.cleanup_tmp_path(f"datasets/{file_name}")

    def list_files_dataset(self, extension: Optional[str] = None) -> list[str]:
        key = os.path.join(self.root_path(), "datasets")
        return self.storage.list_files(key, extension)
