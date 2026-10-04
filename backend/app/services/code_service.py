from .llm_service import LLMService


class CodeService:
    def __init__(self):
        self.llm = LLMService()

    async def analyze(self, code: str, language: str):

        prompt = f"""
You are a friendly AI Programming Tutor.

The user is using a Code Debugger and may be a complete beginner.

Analyze this {language} code:

```{language}
{code}
"""
        answer = await self.llm.generate(prompt)

        return {
            "language": language,
            "analysis": answer,
            "execution": {
                "executed": False,
                "message": (
                    "Code execution is disabled. "
                    "The code was analyzed using AI static analysis."
            ),
        },
    }