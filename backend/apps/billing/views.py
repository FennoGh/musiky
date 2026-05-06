from datetime import datetime, timedelta, timezone

from rest_framework.decorators import api_view
from rest_framework.response import Response


def _make_sub(plan, status="ACTIVE", cancel=False):
    now = datetime.now(timezone.utc)
    return {
        "id": "sub_current",
        "plan": plan,
        "status": status,
        "currentPeriodStart": now.isoformat(),
        "currentPeriodEnd": (now + timedelta(days=30)).isoformat(),
        "cancelAtPeriodEnd": cancel,
    }


@api_view(["GET", "POST", "DELETE"])
def subscription(request):
    plan = request.user.plan or "STARTER"
    if request.method == "DELETE":
        return Response(_make_sub(plan, status="CANCELLED", cancel=True))
    if request.method == "POST":
        return Response(_make_sub(request.data.get("plan") or plan))
    return Response(_make_sub(plan))


@api_view(["GET"])
def payment_methods(request):
    return Response([])


@api_view(["POST"])
def set_default_method(request, method_id):
    return Response(status=204)


@api_view(["DELETE"])
def remove_method(request, method_id):
    return Response(status=204)


@api_view(["GET"])
def invoices(request):
    return Response([])
