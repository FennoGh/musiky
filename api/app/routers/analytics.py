from decimal import Decimal

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlmodel import Session, func, select

from ..database import get_session
from ..deps import get_current_user
from ..models import (
    Activity,
    Collaborator,
    Distribution,
    Expense,
    Project,
    Revenue,
    User,
)
from ..permissions import get_project_for_member

router = APIRouter(prefix="/projects/{project_id}", tags=["analytics"])
global_router = APIRouter(tags=["analytics"])


class ProjectSummary(BaseModel):
    projectId: str
    title: str
    totalStreams: int
    totalRevenue: Decimal
    totalExpenses: Decimal
    breakEvenPct: Decimal  # 100 = recovered


@router.get("/summary", response_model=ProjectSummary)
def project_summary(
    project_id: str,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
):
    project, _ = get_project_for_member(session, project_id, user)

    # Total streams sums each LIVE distribution's manually entered count.
    total_streams = session.exec(
        select(func.coalesce(func.sum(Distribution.streams), 0)).where(
            Distribution.projectId == project_id
        )
    ).one()
    total_revenue = session.exec(
        select(func.coalesce(func.sum(Revenue.amount), 0)).where(
            Revenue.projectId == project_id
        )
    ).one()
    total_expenses = session.exec(
        select(func.coalesce(func.sum(Expense.amount), 0)).where(
            Expense.projectId == project_id
        )
    ).one()

    rev = Decimal(total_revenue or 0)
    exp = Decimal(total_expenses or 0)
    break_even = (rev / exp * 100) if exp > 0 else Decimal("0")

    return ProjectSummary(
        projectId=project_id,
        title=project.title,
        totalStreams=int(total_streams or 0),
        totalRevenue=rev,
        totalExpenses=exp,
        breakEvenPct=break_even.quantize(Decimal("0.01")),
    )


@router.get("/activity", response_model=list[Activity])
def project_activity(
    project_id: str,
    limit: int = 50,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
):
    get_project_for_member(session, project_id, user)
    return session.exec(
        select(Activity)
        .where(Activity.projectId == project_id)
        .order_by(Activity.createdAt.desc())
        .limit(limit)
    ).all()


@global_router.get("/activity", response_model=list[Activity])
def global_activity(
    limit: int = 100,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
):
    collab_project_ids = session.exec(
        select(Collaborator.projectId).where(Collaborator.userId == user.id)
    ).all()
    owned_ids = session.exec(
        select(Project.id).where(Project.ownerId == user.id)
    ).all()
    project_ids = list({*owned_ids, *collab_project_ids})
    if not project_ids:
        return []
    return session.exec(
        select(Activity)
        .where(Activity.projectId.in_(project_ids))  # type: ignore[union-attr]
        .order_by(Activity.createdAt.desc())
        .limit(limit)
    ).all()
