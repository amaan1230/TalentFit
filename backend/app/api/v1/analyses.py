import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from app.core.db import get_db
from app.core.deps import get_current_user, get_request_ai_provider
from app.ai.base import AIProvider
from app.schemas.resume import StructuredResume
from app.schemas.job import JobPostingSchema
from app.schemas.matching import MatchAnalysisResponse, ScoreBreakdown, ATSAnalysis, EvidenceItem
from app.services.matcher import calculate_match_analysis
from app.services.optimizer import generate_optimization_suggestions
from app.schemas.optimization import SuggestionItem

router = APIRouter()

class CreateAnalysisRequest(BaseModel):
    resume_id: str
    job_posting_id: str

@router.post("/matching/analyze", response_model=MatchAnalysisResponse)
async def create_analysis(
    req: CreateAnalysisRequest,
    current_user: dict = Depends(get_current_user),
    ai_provider: Optional[AIProvider] = Depends(get_request_ai_provider),
    db = Depends(get_db)
):
    user_id = current_user["id"]
    resume_doc = await db.resumes.find_one({"_id": req.resume_id, "user_id": user_id})
    if not resume_doc:
        resume_doc = await db.resumes.find_one({"id": req.resume_id, "user_id": user_id})
    if not resume_doc:
        raise HTTPException(status_code=404, detail="Resume not found.")

    job_doc = await db.job_postings.find_one({"_id": req.job_posting_id, "user_id": user_id})
    if not job_doc:
        job_doc = await db.job_postings.find_one({"id": req.job_posting_id, "user_id": user_id})
    if not job_doc:
        raise HTTPException(status_code=404, detail="Job posting not found.")

    struct_resume = StructuredResume(**resume_doc["parsed_json"])
    struct_job = JobPostingSchema(**job_doc["extracted_json"])

    analysis_res = calculate_match_analysis(struct_resume, struct_job)

    an_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)

    analysis_doc = {
        "_id": an_id,
        "id": an_id,
        "user_id": user_id,
        "resume_id": resume_doc["id"],
        "job_posting_id": job_doc["id"],
        "overall_score": analysis_res["overall_score"],
        "score_breakdown": analysis_res["score_breakdown"],
        "matched_skills": analysis_res["matched_skills"],
        "underrepresented_skills": analysis_res["underrepresented_skills"],
        "missing_skills": analysis_res["missing_skills"],
        "evidence_list": analysis_res["evidence_list"],
        "ats_analysis": analysis_res["ats_analysis"],
        "created_at": now
    }
    await db.job_analyses.insert_one(analysis_doc)

    # Generate initial optimization suggestions
    try:
        suggestions = await generate_optimization_suggestions(
            resume=struct_resume,
            job=struct_job,
            matched_skills=analysis_res["matched_skills"],
            underrepresented_skills=analysis_res["underrepresented_skills"],
            missing_skills=analysis_res["missing_skills"],
            ai_provider=ai_provider
        )
        sug_docs = [
            {
                "_id": str(uuid.uuid4()),
                "id": sug.id,
                "analysis_id": an_id,
                "section": sug.section,
                "before_text": sug.before_text,
                "after_text": sug.after_text,
                "reason": sug.reason,
                "status": "pending"
            }
            for sug in suggestions
        ]
        if sug_docs:
            await db.optimization_suggestions.insert_many(sug_docs)
    except Exception:
        pass

    return MatchAnalysisResponse(
        id=analysis_doc["id"],
        resume_id=analysis_doc["resume_id"],
        job_posting_id=analysis_doc["job_posting_id"],
        overall_score=analysis_doc["overall_score"],
        score_breakdown=ScoreBreakdown(**analysis_doc["score_breakdown"]),
        matched_skills=analysis_doc["matched_skills"],
        underrepresented_skills=analysis_doc["underrepresented_skills"],
        missing_skills=analysis_doc["missing_skills"],
        evidence_list=[EvidenceItem(**item) for item in analysis_doc["evidence_list"]],
        ats_analysis=ATSAnalysis(**analysis_doc["ats_analysis"]),
        created_at=analysis_doc["created_at"],
        job_title=job_doc["title"],
        company=job_doc.get("company") or "Company"
    )

@router.get("/analyses", response_model=List[MatchAnalysisResponse])
async def list_analyses(
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db)
):
    user_id = current_user["id"]
    cursor = db.job_analyses.find({"user_id": user_id}).sort("created_at", -1)
    analyses_list = await cursor.to_list(length=100)

    out = []
    for an in analyses_list:
        job_doc = await db.job_postings.find_one({"_id": an["job_posting_id"]})
        if not job_doc:
            job_doc = await db.job_postings.find_one({"id": an["job_posting_id"]})
        title = job_doc["title"] if job_doc else "Target Role"
        company = (job_doc.get("company") if job_doc else "Company") or "Company"

        out.append(MatchAnalysisResponse(
            id=an["id"],
            resume_id=an["resume_id"],
            job_posting_id=an["job_posting_id"],
            overall_score=an["overall_score"],
            score_breakdown=ScoreBreakdown(**an["score_breakdown"]),
            matched_skills=an["matched_skills"],
            underrepresented_skills=an["underrepresented_skills"],
            missing_skills=an["missing_skills"],
            evidence_list=[EvidenceItem(**item) for item in an["evidence_list"]],
            ats_analysis=ATSAnalysis(**an["ats_analysis"]),
            created_at=an["created_at"],
            job_title=title,
            company=company
        ))
    return out

@router.get("/analyses/{analysis_id}", response_model=MatchAnalysisResponse)
async def get_analysis(
    analysis_id: str,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db)
):
    user_id = current_user["id"]
    an = await db.job_analyses.find_one({"_id": analysis_id, "user_id": user_id})
    if not an:
        an = await db.job_analyses.find_one({"id": analysis_id, "user_id": user_id})
    if not an:
        raise HTTPException(status_code=404, detail="Analysis record not found.")

    job_doc = await db.job_postings.find_one({"_id": an["job_posting_id"]})
    if not job_doc:
        job_doc = await db.job_postings.find_one({"id": an["job_posting_id"]})
    title = job_doc["title"] if job_doc else "Target Role"
    company = (job_doc.get("company") if job_doc else "Company") or "Company"

    resume_doc = await db.resumes.find_one({"_id": an["resume_id"]})
    if not resume_doc:
        resume_doc = await db.resumes.find_one({"id": an["resume_id"]})

    if resume_doc and job_doc:
        try:
            struct_resume = StructuredResume(**resume_doc["parsed_json"])
            struct_job = JobPostingSchema(**job_doc["extracted_json"])
            recalc = calculate_match_analysis(struct_resume, struct_job)

            # Apply accepted suggestions if any
            cursor = db.optimization_suggestions.find({"analysis_id": an["id"], "status": "accepted"})
            accepted_sugs = await cursor.to_list(length=100)
            if accepted_sugs:
                from app.services.optimizer import apply_suggestions_to_resume
                accepted_ids = [s["id"] for s in accepted_sugs]
                sug_items = [
                    SuggestionItem(
                        id=s["id"], section=s["section"], before_text=s["before_text"], after_text=s["after_text"], reason=s["reason"], status=s["status"]
                    )
                    for s in accepted_sugs
                ]
                opt_resume = apply_suggestions_to_resume(struct_resume, sug_items, accepted_ids)
                recalc = calculate_match_analysis(opt_resume, struct_job)

            an["overall_score"] = recalc["overall_score"]
            an["score_breakdown"] = recalc["score_breakdown"]
            an["matched_skills"] = recalc["matched_skills"]
            an["underrepresented_skills"] = recalc["underrepresented_skills"]
            an["missing_skills"] = recalc["missing_skills"]
            an["evidence_list"] = recalc["evidence_list"]
            an["ats_analysis"] = recalc["ats_analysis"]

            await db.job_analyses.update_one(
                {"_id": an["_id"]},
                {"$set": {
                    "overall_score": recalc["overall_score"],
                    "score_breakdown": recalc["score_breakdown"],
                    "matched_skills": recalc["matched_skills"],
                    "underrepresented_skills": recalc["underrepresented_skills"],
                    "missing_skills": recalc["missing_skills"],
                    "evidence_list": recalc["evidence_list"],
                    "ats_analysis": recalc["ats_analysis"]
                }}
            )
        except Exception:
            pass

    return MatchAnalysisResponse(
        id=an["id"],
        resume_id=an["resume_id"],
        job_posting_id=an["job_posting_id"],
        overall_score=an["overall_score"],
        score_breakdown=ScoreBreakdown(**an["score_breakdown"]),
        matched_skills=an["matched_skills"],
        underrepresented_skills=an["underrepresented_skills"],
        missing_skills=an["missing_skills"],
        evidence_list=[EvidenceItem(**item) for item in an["evidence_list"]],
        ats_analysis=ATSAnalysis(**an["ats_analysis"]),
        created_at=an["created_at"],
        job_title=title,
        company=company
    )
