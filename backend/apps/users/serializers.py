from rest_framework import serializers


class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(min_length=1, write_only=True)
    name = serializers.CharField(required=False, allow_blank=True, allow_null=True)


class LoginSerializer(serializers.Serializer):
    # Frontend posts JSON {email, password}, but the legacy FastAPI endpoint
    # used OAuth2 form fields {username, password}. Accept both shapes.
    email = serializers.CharField(required=False, allow_blank=True)
    username = serializers.CharField(required=False, allow_blank=True)
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        ident = attrs.get("email") or attrs.get("username")
        if not ident:
            raise serializers.ValidationError("Email is required")
        attrs["email"] = ident.strip().lower()
        return attrs


class TokenSerializer(serializers.Serializer):
    access_token = serializers.CharField()
    token_type = serializers.CharField(default="bearer")


class UserSerializer(serializers.Serializer):
    id = serializers.CharField()
    email = serializers.CharField()
    name = serializers.CharField(allow_null=True, allow_blank=True)
    image = serializers.CharField(allow_null=True, allow_blank=True)
    plan = serializers.CharField()
    createdAt = serializers.DateTimeField(source="created_at")


class UserPatchSerializer(serializers.Serializer):
    name = serializers.CharField(required=False, allow_null=True)
    avatarUrl = serializers.CharField(required=False, allow_null=True)


class PasswordChangeSerializer(serializers.Serializer):
    currentPassword = serializers.CharField(write_only=True)
    newPassword = serializers.CharField(write_only=True, min_length=8)


class NotificationPrefsSerializer(serializers.Serializer):
    emailDigest = serializers.BooleanField(default=True)
    payoutAlerts = serializers.BooleanField(default=True)
    weeklyReport = serializers.BooleanField(default=False)
