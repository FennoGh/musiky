#!/usr/bin/env bash
# cost_monitor.sh — Resource usage snapshot for the Musiky server.
#
# Usage:
#   bash infra/cost_monitor.sh
#
# On a $6/mo DigitalOcean droplet, "cost control" means knowing when
# to upgrade. Upgrade signal: RAM above 80% (>410 MB) consistently.

echo "============================================"
echo " Musiky Resource Report — $(date '+%Y-%m-%d %H:%M:%S')"
echo "============================================"

echo ""
echo "--- Memory (MB) ---"
free -m | awk 'NR==2 {
  printf "Used:  %s MB\nFree:  %s MB\nTotal: %s MB\nUsage: %.0f%%\n", $3, $4, $2, $3*100/$2
}'

echo ""
echo "--- Swap ---"
free -m | awk '/Swap/ {
  printf "Used:  %s MB / Total: %s MB\n", $3, $2
}'

echo ""
echo "--- Disk (/) ---"
df -h / | awk 'NR==2 {
  print "Used:  " $3 " / Total: " $2 " (" $5 " used)"
}'

echo ""
echo "--- CPU Load (1 / 5 / 15 min) ---"
uptime | awk -F'load average:' '{print "Load:" $2}'

echo ""
echo "--- Docker Container Resources ---"
docker stats --no-stream \
  --format "table {{.Name}}\t{{.MemUsage}}\t{{.MemPerc}}\t{{.CPUPerc}}" \
  2>/dev/null || echo "(Docker not running or no containers)"

echo ""
echo "--- Upgrade Guide ---"
echo "  Current plan: \$6/mo  — 512 MB RAM, 1 vCPU, 10 GB SSD"
echo "  Next plan:    \$12/mo — 1 GB RAM,   1 vCPU, 25 GB SSD"
echo "  Upgrade when: RAM usage > 80% consistently (>410 MB)"
echo "============================================"
