from openai import AsyncOpenAI

from ..config import settings


class LLMService:
    def __init__(self):
        self.client = AsyncOpenAI(
            api_key=settings.llm_api_key,
            base_url=settings.llm_base_url,
        )

    async def generate(self, prompt: str) -> str:
        try:
            response = await self.client.chat.completions.create(
                model=settings.llm_model,
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "You are a helpful AI Programming Tutor. "
                            "Answer using the provided context when available. "
                            "Explain programming concepts clearly."
                        ),
                    },
                    {
                        "role": "user",
                        "content": prompt,
                    },
                ],
                temperature=0.2,
            )

            return response.choices[0].message.content or ""

        except Exception as e:
            error_text = str(e)

            if "503" in error_text or "high demand" in error_text.lower():
                return (
                    "The AI model is temporarily unavailable because it is "
                    "experiencing high demand. Your PDF was successfully "
                    "uploaded and indexed. Please try the question again "
                    "in a few seconds."
                )

            raise