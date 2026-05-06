from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from django.urls import include, path


def health(_request):
    return JsonResponse({"status": "ok"})


urlpatterns = [
    path("health", health),
    path("auth/", include("apps.users.urls_auth")),
    path("", include("apps.users.urls")),
    path("", include("apps.projects.urls")),
    path("", include("apps.finance.urls")),
    path("", include("apps.distribution.urls")),
    path("", include("apps.billing.urls")),
    path("uploads/", include("apps.uploads.urls")),
    path("", include("apps.analytics.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
