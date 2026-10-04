import base64

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from ..services.vision_service import VisionService

router = APIRouter(prefix="/multimodal", tags=["multimodal"])

vision = VisionService()


@router.post("/analyze-image")
async def analyze_image(
    image: UploadFile = File(...),
    question: str = Form(
        "Analyze this programming image and explain what it shows."
    ),
):
    content_type = image.content_type or ""

    if not content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail="Please upload an image file."
        )

    # SVG is not reliably supported by vision APIs.
    if content_type == "image/svg+xml":
        raise HTTPException(
            status_code=400,
            detail=(
                "SVG images are not supported for AI image analysis. "
                "Please upload the image as PNG or JPG."
            )
        )

    data = await image.read()

    if len(data) > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=413,
            detail="Image exceeds 10 MB limit."
        )

    encoded = base64.b64encode(data).decode("utf-8")

    try:
        answer = await vision.analyze(
            encoded,
            content_type,
            question,
        )

        return {
            "answer": answer,
            "filename": image.filename,
        }

    except Exception as e:
        print("MULTIMODAL ERROR:", repr(e))

        raise HTTPException(
            status_code=500,
            detail=f"Vision analysis failed: {str(e)}"
        )