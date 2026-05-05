from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from sqlmodel import Session, select

from ..database import get_session
from ..deps import get_current_user
from ..models import (
    Activity,
    Collaborator,
    Expense,
    Payout,
    Project,
    Revenue,
    User,
)
from ..security import hash_password, verify_password

router = APIRouter(tags=["users"])


class UserPatch(BaseModel):
    name: str | None = None
    avatarUrl: str | None = None


class PasswordChange(BaseModel):
    currentPassword: str
    newPassword: str


class NotificationPrefs(BaseModel):
    emailDigest: bool = True
    payoutAlerts: bool = True
    weeklyReport: bool = False


@router.get("/me", response_model=User)
def me(current: User = Depends(get_current_user)):
    return current


@router.patch("/me", response_model=User)
def update_me(
    body: UserPatch,
    session: Session = Depends(get_session),
    current: User = Depends(get_current_user),
):
    if body.name is not None:
        current.name = body.name
    if body.avatarUrl is not None:
        current.image = body.avatarUrl
    session.add(current)
    session.commit()
    session.refresh(current)
    return current


@router.put("/me/password", status_code=204)
def change_password(
    body: PasswordChange,
    session: Session = Depends(get_session),
    current: User = Depends(get_current_user),
):
    if not current.passwordHash or not verify_password(
        body.currentPassword, current.passwordHash
    ):
        raise HTTPException(400, "Current password is incorrect")
    if len(body.newPassword) < 8:
        raise HTTPException(400, "New password must be at least 8 characters")
    current.passwordHash = hash_password(body.newPassword)
    session.add(current)
    session.commit()


@router.put("/me/notifications", status_code=204)
def update_notifications(
    body: NotificationPrefs,
    current: User = Depends(get_current_user),
):
    # Stub — notification preferences not yet persisted in DB.
    # Accepts the request so the frontend doesn't error.
    pass


@router.delete("/me", status_code=204)
def delete_account(
    session: Session = Depends(get_session),
    current: User = Depends(get_current_user),
):
    # Delete owned projects first (cascades to collabs, tracks, etc.)
    projects = session.exec(
        select(Project).where(Project.ownerId == current.id)
    ).all()
    for p in projects:
        session.delete(p)
    session.flush()
    session.delete(current)
    session.commit()


@router.get("/me/export")
def export_data(
    session: Session = Depends(get_session),
    current: User = Depends(get_current_user),
):
    projects = session.exec(
        select(Project).where(Project.ownerId == current.id)
    ).all()
    project_ids = [p.id for p in projects]

    collaborations = session.exec(
        select(Collaborator).where(Collaborator.userId == current.id)
    ).all()
    payouts = session.exec(
        select(Payout).where(Payout.userId == current.id)
    ).all()
    expenses = session.exec(
        select(Expense).where(Expense.payerId == current.id)
    ).all()

    def dt(d: datetime | None) -> str | None:
        return d.isoformat() if d else None

    return JSONResponse(
        content={
            "user": {
                "id": current.id,
                "email": current.email,
                "name": current.name,
                "plan": current.plan.value if current.plan else None,
                "createdAt": dt(current.createdAt),
            },
            "projects": [
                {
                    "id": p.id,
                    "title": p.title,
                    "status": p.status.value if p.status else None,
                    "createdAt": dt(p.createdAt),
                }
                for p in projects
            ],
            "collaborations": [
                {
                    "projectId": c.projectId,
                    "role": c.role.value if c.role else None,
                    "splitPct": str(c.splitPct),
                }
                for c in collaborations
            ],
            "payouts": [
                {
                    "id": po.id,
                    "projectId": po.projectId,
                    "amount": str(po.amount),
                    "status": po.status.value if po.status else None,
                }
                for po in payouts
            ],
            "expenses": [
                {
                    "id": e.id,
                    "projectId": e.projectId,
                    "amount": str(e.amount),
                    "category": e.category.value if e.category else None,
                }
                for e in expenses
            ],
        },
        headers={"Content-Disposition": "attachment; filename=musiky-export.json"},
    )
