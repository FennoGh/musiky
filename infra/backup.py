#!/usr/bin/env python3
"""
backup.py — Database backup and restore for Musiky.

Uses pg_dump/psql inside the running db container — no PostgreSQL
client tools needed on the host machine.

Usage:
  python infra/backup.py backup              # create a new compressed backup
  python infra/backup.py restore FILE.sql.gz # restore from a backup file

Backups are saved to infra/backups/ and auto-pruned (keeps last 7).
"""
import gzip
import subprocess
import sys
from datetime import datetime
from pathlib import Path

BACKUPS_DIR = Path(__file__).parent / "backups"
DB_CONTAINER = "musiky-db-1"
DB_USER = "musiky"
DB_NAME = "musiky"
KEEP_LAST = 7


def backup() -> None:
    BACKUPS_DIR.mkdir(exist_ok=True)
    ts = datetime.now().strftime("%Y-%m-%d_%H-%M")
    out_file = BACKUPS_DIR / f"musiky_backup_{ts}.sql.gz"

    print(f"Dumping database '{DB_NAME}'...")
    result = subprocess.run(
        ["docker", "exec", DB_CONTAINER, "pg_dump", "-U", DB_USER, DB_NAME],
        capture_output=True,
        check=True,
    )

    with gzip.open(out_file, "wb") as f:
        f.write(result.stdout)

    size_kb = out_file.stat().st_size // 1024
    print(f"Backup saved: {out_file.name} ({size_kb} KB)")

    # Remove old backups beyond the last KEEP_LAST
    all_backups = sorted(BACKUPS_DIR.glob("musiky_backup_*.sql.gz"))
    for old in all_backups[:-KEEP_LAST]:
        old.unlink()
        print(f"Deleted old backup: {old.name}")


def restore(filename: str) -> None:
    dump_file = Path(filename)
    if not dump_file.exists():
        print(f"ERROR: File not found: {filename}")
        sys.exit(1)

    print(f"Restoring from {dump_file.name}...")

    with gzip.open(dump_file, "rb") as f:
        sql_data = f.read()

    subprocess.run(
        ["docker", "exec", "-i", DB_CONTAINER, "psql", "-U", DB_USER, DB_NAME],
        input=sql_data,
        check=True,
    )
    print("Restore complete.")


def main() -> None:
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    cmd = sys.argv[1]
    if cmd == "backup":
        backup()
    elif cmd == "restore" and len(sys.argv) == 3:
        restore(sys.argv[2])
    else:
        print(__doc__)
        sys.exit(1)


if __name__ == "__main__":
    main()
