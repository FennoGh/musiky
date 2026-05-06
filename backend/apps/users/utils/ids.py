"""cuid-compatible IDs.

Same scheme as the legacy FastAPI/Prisma codebase:
prefix "c" + base36 timestamp + 16 random base36 chars.
Sortable, URL-safe, looks indistinguishable from prisma-generated cuids.
"""

import secrets
import time

ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyz"


def _b36(n: int) -> str:
    if n == 0:
        return "0"
    out = []
    while n:
        n, r = divmod(n, 36)
        out.append(ALPHABET[r])
    return "".join(reversed(out))


def cuid() -> str:
    ts = _b36(int(time.time() * 1000))
    rand = "".join(secrets.choice(ALPHABET) for _ in range(16))
    return f"c{ts}{rand}"
