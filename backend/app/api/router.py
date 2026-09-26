from fastapi import APIRouter
from app.api.v1 import auth, resumes, jobs, analyses, optimization, cover_letters, documents

api_router = APIRouter(prefix="/api")

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(resumes.router, prefix="/resumes", tags=["Resumes"])
api_router.include_router(jobs.router, prefix="/jobs", tags=["Jobs"])
api_router.include_router(analyses.router, tags=["Analyses"])
api_router.include_router(optimization.router, tags=["Optimization"])
api_router.include_router(cover_letters.router, prefix="/cover-letter", tags=["Cover Letters"])
api_router.include_router(documents.router, prefix="/documents", tags=["Documents"])
