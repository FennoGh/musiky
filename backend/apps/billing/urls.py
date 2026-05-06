from django.urls import path

from . import views

urlpatterns = [
    path("billing/subscription", views.subscription),
    path("billing/payment-methods", views.payment_methods),
    path("billing/payment-methods/<str:method_id>/default", views.set_default_method),
    path("billing/payment-methods/<str:method_id>", views.remove_method),
    path("billing/invoices", views.invoices),
]
