import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from app.core.db import get_db
from app.core.deps import get_current_user, get_request_ai_provider
from app.ai.base import AIProvider
from app.schemas.resume import StructuredResume
from app.schemas.job import JobPostingSchema
from app.schemas.optimization import SuggestionItem, SuggestionsResponse, ApplyChangesRequest, OptimizedResumeResponse
from app.services.optimizer import apply_suggestions_to_resume, generate_optimization_suggestions
from app.services.matcher import calculate_match_analysis

router = APIRouter()

@router.get("/analysis/{analysis_id}/suggestions", response_model=SuggestionsResponse)
async def get_suggestions(
    analysis_id: str,
    refresh: bool = Query(False),
    current_user: dict = Depends(get_current_user),
    ai_provider: AIProvider = Depends(get_request_ai_provider),
    db = Depends(get_db)
):
    user_id = current_user["id"]
    analysis = await db.job_analyses.find_one({"_id": analysis_id, "user_id": user_id})
    if not analysis:
        analysis = await db.job_analyses.find_one({"id": analysis_id, "user_id": user_id})
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found.")

    cursor = db.optimization_suggestions.find({"analysis_id": analysis["id"]})
    sug_objs = await cursor.to_list(length=100)

    # Auto-regenerate if refresh requested or existing suggestions count <= 1
    if refresh or len(sug_objs) <= 1:
        resume_doc = await db.resumes.find_one({"_id": analysis["resume_id"]})
        if not resume_doc:
            resume_doc = await db.resumes.find_one({"id": analysis["resume_id"]})
        job_doc = await db.job_postings.find_one({"_id": analysis["job_posting_id"]})
        if not job_doc:
            job_doc = await db.job_postings.find_one({"id": analysis["job_posting_id"]})
        
        if resume_doc and job_doc:
            struct_resume = StructuredResume(**resume_doc["parsed_json"])
            struct_job = JobPostingSchema(**job_doc["extracted_json"])
            new_sugs = await generate_optimization_suggestions(
                resume=struct_resume,
                job=struct_job,
                matched_skills=analysis.get("matched_skills", []),
                underrepresented_skills=analysis.get("underrepresented_skills", []),
                missing_skills=analysis.get("missing_skills", []),
                ai_provider=ai_provider
            )
            if new_sugs:
                await db.optimization_suggestions.delete_many({"analysis_id": analysis["id"]})
                sug_docs = [
                    {
                        "_id": str(uuid.uuid4()),
                        "id": sug.id,
                        "analysis_id": analysis["id"],
                        "section": sug.section,
                        "before_text": sug.before_text,
                        "after_text": sug.after_text,
                        "reason": sug.reason,
                        "status": "pending"
                    }
                    for sug in new_sugs
                ]
                await db.optimization_suggestions.insert_many(sug_docs)
                sug_objs = sug_docs

    return SuggestionsResponse(
        analysis_id=analysis_id,
        suggestions=[
            SuggestionItem(
                id=s["id"],
                section=s["section"],
                before_text=s["before_text"],
                after_text=s["after_text"],
                reason=s["reason"],
                status=s["status"]
            )
            for s in sug_objs
        ]
    )

@router.post("/analysis/{analysis_id}/apply-changes", response_model=OptimizedResumeResponse)
async def apply_changes(
    analysis_id: str,
    req: ApplyChangesRequest,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db)
):
    user_id = current_user["id"]
    analysis = await db.job_analyses.find_one({"_id": analysis_id, "user_id": user_id})
    if not analysis:
        analysis = await db.job_analyses.find_one({"id": analysis_id, "user_id": user_id})
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found.")

    resume_obj = await db.resumes.find_one({"_id": analysis["resume_id"]})
    if not resume_obj:
        resume_obj = await db.resumes.find_one({"id": analysis["resume_id"]})
    if not resume_obj:
        raise HTTPException(status_code=404, detail="Original resume not found.")

    cursor = db.optimization_suggestions.find({"analysis_id": analysis["id"]})
    sug_objs = await cursor.to_list(length=100)

    # Update statuses in MongoDB
    for s in sug_objs:
        new_status = s["status"]
        if s["id"] in req.accepted_ids:
            new_status = "accepted"
        elif s["id"] in req.rejected_ids:
            new_status = "rejected"
        
        if new_status != s["status"]:
            s["status"] = new_status
            await db.optimization_suggestions.update_one({"_id": s["_id"]}, {"$set": {"status": new_status}})

    original_structured = StructuredResume(**resume_obj["parsed_json"])
    sug_items = [
        SuggestionItem(
            id=s["id"],
            section=s["section"],
            before_text=s["before_text"],
            after_text=s["after_text"],
            reason=s["reason"],
            status=s["status"]
        )
        for s in sug_objs
    ]

    optimized_structured = apply_suggestions_to_resume(
        original_resume=original_structured,
        suggestions=sug_items,
        accepted_ids=req.accepted_ids
    )

    # Recalculate match score for optimized resume against job posting
    orig_score = float(analysis.get("overall_score", 0.0))
    new_score = orig_score
    
    job_doc = await db.job_postings.find_one({"_id": analysis["job_posting_id"]})
    if not job_doc:
        job_doc = await db.job_postings.find_one({"id": analysis["job_posting_id"]})
    if job_doc:
        struct_job = JobPostingSchema(**job_doc["extracted_json"])
        recalc_analysis = calculate_match_analysis(optimized_structured, struct_job)
        new_score = float(recalc_analysis["overall_score"])

        # PERSIST updated score and ATS audit to MongoDB
        await db.job_analyses.update_one(
            {"_id": analysis["_id"]},
            {"$set": {
                "overall_score": recalc_analysis["overall_score"],
                "score_breakdown": recalc_analysis["score_breakdown"],
                "matched_skills": recalc_analysis["matched_skills"],
                "underrepresented_skills": recalc_analysis["underrepresented_skills"],
                "missing_skills": recalc_analysis["missing_skills"],
                "evidence_list": recalc_analysis["evidence_list"],
                "ats_analysis": recalc_analysis["ats_analysis"]
            }}
        )

    return OptimizedResumeResponse(
        analysis_id=analysis_id,
        optimized_resume=optimized_structured,
        accepted_count=len(req.accepted_ids),
        rejected_count=len(req.rejected_ids),
        original_score=orig_score,
        new_overall_score=new_score
    )


