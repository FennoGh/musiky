from rest_framework.exceptions import NotFound, PermissionDenied

from .models import Collaborator, Project


def project_for_member(project_id, user):
    """Return (project, is_owner). 404 if user has no link to the project."""
    try:
        project = Project.objects.get(pk=project_id)
    except Project.DoesNotExist:
        raise NotFound("Project not found")
    if project.owner_id == user.id:
        return project, True
    if Collaborator.objects.filter(project_id=project_id, user_id=user.id).exists():
        return project, False
    raise NotFound("Project not found")


def project_for_owner(project_id, user):
    try:
        project = Project.objects.get(pk=project_id)
    except Project.DoesNotExist:
        raise NotFound("Project not found")
    if project.owner_id != user.id:
        raise PermissionDenied("Not your project")
    return project
