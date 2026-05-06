"""Django settings for musiky."""

import os
from datetime import timedelta
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR.parent / ".env")

SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY", "dev-secret-change-me")
DEBUG = os.environ.get("DJANGO_DEBUG", "True").lower() in ("1", "true", "yes")
ALLOWED_HOSTS = [h.strip() for h in os.environ.get(
    "DJANGO_ALLOWED_HOSTS", "localhost,127.0.0.1,0.0.0.0,174.138.1.11"
).split(",") if h.strip()]

INSTALLED_APPS = [
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "corsheaders",
    "apps.users",
    "apps.projects",
    "apps.finance",
    "apps.distribution",
    "apps.billing",
    "apps.uploads",
    "apps.analytics",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "musiky.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "musiky.wsgi.application"

DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "postgres://musiky:CHANGE_ME@localhost:5432/musiky",
)

def _parse_db(url: str) -> dict:
    from urllib.parse import urlparse
    p = urlparse(url)
    return {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": (p.path or "/musiky").lstrip("/"),
        "USER": p.username or "musiky",
        "PASSWORD": p.password or "",
        "HOST": p.hostname or "localhost",
        "PORT": str(p.port or 5432),
    }

DATABASES = {"default": _parse_db(DATABASE_URL)}

AUTH_USER_MODEL = "users.User"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

MEDIA_URL = "/uploads/"
MEDIA_ROOT = BASE_DIR / "uploads"

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "DEFAULT_RENDERER_CLASSES": [
        "rest_framework.renderers.JSONRenderer",
    ],
    "DEFAULT_PARSER_CLASSES": [
        "rest_framework.parsers.JSONParser",
        "rest_framework.parsers.FormParser",
        "rest_framework.parsers.MultiPartParser",
    ],
    "EXCEPTION_HANDLER": "apps.users.exceptions.api_exception_handler",
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(
        minutes=int(os.environ.get("ACCESS_TOKEN_EXPIRE_MINUTES", "10080"))
    ),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=30),
    "ALGORITHM": "HS256",
    "SIGNING_KEY": os.environ.get("JWT_SECRET", SECRET_KEY),
    "AUTH_HEADER_TYPES": ("Bearer",),
    "USER_ID_FIELD": "id",
    "USER_ID_CLAIM": "sub",
    "TOKEN_TYPE_CLAIM": None,
}

CORS_ALLOWED_ORIGIN_REGEXES = [
    r"^https?://localhost(:\d+)?$",
    r"^https?://127\.0\.0\.1(:\d+)?$",
    r"^https?://192\.168\.\d+\.\d+(:\d+)?$",
    r"^https?://10\.\d+\.\d+\.\d+(:\d+)?$",
    r"^https?://172\.(1[6-9]|2\d|3[01])\.\d+\.\d+(:\d+)?$",
    r"^https?://174\.138\.1\.11(:\d+)?$",
]
CORS_ALLOW_CREDENTIALS = True

DATA_UPLOAD_MAX_MEMORY_SIZE = 64 * 1024 * 1024  # 64 MB (audio is up to 60 MB)
FILE_UPLOAD_MAX_MEMORY_SIZE = 8 * 1024 * 1024
