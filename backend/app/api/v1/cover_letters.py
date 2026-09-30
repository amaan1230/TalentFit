import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from app.core.db import get_db
from app.core.deps import get_current_user, get_request_ai_provider
from app.ai.base import AIProvider
from app.schemas.resume import StructuredResume
from app.schemas.job import JobPostingSchema
from app.schemas.cover_letter import GenerateCoverLetterRequest, ImproveCoverLetterRequest, CoverLetterResponse
from app.services.cover_letter_service import generate_tailored_cover_letter, refine_cover_letter

router = APIRouter()

@router.post("/generate", response_model=CoverLetterResponse)
async def generate_cover_letter_endpoint(
    req: GenerateCoverLetterRequest,
    current_user: dict = Depends(get_current_user),
    ai_provider: AIProvider = Depends(get_request_ai_provider),
    db = Depends(get_db)
):
    user_id = current_user["id"]
    analysis = await db.job_analyses.find_one({"_id": req.analysis_id, "user_id": user_id})
    if not analysis:
        analysis = await db.job_analyses.find_one({"id": req.analysis_id, "user_id": user_id})
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis record not found.")

    resume_obj = await db.resumes.find_one({"_id": analysis["resume_id"]})
    if not resume_obj:
        resume_obj = await db.resumes.find_one({"id": analysis["resume_id"]})

    job_obj = await db.job_postings.find_one({"_id": analysis["job_posting_id"]})
    if not job_obj:
        job_obj = await db.job_postings.find_one({"id": analysis["job_posting_id"]})

    struct_resume = StructuredResume(**resume_obj["parsed_json"])
    struct_job = JobPostingSchema(**job_obj["extracted_json"])

    content = await generate_tailored_cover_letter(
        resume=struct_resume,
        job=struct_job,
        matched_skills=analysis["matched_skills"],
        custom_notes=req.custom_notes,
        ai_provider=ai_provider,
        fallback_name=current_user.get("name")
    )

    cl_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)

    cl_doc = {
        "_id": cl_id,
        "id": cl_id,
        "analysis_id": analysis["id"],
        "user_id": user_id,
        "content": content,
        "version": 1,
        "created_at": now,
        "updated_at": now
    }
    await db.cover_letters.insert_one(cl_doc)

    return CoverLetterResponse(
        id=cl_doc["id"],
        analysis_id=cl_doc["analysis_id"],
        content=cl_doc["content"],
        version=cl_doc["version"],
        created_at=cl_doc["created_at"]
    )

@router.post("/refine", response_model=CoverLetterResponse)
async def refine_cover_letter_endpoint(
    req: ImproveCoverLetterRequest,
    current_user: dict = Depends(get_current_user),
    ai_provider: AIProvider = Depends(get_request_ai_provider),
    db = Depends(get_db)
):
    user_id = current_user["id"]
    cl_obj = await db.cover_letters.find_one({"_id": req.cover_letter_id, "user_id": user_id})
    if not cl_obj:
        cl_obj = await db.cover_letters.find_one({"id": req.cover_letter_id, "user_id": user_id})
    if not cl_obj:
        raise HTTPException(status_code=404, detail="Cover letter not found.")

    updated_content = await refine_cover_letter(
        current_content=cl_obj["content"],
        instruction=req.instruction,
        custom_instruction=req.custom_instruction,
        ai_provider=ai_provider
    )

    new_version = (cl_obj.get("version") or 1) + 1
    now = datetime.now(timezone.utc)

    await db.cover_letters.update_one(
        {"_id": cl_obj["_id"]},
        {"$set": {"content": updated_content, "version": new_version, "updated_at": now}}
    )

    return CoverLetterResponse(
        id=cl_obj["id"],
        analysis_id=cl_obj["analysis_id"],
        content=updated_content,
        version=new_version,
        created_at=cl_obj["created_at"]
    )

@router.get("/{analysis_id}", response_model=CoverLetterResponse)
async def get_cover_letter_by_analysis(
    analysis_id: str,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db)
):
    user_id = current_user["id"]
    an = await db.job_analyses.find_one({"_id": analysis_id, "user_id": user_id})
    if not an:
        an = await db.job_analyses.find_one({"id": analysis_id, "user_id": user_id})
    
    an_ids = [analysis_id]
    if an:
        if "id" in an and an["id"]:
            an_ids.append(an["id"])
        if "_id" in an and str(an["_id"]):
            an_ids.append(str(an["_id"]))

    cursor = db.cover_letters.find({"analysis_id": {"$in": an_ids}, "user_id": user_id}).sort("created_at", -1)
    cl_list = await cursor.to_list(length=1)
    if not cl_list:
        raise HTTPException(status_code=404, detail="No cover letter generated for this analysis yet.")

    cl_obj = cl_list[0]
    return CoverLetterResponse(
        id=cl_obj["id"],
        analysis_id=cl_obj["analysis_id"],
        content=cl_obj["content"],
        version=cl_obj.get("version", 1),
        created_at=cl_obj["created_at"]
    )

