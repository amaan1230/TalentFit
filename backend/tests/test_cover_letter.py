import asyncio
from app.schemas.resume import StructuredResume
from app.schemas.job import JobPostingSchema
from app.services.cover_letter_service import fill_placeholders, generate_tailored_cover_letter


class Echo:
    async def generate_text(self, prompt, system_prompt=None):
        self.prompt = prompt
        return "[Your Name]\nDear Hiring Manager at [Company Name],\n\n[Date]\nSincerely,\n[Your Full Name]"


def test_fill_placeholders():
    out = fill_placeholders("Dear [Company Name],\n[Date]\nSincerely,\n[Your Name]", "Asha Rao", "Acme")
    assert out == "Dear Acme,\n\nSincerely,\nAsha Rao"


def test_name_and_company_flow_into_letter():
    ai = Echo()
    out = asyncio.run(generate_tailored_cover_letter(StructuredResume(name=""), JobPostingSchema(title="Dev", company="Acme Corp"), [], ai_provider=ai, fallback_name="Asha Rao"))
    assert "Asha Rao" in ai.prompt and "Acme Corp" in ai.prompt
    assert "Asha Rao" in out and "Acme Corp" in out and "[" not in out


def test_default_company_not_used():
    ai = Echo()
    asyncio.run(generate_tailored_cover_letter(StructuredResume(name="Asha"), JobPostingSchema(title="Dev"), [], ai_provider=ai))
    assert "Target Company" not in ai.prompt
