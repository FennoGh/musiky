"""
locustfile.py — Load test for the Musiky API.

Simulates real users: each user logs in once, then repeatedly
hits endpoints with realistic weights.

Install:
  pip install locust

Run (headless, 60 seconds):
  locust -f infra/locustfile.py \\
    --host http://174.138.1.11:8000 \\
    --users 20 --spawn-rate 2 \\
    --headless --run-time 60s

Run (with web UI at http://localhost:8089):
  locust -f infra/locustfile.py --host http://174.138.1.11:8000

Expected results on a 512 MB droplet with 20 users:
  - /health        : < 50 ms avg
  - /projects      : < 300 ms avg
  - /analytics     : < 500 ms avg
  - Failure rate   : 0%
"""
from locust import HttpUser, between, task

# Test credentials — create this user in the DB first:
#   python infra/backup.py backup  (to have a restore point)
#   then register via the web UI or API POST /auth/register
TEST_EMAIL = "loadtest@musiky.dev"
TEST_PASSWORD = "loadtest123"


class ApiUser(HttpUser):
    """Simulates a logged-in Musiky user browsing the app."""

    wait_time = between(1, 3)  # realistic pause between requests

    def on_start(self) -> None:
        """Called once per simulated user — logs in and stores the token."""
        resp = self.client.post(
            "/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD},
        )
        if resp.status_code == 200:
            token = resp.json().get("access_token", "")
            self.auth = {"Authorization": f"Bearer {token}"}
        else:
            self.auth = {}

    @task(5)
    def health_check(self) -> None:
        """Lightweight ping — should always be sub-50ms."""
        self.client.get("/health")

    @task(3)
    def list_projects(self) -> None:
        """Lists the user's projects — requires auth + DB query."""
        self.client.get("/projects", headers=self.auth)

    @task(1)
    def get_analytics(self) -> None:
        """Analytics aggregation — heavier DB query."""
        self.client.get("/analytics", headers=self.auth)
