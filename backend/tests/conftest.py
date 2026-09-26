import pytest
import pytest_asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from httpx import AsyncClient, ASGITransport
from app.core.db import get_db
from app.core.config import settings
from app.main import app

TEST_MONGO_URL = settings.MONGODB_URL
TEST_DB_NAME = "cvcover_test_db"

@pytest_asyncio.fixture
async def db_session():
    try:
        client = AsyncIOMotorClient(TEST_MONGO_URL, serverSelectionTimeoutMS=1000)
        await client.admin.command('ping')
        db = client[TEST_DB_NAME]
    except Exception:
        from mongomock_motor import AsyncMongoMockClient
        client = AsyncMongoMockClient()
        db = client[TEST_DB_NAME]

    yield db
    client.close()

@pytest_asyncio.fixture
async def client(db_session):
    async def _get_test_db():
        return db_session

    app.dependency_overrides[get_db] = _get_test_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()
