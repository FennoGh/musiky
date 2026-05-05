from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlmodel import Session, select

from ..database import get_session
from ..deps import get_current_user
from ..ids import cuid
from ..models import Activity, ActivityType, Track, User
from ..permissions import get_project_for_member, get_project_for_owner

router = APIRouter(prefix="/projects/{project_id}/tracks", tags=["tracks"])


class TrackIn(BaseModel):
    title: str
    fileUrl: str
    coverUrl: str | None = None
    duration: int | None = None
    version: int = 1


@router.get("", response_model=list[Track])
def list_tracks(
    project_id: str,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
):
    get_project_for_member(session, project_id, user)
    return session.exec(
        select(Track).where(Track.projectId == project_id).order_by(Track.uploadedAt.desc())
    ).all()


@router.post("", response_model=Track, status_code=201)
def add_track(
    project_id: str,
    body: TrackIn,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
):
    get_project_for_owner(session, project_id, user)
    track = Track(id=cuid(), projectId=project_id, **body.model_dump())
    session.add(track)
    session.add(
        Activity(
            id=cuid(),
            projectId=project_id,
            actorId=user.id,
            type=ActivityType.TRACK_UPLOADED,
            payload={"title": body.title, "version": body.version},
        )
    )
    session.commit()
    session.refresh(track)
    return track
