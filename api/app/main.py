from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from pathlib import Path

from fastapi.staticfiles import StaticFiles

from .routers import (
    analytics,
    auth,
    billing,
    collaborators,
    distributions,
    expenses,
    payouts,
    platforms,
    projects,
    revenues,
    tracks,
    uploads,
    users,
)

app = FastAPI(
    title="Musiky API",
    description="Music made together, paid apart.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    # Dev: allow localhost / 127.0.0.1 / private LAN IPs on any port.
    allow_origin_regex=r"^http://(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+):\d+$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["meta"])
def health():
    return {"status": "ok"}


app.include_router(auth.router)
app.include_router(users.router)
app.include_router(projects.router)
app.include_router(collaborators.router)
app.include_router(tracks.router)
app.include_router(expenses.router)
app.include_router(platforms.router)
app.include_router(distributions.router)
app.include_router(revenues.router)
app.include_router(payouts.router)
app.include_router(analytics.router)
app.include_router(analytics.global_router)
app.include_router(billing.router)
app.include_router(uploads.router)

UPLOAD_ROOT = Path(__file__).resolve().parents[1] / "uploads"
UPLOAD_ROOT.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_ROOT), name="uploads")
