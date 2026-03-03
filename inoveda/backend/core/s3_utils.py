import logging
import boto3
from botocore.config import Config
from botocore.exceptions import ClientError
from core.config import settings

logger = logging.getLogger(__name__)

class S3Service:
    def __init__(self):
        if settings.use_s3:
            self.s3_client = boto3.client(
                "s3",
                aws_access_key_id=settings.aws_access_key_id,
                aws_secret_access_key=settings.aws_secret_access_key,
                region_name=settings.aws_region,
                config=Config(signature_version="s3v4")
            )
            self.bucket = settings.s3_bucket
        else:
            self.s3_client = None
            self.bucket = None

    def generate_upload_url(self, object_name: str, expiration: int = 3600):
        """Generate a presigned URL to upload a file directly to S3"""
        if not self.s3_client:
            return None
        try:
            response = self.s3_client.generate_presigned_post(
                Bucket=self.bucket,
                Key=object_name,
                Fields={"acl": "private", "Content-Type": "application/octet-stream"},
                Conditions=[
                    {"acl": "private"},
                    ["starts-with", "$Content-Type", ""],
                    ["content-length-range", 0, settings.max_upload_mb * 1024 * 1024]
                ],
                ExpiresIn=expiration
            )
            return response
        except ClientError:
            logger.exception("s3_presigned_post_failed")
            return None

    def generate_download_url(self, object_name: str, expiration: int = 3600):
        """Generate a presigned URL to download a file from S3"""
        if not self.s3_client:
            return None
        # Check if it's already a full URL or local path
        if not object_name or object_name.startswith("http") or object_name.startswith("uploads/"):
            return object_name
            
        try:
            response = self.s3_client.generate_presigned_url(
                "get_object",
                Params={"Bucket": self.bucket, "Key": object_name},
                ExpiresIn=expiration
            )
            return response
        except ClientError:
            logger.exception("s3_presigned_get_failed")
            return None

    def upload_fileobj(self, file_obj, object_name: str):
        """Upload a file-like object directly from the backend to S3"""
        if not self.s3_client:
            return False
        try:
            self.s3_client.upload_fileobj(file_obj, self.bucket, object_name)
            return True
        except ClientError:
            logger.exception("s3_upload_failed")
            return False

s3_service = S3Service()
