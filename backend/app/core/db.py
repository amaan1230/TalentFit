import logging
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

logger = logging.getLogger(__name__)

class MongoManager:
    client = None
    db = None
    is_mock: bool = False

mongo_manager = MongoManager()

def get_db():
    if mongo_manager.db is None:
        try:
            client = AsyncIOMotorClient(settings.MONGODB_URL, serverSelectionTimeoutMS=2000)
            mongo_manager.client = client
            mongo_manager.db = client[settings.MONGODB_DB_NAME]
        except Exception as e:
            logger.warning(f"Could not connect to MongoDB server: {e}. Switching to MongoMock.")
            from mongomock_motor import AsyncMongoMockClient
            client = AsyncMongoMockClient()
            mongo_manager.client = client
            mongo_manager.db = client[settings.MONGODB_DB_NAME]
            mongo_manager.is_mock = True
    return mongo_manager.db

async def init_db():
    db = get_db()
    try:
        # Ping MongoDB server to verify active connection
        await mongo_manager.client.admin.command('ping')
        logger.info("Connected to live MongoDB server.")
    except Exception as e:
        logger.warning(f"Live MongoDB server not active on {settings.MONGODB_URL} ({e}). Falling back to MongoMock in-memory database.")
        from mongomock_motor import AsyncMongoMockClient
        client = AsyncMongoMockClient()
        mongo_manager.client = client
        mongo_manager.db = client[settings.MONGODB_DB_NAME]
        mongo_manager.is_mock = True
        db = mongo_manager.db

    try:
        # Initialize collection indexes
        await db.users.create_index("email", unique=True)
        await db.resumes.create_index("user_id")
        await db.job_postings.create_index("user_id")
        await db.job_analyses.create_index("user_id")
        logger.info("MongoDB collections & indexes initialized.")
    except Exception as ie:
        logger.warning(f"Index initialization note: {ie}")
