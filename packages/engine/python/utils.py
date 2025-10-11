import os
import uuid
import hashlib

from typing import Union

def tmp_dir() -> str:
    """
    Returns the temporary directory for the application.
    """
    tmp_dir = os.environ["TMP_DIR"]

    if tmp_dir == "" or tmp_dir is None:
        raise ValueError("TMP_DIR is not set")

    return tmp_dir

def deterministic_uuid(content: Union[str, bytes]) -> str:
    """Creates deterministic UUID on hash value of string or byte content.

    Args:
        content: String or byte representation of data.

    Returns:
        UUID of the content.
    """
    if isinstance(content, str):
        content_bytes = content.encode("utf-8")
    elif isinstance(content, bytes):
        content_bytes = content
    else:
        raise ValueError(f"Content type {type(content)} not supported!")

    hash_object = hashlib.sha256(content_bytes)
    hash_hex = hash_object.hexdigest()
    namespace = uuid.UUID("00000000-0000-0000-0000-000000000000")
    content_uuid = str(uuid.uuid5(namespace, hash_hex))

    return content_uuid
