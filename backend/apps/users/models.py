from django.contrib.auth.base_user import AbstractBaseUser, BaseUserManager
from django.db import models

from apps.users.utils.ids import cuid


class Plan(models.TextChoices):
    STARTER = "STARTER", "Starter"
    PRO = "PRO", "Pro"
    TEAM = "TEAM", "Team"


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra):
        if not email:
            raise ValueError("Email is required")
        email = self.normalize_email(email).lower()
        user = self.model(email=email, **extra)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra):
        return self.create_user(email, password, **extra)


class User(AbstractBaseUser):
    id = models.CharField(primary_key=True, max_length=32, default=cuid, editable=False)
    email = models.EmailField(unique=True)
    name = models.CharField(max_length=200, blank=True, default="")
    image = models.CharField(max_length=500, blank=True, null=True)
    plan = models.CharField(max_length=10, choices=Plan.choices, default=Plan.STARTER)
    created_at = models.DateTimeField(auto_now_add=True)

    is_active = models.BooleanField(default=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    objects = UserManager()

    def __str__(self):
        return self.email
