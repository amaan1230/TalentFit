import logging
from app.ai.base import AIProvider
from app.ai.openai_provider import OpenAIProvider
from app.ai.gemini_provider import GeminiProvider
from app.ai.mock_provider import MockProvider
from app.core.config import settings

logger = logging.getLogger(__name__)

def get_ai_provider(provider_name: str = None, api_key: str = None) -> AIProvider:
    name = (provider_name or settings.DEFAULT_AI_PROVIDER or "openai").lower()
    
    if api_key:
        api_key = api_key.strip().strip('"').strip("'")
    
    if api_key and len(api_key) > 5:
        logger.info(f"Using request-scoped custom {name} API key.")
        if name == "gemini":
            return GeminiProvider(api_key=api_key)
        elif name == "openai":
            return OpenAIProvider(api_key=api_key)

    # System env key fallback
    if name == "gemini" and settings.GEMINI_API_KEY:
        return GeminiProvider(api_key=settings.GEMINI_API_KEY)
    elif name == "openai" and settings.OPENAI_API_KEY:
        return OpenAIProvider(api_key=settings.OPENAI_API_KEY)
    elif settings.OPENAI_API_KEY:
        return OpenAIProvider(api_key=settings.OPENAI_API_KEY)
    elif settings.GEMINI_API_KEY:
        return GeminiProvider(api_key=settings.GEMINI_API_KEY)

    logger.info("No active AI provider keys found. Using MockProvider.")
    return MockProvider()

