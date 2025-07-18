import os
import boto3
from typing import Optional

class StorageProvider:
    def __init__(self, bucket_name: Optional[str] = None):
        self.client = boto3.client(
            service_name="s3",
            endpoint_url=f'https://{os.environ["CLOUDFLARE_ACCOUNT_ID"]}.r2.cloudflarestorage.com',
            aws_access_key_id=os.environ["CLOUDFLARE_ACCESS_KEY"],
            aws_secret_access_key=os.environ["CLOUDFLARE_SECRET_KEY"],
            region_name="auto",
        )
        self.bucket_name = bucket_name or os.environ["CLOUDFLARE_BUCKET"]
