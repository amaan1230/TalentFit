import hashlib
import logging
from typing import Tuple, Optional
import httpx
from bs4 import BeautifulSoup
from app.schemas.job import JobPostingSchema
from app.ai.base import AIProvider
from app.ai.factory import get_ai_provider
from app.ai.prompts import JOB_EXTRACTOR_SYSTEM

logger = logging.getLogger(__name__)

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9"
}

def clean_html_content(html: str) -> str:
    soup = BeautifulSoup(html, "html.parser")
    for element in soup(["script", "style", "nav", "footer", "header", "svg", "iframe", "noscript"]):
        element.decompose()
    
    # Try finding main job container if available
    main_container = soup.find("main") or soup.find("article") or soup.find(class_=lambda c: c and any(k in str(c).lower() for k in ["job", "description", "posting", "content"]))
    target = main_container if main_container else soup.body or soup

    lines = (line.strip() for line in target.get_text(separator="\n").splitlines())
    chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
    text = "\n".join(chunk for chunk in chunks if chunk)
    return text

async def fetch_job_url(url: str) -> str:
    try:
        async with httpx.AsyncClient(timeout=15.0, follow_redirects=True, headers=HEADERS) as client:
            resp = await client.get(url)
            if resp.status_code != 200:
                raise ValueError(f"HTTP Status {resp.status_code}")
            clean_text = clean_html_content(resp.text)
            if len(clean_text) < 50:
                raise ValueError("Extracted text is too short or blocked.")
            return clean_text
    except Exception as e:
        logger.warning(f"Failed to fetch job URL ({url}): {e}")
        raise ValueError("We couldn't automatically read this job posting. Anti-bot protections or paywalls may be blocking access.")

async def extract_job_from_text(
    raw_text: str,
    custom_title: str = None,
    custom_company: str = None,
    ai_provider: Optional[AIProvider] = None
) -> Tuple[JobPostingSchema, str]:
    content_hash = hashlib.sha256(raw_text.encode("utf-8")).hexdigest()
    provider = ai_provider or get_ai_provider()
    
    prompt = f"Extract structured job specifications from this text:\n\n{raw_text[:12000]}"
    try:
        job_schema = await provider.generate_structured(
            prompt=prompt,
            schema_cls=JobPostingSchema,
            system_prompt=JOB_EXTRACTOR_SYSTEM
        )
    except Exception as e:
        logger.warning(f"AI job extraction fallback triggered: {e}")
        job_schema = JobPostingSchema(
            title=custom_title or "Target Position",
            company=custom_company or "Company",
            responsibilities=[raw_text[:300]]
        )

    if custom_title:
        job_schema.title = custom_title
    if custom_company:
        job_schema.company = custom_company

    return job_schema, content_hash
