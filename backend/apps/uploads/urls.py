from django.urls import path

from . import views

urlpatterns = [
    path("cover", views.upload_cover),
    path("audio", views.upload_audio),
]
