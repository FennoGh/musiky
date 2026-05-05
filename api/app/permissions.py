from fastapi import HTTPException
from sqlmodel import Session, select

from .models import Collaborator, Project, User


def get_project_for_member(
    session: Session, project_id: str, user: User
) -> tuple[Project, bool]:
    """Return (project, is_owner) if the user is the owner OR a collaborator.

    Raises 404 if the user has no link to the project, so we never leak existence.
    """
    project = session.get(Project, project_id)
    if not project:
        raise HTTPException(404, "Project not found")

    if project.ownerId == user.id:
        return project, True

    collab = session.exec(
        select(Collaborator).where(
            Collaborator.projectId == project_id,
            Collaborator.userId == user.id,
        )
    ).first()
    if collab:
        return project, False

    raise HTTPException(404, "Project not found")


def get_project_for_owner(
    session: Session, project_id: str, user: User
) -> Project:
    project = session.get(Project, project_id)
    if not project:
        raise HTTPException(404, "Project not found")
    if project.ownerId != user.id:
        raise HTTPException(403, "Not your project")
    return project
