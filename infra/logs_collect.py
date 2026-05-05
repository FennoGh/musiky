#!/usr/bin/env python3
"""
logs_collect.py — Centralised log collection (CloudWatch equivalent).

Reads the last minute of logs from each Docker container and appends
them to a shared log file with timestamps and service labels.

Set up as a cron job on the server to run every minute:
  * * * * * /usr/bin/python3 /home/musiky/musiky/infra/logs_collect.py

Outputs:
  /var/log/musiky/combined_YYYY-MM-DD.log  — all container logs
  /var/log/musiky/errors.log               — ERROR/CRITICAL lines only

Keeps 7 days of combined logs, then auto-deletes older files.
"""
import subprocess
from datetime import datetime
from pathlib import Path

LOG_DIR = Path("/var/log/musiky")
SERVICES = ["musiky-db-1", "musiky-api-1", "musiky-web-1"]
KEEP_DAYS = 7


def collect() -> None:
    LOG_DIR.mkdir(parents=True, exist_ok=True)

    today = datetime.utcnow().strftime("%Y-%m-%d")
    combined_log = LOG_DIR / f"combined_{today}.log"
    error_log = LOG_DIR / "errors.log"

    with open(combined_log, "a") as all_f, open(error_log, "a") as err_f:
        for service in SERVICES:
            result = subprocess.run(
                ["docker", "logs", "--since", "1m", "--timestamps", service],
                capture_output=True,
                text=True,
            )
            # docker logs writes to stderr even for normal output
            lines = (result.stdout + result.stderr).splitlines()
            for line in lines:
                ts = datetime.utcnow().isoformat(timespec="seconds")
                entry = f"[{ts}] [{service}] {line}\n"
                all_f.write(entry)
                if any(k in line.upper() for k in ("ERROR", "CRITICAL", "EXCEPTION")):
                    err_f.write(entry)

    # Prune combined logs older than KEEP_DAYS
    all_combined = sorted(LOG_DIR.glob("combined_*.log"))
    for old in all_combined[:-KEEP_DAYS]:
        old.unlink()


if __name__ == "__main__":
    collect()
