import logging
import uuid
from io import BytesIO
from pathlib import Path

from fastapi import APIRouter, File, HTTPException, Request, UploadFile
from PIL import Image, UnidentifiedImageError

from ..rate_limit import limiter

router = APIRouter()
logger = logging.getLogger(__name__)

UPLOAD_DIR = Path(__file__).resolve().parent.parent / "uploads"
MAX_SIZE = 5 * 1024 * 1024  # 5MB

# Pillow가 판별한 실제 포맷 → 저장 확장자.
# 클라이언트가 보낸 content_type은 위조할 수 있어 신뢰하지 않는다.
FORMAT_EXT = {
    "JPEG": "jpg",
    "PNG": "png",
    "WEBP": "webp",
    "GIF": "gif",
}

# 압축 폭탄(decompression bomb) 방지 — 픽셀 수 상한
Image.MAX_IMAGE_PIXELS = 50_000_000


@router.post("/upload")
@limiter.limit("20/hour")
async def upload_image(request: Request, file: UploadFile = File(...)):
    contents = await file.read()

    if len(contents) > MAX_SIZE:
        raise HTTPException(status_code=413, detail="파일 크기는 5MB 이하만 허용됩니다.")
    if not contents:
        raise HTTPException(status_code=400, detail="빈 파일입니다.")

    # 확장자가 아니라 실제 내용으로 이미지 여부를 판별한다
    try:
        with Image.open(BytesIO(contents)) as img:
            img.verify()  # 손상·위조 검사 (verify 후에는 재사용 불가)
        with Image.open(BytesIO(contents)) as img:
            image_format = img.format
    except (UnidentifiedImageError, OSError, Image.DecompressionBombError):
        raise HTTPException(
            status_code=415,
            detail="이미지 파일만 업로드 가능합니다. (jpg, png, webp, gif)",
        )

    ext = FORMAT_EXT.get(image_format or "")
    if ext is None:
        raise HTTPException(
            status_code=415,
            detail="이미지 파일만 업로드 가능합니다. (jpg, png, webp, gif)",
        )

    # 파일명은 서버가 생성한다 — 사용자 입력이 경로에 들어가지 않도록
    filename = f"{uuid.uuid4().hex}.{ext}"
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    (UPLOAD_DIR / filename).write_bytes(contents)

    # DB에는 상대경로로 저장한다 (프론트의 resolveUploadUrl이 오리진을 붙인다)
    return {"url": f"/uploads/{filename}"}
