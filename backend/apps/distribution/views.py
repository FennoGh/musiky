import re
from datetime import datetime, timezone

from rest_framework.decorators import api_view, permission_classes
from rest_framework.exceptions import NotFound
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from apps.projects.models import Activity, ActivityType
from apps.projects.permissions import project_for_member, project_for_owner

from .models import DistStatus, Distribution, Platform
from .serializers import (
    DistributionInSerializer,
    DistributionSerializer,
    PlatformInSerializer,
    PlatformSerializer,
    StreamsInSerializer,
)


def _slugify(name):
    s = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
    return s or "custom"


def _resolve_unique_slug(name):
    base = _slugify(name)
    slug = base
    n = 1
    while Platform.objects.filter(slug=slug).exists():
        n += 1
        slug = f"{base}-{n}"
    return slug


@api_view(["GET", "POST"])
@permission_classes([AllowAny])  # GET is public; POST gets re-checked below
def platforms(request):
    if request.method == "GET":
        rows = Platform.objects.order_by("name")
        return Response(PlatformSerializer(rows, many=True).data)

    if not request.user.is_authenticated:
        return Response({"detail": "Authentication required"}, status=401)

    s = PlatformInSerializer(data=request.data)
    s.is_valid(raise_exception=True)
    name = s.validated_data["name"].strip()
    if len(name) < 2:
        return Response({"detail": "Platform name must be at least 2 characters"}, status=400)
    existing = Platform.objects.filter(name=name).first()
    if existing:
        return Response(PlatformSerializer(existing).data)
    platform = Platform.objects.create(name=name, slug=_resolve_unique_slug(name))
    return Response(PlatformSerializer(platform).data, status=201)


@api_view(["GET", "POST"])
def distribution_collection(request, project_id):
    user = request.user
    if request.method == "GET":
        project_for_member(project_id, user)
        rows = Distribution.objects.filter(project_id=project_id)
        return Response(DistributionSerializer(rows, many=True).data)

    project_for_owner(project_id, user)
    s = DistributionInSerializer(data=request.data)
    s.is_valid(raise_exception=True)
    data = s.validated_data

    platform_id = data.get("platformId")
    custom_name = (data.get("customName") or "").strip()

    if platform_id:
        try:
            platform = Platform.objects.get(pk=platform_id)
        except Platform.DoesNotExist:
            raise NotFound("Platform not found")
    elif custom_name:
        if len(custom_name) < 2:
            return Response({"detail": "Platform name must be at least 2 characters"}, status=400)
        platform = Platform.objects.filter(name=custom_name).first()
        if not platform:
            platform = Platform.objects.create(
                name=custom_name, slug=_resolve_unique_slug(custom_name)
            )
    else:
        return Response({"detail": "platformId or customName is required"}, status=400)

    if Distribution.objects.filter(project_id=project_id, platform_id=platform.id).exists():
        return Response({"detail": "Already distributed to this platform"}, status=400)

    dist = Distribution.objects.create(
        project_id=project_id,
        platform_id=platform.id,
        status=DistStatus.LIVE,  # in real life: PENDING then async confirm
        live_at=datetime.now(timezone.utc),
    )
    Activity.objects.create(
        project_id=project_id,
        actor_id=user.id,
        type=ActivityType.DISTRIBUTED,
        payload={"platformId": platform.id, "name": platform.name},
    )
    return Response(DistributionSerializer(dist).data, status=201)


@api_view(["PATCH"])
def distribution_streams(request, project_id, distribution_id):
    user = request.user
    project_for_owner(project_id, user)
    try:
        dist = Distribution.objects.get(pk=distribution_id, project_id=project_id)
    except Distribution.DoesNotExist:
        raise NotFound("Distribution not found")
    if dist.status != DistStatus.LIVE:
        return Response({"detail": "Streams can only be set on LIVE distributions"}, status=400)
    s = StreamsInSerializer(data=request.data)
    s.is_valid(raise_exception=True)
    if s.validated_data["streams"] < 0:
        return Response({"detail": "Streams must be a non-negative integer"}, status=400)
    dist.streams = s.validated_data["streams"]
    dist.save()
    return Response(DistributionSerializer(dist).data)


@api_view(["DELETE"])
def distribution_detail(request, project_id, distribution_id):
    user = request.user
    project_for_owner(project_id, user)
    try:
        dist = Distribution.objects.get(pk=distribution_id, project_id=project_id)
    except Distribution.DoesNotExist:
        raise NotFound("Distribution not found")
    platform_id = dist.platform_id
    dist.delete()
    Activity.objects.create(
        project_id=project_id,
        actor_id=user.id,
        type=ActivityType.DISTRIBUTED,
        payload={"action": "removed", "platformId": platform_id},
    )
    return Response(status=204)
