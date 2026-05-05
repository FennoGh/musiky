from datetime import datetime
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import Session, func, select

from ..database import get_session
from ..deps import get_current_user
from ..ids import cuid
from ..models import (
    Activity,
    ActivityType,
    CollabRole,
    Collaborator,
    User,
)
from ..permissions import get_project_for_member, get_project_for_owner

router = APIRouter(prefix="/projects/{project_id}/collaborators", tags=["collaborators"])


class CollaboratorIn(BaseModel):
    email: str
    role: CollabRole
    splitPct: Decimal


class CollaboratorPatch(BaseModel):
    splitPct: Decimal | None = None
    role: CollabRole | None = None


class CollaboratorOut(BaseModel):
    id: str
    projectId: str
    userId: str
    userName: str | None
    userEmail: str | None
    role: CollabRole
    splitPct: Decimal
    joinedAt: datetime

    model_config = {"from_attributes": True}


def _enrich(session: Session, collab: Collaborator) -> CollaboratorOut:
    u = session.get(User, collab.userId)
    return CollaboratorOut(
        id=collab.id,
        projectId=collab.projectId,
        userId=collab.userId,
        userName=u.name if u else None,
        userEmail=u.email if u else None,
        role=collab.role,
        splitPct=collab.splitPct,
        joinedAt=collab.joinedAt,
    )


@router.get("", response_model=list[CollaboratorOut])
def list_collaborators(
    project_id: str,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
):
    get_project_for_member(session, project_id, user)
    collabs = session.exec(
        select(Collaborator).where(Collaborator.projectId == project_id)
    ).all()
    return [_enrich(session, c) for c in collabs]


@router.post("", response_model=CollaboratorOut, status_code=201)
def add_collaborator(
    project_id: str,
    body: CollaboratorIn,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
):
    project = get_project_for_owner(session, project_id, user)

    target = session.exec(select(User).where(User.email == body.email)).first()
    if not target:
        raise HTTPException(
            404, "No user with that email — ask them to sign up first."
        )

    existing = session.exec(
        select(Collaborator).where(
            Collaborator.projectId == project_id,
            Collaborator.userId == target.id,
        )
    ).first()
    if existing:
        raise HTTPException(409, "That user is already a collaborator on this project")

    total = session.exec(
        select(func.coalesce(func.sum(Collaborator.splitPct), 0)).where(
            Collaborator.projectId == project_id
        )
    ).one()
    total_dec = Decimal(total)
    deficit = total_dec + body.splitPct - Decimal("100.00")

    # When the requested split would exceed 100%, atomically pull the difference
    # from the owner's share. This keeps the allocation bar consistent: if the
    # add fails, nothing is committed, so the owner's split stays untouched.
    if deficit > 0:
        owner_collab = session.exec(
            select(Collaborator).where(
                Collaborator.projectId == project_id,
                Collaborator.userId == project.ownerId,
            )
        ).first()
        if not owner_collab or (owner_collab.splitPct or Decimal("0")) < deficit:
            raise HTTPException(400, "Total split would exceed 100%")
        owner_collab.splitPct = (owner_collab.splitPct or Decimal("0")) - deficit
        session.add(owner_collab)

    collab = Collaborator(
        id=cuid(),
        projectId=project_id,
        userId=target.id,
        role=body.role,
        splitPct=body.splitPct,
    )
    session.add(collab)
    session.add(
        Activity(
            id=cuid(),
            projectId=project_id,
            actorId=user.id,
            type=ActivityType.COLLAB_JOINED,
            payload={"role": body.role.value, "splitPct": str(body.splitPct)},
        )
    )
    session.commit()
    session.refresh(collab)
    return _enrich(session, collab)


@router.patch("/{collaborator_id}", response_model=CollaboratorOut)
def update_collaborator(
    project_id: str,
    collaborator_id: str,
    body: CollaboratorPatch,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
):
    get_project_for_owner(session, project_id, user)
    collab = session.get(Collaborator, collaborator_id)
    if not collab or collab.projectId != project_id:
        raise HTTPException(404, "Collaborator not found")

    if body.role is not None:
        collab.role = body.role
    if body.splitPct is not None:
        # re-validate total splits excluding this collaborator
        others_total = session.exec(
            select(func.coalesce(func.sum(Collaborator.splitPct), 0)).where(
                Collaborator.projectId == project_id,
                Collaborator.id != collaborator_id,
            )
        ).one()
        if Decimal(others_total) + body.splitPct > Decimal("100.00"):
            raise HTTPException(400, "Total split would exceed 100%")
        collab.splitPct = body.splitPct

    session.add(collab)
    session.commit()
    session.refresh(collab)
    return _enrich(session, collab)


@router.delete("/{collaborator_id}", status_code=204)
def remove_collaborator(
    project_id: str,
    collaborator_id: str,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
):
    project = get_project_for_owner(session, project_id, user)
    collab = session.get(Collaborator, collaborator_id)
    if not collab or collab.projectId != project_id:
        raise HTTPException(404, "Collaborator not found")
    if collab.role == CollabRole.OWNER:
        raise HTTPException(400, "Cannot remove the project owner")

    freed = collab.splitPct or Decimal("0")
    session.delete(collab)

    # Transfer the freed split back to the owner so totals stay at 100%
    # and the project stops appearing on the removed user's dashboard.
    owner_collab = session.exec(
        select(Collaborator).where(
            Collaborator.projectId == project_id,
            Collaborator.userId == project.ownerId,
        )
    ).first()
    if owner_collab is not None and freed > 0:
        owner_collab.splitPct = (owner_collab.splitPct or Decimal("0")) + freed
        session.add(owner_collab)

    session.commit()
