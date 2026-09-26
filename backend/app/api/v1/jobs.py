import uuid
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from app.core.db import get_db
from app.core.deps import get_current_user, get_request_ai_provider
from app.ai.base import AIProvider
from app.schemas.job import JobExtractUrlRequest, JobExtractTextRequest, JobPostingResponse, JobPostingSchema
from app.services.job_extractor import fetch_job_url, extract_job_from_text

router = APIRouter()

@router.post("/extract-url", response_model=JobPostingResponse)
async def extract_from_url(
    req: JobExtractUrlRequest,
    current_user: dict = Depends(get_current_user),
    ai_provider: Optional[AIProvider] = Depends(get_request_ai_provider),
    db = Depends(get_db)
):
    user_id = current_user["id"]
    res_check = await db.resumes.find_one({"_id": req.resume_id, "user_id": user_id})
    if not res_check:
        res_check = await db.resumes.find_one({"id": req.resume_id, "user_id": user_id})
    if not res_check:
        raise HTTPException(status_code=404, detail="Selected resume not found. Please upload or select a valid resume first.")

    try:
        raw_text = await fetch_job_url(req.url)
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))

    job_schema, content_hash = await extract_job_from_text(raw_text, ai_provider=ai_provider)

    job_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)

    job_doc = {
        "_id": job_id,
        "id": job_id,
        "user_id": user_id,
        "url": req.url,
        "title": job_schema.title,
        "company": job_schema.company,
        "raw_text": raw_text,
        "extracted_json": job_schema.model_dump(),
        "content_hash": content_hash,
        "created_at": now
    }

    await db.job_postings.insert_one(job_doc)

    return JobPostingResponse(
        id=job_doc["id"],
        url=job_doc["url"],
        title=job_doc["title"],
        company=job_doc["company"],
        extracted_json=job_schema,
        created_at=job_doc["created_at"]
    )

@router.post("/analyze-text", response_model=JobPostingResponse)
async def extract_from_text(
    req: JobExtractTextRequest,
    current_user: dict = Depends(get_current_user),
    ai_provider: Optional[AIProvider] = Depends(get_request_ai_provider),
    db = Depends(get_db)
):
    if not req.raw_text or len(req.raw_text.strip()) < 20:
        raise HTTPException(status_code=400, detail="Job description text is too short. Please paste complete job requirements.")

    user_id = current_user["id"]
    res_check = await db.resumes.find_one({"_id": req.resume_id, "user_id": user_id})
    if not res_check:
        res_check = await db.resumes.find_one({"id": req.resume_id, "user_id": user_id})
    if not res_check:
        raise HTTPException(status_code=404, detail="Selected resume not found.")

    job_schema, content_hash = await extract_job_from_text(
        req.raw_text, custom_title=req.title, custom_company=req.company, ai_provider=ai_provider
    )

    job_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)

    job_doc = {
        "_id": job_id,
        "id": job_id,
        "user_id": user_id,
        "url": None,
        "title": job_schema.title,
        "company": job_schema.company,
        "raw_text": req.raw_text,
        "extracted_json": job_schema.model_dump(),
        "content_hash": content_hash,
        "created_at": now
    }

    await db.job_postings.insert_one(job_doc)

    return JobPostingResponse(
        id=job_doc["id"],
        url=job_doc["url"],
        title=job_doc["title"],
        company=job_doc["company"],
        extracted_json=job_schema,
        created_at=job_doc["created_at"]
    )
