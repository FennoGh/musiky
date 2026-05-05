import os
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from ..deps import get_current_user
from ..ids import cuid
from ..models import User

router = APIRouter(prefix="/uploads", tags=["uploads"])

UPLOAD_ROOT = Path(__file__).resolve().parents[2] / "uploads"
IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
AUDIO_TYPES = {
    "audio/mpeg",
    "audio/mp3",
    "audio/wav",
    "audio/x-wav",
    "audio/ogg",
    "audio/mp4",
    "audio/x-m4a",
    "audio/flac",
}
MAX_IMAGE = 8 * 1024 * 1024  # 8 MB
MAX_AUDIO = 60 * 1024 * 1024  # 60 MB


def _save(file: UploadFile, kind: str, allowed: set[str], max_bytes: int) -> str:
    if file.content_type not in allowed:
        raise HTTPException(415, f"Unsupported type: {file.content_type}")
    ext = os.path.splitext(file.filename or "")[1].lower()
    name = f"{cuid()}{ext}"
    dest_dir = UPLOAD_ROOT / kind
    dest_dir.mkdir(parents=True, exist_ok=True)
    dest = dest_dir / name
    size = 0
    with dest.open("wb") as out:
        while chunk := file.file.read(1024 * 1024):
            size += len(chunk)
            if size > max_bytes:
                out.close()
                dest.unlink(missing_ok=True)
                raise HTTPException(413, "File too large")
            out.write(chunk)
    return f"/uploads/{kind}/{name}"


@router.post("/cover")
def upload_cover(
    file: UploadFile = File(...),
    _: User = Depends(get_current_user),
):
    return {"url": _save(file, "covers", IMAGE_TYPES, MAX_IMAGE)}


@router.post("/audio")
def upload_audio(
    file: UploadFile = File(...),
    _: User = Depends(get_current_user),
):
    return {"url": _save(file, "audio", AUDIO_TYPES, MAX_AUDIO)}
