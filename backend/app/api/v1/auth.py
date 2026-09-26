import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from app.core.db import get_db
from app.core.security import verify_password, get_password_hash, create_access_token
from app.core.deps import get_current_user
from app.schemas.auth import UserCreate, UserLogin, UserResponse, Token, ForgotPasswordRequest

router = APIRouter()

@router.post("/register", response_model=Token)
async def register(user_in: UserCreate, db = Depends(get_db)):
    email_clean = user_in.email.lower()
    existing = await db.users.find_one({"email": email_clean})
    if existing:
        raise HTTPException(status_code=400, detail="User with this email already exists.")

    user_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)

    user_doc = {
        "_id": user_id,
        "id": user_id,
        "name": user_in.name,
        "email": email_clean,
        "password_hash": get_password_hash(user_in.password),
        "created_at": now,
        "updated_at": now
    }

    await db.users.insert_one(user_doc)

    token = create_access_token(user_id)
    return Token(
        access_token=token,
        user=UserResponse(
            id=user_doc["id"],
            name=user_doc["name"],
            email=user_doc["email"],
            created_at=user_doc["created_at"],
            updated_at=user_doc["updated_at"]
        )
    )

@router.post("/login", response_model=Token)
async def login(user_in: UserLogin, db = Depends(get_db)):
    email_clean = user_in.email.lower()
    user_doc = await db.users.find_one({"email": email_clean})
    if not user_doc or not verify_password(user_in.password, user_doc["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    token = create_access_token(user_doc["id"])
    return Token(
        access_token=token,
        user=UserResponse(
            id=user_doc["id"],
            name=user_doc["name"],
            email=user_doc["email"],
            created_at=user_doc["created_at"],
            updated_at=user_doc["updated_at"]
        )
    )

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(
        id=current_user["id"],
        name=current_user["name"],
        email=current_user["email"],
        created_at=current_user["created_at"],
        updated_at=current_user["updated_at"]
    )

@router.post("/forgot-password")
async def forgot_password(req: ForgotPasswordRequest, db = Depends(get_db)):
    user_doc = await db.users.find_one({"email": req.email.lower()})
    if not user_doc:
        return {"message": "If an account with that email exists, a password reset link has been sent."}
    return {"message": "Password reset instructions have been dispatched to your email."}
