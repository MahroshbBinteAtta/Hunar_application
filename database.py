import os
import json
import logging
import asyncio
import socket
from datetime import datetime
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "hunar_db")

# URL-escape username/password if special characters are present
from urllib.parse import quote_plus
if "mongodb+srv://" in MONGODB_URL or "mongodb://" in MONGODB_URL:
    try:
        prefix = "mongodb+srv://" if "mongodb+srv://" in MONGODB_URL else "mongodb://"
        rest = MONGODB_URL[len(prefix):]
        if "@" in rest:
            userinfo, hostinfo = rest.split("@", 1)
            if ":" in userinfo:
                username, password = userinfo.split(":", 1)
                # Only escape if not already percent-encoded
                escaped_user = username if "%" in username else quote_plus(username)
                escaped_pass = password if "%" in password else quote_plus(password)
                MONGODB_URL = f"{prefix}{escaped_user}:{escaped_pass}@{hostinfo}"
    except Exception:
        pass

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("hunar_db")

# Mock Cursor for Async Iteration (async for doc in cursor)
class MockCursor:
    def __init__(self, data):
        self.data = data
        self.index = 0

    def __aiter__(self):
        return self

    async def __anext__(self):
        if self.index >= len(self.data):
            raise StopAsyncIteration
        val = self.data[self.index]
        self.index += 1
        return val

# Mock Collection simulating MongoDB operations using hunar_db.json
class MockCollection:
    def __init__(self, collection_name):
        self.collection_name = collection_name
        self._filepath = "hunar_db.json"

    def _read_db(self):
        if not os.path.exists(self._filepath):
            return {}
        try:
            with open(self._filepath, "r") as f:
                return json.load(f)
        except Exception:
            return {}

    def _write_db(self, db_data):
        try:
            with open(self._filepath, "w") as f:
                json.dump(db_data, f, default=str, indent=2)
        except Exception as e:
            logger.error(f"Failed to write to mock JSON database: {e}")

    def _get_docs(self):
        db_data = self._read_db()
        return db_data.get(self.collection_name, [])

    def _save_docs(self, docs):
        db_data = self._read_db()
        db_data[self.collection_name] = docs
        self._write_db(db_data)

    def _match(self, doc, query):
        for k, v in query.items():
            if k == "_id":
                if isinstance(v, ObjectId):
                    v = str(v)
                elif isinstance(v, dict) and "$in" in v:
                    ids = [str(x) for x in v["$in"]]
                    if str(doc.get(k)) not in ids:
                        return False
                    continue
            
            if isinstance(v, dict):
                if "$ne" in v:
                    target_val = v["$ne"]
                    if doc.get(k) == target_val:
                        return False
                elif "$in" in v:
                    if doc.get(k) not in v["$in"]:
                        return False
                else:
                    return False
            else:
                if doc.get(k) != v:
                    return False
        return True

    async def find_one(self, query):
        await asyncio.sleep(0.005)
        docs = self._get_docs()
        for doc in docs:
            if self._match(doc, query):
                return doc
        return None

    async def insert_one(self, doc):
        await asyncio.sleep(0.005)
        docs = self._get_docs()
        if "_id" not in doc:
            doc["_id"] = str(ObjectId())
        
        doc_serialized = {}
        for k, v in doc.items():
            if isinstance(v, datetime):
                doc_serialized[k] = v.isoformat()
            elif isinstance(v, ObjectId):
                doc_serialized[k] = str(v)
            else:
                doc_serialized[k] = v
                
        docs.append(doc_serialized)
        self._save_docs(docs)

        class InsertResult:
            def __init__(self, inserted_id):
                self.inserted_id = inserted_id
        return InsertResult(doc["_id"])

    async def insert_many(self, docs_list):
        await asyncio.sleep(0.005)
        docs = self._get_docs()
        for doc in docs_list:
            if "_id" not in doc:
                doc["_id"] = str(ObjectId())
            
            doc_serialized = {}
            for k, v in doc.items():
                if isinstance(v, datetime):
                    doc_serialized[k] = v.isoformat()
                elif isinstance(v, ObjectId):
                    doc_serialized[k] = str(v)
                else:
                    doc_serialized[k] = v
            docs.append(doc_serialized)
        self._save_docs(docs)

    async def update_one(self, query, update, upsert=False):
        await asyncio.sleep(0.005)
        docs = self._get_docs()
        updated = False

        for i, doc in enumerate(docs):
            if self._match(doc, query):
                if "$set" in update:
                    for uk, uv in update["$set"].items():
                        if isinstance(uv, datetime):
                            uv = uv.isoformat()
                        elif isinstance(uv, ObjectId):
                            uv = str(uv)
                        doc[uk] = uv
                docs[i] = doc
                updated = True
                break

        if not updated and upsert:
            new_doc = query.copy()
            if "$set" in update:
                for uk, uv in update["$set"].items():
                    if isinstance(uv, datetime):
                        uv = uv.isoformat()
                    elif isinstance(uv, ObjectId):
                        uv = str(uv)
                    new_doc[uk] = uv
            if "_id" not in new_doc:
                new_doc["_id"] = str(ObjectId())
            docs.append(new_doc)

        self._save_docs(docs)

    async def delete_many(self, query):
        await asyncio.sleep(0.005)
        docs = self._get_docs()
        new_docs = [doc for doc in docs if not self._match(doc, query)]
        self._save_docs(new_docs)

    async def count_documents(self, query):
        await asyncio.sleep(0.005)
        docs = self._get_docs()
        count = 0
        for doc in docs:
            if self._match(doc, query):
                count += 1
        return count

    def find(self, query=None):
        query = query or {}
        docs = self._get_docs()
        matched = []
        for doc in docs:
            if self._match(doc, query):
                matched.append(doc)
        return MockCursor(matched)

# Mock Database returning Mock Collections
class MockDatabase:
    def __getattr__(self, name):
        return MockCollection(name)

    async def command(self, cmd):
        if cmd == "ping":
            return True
        raise NotImplementedError()

# Fast check if MongoDB port is open
def is_mongo_running(host="localhost", port=27017):
    try:
        # Extract host/port from MONGODB_URL if needed
        # Simple extraction for localhost
        h = host
        p = port
        if "mongodb://" in MONGODB_URL:
            parts = MONGODB_URL.replace("mongodb://", "").split(":")
            if len(parts) >= 1:
                h = parts[0].split("/")[0]
            if len(parts) >= 2:
                p = int(parts[1].split("/")[0])
        
        s = socket.create_connection((h, p), timeout=0.5)
        s.close()
        return True
    except Exception:
        return False

# Initialize the correct DB reference on module import
if "mongodb+srv://" in MONGODB_URL or is_mongo_running():
    logger.info("MongoDB instance detected. Connecting...")
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    use_mock_db = False
else:
    logger.warning("MongoDB instance not running. Initializing Mock JSON database ('hunar_db.json').")
    db = MockDatabase()
    use_mock_db = True

async def check_db_connection():
    global db, use_mock_db
    if not use_mock_db:
        try:
            await db.command("ping")
            logger.info("Successfully verified connection to MongoDB instance!")
            return True
        except Exception as e:
            logger.warning(f"Connection verification failed: {e}. Switching to Mock database.")
            
    db = MockDatabase()
    use_mock_db = True
    logger.info("Running using local Mock JSON database ('hunar_db.json')")
    return True
