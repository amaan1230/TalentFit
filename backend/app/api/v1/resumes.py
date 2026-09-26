import os
import uuid
from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from app.core.db import get_db
from app.core.deps import get_current_user, get_request_ai_provider
from app.core.config import settings
from app.schemas.resume import ResumeResponse, StructuredResume
from app.services.resume_parser import parse_resume_file
from app.ai.base import AIProvider
from typing import Optional

router = APIRouter()

@router.post("/upload", response_model=ResumeResponse)
async def upload_resume(
    file: UploadFile = File(...),
    set_default: bool = Form(False),
    current_user: dict = Depends(get_current_user),
    ai_provider: Optional[AIProvider] = Depends(get_request_ai_provider),
    db = Depends(get_db)
):
    content = await file.read()
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size exceeds maximum limit of 10MB.")

    filename = file.filename or "resume.pdf"
    file_type = file.content_type or "application/pdf"

    try:
        raw_text, parsed_json, file_hash = await parse_resume_file(filename, content, file_type, ai_provider=ai_provider)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Failed to process resume: {str(e)}")

    save_filename = f"{uuid.uuid4().hex}_{filename}"
    file_path = os.path.join(settings.UPLOAD_DIR, save_filename)
    with open(file_path, "wb") as f:
        f.write(content)

    user_id = current_user["id"]
    existing_count = await db.resumes.count_documents({"user_id": user_id})
    is_def = set_default or existing_count == 0

    if is_def:
        await db.resumes.update_many({"user_id": user_id}, {"$set": {"is_default": False}})

    res_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)

    resume_doc = {
        "_id": res_id,
        "id": res_id,
        "user_id": user_id,
        "filename": filename,
        "file_type": file_type,
        "file_path": file_path,
        "raw_text": raw_text,
        "parsed_json": parsed_json.model_dump(),
        "is_default": is_def,
        "file_hash": file_hash,
        "created_at": now,
        "updated_at": now
    }

    await db.resumes.insert_one(resume_doc)

    return ResumeResponse(
        id=resume_doc["id"],
        filename=resume_doc["filename"],
        file_type=resume_doc["file_type"],
        is_default=resume_doc["is_default"],
        parsed_json=StructuredResume(**resume_doc["parsed_json"]),
        created_at=resume_doc["created_at"]
    )

@router.get("", response_model=List[ResumeResponse])
async def list_resumes(
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db)
):
    cursor = db.resumes.find({"user_id": current_user["id"]}).sort("created_at", -1)
    resumes = await cursor.to_list(length=100)
    return [
        ResumeResponse(
            id=r["id"],
            filename=r["filename"],
            file_type=r["file_type"],
            is_default=r["is_default"],
            parsed_json=StructuredResume(**r["parsed_json"]),
            created_at=r["created_at"]
        )
        for r in resumes
    ]

@router.get("/{resume_id}", response_model=ResumeResponse)
async def get_resume(
    resume_id: str,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db)
):
    resume = await db.resumes.find_one({"_id": resume_id, "user_id": current_user["id"]})
    if not resume:
        resume = await db.resumes.find_one({"id": resume_id, "user_id": current_user["id"]})
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found.")

    return ResumeResponse(
        id=resume["id"],
        filename=resume["filename"],
        file_type=resume["file_type"],
        is_default=resume["is_default"],
        parsed_json=StructuredResume(**resume["parsed_json"]),
        created_at=resume["created_at"]
    )

@router.post("/{resume_id}/set-default")
async def set_default_resume(
    resume_id: str,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db)
):
    user_id = current_user["id"]
    resume = await db.resumes.find_one({"_id": resume_id, "user_id": user_id})
    if not resume:
        resume = await db.resumes.find_one({"id": resume_id, "user_id": user_id})
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found.")

    await db.resumes.update_many({"user_id": user_id}, {"$set": {"is_default": False}})
    await db.resumes.update_one({"_id": resume["_id"]}, {"$set": {"is_default": True}})
    return {"message": "Default resume updated successfully."}

@router.delete("/{resume_id}")
async def delete_resume(
    resume_id: str,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db)
):
    user_id = current_user["id"]
    resume = await db.resumes.find_one({"_id": resume_id, "user_id": user_id})
    if not resume:
        resume = await db.resumes.find_one({"id": resume_id, "user_id": user_id})
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found.")

    if os.path.exists(resume["file_path"]):
        try:
            os.remove(resume["file_path"])
        except Exception:
            pass

    await db.resumes.delete_one({"_id": resume["_id"]})
    return {"message": "Resume deleted successfully."}
