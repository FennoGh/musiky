#!/usr/bin/env bash
# port_audit.sh — Verify which ports are open on the Musiky server.
#
# Usage (run on the server):
#   bash infra/port_audit.sh
#
# Key verification: ports 5432, 8000, 3000 must NOT appear as
# externally listening — they should only be accessible inside Docker.

echo "============================================"
echo " Musiky Port Audit — $(date '+%Y-%m-%d %H:%M:%S')"
echo "============================================"

echo ""
echo "--- Listening TCP ports (ss) ---"
ss -tlnp | grep LISTEN || echo "(no listening ports found)"

echo ""
echo "--- UFW Firewall Status ---"
if command -v ufw > /dev/null 2>&1; then
  ufw status verbose
else
  echo "(UFW not installed)"
fi

echo ""
echo "--- Docker Port Mappings ---"
docker ps --format "table {{.Names}}\t{{.Ports}}" 2>/dev/null \
  || echo "(Docker not running)"

echo ""
echo "--- Expected vs Actual ---"
echo ""
printf "%-8s %-12s %-25s\n" "PORT" "EXPECTED" "CHECK"
printf "%-8s %-12s %-25s\n" "----" "--------" "-----"
printf "%-8s %-12s %-25s\n" "22"   "OPEN"   "SSH access"
printf "%-8s %-12s %-25s\n" "80"   "OPEN"   "HTTP (UFW rule)"
printf "%-8s %-12s %-25s\n" "443"  "OPEN"   "HTTPS (UFW rule)"
printf "%-8s %-12s %-25s\n" "3000" "INTERNAL" "Next.js (Docker only)"
printf "%-8s %-12s %-25s\n" "8000" "INTERNAL" "FastAPI (Docker only)"
printf "%-8s %-12s %-25s\n" "5432" "INTERNAL" "PostgreSQL (Docker only)"
echo ""
echo "IMPORTANT: 3000, 8000 and 5432 must NOT appear"
echo "           in the 'ss' output above as 0.0.0.0:PORT."

# Optional: nmap scan from localhost if installed
if command -v nmap > /dev/null 2>&1; then
  echo ""
  echo "--- nmap localhost scan (ports 22,80,443,3000,8000,5432) ---"
  nmap -sT -p 22,80,443,3000,8000,5432 localhost 2>/dev/null
fi

echo "============================================"
