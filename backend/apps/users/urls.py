from django.urls import path

from . import views

urlpatterns = [
    path("me", views.me),
    path("me/password", views.change_password),
    path("me/notifications", views.update_notifications),
    path("me/export", views.export_data),
]
