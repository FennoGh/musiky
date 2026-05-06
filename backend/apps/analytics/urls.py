from django.urls import path

from . import views

urlpatterns = [
    path("projects/<str:project_id>/summary", views.project_summary),
    path("projects/<str:project_id>/activity", views.project_activity),
    path("activity", views.global_activity),
]
