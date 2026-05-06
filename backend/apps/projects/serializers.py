from rest_framework import serializers

from .models import Activity, Collaborator, Project, Track


class ProjectSerializer(serializers.Serializer):
    id = serializers.CharField()
    title = serializers.CharField()
    coverUrl = serializers.CharField(source="cover_url", allow_null=True)
    status = serializers.CharField()
    ownerId = serializers.CharField(source="owner_id")
    createdAt = serializers.DateTimeField(source="created_at")
    releasedAt = serializers.DateTimeField(source="released_at", allow_null=True)
    isOwner = serializers.BooleanField()
    role = serializers.CharField(allow_null=True)
    mySplitPct = serializers.DecimalField(max_digits=5, decimal_places=2, allow_null=True)


class ProjectInSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=200)
    coverUrl = serializers.CharField(required=False, allow_null=True, allow_blank=True)


class ProjectPatchSerializer(serializers.Serializer):
    title = serializers.CharField(required=False, max_length=200)
    coverUrl = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    status = serializers.CharField(required=False)


class TrackSerializer(serializers.Serializer):
    id = serializers.CharField()
    projectId = serializers.CharField(source="project_id")
    title = serializers.CharField()
    fileUrl = serializers.CharField(source="file_url")
    coverUrl = serializers.CharField(source="cover_url", allow_null=True)
    version = serializers.IntegerField()
    duration = serializers.IntegerField(allow_null=True)
    uploadedAt = serializers.DateTimeField(source="uploaded_at")


class TrackInSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=200)
    fileUrl = serializers.CharField(max_length=500)
    coverUrl = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    duration = serializers.IntegerField(required=False, allow_null=True)
    version = serializers.IntegerField(default=1)


class TrackPatchSerializer(serializers.Serializer):
    title = serializers.CharField(required=False, max_length=200)
    coverUrl = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    duration = serializers.IntegerField(required=False, allow_null=True)
    version = serializers.IntegerField(required=False)


class CollaboratorSerializer(serializers.Serializer):
    id = serializers.CharField()
    projectId = serializers.CharField(source="project_id")
    userId = serializers.CharField(source="user_id")
    userName = serializers.CharField(allow_null=True)
    userEmail = serializers.CharField(allow_null=True)
    role = serializers.CharField()
    splitPct = serializers.DecimalField(source="split_pct", max_digits=5, decimal_places=2)
    joinedAt = serializers.DateTimeField(source="joined_at")


class CollaboratorInSerializer(serializers.Serializer):
    email = serializers.EmailField()
    role = serializers.CharField()
    splitPct = serializers.DecimalField(max_digits=5, decimal_places=2)


class CollaboratorPatchSerializer(serializers.Serializer):
    splitPct = serializers.DecimalField(
        required=False, max_digits=5, decimal_places=2, allow_null=True
    )
    role = serializers.CharField(required=False, allow_null=True)


class ActivitySerializer(serializers.Serializer):
    id = serializers.CharField()
    projectId = serializers.CharField(source="project_id", allow_null=True)
    actorId = serializers.CharField(source="actor_id", allow_null=True)
    type = serializers.CharField()
    payload = serializers.JSONField(allow_null=True)
    createdAt = serializers.DateTimeField(source="created_at")
