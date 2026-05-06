from rest_framework import serializers


class PlatformSerializer(serializers.Serializer):
    id = serializers.CharField()
    name = serializers.CharField()
    slug = serializers.CharField()


class PlatformInSerializer(serializers.Serializer):
    name = serializers.CharField()


class DistributionSerializer(serializers.Serializer):
    id = serializers.CharField()
    projectId = serializers.CharField(source="project_id")
    platformId = serializers.CharField(source="platform_id")
    status = serializers.CharField()
    liveAt = serializers.DateTimeField(source="live_at", allow_null=True)
    streams = serializers.IntegerField()


class DistributionInSerializer(serializers.Serializer):
    platformId = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    customName = serializers.CharField(required=False, allow_null=True, allow_blank=True)


class StreamsInSerializer(serializers.Serializer):
    streams = serializers.IntegerField()
