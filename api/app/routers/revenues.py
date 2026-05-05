from datetime import datetime
from decimal import ROUND_HALF_UP, Decimal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import Session, select

from ..database import get_session
from ..deps import get_current_user
from ..ids import cuid
from ..models import (
    Activity,
    ActivityType,
    Collaborator,
    Payout,
    PayoutStatus,
    Platform,
    Revenue,
    User,
)
from ..permissions import get_project_for_member, get_project_for_owner

router = APIRouter(prefix="/projects/{project_id}/revenues", tags=["revenues"])


class RevenueIn(BaseModel):
    platformId: str
    amount: Decimal
    currency: str = "USD"
    periodStart: datetime
    periodEnd: datetime


def _q2(d: Decimal) -> Decimal:
    return d.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


@router.get("", response_model=list[Revenue])
def list_revenues(
    project_id: str,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
):
    get_project_for_member(session, project_id, user)
    return session.exec(
        select(Revenue).where(Revenue.projectId == project_id).order_by(Revenue.receivedAt.desc())
    ).all()


@router.post("", response_model=Revenue, status_code=201)
def record_revenue(
    project_id: str,
    body: RevenueIn,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
):
    """Record a royalty payment from a platform.

    Atomically fans out into one Payout per Collaborator using their splitPct.
    Rounding remainder (cents lost to .01 quantization) is added to the
    OWNER's payout so the sum always equals the revenue exactly.
    """
    project = get_project_for_owner(session, project_id, user)
    if not session.get(Platform, body.platformId):
        raise HTTPException(404, "Platform not found")

    collabs = session.exec(
        select(Collaborator).where(
            Collaborator.projectId == project_id,
            Collaborator.userId.is_not(None),
        )
    ).all()
    if not collabs:
        raise HTTPException(400, "Project has no registered collaborators")

    revenue = Revenue(id=cuid(), projectId=project_id, **body.model_dump())
    session.add(revenue)
    session.flush()  # so Payouts can FK-reference revenue.id

    payouts: list[Payout] = []
    distributed = Decimal("0.00")
    owner_payout: Payout | None = None
    for c in collabs:
        share = _q2(body.amount * (c.splitPct / Decimal("100")))
        p = Payout(
            id=cuid(),
            projectId=project_id,
            revenueId=revenue.id,
            userId=c.userId,
            amount=share,
            status=PayoutStatus.PENDING,
        )
        if c.userId == project.ownerId:
            owner_payout = p
        payouts.append(p)
        distributed += share

    # reconcile rounding remainder onto the owner's payout
    remainder = _q2(body.amount) - distributed
    if remainder != 0 and owner_payout is not None:
        owner_payout.amount = _q2(owner_payout.amount + remainder)

    for p in payouts:
        session.add(p)

    session.add(
        Activity(
            id=cuid(),
            projectId=project_id,
            actorId=user.id,
            type=ActivityType.REVENUE_RECEIVED,
            payload={
                "amount": str(body.amount),
                "currency": body.currency,
                "platformId": body.platformId,
                "payouts": len(payouts),
            },
        )
    )
    session.commit()
    session.refresh(revenue)
    return revenue
