#!/usr/bin/env bash
# init_server.sh — One-time server bootstrap (Infrastructure as Code)
# Run as root on a fresh Debian 12 droplet:
#   bash infra/init_server.sh
#
# What this script does:
#   1. Updates the system
#   2. Creates a 2 GB swap file (required — server only has 512 MB RAM)
#   3. Installs Docker CE and Git
#   4. Creates a 'musiky' user with Docker access
#   5. Configures UFW firewall (only ports 22, 80, 443 open)
#   6. Clones the repository

set -euo pipefail   # stop on first error, treat undefined vars as errors

REPO_URL="${REPO_URL:-https://github.com/OWNER/musiky.git}"
APP_DIR="/home/musiky/musiky"

# ── 1. System update ──────────────────────────────────────────────
echo "[1/6] Updating system packages..."
apt-get update -qq && apt-get upgrade -y -qq

# ── 2. Swap file (2 GB) ───────────────────────────────────────────
# 512 MB RAM is not enough for cold-start of 3 Docker containers.
# Swap lets the OS handle memory spikes without OOM-killing services.
echo "[2/6] Creating 2 GB swap file..."
if [ ! -f /swapfile ]; then
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
  echo "Swap created and enabled."
else
  echo "Swap file already exists, skipping."
fi

# ── 3. Docker CE ──────────────────────────────────────────────────
echo "[3/6] Installing Docker CE and Git..."
apt-get install -y -qq ca-certificates curl gnupg git

install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/debian/gpg \
  | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/debian \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
  > /etc/apt/sources.list.d/docker.list

apt-get update -qq
apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-compose-plugin

systemctl enable docker
systemctl start docker
echo "Docker installed: $(docker --version)"

# ── 4. App user ───────────────────────────────────────────────────
echo "[4/6] Creating 'musiky' user..."
if ! id musiky &>/dev/null; then
  useradd -m -s /bin/bash musiky
fi
usermod -aG docker musiky
echo "User 'musiky' created and added to docker group."

# ── 5. UFW Firewall ───────────────────────────────────────────────
# Only ports 22 (SSH), 80 (HTTP), 443 (HTTPS) are open to the internet.
# Ports 3000, 8000, 5432 are managed internally by Docker — NOT exposed via UFW.
echo "[5/6] Configuring UFW firewall..."
apt-get install -y -qq ufw
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw --force enable
echo "UFW enabled. Status:"
ufw status

# ── 6. Clone repository ───────────────────────────────────────────
echo "[6/6] Cloning repository..."
if [ ! -d "$APP_DIR" ]; then
  sudo -u musiky git clone "$REPO_URL" "$APP_DIR"
  echo "Repository cloned to $APP_DIR"
else
  echo "Repository already exists at $APP_DIR, skipping clone."
fi

echo ""
echo "============================================"
echo " Server ready!"
echo " Next steps:"
echo "   1. Copy .env to $APP_DIR/musiky/.env"
echo "   2. cd $APP_DIR/musiky && docker compose up -d"
echo "============================================"
