from django.urls import path

from . import views

urlpatterns = [
    path("platforms", views.platforms),
    path("projects/<str:project_id>/distributions", views.distribution_collection),
    path(
        "projects/<str:project_id>/distributions/<str:distribution_id>",
        views.distribution_detail,
    ),
    path(
        "projects/<str:project_id>/distributions/<str:distribution_id>/streams",
        views.distribution_streams,
    ),
]
