from datetime import datetime, timedelta

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from ..deps import get_current_user
from ..models import User

router = APIRouter(prefix="/billing", tags=["billing"])


class Subscription(BaseModel):
    id: str
    plan: str
    status: str
    currentPeriodStart: str
    currentPeriodEnd: str
    cancelAtPeriodEnd: bool


class PaymentMethod(BaseModel):
    id: str
    type: str
    last4: str
    brand: str | None
    expMonth: int | None
    expYear: int | None
    isDefault: bool


class Invoice(BaseModel):
    id: str
    amount: str
    currency: str
    status: str
    description: str
    createdAt: str
    paidAt: str | None
    pdfUrl: str | None


class SubscriptionIn(BaseModel):
    plan: str


def _make_sub(plan: str, status: str = "ACTIVE", cancel: bool = False) -> Subscription:
    now = datetime.utcnow()
    return Subscription(
        id="sub_current",
        plan=plan,
        status=status,
        currentPeriodStart=now.isoformat(),
        currentPeriodEnd=(now + timedelta(days=30)).isoformat(),
        cancelAtPeriodEnd=cancel,
    )


@router.get("/subscription", response_model=Subscription)
def get_subscription(user: User = Depends(get_current_user)):
    return _make_sub(user.plan.value if user.plan else "STARTER")


@router.post("/subscription", response_model=Subscription)
def update_subscription(
    body: SubscriptionIn, user: User = Depends(get_current_user)
):
    return _make_sub(body.plan)


@router.delete("/subscription", response_model=Subscription)
def cancel_subscription(user: User = Depends(get_current_user)):
    return _make_sub(
        user.plan.value if user.plan else "STARTER",
        status="CANCELLED",
        cancel=True,
    )


@router.get("/payment-methods", response_model=list[PaymentMethod])
def list_payment_methods(user: User = Depends(get_current_user)):
    return []


@router.post("/payment-methods/{method_id}/default", status_code=204)
def set_default_method(method_id: str, user: User = Depends(get_current_user)):
    pass


@router.delete("/payment-methods/{method_id}", status_code=204)
def remove_method(method_id: str, user: User = Depends(get_current_user)):
    pass


@router.get("/invoices", response_model=list[Invoice])
def list_invoices(user: User = Depends(get_current_user)):
    return []
