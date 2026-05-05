from decimal import Decimal

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlmodel import Session, select

from ..database import get_session
from ..deps import get_current_user
from ..ids import cuid
from ..models import Activity, ActivityType, Expense, ExpenseCategory, User
from ..permissions import get_project_for_member, get_project_for_owner

router = APIRouter(prefix="/projects/{project_id}/expenses", tags=["expenses"])


class ExpenseIn(BaseModel):
    category: ExpenseCategory
    amount: Decimal
    currency: str = "USD"
    description: str | None = None


@router.get("", response_model=list[Expense])
def list_expenses(
    project_id: str,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
):
    get_project_for_member(session, project_id, user)
    return session.exec(
        select(Expense).where(Expense.projectId == project_id).order_by(Expense.spentAt.desc())
    ).all()


@router.post("", response_model=Expense, status_code=201)
def add_expense(
    project_id: str,
    body: ExpenseIn,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
):
    get_project_for_owner(session, project_id, user)
    expense = Expense(
        id=cuid(), projectId=project_id, payerId=user.id, **body.model_dump()
    )
    session.add(expense)
    session.add(
        Activity(
            id=cuid(),
            projectId=project_id,
            actorId=user.id,
            type=ActivityType.EXPENSE_LOGGED,
            payload={
                "category": body.category.value,
                "amount": str(body.amount),
                "currency": body.currency,
            },
        )
    )
    session.commit()
    session.refresh(expense)
    return expense
