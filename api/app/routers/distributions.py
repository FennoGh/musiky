import re
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import Session, select

from ..database import get_session
from ..deps import get_current_user
from ..ids import cuid
from ..models import (
    Activity,
    ActivityType,
    DistStatus,
    Distribution,
    Platform,
    User,
)
from ..permissions import get_project_for_member, get_project_for_owner

router = APIRouter(prefix="/projects/{project_id}/distributions", tags=["distributions"])


class DistributionIn(BaseModel):
    platformId: str | None = None
    customName: str | None = None


class StreamsIn(BaseModel):
    streams: int


def _slugify(name: str) -> str:
    s = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
    return s or "custom"


@router.get("", response_model=list[Distribution])
def list_distributions(
    project_id: str,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
):
    get_project_for_member(session, project_id, user)
    return session.exec(
        select(Distribution).where(Distribution.projectId == project_id)
    ).all()


@router.post("", response_model=Distribution, status_code=201)
def start_distribution(
    project_id: str,
    body: DistributionIn,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
):
    get_project_for_owner(session, project_id, user)

    # Resolve the target platform: either an existing platformId or a free-text
    # customName that gets reused / created as needed.
    if body.platformId:
        platform = session.get(Platform, body.platformId)
        if not platform:
            raise HTTPException(404, "Platform not found")
    elif body.customName and body.customName.strip():
        name = body.customName.strip()
        if len(name) < 2:
            raise HTTPException(400, "Platform name must be at least 2 characters")
        platform = session.exec(select(Platform).where(Platform.name == name)).first()
        if not platform:
            base_slug = _slugify(name)
            slug = base_slug
            n = 1
            while session.exec(select(Platform).where(Platform.slug == slug)).first():
                n += 1
                slug = f"{base_slug}-{n}"
            platform = Platform(id=cuid(), name=name, slug=slug)
            session.add(platform)
            session.flush()
    else:
        raise HTTPException(400, "platformId or customName is required")

    existing = session.exec(
        select(Distribution).where(
            Distribution.projectId == project_id,
            Distribution.platformId == platform.id,
        )
    ).first()
    if existing:
        raise HTTPException(400, "Already distributed to this platform")

    dist = Distribution(
        id=cuid(),
        projectId=project_id,
        platformId=platform.id,
        status=DistStatus.LIVE,  # in real life: PENDING then async confirm
        liveAt=datetime.utcnow(),
    )
    session.add(dist)
    session.add(
        Activity(
            id=cuid(),
            projectId=project_id,
            actorId=user.id,
            type=ActivityType.DISTRIBUTED,
            payload={"platformId": platform.id, "name": platform.name},
        )
    )
    session.commit()
    session.refresh(dist)
    return dist


@router.patch("/{distribution_id}/streams", response_model=Distribution)
def update_streams(
    project_id: str,
    distribution_id: str,
    body: StreamsIn,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
):
    get_project_for_owner(session, project_id, user)
    dist = session.get(Distribution, distribution_id)
    if not dist or dist.projectId != project_id:
        raise HTTPException(404, "Distribution not found")
    if dist.status != DistStatus.LIVE:
        raise HTTPException(400, "Streams can only be set on LIVE distributions")
    if body.streams < 0:
        raise HTTPException(400, "Streams must be a non-negative integer")
    dist.streams = body.streams
    session.add(dist)
    session.commit()
    session.refresh(dist)
    return dist


@router.delete("/{distribution_id}", status_code=204)
def remove_distribution(
    project_id: str,
    distribution_id: str,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
):
    get_project_for_owner(session, project_id, user)
    dist = session.get(Distribution, distribution_id)
    if not dist or dist.projectId != project_id:
        raise HTTPException(404, "Distribution not found")
    session.delete(dist)
    session.add(
        Activity(
            id=cuid(),
            projectId=project_id,
            actorId=user.id,
            type=ActivityType.DISTRIBUTED,
            payload={"action": "removed", "platformId": dist.platformId},
        )
    )
    session.commit()
