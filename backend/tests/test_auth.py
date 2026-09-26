import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_register_and_login_flow(client: AsyncClient):
    # 1. Register user
    reg_payload = {
        "name": "Test User",
        "email": "test@example.com",
        "password": "SecurePassword123!"
    }
    resp = await client.post("/api/auth/register", json=reg_payload)
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["user"]["email"] == "test@example.com"
    token = data["access_token"]

    # 2. Get Me profile
    me_resp = await client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_resp.status_code == 200
    assert me_resp.json()["name"] == "Test User"

    # 3. Login
    login_payload = {
        "email": "test@example.com",
        "password": "SecurePassword123!"
    }
    login_resp = await client.post("/api/auth/login", json=login_payload)
    assert login_resp.status_code == 200
    assert "access_token" in login_resp.json()

@pytest.mark.asyncio
async def test_invalid_login(client: AsyncClient):
    login_payload = {
        "email": "nonexistent@example.com",
        "password": "wrongpassword"
    }
    resp = await client.post("/api/auth/login", json=login_payload)
    assert resp.status_code == 401
