import re

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import Session, select

from ..database import get_session
from ..deps import get_current_user
from ..ids import cuid
from ..models import Platform, User

router = APIRouter(prefix="/platforms", tags=["platforms"])


class PlatformIn(BaseModel):
    name: str


def _slugify(name: str) -> str:
    s = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
    return s or "custom"


@router.get("", response_model=list[Platform])
def list_platforms(session: Session = Depends(get_session)):
    return session.exec(select(Platform).order_by(Platform.name)).all()


@router.post("", response_model=Platform, status_code=201)
def create_custom_platform(
    body: PlatformIn,
    session: Session = Depends(get_session),
    _: User = Depends(get_current_user),
):
    name = body.name.strip()
    if len(name) < 2:
        raise HTTPException(400, "Platform name must be at least 2 characters")

    # If a platform with this name already exists, return it instead of erroring.
    existing = session.exec(select(Platform).where(Platform.name == name)).first()
    if existing:
        return existing

    base_slug = _slugify(name)
    slug = base_slug
    n = 1
    while session.exec(select(Platform).where(Platform.slug == slug)).first():
        n += 1
        slug = f"{base_slug}-{n}"

    platform = Platform(id=cuid(), name=name, slug=slug)
    session.add(platform)
    session.commit()
    session.refresh(platform)
    return platform
