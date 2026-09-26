import json
import logging
from typing import Type, TypeVar
from pydantic import BaseModel
import openai
from app.ai.base import AIProvider
from app.core.config import settings

T = TypeVar("T", bound=BaseModel)
logger = logging.getLogger(__name__)

class OpenAIProvider(AIProvider):
    def __init__(self, api_key: str = None, model: str = None):
        self.api_key = api_key or settings.OPENAI_API_KEY
        self.model = model or settings.OPENAI_MODEL
        if self.api_key:
            self.client = openai.AsyncOpenAI(api_key=self.api_key)
        else:
            self.client = None

    async def generate_text(self, prompt: str, system_prompt: str = None) -> str:
        if not self.client:
            raise ValueError("OpenAI API key not configured.")
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        response = await self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            temperature=0.3
        )
        return response.choices[0].message.content or ""

    async def generate_structured(self, prompt: str, schema_cls: Type[T], system_prompt: str = None) -> T:
        if not self.client:
            raise ValueError("OpenAI API key not configured.")
        
        full_system = (system_prompt or "") + "\n\nRespond ONLY with valid JSON matching the schema."
        json_schema_prompt = f"{prompt}\n\nJSON Schema:\n{json.dumps(schema_cls.model_json_schema(), indent=2)}"

        for attempt in range(2):
            try:
                response = await self.client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {"role": "system", "content": full_system},
                        {"role": "user", "content": json_schema_prompt}
                    ],
                    response_format={"type": "json_object"},
                    temperature=0.2
                )
                raw_json = response.choices[0].message.content or "{}"
                return schema_cls.model_validate_json(raw_json)
            except Exception as e:
                logger.warning(f"OpenAI structured parsing attempt {attempt+1} failed: {e}")
                if attempt == 1:
                    raise e
