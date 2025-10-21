import os

from typing import List, Optional

from storage_provider import StorageProvider

class SourceStorage:
    def __init__(self, source_id: str):
        self.source_id = source_id

        self._storage = StorageProvider()

    def root_path(self) -> str:
        return os.path.join("sources", self.source_id)

    # ----------------- #
    #  Dataset methods  #
    # ----------------- #

    def make_dataset_file_path(self, file_name: str) -> str:
        dataset_path = os.path.join("datasets", file_name)

        return self._make_tmp_path(dataset_path)

    # def cleanup_dataset_file_path(self, file_name: str) -> None:
    #     dataset_path = os.path.join("datasets", file_name)

    #     self._cleanup_tmp_path(dataset_path)

    def upload_dataset_file(self, file_name: str) -> None:
        dataset_path = os.path.join("datasets", file_name)
        file_path = os.path.join(self.root_path(), dataset_path)

        self._storage.upload_tmp_file(file_path)

    def download_dataset_file(self, file_name: str) -> str:
        dataset_path = os.path.join("datasets", file_name)
        full_path = os.path.join(self.root_path(), dataset_path)

        return self._storage.download_tmp_file(full_path)

    def list_dataset_files(self, extension: Optional[str] = None) -> List[str]:
        key = os.path.join(self.root_path(), "datasets")

        return self._storage.list_files(key, extension)

    # ---------------- #
    #  Helper methods  #
    # ---------------- #

    def _make_tmp_path(self, path: Optional[str] = None) -> str:
        tmp_path = os.path.join(self.root_path(), path or "")

        return self._storage.make_tmp_path(tmp_path)

    # def _cleanup_tmp_path(self, path: Optional[str] = None) -> None:
    #     tmp_path = os.path.join(self.root_path(), path or "")

    #     self._storage.cleanup_tmp_path(tmp_path)