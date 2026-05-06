from django.urls import path

from . import views

urlpatterns = [
    path("projects", views.project_collection),
    path("projects/<str:project_id>", views.project_detail),
    path("projects/<str:project_id>/tracks", views.track_collection),
    path("projects/<str:project_id>/tracks/<str:track_id>", views.track_detail),
    path("projects/<str:project_id>/collaborators", views.collab_collection),
    path("projects/<str:project_id>/collaborators/<str:collaborator_id>", views.collab_detail),
]
