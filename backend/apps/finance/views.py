from datetime import datetime, timezone
from decimal import ROUND_HALF_UP, Decimal

from django.db import transaction
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.exceptions import NotFound
from rest_framework.response import Response

from apps.distribution.models import Platform
from apps.projects.models import Activity, ActivityType, Collaborator
from apps.projects.permissions import project_for_member, project_for_owner

from .models import Expense, Payout, PayoutStatus, Revenue
from .serializers import (
    ExpenseInSerializer,
    ExpensePatchSerializer,
    ExpenseSerializer,
    PayoutSerializer,
    ProjectPayoutSerializer,
    RevenueInSerializer,
    RevenuePatchSerializer,
    RevenueSerializer,
)


# ─── Expenses ────────────────────────────────────────────────────

@api_view(["GET", "POST"])
def expense_collection(request, project_id):
    user = request.user
    if request.method == "GET":
        project_for_member(project_id, user)
        rows = Expense.objects.filter(project_id=project_id).order_by("-spent_at")
        return Response(ExpenseSerializer(rows, many=True).data)

    project_for_owner(project_id, user)
    s = ExpenseInSerializer(data=request.data)
    s.is_valid(raise_exception=True)
    data = s.validated_data
    if data["amount"] <= 0:
        return Response({"detail": "Amount must be greater than 0"}, status=400)
    cur = (data.get("currency") or "USD").strip().upper()
    if len(cur) != 3:
        return Response({"detail": "Currency must be a 3-letter ISO code"}, status=400)

    expense = Expense.objects.create(
        project_id=project_id,
        payer_id=user.id,
        category=data["category"],
        amount=data["amount"],
        currency=cur,
        description=data.get("description"),
    )
    Activity.objects.create(
        project_id=project_id,
        actor_id=user.id,
        type=ActivityType.EXPENSE_LOGGED,
        payload={
            "category": data["category"],
            "amount": str(data["amount"]),
            "currency": cur,
        },
    )
    return Response(ExpenseSerializer(expense).data, status=201)


@api_view(["PATCH", "DELETE"])
def expense_detail(request, project_id, expense_id):
    user = request.user
    project_for_owner(project_id, user)
    try:
        expense = Expense.objects.get(pk=expense_id, project_id=project_id)
    except Expense.DoesNotExist:
        raise NotFound("Expense not found")

    if request.method == "DELETE":
        expense.delete()
        return Response(status=204)

    s = ExpensePatchSerializer(data=request.data, partial=True)
    s.is_valid(raise_exception=True)
    data = s.validated_data
    if "amount" in data:
        if data["amount"] is None or data["amount"] <= 0:
            return Response({"detail": "Amount must be greater than 0"}, status=400)
        expense.amount = data["amount"]
    if "currency" in data and data["currency"] is not None:
        cur = data["currency"].strip().upper()
        if len(cur) != 3:
            return Response({"detail": "Currency must be a 3-letter ISO code"}, status=400)
        expense.currency = cur
    if "category" in data:
        expense.category = data["category"]
    if "description" in data:
        expense.description = data["description"]
    expense.save()
    return Response(ExpenseSerializer(expense).data)


# ─── Revenues + Payout fan-out ───────────────────────────────────

def _q2(d: Decimal) -> Decimal:
    return d.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def _build_payouts(project_id, revenue_id, owner_id, amount):
    """Build (do not save) one Payout per registered collaborator.

    Owner's payout is auto-PAID (the platform deposit already arrived). Others
    PENDING. Rounding remainder lands on the owner so the sum equals `amount`.
    """
    collabs = list(Collaborator.objects.filter(project_id=project_id))
    if not collabs:
        return None
    now = datetime.now(timezone.utc)
    payouts = []
    distributed = Decimal("0.00")
    owner_payout = None
    for c in collabs:
        share = _q2(amount * (c.split_pct / Decimal("100")))
        is_owner = c.user_id == owner_id
        p = Payout(
            project_id=project_id,
            revenue_id=revenue_id,
            user_id=c.user_id,
            amount=share,
            status=PayoutStatus.PAID if is_owner else PayoutStatus.PENDING,
            paid_at=now if is_owner else None,
        )
        if is_owner:
            owner_payout = p
        payouts.append(p)
        distributed += share
    remainder = _q2(amount) - distributed
    if remainder != 0 and owner_payout is not None:
        owner_payout.amount = _q2(owner_payout.amount + remainder)
    return payouts


def _external_paid(payouts, owner_id):
    return any(
        p.status == PayoutStatus.PAID and p.user_id != owner_id for p in payouts
    )


@api_view(["GET", "POST"])
def revenue_collection(request, project_id):
    user = request.user
    if request.method == "GET":
        project_for_member(project_id, user)
        rows = Revenue.objects.filter(project_id=project_id).order_by("-received_at")
        return Response(RevenueSerializer(rows, many=True).data)

    project = project_for_owner(project_id, user)
    s = RevenueInSerializer(data=request.data)
    s.is_valid(raise_exception=True)
    data = s.validated_data
    if not Platform.objects.filter(pk=data["platformId"]).exists():
        return Response({"detail": "Platform not found"}, status=404)
    if data["amount"] <= 0:
        return Response({"detail": "Amount must be greater than 0"}, status=400)

    with transaction.atomic():
        revenue = Revenue.objects.create(
            project_id=project_id,
            platform_id=data["platformId"],
            amount=data["amount"],
            currency=data.get("currency", "USD"),
            period_start=data["periodStart"],
            period_end=data["periodEnd"],
        )
        payouts = _build_payouts(project_id, revenue.id, project.owner_id, revenue.amount)
        if payouts is None:
            return Response(
                {"detail": "Project has no registered collaborators"}, status=400
            )
        Payout.objects.bulk_create(payouts)
        Activity.objects.create(
            project_id=project_id,
            actor_id=user.id,
            type=ActivityType.REVENUE_RECEIVED,
            payload={
                "amount": str(data["amount"]),
                "currency": revenue.currency,
                "platformId": data["platformId"],
                "payouts": len(payouts),
            },
        )
    return Response(RevenueSerializer(revenue).data, status=201)


@api_view(["PATCH", "DELETE"])
def revenue_detail(request, project_id, revenue_id):
    user = request.user
    project = project_for_owner(project_id, user)
    try:
        revenue = Revenue.objects.get(pk=revenue_id, project_id=project_id)
    except Revenue.DoesNotExist:
        raise NotFound("Revenue not found")

    owner_id = project.owner_id

    if request.method == "DELETE":
        payouts = list(Payout.objects.filter(revenue_id=revenue.id))
        if _external_paid(payouts, owner_id):
            return Response(
                {"detail": "Cannot delete: at least one collaborator payout is already PAID"},
                status=409,
            )
        with transaction.atomic():
            Payout.objects.filter(revenue_id=revenue.id).delete()
            revenue.delete()
        return Response(status=204)

    s = RevenuePatchSerializer(data=request.data, partial=True)
    s.is_valid(raise_exception=True)
    data = s.validated_data

    if "platformId" in data and data["platformId"] is not None:
        if not Platform.objects.filter(pk=data["platformId"]).exists():
            return Response({"detail": "Platform not found"}, status=404)
    if "amount" in data and (data["amount"] is None or data["amount"] <= 0):
        return Response({"detail": "Amount must be greater than 0"}, status=400)
    if "currency" in data and data["currency"] is not None:
        cur = data["currency"].strip().upper()
        if len(cur) != 3:
            return Response({"detail": "Currency must be a 3-letter ISO code"}, status=400)
        data["currency"] = cur
    if (
        "periodStart" in data and "periodEnd" in data
        and data["periodStart"] and data["periodEnd"]
        and data["periodStart"] > data["periodEnd"]
    ):
        return Response({"detail": "Period start must be before end"}, status=400)

    amount_changing = "amount" in data and data["amount"] != revenue.amount

    with transaction.atomic():
        if amount_changing:
            payouts = list(Payout.objects.filter(revenue_id=revenue.id))
            if _external_paid(payouts, owner_id):
                return Response(
                    {"detail": "Cannot change amount: at least one collaborator payout is already PAID"},
                    status=409,
                )
            Payout.objects.filter(revenue_id=revenue.id).delete()

        if "platformId" in data and data["platformId"] is not None:
            revenue.platform_id = data["platformId"]
        if "amount" in data:
            revenue.amount = data["amount"]
        if "currency" in data:
            revenue.currency = data["currency"]
        if "periodStart" in data:
            revenue.period_start = data["periodStart"]
        if "periodEnd" in data:
            revenue.period_end = data["periodEnd"]
        revenue.save()

        if amount_changing:
            new_payouts = _build_payouts(project_id, revenue.id, owner_id, revenue.amount)
            if new_payouts:
                Payout.objects.bulk_create(new_payouts)

    return Response(RevenueSerializer(revenue).data)


# ─── Payouts ─────────────────────────────────────────────────────

@api_view(["GET"])
def my_payouts(request):
    rows = Payout.objects.filter(user_id=request.user.id)
    return Response(PayoutSerializer(rows, many=True).data)


@api_view(["GET"])
def project_payouts(request, project_id):
    project_for_member(project_id, request.user)
    rows = Payout.objects.filter(project_id=project_id).select_related("user")
    out = [
        {
            "id": p.id,
            "project_id": p.project_id,
            "revenue_id": p.revenue_id,
            "user_id": p.user_id,
            "userName": p.user.name,
            "userEmail": p.user.email,
            "amount": p.amount,
            "status": p.status,
            "paid_at": p.paid_at,
        }
        for p in rows
    ]
    return Response(ProjectPayoutSerializer(out, many=True).data)


@api_view(["POST"])
def mark_paid(request, payout_id):
    try:
        payout = Payout.objects.get(pk=payout_id)
    except Payout.DoesNotExist:
        raise NotFound("Payout not found")
    if payout.user_id != request.user.id:
        return Response({"detail": "Not your payout"}, status=403)
    payout.status = PayoutStatus.PAID
    payout.paid_at = datetime.now(timezone.utc)
    payout.save()
    Activity.objects.create(
        project_id=payout.project_id,
        actor_id=request.user.id,
        type=ActivityType.PAYOUT_SENT,
        payload={"amount": str(payout.amount)},
    )
    return Response(PayoutSerializer(payout).data)
