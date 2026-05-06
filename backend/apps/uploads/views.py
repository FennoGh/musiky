import os
from pathlib import Path

from django.conf import settings
from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response

from apps.users.utils.ids import cuid

UPLOAD_ROOT = Path(settings.MEDIA_ROOT)
IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
AUDIO_TYPES = {
    "audio/mpeg", "audio/mp3", "audio/wav", "audio/x-wav",
    "audio/ogg", "audio/mp4", "audio/x-m4a", "audio/flac",
}
MAX_IMAGE = 8 * 1024 * 1024   # 8 MB
MAX_AUDIO = 60 * 1024 * 1024  # 60 MB


def _save(file, kind, allowed, max_bytes):
    if file.content_type not in allowed:
        return None, Response(
            {"detail": f"Unsupported type: {file.content_type}"}, status=415
        )
    ext = os.path.splitext(file.name or "")[1].lower()
    name = f"{cuid()}{ext}"
    dest_dir = UPLOAD_ROOT / kind
    dest_dir.mkdir(parents=True, exist_ok=True)
    dest = dest_dir / name
    size = 0
    try:
        with dest.open("wb") as out:
            for chunk in file.chunks(1024 * 1024):
                size += len(chunk)
                if size > max_bytes:
                    out.close()
                    dest.unlink(missing_ok=True)
                    return None, Response({"detail": "File too large"}, status=413)
                out.write(chunk)
    except OSError as exc:
        dest.unlink(missing_ok=True)
        return None, Response({"detail": f"Upload failed: {exc}"}, status=500)
    return f"/uploads/{kind}/{name}", None


@api_view(["POST"])
@parser_classes([MultiPartParser])
def upload_cover(request):
    file = request.FILES.get("file")
    if not file:
        return Response({"detail": "file field required"}, status=400)
    url, err = _save(file, "covers", IMAGE_TYPES, MAX_IMAGE)
    if err:
        return err
    return Response({"url": url})


@api_view(["POST"])
@parser_classes([MultiPartParser])
def upload_audio(request):
    file = request.FILES.get("file")
    if not file:
        return Response({"detail": "file field required"}, status=400)
    url, err = _save(file, "audio", AUDIO_TYPES, MAX_AUDIO)
    if err:
        return err
    return Response({"url": url})
