from decimal import Decimal

from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import Q, Sum
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.exceptions import NotFound, ValidationError
from rest_framework.response import Response

from .models import Activity, ActivityType, CollabRole, Collaborator, Project, ProjectStatus, Track
from .permissions import project_for_member, project_for_owner
from .serializers import (
    ActivitySerializer,
    CollaboratorInSerializer,
    CollaboratorPatchSerializer,
    CollaboratorSerializer,
    ProjectInSerializer,
    ProjectPatchSerializer,
    ProjectSerializer,
    TrackInSerializer,
    TrackPatchSerializer,
    TrackSerializer,
)

User = get_user_model()


def _project_payload(project, user, collab=None):
    """Build the response shape ProjectSerializer expects (matches ProjectOut)."""
    is_owner = project.owner_id == user.id
    role = None
    split = None
    if collab is not None:
        role = collab.role
        split = collab.split_pct
    elif is_owner:
        role = CollabRole.OWNER

    return {
        "id": project.id,
        "title": project.title,
        "cover_url": project.cover_url,
        "status": project.status,
        "owner_id": project.owner_id,
        "created_at": project.created_at,
        "released_at": project.released_at,
        "isOwner": is_owner,
        "role": role,
        "mySplitPct": split,
    }


@api_view(["GET", "POST"])
def project_collection(request):
    user = request.user
    if request.method == "GET":
        owned = Q(owner_id=user.id)
        collab_pids = Collaborator.objects.filter(user_id=user.id).values_list(
            "project_id", flat=True
        )
        projects = list(
            Project.objects.filter(owned | Q(id__in=collab_pids)).order_by("-created_at")
        )
        if not projects:
            return Response([])
        my_collabs = {
            c.project_id: c
            for c in Collaborator.objects.filter(
                user_id=user.id, project_id__in=[p.id for p in projects]
            )
        }
        data = [
            ProjectSerializer(_project_payload(p, user, my_collabs.get(p.id))).data
            for p in projects
        ]
        return Response(data)

    # POST
    s = ProjectInSerializer(data=request.data)
    s.is_valid(raise_exception=True)
    with transaction.atomic():
        project = Project.objects.create(
            title=s.validated_data["title"],
            cover_url=s.validated_data.get("coverUrl"),
            owner_id=user.id,
        )
        owner_collab = Collaborator.objects.create(
            project=project,
            user_id=user.id,
            role=CollabRole.OWNER,
            split_pct=Decimal("100.00"),
        )
        Activity.objects.create(
            project=project,
            actor_id=user.id,
            type=ActivityType.PROJECT_CREATED,
            payload={"title": project.title},
        )
    payload = _project_payload(project, user, owner_collab)
    return Response(ProjectSerializer(payload).data, status=status.HTTP_201_CREATED)


@api_view(["GET", "PATCH", "DELETE"])
def project_detail(request, project_id):
    user = request.user
    if request.method == "GET":
        project, _is_owner = project_for_member(project_id, user)
        collab = Collaborator.objects.filter(
            project_id=project_id, user_id=user.id
        ).first()
        return Response(ProjectSerializer(_project_payload(project, user, collab)).data)

    if request.method == "PATCH":
        project = project_for_owner(project_id, user)
        s = ProjectPatchSerializer(data=request.data, partial=True)
        s.is_valid(raise_exception=True)
        data = s.validated_data
        # Block edits to title/cover while LIVE — only status may change.
        if project.status == ProjectStatus.LIVE:
            non_status = [k for k in data.keys() if k != "status"]
            if non_status:
                return Response(
                    {"detail": "Project is LIVE — change status to DRAFT/READY/ARCHIVED before editing other fields."},
                    status=409,
                )
        if "title" in data:
            project.title = data["title"]
        if "coverUrl" in data:
            project.cover_url = data["coverUrl"]
        if "status" in data:
            project.status = data["status"]
        project.save()
        collab = Collaborator.objects.filter(
            project_id=project_id, user_id=user.id
        ).first()
        return Response(ProjectSerializer(_project_payload(project, user, collab)).data)

    # DELETE
    project = project_for_owner(project_id, user)
    if project.status == ProjectStatus.LIVE:
        return Response(
            {"detail": "Project is LIVE — change status to DRAFT/READY/ARCHIVED before deleting."},
            status=409,
        )
    project.delete()
    return Response(status=204)


# ─── Tracks ──────────────────────────────────────────────────────

@api_view(["GET", "POST"])
def track_collection(request, project_id):
    user = request.user
    if request.method == "GET":
        project_for_member(project_id, user)
        tracks = Track.objects.filter(project_id=project_id).order_by("-uploaded_at")
        return Response(TrackSerializer(tracks, many=True).data)

    project_for_owner(project_id, user)
    s = TrackInSerializer(data=request.data)
    s.is_valid(raise_exception=True)
    data = s.validated_data
    track = Track.objects.create(
        project_id=project_id,
        title=data["title"],
        file_url=data["fileUrl"],
        cover_url=data.get("coverUrl"),
        duration=data.get("duration"),
        version=data.get("version", 1),
    )
    Activity.objects.create(
        project_id=project_id,
        actor_id=user.id,
        type=ActivityType.TRACK_UPLOADED,
        payload={"title": data["title"], "version": data.get("version", 1)},
    )
    return Response(TrackSerializer(track).data, status=201)


@api_view(["PATCH", "DELETE"])
def track_detail(request, project_id, track_id):
    user = request.user
    project_for_owner(project_id, user)
    try:
        track = Track.objects.get(pk=track_id, project_id=project_id)
    except Track.DoesNotExist:
        raise NotFound("Track not found")

    if request.method == "DELETE":
        track.delete()
        return Response(status=204)

    s = TrackPatchSerializer(data=request.data, partial=True)
    s.is_valid(raise_exception=True)
    data = s.validated_data
    if "title" in data and not (data["title"] or "").strip():
        return Response({"detail": "Title cannot be empty"}, status=400)
    if "version" in data and data["version"] is not None and data["version"] < 1:
        return Response({"detail": "Version must be >= 1"}, status=400)
    if "title" in data:
        track.title = data["title"]
    if "coverUrl" in data:
        track.cover_url = data["coverUrl"]
    if "duration" in data:
        track.duration = data["duration"]
    if "version" in data:
        track.version = data["version"]
    track.save()
    return Response(TrackSerializer(track).data)


# ─── Collaborators ───────────────────────────────────────────────

def _enrich_collab(collab):
    return {
        "id": collab.id,
        "project_id": collab.project_id,
        "user_id": collab.user_id,
        "userName": collab.user.name if collab.user_id else None,
        "userEmail": collab.user.email if collab.user_id else None,
        "role": collab.role,
        "split_pct": collab.split_pct,
        "joined_at": collab.joined_at,
    }


@api_view(["GET", "POST"])
def collab_collection(request, project_id):
    user = request.user
    if request.method == "GET":
        project_for_member(project_id, user)
        collabs = Collaborator.objects.filter(project_id=project_id).select_related("user")
        return Response(
            [CollaboratorSerializer(_enrich_collab(c)).data for c in collabs]
        )

    project = project_for_owner(project_id, user)
    s = CollaboratorInSerializer(data=request.data)
    s.is_valid(raise_exception=True)
    data = s.validated_data
    try:
        target = User.objects.get(email=data["email"].lower())
    except User.DoesNotExist:
        return Response(
            {"detail": "No user with that email — ask them to sign up first."},
            status=404,
        )

    if Collaborator.objects.filter(project_id=project_id, user_id=target.id).exists():
        return Response(
            {"detail": "That user is already a collaborator on this project"},
            status=409,
        )

    if data["role"] == CollabRole.OWNER:
        return Response(
            {"detail": "Owner role is reserved — pick PRODUCER, COMPOSER, etc."},
            status=400,
        )

    with transaction.atomic():
        total = Collaborator.objects.filter(project_id=project_id).aggregate(
            t=Sum("split_pct")
        )["t"] or Decimal("0")
        deficit = total + data["splitPct"] - Decimal("100.00")
        if deficit > 0:
            owner_collab = Collaborator.objects.select_for_update().filter(
                project_id=project_id, user_id=project.owner_id
            ).first()
            if not owner_collab or (owner_collab.split_pct or Decimal("0")) < deficit:
                return Response({"detail": "Total split would exceed 100%"}, status=400)
            owner_collab.split_pct = (owner_collab.split_pct or Decimal("0")) - deficit
            owner_collab.save()

        collab = Collaborator.objects.create(
            project_id=project_id,
            user_id=target.id,
            role=data["role"],
            split_pct=data["splitPct"],
        )
        Activity.objects.create(
            project_id=project_id,
            actor_id=user.id,
            type=ActivityType.COLLAB_JOINED,
            payload={"role": data["role"], "splitPct": str(data["splitPct"])},
        )

    collab.user = target
    return Response(
        CollaboratorSerializer(_enrich_collab(collab)).data, status=201
    )


@api_view(["PATCH", "DELETE"])
def collab_detail(request, project_id, collaborator_id):
    user = request.user
    project = project_for_owner(project_id, user)
    try:
        collab = Collaborator.objects.select_related("user").get(
            pk=collaborator_id, project_id=project_id
        )
    except Collaborator.DoesNotExist:
        raise NotFound("Collaborator not found")

    if request.method == "DELETE":
        if collab.role == CollabRole.OWNER:
            return Response({"detail": "Cannot remove the project owner"}, status=400)
        with transaction.atomic():
            freed = collab.split_pct or Decimal("0")
            collab.delete()
            owner_collab = Collaborator.objects.select_for_update().filter(
                project_id=project_id, user_id=project.owner_id
            ).first()
            if owner_collab is not None and freed > 0:
                owner_collab.split_pct = (owner_collab.split_pct or Decimal("0")) + freed
                owner_collab.save()
        return Response(status=204)

    s = CollaboratorPatchSerializer(data=request.data, partial=True)
    s.is_valid(raise_exception=True)
    data = s.validated_data
    is_owner_row = collab.user_id == project.owner_id

    if "role" in data and data["role"] is not None:
        if is_owner_row and data["role"] != CollabRole.OWNER:
            return Response({"detail": "Cannot change the owner's role"}, status=400)
        collab.role = data["role"]

    if "splitPct" in data and data["splitPct"] is not None:
        if is_owner_row:
            return Response(
                {"detail": "Owner split is computed automatically — edit a collaborator's split instead."},
                status=400,
            )
        new_split = data["splitPct"]
        if new_split < Decimal("0") or new_split > Decimal("100"):
            return Response({"detail": "Split must be between 0 and 100"}, status=400)
        with transaction.atomic():
            old_split = collab.split_pct or Decimal("0")
            delta = new_split - old_split
            owner_collab = Collaborator.objects.select_for_update().filter(
                project_id=project_id, user_id=project.owner_id
            ).first()
            if not owner_collab:
                return Response({"detail": "Owner collaborator row missing"}, status=500)
            new_owner_split = (owner_collab.split_pct or Decimal("0")) - delta
            if new_owner_split < Decimal("0"):
                return Response(
                    {"detail": f"Owner only has {owner_collab.split_pct}% to give — pick a smaller split."},
                    status=400,
                )
            owner_collab.split_pct = new_owner_split
            owner_collab.save()
            collab.split_pct = new_split
            collab.save()
    else:
        collab.save()

    return Response(CollaboratorSerializer(_enrich_collab(collab)).data)
