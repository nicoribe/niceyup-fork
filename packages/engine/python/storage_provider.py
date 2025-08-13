import boto3
import os
import shutil
from typing import List, Optional

class StorageProvider:
    def __init__(
        self,
        bucket_name: Optional[str] = None,
        tmp_dir: str = "/tmp",
    ):
        self.s3_client = boto3.client(
            service_name="s3",
            endpoint_url=f'https://{os.environ["CLOUDFLARE_ACCOUNT_ID"]}.r2.cloudflarestorage.com',
            aws_access_key_id=os.environ["CLOUDFLARE_ACCESS_KEY"],
            aws_secret_access_key=os.environ["CLOUDFLARE_SECRET_KEY"],
            region_name="auto",
        )
        self.bucket_name = bucket_name or os.environ["CLOUDFLARE_BUCKET"]

        if os.environ["PYTHON_ENV"] == "development":
            tmp_dir = "./tmp"
        self.tmp_dir = os.path.join(tmp_dir, "better_chat_tmp")
    
    def upload_file(self, file_path: str, file_name: str, local_file: str) -> None:
        full_path = f"{file_path.strip('/')}/{file_name}"
        self.s3_client.upload_file(local_file, self.bucket_name, full_path)

    def download_file(self, file_path: str, file_name: str, local_file: str) -> None:
        full_path = f"{file_path.strip('/')}/{file_name}"
        self.s3_client.download_file(self.bucket_name, full_path, local_file)

    def make_tmp_path(self, path: Optional[str] = None) -> str:
        tmp_path = os.path.join(self.tmp_dir, path or "")
        os.makedirs(os.path.dirname(tmp_path), exist_ok=True)
        return tmp_path

    def cleanup_tmp_path(self, path: Optional[str] = None) -> None:
        tmp_path = os.path.join(self.tmp_dir, path or "")
        if os.path.exists(tmp_path):
            if os.path.isfile(tmp_path):
                os.remove(tmp_path)
            elif os.path.isdir(tmp_path):
                shutil.rmtree(tmp_path)

    def download_tmp_file(self, file_path: str) -> str:
        tmp_path = self.make_tmp_path(file_path)
        self.s3_client.download_file(self.bucket_name, file_path, tmp_path)
        return tmp_path

    def upload_tmp_file(self, file_path: str) -> None:
        _tmp_path = os.path.join(self.tmp_dir, file_path)
        self.s3_client.upload_file(_tmp_path, self.bucket_name, file_path)
        self.cleanup_tmp_path(file_path)

    def list_files(self, folder_path: str, extension: Optional[str] = None) -> List[str]:
        prefix = folder_path.strip('/') + '/'
        paginator = self.s3_client.get_paginator("list_objects_v2")
        files = []
        for page in paginator.paginate(Bucket=self.bucket_name, Prefix=prefix):
            for obj in page.get("Contents", []):
                key = obj["Key"]
                if not key.endswith("/"):
                    if extension is None or key.endswith(extension):
                        files.append(key)
        return files
