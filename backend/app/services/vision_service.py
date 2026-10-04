from openai import AsyncOpenAI

from ..config import settings


class VisionService:
    def __init__(self):
        self.client = AsyncOpenAI(
            api_key=settings.llm_api_key,
            base_url=settings.llm_base_url,
        )

    async def analyze(
        self,
        base64_data: str,
        mime_type: str,
        question: str,
    ):
        if not settings.llm_api_key:
            return "LLM API key is not configured."

        try:
            response = await self.client.chat.completions.create(
                model=settings.vision_model,
                temperature=0.2,
                max_tokens=700,
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "You are a multimodal AI Programming Tutor. "
                            "Analyze programming screenshots, code images, "
                            "error messages, diagrams, and technical images. "
                            "Explain only what is visible in the image. "
                            "Do not invent details."
                        ),
                    },
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": question,
                            },
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": (
                                        f"data:{mime_type};base64,"
                                        f"{base64_data}"
                                    )
                                },
                            },
                        ],
                    },
                ],
            )

            return response.choices[0].message.content or ""

        except Exception as e:
            print("VISION ERROR:", repr(e))
            raise