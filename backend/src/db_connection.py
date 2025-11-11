# src/db_connection.py
import os
from dotenv import load_dotenv
from pymongo import MongoClient

# Load .env
load_dotenv()

_client = None
_db = None

def get_db():
    global _client, _db
    if _db is not None:
        return _db

    mongo_uri = os.getenv("MONGO_URI")
    db_name = os.getenv("MONGO_DB_NAME")

    if not mongo_uri or not db_name:
        raise RuntimeError("MONGO_URI and MONGO_DB_NAME must be set in .env")

    _client = MongoClient(mongo_uri)
    _db = _client[db_name]
    return _db