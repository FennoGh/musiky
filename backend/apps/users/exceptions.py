"""DRF exception handler that mirrors FastAPI's HTTPException JSON shape.

Frontend (lib/api.ts) reads `data.detail`. This handler ensures every error
response carries a top-level `detail` string regardless of whether DRF's
default raised a string, dict, or list.
"""

from rest_framework.views import exception_handler


def _flatten(value):
    if isinstance(value, list):
        for item in value:
            yield from _flatten(item)
    elif isinstance(value, dict):
        for v in value.values():
            yield from _flatten(v)
    else:
        yield str(value)


def api_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is None:
        return None
    data = response.data
    if isinstance(data, dict) and "detail" in data and isinstance(data["detail"], str):
        return response
    detail = next(_flatten(data), "Request failed")
    response.data = {"detail": detail}
    return response
