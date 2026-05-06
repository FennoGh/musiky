from decimal import Decimal

from django.db.models import Sum
from rest_framework.decorators import api_view
from rest_framework.response import Response

from apps.distribution.models import Distribution
from apps.finance.models import Expense, Revenue
from apps.projects.models import Activity, Collaborator, Project
from apps.projects.permissions import project_for_member
from apps.projects.serializers import ActivitySerializer


@api_view(["GET"])
def project_summary(request, project_id):
    project, _ = project_for_member(project_id, request.user)
    total_streams = (
        Distribution.objects.filter(project_id=project_id).aggregate(s=Sum("streams"))["s"] or 0
    )
    total_revenue = (
        Revenue.objects.filter(project_id=project_id).aggregate(s=Sum("amount"))["s"] or Decimal("0")
    )
    total_expenses = (
        Expense.objects.filter(project_id=project_id).aggregate(s=Sum("amount"))["s"] or Decimal("0")
    )
    rev = Decimal(total_revenue)
    exp = Decimal(total_expenses)
    break_even = (rev / exp * 100) if exp > 0 else Decimal("0")
    return Response({
        "projectId": project_id,
        "title": project.title,
        "totalStreams": int(total_streams),
        "totalRevenue": str(rev.quantize(Decimal("0.01"))),
        "totalExpenses": str(exp.quantize(Decimal("0.01"))),
        "breakEvenPct": str(break_even.quantize(Decimal("0.01"))),
    })


@api_view(["GET"])
def project_activity(request, project_id):
    project_for_member(project_id, request.user)
    try:
        limit = int(request.query_params.get("limit", 50))
    except (TypeError, ValueError):
        limit = 50
    rows = (
        Activity.objects.filter(project_id=project_id)
        .order_by("-created_at")[:limit]
    )
    return Response(ActivitySerializer(rows, many=True).data)


@api_view(["GET"])
def global_activity(request):
    user = request.user
    try:
        limit = int(request.query_params.get("limit", 100))
    except (TypeError, ValueError):
        limit = 100
    owned_ids = list(Project.objects.filter(owner=user).values_list("id", flat=True))
    collab_ids = list(
        Collaborator.objects.filter(user=user).values_list("project_id", flat=True)
    )
    pids = list({*owned_ids, *collab_ids})
    if not pids:
        return Response([])
    rows = (
        Activity.objects.filter(project_id__in=pids)
        .order_by("-created_at")[:limit]
    )
    return Response(ActivitySerializer(rows, many=True).data)
