import os
import uuid
import logging
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from app.core.db import get_db
from app.core.deps import get_current_user
from app.schemas.resume import StructuredResume
from app.services.document_generator import (
    generate_resume_pdf,
    generate_resume_docx,
    generate_cover_letter_pdf,
    generate_cover_letter_docx
)
from app.services.optimizer import apply_suggestions_to_resume, clean_optimized_text
from app.services.template_filler import fill_original_template
from app.schemas.optimization import SuggestionItem

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/download/{doc_type}/{analysis_id}")
async def download_document(
    doc_type: str, # "resume_pdf", "resume_docx", "cover_letter_pdf", "cover_letter_docx"
    analysis_id: str,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db)
):
    valid_types = ["resume_pdf", "resume_docx", "cover_letter_pdf", "cover_letter_docx"]
    if doc_type not in valid_types:
        raise HTTPException(status_code=400, detail="Invalid document type requested.")

    user_id = current_user["id"]
    analysis = await db.job_analyses.find_one({"_id": analysis_id, "user_id": user_id})
    if not analysis:
        analysis = await db.job_analyses.find_one({"id": analysis_id, "user_id": user_id})
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis record not found.")

    filepath = ""
    download_filename = "document.pdf"

    if doc_type.startswith("resume"):
        resume_obj = await db.resumes.find_one({"_id": analysis["resume_id"]})
        if not resume_obj:
            resume_obj = await db.resumes.find_one({"id": analysis["resume_id"]})
        orig_structured = StructuredResume(**resume_obj["parsed_json"])

        an_id_val = analysis.get("id") or str(analysis.get("_id"))
        cursor = db.optimization_suggestions.find({
            "analysis_id": {"$in": [an_id_val, str(analysis.get("_id")), analysis.get("id")]},
            "status": "accepted"
        })
        accepted_sugs = await cursor.to_list(length=100)
        accepted_ids = [s["id"] for s in accepted_sugs]

        sug_items = [
            SuggestionItem(
                id=s["id"], section=s["section"], before_text=s["before_text"], after_text=s["after_text"], reason=s["reason"], status=s["status"]
            )
            for s in accepted_sugs
        ]

        final_resume = apply_suggestions_to_resume(orig_structured, sug_items, accepted_ids)

        # Prefer editing the user's own uploaded file so the download keeps their template.
        ext = ".pdf" if doc_type == "resume_pdf" else ".docx"
        pairs = [(s.before_text, clean_optimized_text(s.after_text)) for s in sug_items
                 if s.section == "summary" or s.section.startswith(("experience:", "project:"))]
        new_skills = [clean_optimized_text(s.after_text) for s in sug_items if s.section.startswith("skills")]
        try:
            filepath = fill_original_template(resume_obj.get("file_path"), ext, pairs, orig_structured.skills, new_skills) or ""
        except Exception as e:
            logger.warning(f"Template fill failed, using generated layout: {e}")
            filepath = ""
        if not filepath:
            filepath = (generate_resume_pdf if ext == ".pdf" else generate_resume_docx)(final_resume)
        download_filename = f"Optimized_Resume_{final_resume.name or 'Candidate'}{ext}".replace(" ", "_")

    elif doc_type.startswith("cover_letter"):
        an_id_val = analysis.get("id") or str(analysis.get("_id"))
        cursor = db.cover_letters.find({
            "analysis_id": {"$in": [an_id_val, str(analysis.get("_id")), analysis.get("id")]},
            "user_id": user_id
        }).sort("created_at", -1)
        cl_list = await cursor.to_list(length=1)
        if not cl_list:
            raise HTTPException(status_code=404, detail="No cover letter generated for this analysis yet.")
        cl_obj = cl_list[0]

        resume_obj = await db.resumes.find_one({"_id": analysis["resume_id"]})
        if not resume_obj:
            resume_obj = await db.resumes.find_one({"id": analysis["resume_id"]})
        cand_name = (resume_obj["parsed_json"].get("name") if resume_obj else "") or current_user.get("name") or "Candidate"

        if doc_type == "cover_letter_pdf":
            filepath = generate_cover_letter_pdf(cl_obj["content"], cand_name=cand_name)
            download_filename = f"Cover_Letter_{cand_name}.pdf".replace(" ", "_")
        else:
            filepath = generate_cover_letter_docx(cl_obj["content"], cand_name=cand_name)
            download_filename = f"Cover_Letter_{cand_name}.docx".replace(" ", "_")

    if not os.path.exists(filepath):
        raise HTTPException(status_code=500, detail="Failed to generate download document.")

    gen_doc_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    gen_doc = {
        "_id": gen_doc_id,
        "id": gen_doc_id,
        "analysis_id": analysis["id"],
        "doc_type": doc_type,
        "file_path": filepath,
        "created_at": now
    }
    await db.generated_documents.insert_one(gen_doc)

    media_type = "application/pdf" if doc_type.endswith("_pdf") else "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

    return FileResponse(
        path=filepath,
        filename=download_filename,
        media_type=media_type
    )
