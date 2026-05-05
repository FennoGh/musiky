from datetime import datetime
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import Session, or_, select

from ..database import get_session
from ..deps import get_current_user
from ..ids import cuid
from ..models import (
    Activity,
    ActivityType,
    CollabRole,
    Collaborator,
    Project,
    ProjectStatus,
    User,
)
from ..permissions import get_project_for_member, get_project_for_owner

router = APIRouter(prefix="/projects", tags=["projects"])


class ProjectIn(BaseModel):
    title: str
    coverUrl: str | None = None


class ProjectPatch(BaseModel):
    title: str | None = None
    coverUrl: str | None = None
    status: ProjectStatus | None = None


class ProjectOut(BaseModel):
    id: str
    title: str
    coverUrl: str | None
    status: ProjectStatus
    ownerId: str
    createdAt: datetime
    releasedAt: datetime | None
    isOwner: bool
    role: CollabRole | None
    mySplitPct: Decimal | None

    model_config = {"from_attributes": True}


def _to_out(project: Project, user: User, collab: Collaborator | None) -> ProjectOut:
    is_owner = project.ownerId == user.id
    role: CollabRole | None = collab.role if collab else (CollabRole.OWNER if is_owner else None)
    split = collab.splitPct if collab else None
    return ProjectOut(
        id=project.id,
        title=project.title,
        coverUrl=project.coverUrl,
        status=project.status,
        ownerId=project.ownerId,
        createdAt=project.createdAt,
        releasedAt=project.releasedAt,
        isOwner=is_owner,
        role=role,
        mySplitPct=split,
    )


@router.post("", response_model=ProjectOut, status_code=201)
def create_project(
    body: ProjectIn,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
):
    project = Project(
        id=cuid(), title=body.title, coverUrl=body.coverUrl, ownerId=user.id
    )
    session.add(project)
    session.flush()  # ensure project row exists for FK references below
    # owner is automatically a collaborator with 100% until others are added
    owner_collab = Collaborator(
        id=cuid(),
        projectId=project.id,
        userId=user.id,
        role=CollabRole.OWNER,
        splitPct=Decimal("100.00"),
    )
    session.add(owner_collab)
    session.add(
        Activity(
            id=cuid(),
            projectId=project.id,
            actorId=user.id,
            type=ActivityType.PROJECT_CREATED,
            payload={"title": project.title},
        )
    )
    session.commit()
    session.refresh(project)
    session.refresh(owner_collab)
    return _to_out(project, user, owner_collab)


@router.get("", response_model=list[ProjectOut])
def list_my_projects(
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
):
    """Projects the user owns or collaborates on, newest first."""
    collab_project_ids = session.exec(
        select(Collaborator.projectId).where(Collaborator.userId == user.id)
    ).all()

    if collab_project_ids:
        clause = or_(
            Project.ownerId == user.id,
            Project.id.in_(collab_project_ids),  # type: ignore[union-attr]
        )
    else:
        clause = Project.ownerId == user.id

    projects = session.exec(
        select(Project).where(clause).order_by(Project.createdAt.desc())
    ).all()

    if not projects:
        return []

    collabs = session.exec(
        select(Collaborator).where(
            Collaborator.userId == user.id,
            Collaborator.projectId.in_([p.id for p in projects]),  # type: ignore[union-attr]
        )
    ).all()
    collab_by_project = {c.projectId: c for c in collabs}

    return [_to_out(p, user, collab_by_project.get(p.id)) for p in projects]


@router.get("/{project_id}", response_model=ProjectOut)
def get_project(
    project_id: str,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
):
    project, _ = get_project_for_member(session, project_id, user)
    collab = session.exec(
        select(Collaborator).where(
            Collaborator.projectId == project_id,
            Collaborator.userId == user.id,
        )
    ).first()
    return _to_out(project, user, collab)


@router.patch("/{project_id}", response_model=ProjectOut)
def update_project(
    project_id: str,
    body: ProjectPatch,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
):
    project = get_project_for_owner(session, project_id, user)
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(project, k, v)
    session.add(project)
    session.commit()
    session.refresh(project)
    collab = session.exec(
        select(Collaborator).where(
            Collaborator.projectId == project_id,
            Collaborator.userId == user.id,
        )
    ).first()
    return _to_out(project, user, collab)


@router.delete("/{project_id}", status_code=204)
def delete_project(
    project_id: str,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
):
    project = get_project_for_owner(session, project_id, user)
    session.delete(project)
    session.commit()
