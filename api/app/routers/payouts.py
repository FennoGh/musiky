from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from ..database import get_session
from ..deps import get_current_user
from ..ids import cuid
from ..models import Activity, ActivityType, Payout, PayoutStatus, User

router = APIRouter(prefix="/payouts", tags=["payouts"])


@router.get("", response_model=list[Payout])
def my_payouts(
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
):
    return session.exec(
        select(Payout).where(Payout.userId == user.id)
    ).all()


@router.post("/{payout_id}/mark-paid", response_model=Payout)
def mark_paid(
    payout_id: str,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
):
    payout = session.get(Payout, payout_id)
    if not payout:
        raise HTTPException(404, "Payout not found")
    if payout.userId != user.id:
        raise HTTPException(403, "Not your payout")
    payout.status = PayoutStatus.PAID
    payout.paidAt = datetime.utcnow()
    session.add(payout)
    session.add(
        Activity(
            id=cuid(),
            projectId=payout.projectId,
            actorId=user.id,
            type=ActivityType.PAYOUT_SENT,
            payload={"amount": str(payout.amount)},
        )
    )
    session.commit()
    session.refresh(payout)
    return payout
