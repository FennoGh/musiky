from rest_framework import serializers


class ExpenseSerializer(serializers.Serializer):
    id = serializers.CharField()
    projectId = serializers.CharField(source="project_id")
    payerId = serializers.CharField(source="payer_id")
    category = serializers.CharField()
    amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    currency = serializers.CharField()
    description = serializers.CharField(allow_null=True)
    spentAt = serializers.DateTimeField(source="spent_at")


class ExpenseInSerializer(serializers.Serializer):
    category = serializers.CharField()
    amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    currency = serializers.CharField(default="USD")
    description = serializers.CharField(required=False, allow_null=True, allow_blank=True)


class ExpensePatchSerializer(serializers.Serializer):
    category = serializers.CharField(required=False)
    amount = serializers.DecimalField(required=False, max_digits=12, decimal_places=2)
    currency = serializers.CharField(required=False)
    description = serializers.CharField(required=False, allow_null=True, allow_blank=True)


class RevenueSerializer(serializers.Serializer):
    id = serializers.CharField()
    projectId = serializers.CharField(source="project_id")
    platformId = serializers.CharField(source="platform_id")
    amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    currency = serializers.CharField()
    periodStart = serializers.DateTimeField(source="period_start")
    periodEnd = serializers.DateTimeField(source="period_end")
    receivedAt = serializers.DateTimeField(source="received_at")


class RevenueInSerializer(serializers.Serializer):
    platformId = serializers.CharField()
    amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    currency = serializers.CharField(default="USD")
    periodStart = serializers.DateTimeField()
    periodEnd = serializers.DateTimeField()


class RevenuePatchSerializer(serializers.Serializer):
    platformId = serializers.CharField(required=False)
    amount = serializers.DecimalField(required=False, max_digits=12, decimal_places=2)
    currency = serializers.CharField(required=False)
    periodStart = serializers.DateTimeField(required=False)
    periodEnd = serializers.DateTimeField(required=False)


class PayoutSerializer(serializers.Serializer):
    id = serializers.CharField()
    projectId = serializers.CharField(source="project_id")
    revenueId = serializers.CharField(source="revenue_id")
    userId = serializers.CharField(source="user_id")
    amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    status = serializers.CharField()
    paidAt = serializers.DateTimeField(source="paid_at", allow_null=True)


class ProjectPayoutSerializer(serializers.Serializer):
    id = serializers.CharField()
    projectId = serializers.CharField(source="project_id")
    revenueId = serializers.CharField(source="revenue_id")
    userId = serializers.CharField(source="user_id")
    userName = serializers.CharField(allow_null=True)
    userEmail = serializers.CharField(allow_null=True)
    amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    status = serializers.CharField()
    paidAt = serializers.DateTimeField(source="paid_at", allow_null=True)
