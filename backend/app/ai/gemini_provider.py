import json
import logging
import re
from typing import Type, TypeVar
from pydantic import BaseModel
import httpx
from app.ai.base import AIProvider
from app.core.config import settings

T = TypeVar("T", bound=BaseModel)
logger = logging.getLogger(__name__)

class GeminiProvider(AIProvider):
    def __init__(self, api_key: str = None, model: str = None):
        self.api_key = api_key or settings.GEMINI_API_KEY
        self.model = model or settings.GEMINI_MODEL or "gemini-2.5-flash"

    async def generate_text(self, prompt: str, system_prompt: str = None) -> str:
        if not self.api_key:
            raise ValueError("Gemini API key not configured.")

        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent?key={self.api_key}"
        
        contents = []
        if system_prompt:
            contents.append({"role": "user", "parts": [{"text": f"System Instructions: {system_prompt}\n\nUser Request: {prompt}"}]})
        else:
            contents.append({"role": "user", "parts": [{"text": prompt}]})

        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(url, json={"contents": contents})
            if resp.status_code != 200:
                logger.error(f"Gemini API error ({resp.status_code}): {resp.text}")
                raise ValueError(f"Gemini API returned status {resp.status_code}: {resp.text}")
            data = resp.json()
            try:
                return data["candidates"][0]["content"]["parts"][0]["text"]
            except (KeyError, IndexError) as e:
                raise ValueError(f"Unexpected Gemini response structure: {data}")

    async def generate_structured(self, prompt: str, schema_cls: Type[T], system_prompt: str = None) -> T:
        if not self.api_key:
            raise ValueError("Gemini API key not configured.")

        schema_json = json.dumps(schema_cls.model_json_schema(), indent=2)
        full_prompt = f"{system_prompt or ''}\n\nTask: {prompt}\n\nReturn JSON conforming to this Pydantic schema:\n{schema_json}\n\nOutput strictly JSON without markdown codeblocks or extra text."
        
        raw_text = await self.generate_text(full_prompt)
        
        # Clean markdown code blocks if present
        clean_json = raw_text.strip()
        if clean_json.startswith("```json"):
            clean_json = clean_json[7:]
        if clean_json.startswith("```"):
            clean_json = clean_json[3:]
        if clean_json.endswith("```"):
            clean_json = clean_json[:-3]
        clean_json = clean_json.strip()

        try:
            return schema_cls.model_validate_json(clean_json)
        except Exception as e:
            logger.error(f"Failed to validate Gemini JSON output: {e}\nRaw output: {raw_text}")
            raise e
