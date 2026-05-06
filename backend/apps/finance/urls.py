from django.urls import path

from . import views

urlpatterns = [
    path("projects/<str:project_id>/expenses", views.expense_collection),
    path("projects/<str:project_id>/expenses/<str:expense_id>", views.expense_detail),
    path("projects/<str:project_id>/revenues", views.revenue_collection),
    path("projects/<str:project_id>/revenues/<str:revenue_id>", views.revenue_detail),
    path("payouts", views.my_payouts),
    path("payouts/<str:payout_id>/mark-paid", views.mark_paid),
    path("projects/<str:project_id>/payouts", views.project_payouts),
]
