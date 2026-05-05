"""cuid-compatible IDs.

Prisma's @default(cuid()) generates IDs server-side. When we INSERT from
FastAPI we need to supply a compatible string ID. We use the same scheme
prefix ("c") + base36 timestamp + random suffix so all IDs sort correctly
and look indistinguishable from Prisma-generated ones.
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
