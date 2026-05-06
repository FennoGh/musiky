from django.contrib.auth import get_user_model
from django.http import HttpResponse
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import AccessToken

from .serializers import (
    LoginSerializer,
    NotificationPrefsSerializer,
    PasswordChangeSerializer,
    RegisterSerializer,
    UserPatchSerializer,
    UserSerializer,
)

User = get_user_model()


def _issue_token(user):
    token = AccessToken.for_user(user)
    return {"access_token": str(token), "token_type": "bearer"}


@api_view(["POST"])
@permission_classes([AllowAny])
def register(request):
    s = RegisterSerializer(data=request.data)
    s.is_valid(raise_exception=True)
    email = s.validated_data["email"].strip().lower()
    if User.objects.filter(email=email).exists():
        return Response({"detail": "Email already registered"}, status=400)
    user = User.objects.create_user(
        email=email,
        password=s.validated_data["password"],
        name=s.validated_data.get("name") or "",
    )
    return Response(_issue_token(user), status=status.HTTP_201_CREATED)


@api_view(["POST"])
@permission_classes([AllowAny])
def login(request):
    s = LoginSerializer(data=request.data)
    s.is_valid(raise_exception=True)
    try:
        user = User.objects.get(email=s.validated_data["email"])
    except User.DoesNotExist:
        return Response({"detail": "Invalid credentials"}, status=401)
    if not user.check_password(s.validated_data["password"]):
        return Response({"detail": "Invalid credentials"}, status=401)
    return Response(_issue_token(user))


@api_view(["GET", "PATCH", "DELETE"])
@permission_classes([IsAuthenticated])
def me(request):
    user = request.user
    if request.method == "GET":
        return Response(UserSerializer(user).data)
    if request.method == "PATCH":
        s = UserPatchSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        if "name" in s.validated_data and s.validated_data["name"] is not None:
            user.name = s.validated_data["name"]
        if "avatarUrl" in s.validated_data:
            user.image = s.validated_data["avatarUrl"]
        user.save()
        return Response(UserSerializer(user).data)
    # DELETE — owned projects cascade automatically via FK
    user.delete()
    return Response(status=204)


@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def change_password(request):
    s = PasswordChangeSerializer(data=request.data)
    s.is_valid(raise_exception=True)
    if not request.user.check_password(s.validated_data["currentPassword"]):
        return Response({"detail": "Current password is incorrect"}, status=400)
    request.user.set_password(s.validated_data["newPassword"])
    request.user.save()
    return Response(status=204)


@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def update_notifications(request):
    # Stub — preferences not yet persisted. Validate so bad shapes still 400.
    NotificationPrefsSerializer(data=request.data).is_valid(raise_exception=True)
    return Response(status=204)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def export_data(request):
    from django.core.serializers.json import DjangoJSONEncoder
    import json

    from apps.finance.models import Expense, Payout
    from apps.projects.models import Collaborator, Project

    user = request.user
    projects = list(Project.objects.filter(owner=user).values(
        "id", "title", "status", "created_at"
    ))
    collaborations = list(Collaborator.objects.filter(user=user).values(
        "project_id", "role", "split_pct"
    ))
    payouts = list(Payout.objects.filter(user=user).values(
        "id", "project_id", "amount", "status"
    ))
    expenses = list(Expense.objects.filter(payer=user).values(
        "id", "project_id", "amount", "category"
    ))

    data = {
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "plan": user.plan,
            "createdAt": user.created_at,
        },
        "projects": [
            {
                "id": p["id"],
                "title": p["title"],
                "status": p["status"],
                "createdAt": p["created_at"],
            }
            for p in projects
        ],
        "collaborations": [
            {
                "projectId": c["project_id"],
                "role": c["role"],
                "splitPct": str(c["split_pct"]),
            }
            for c in collaborations
        ],
        "payouts": [
            {
                "id": po["id"],
                "projectId": po["project_id"],
                "amount": str(po["amount"]),
                "status": po["status"],
            }
            for po in payouts
        ],
        "expenses": [
            {
                "id": e["id"],
                "projectId": e["project_id"],
                "amount": str(e["amount"]),
                "category": e["category"],
            }
            for e in expenses
        ],
    }
    body = json.dumps(data, cls=DjangoJSONEncoder)
    response = HttpResponse(body, content_type="application/json")
    response["Content-Disposition"] = "attachment; filename=musiky-export.json"
    return response
