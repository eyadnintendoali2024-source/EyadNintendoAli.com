#!/usr/bin/env bash
set -Eeuo pipefail

if [[ ${EUID:-$(id -u)} -ne 0 ]]; then
  echo "Run with sudo: sudo ./server/install-debian13.sh your-public-domain.example" >&2
  exit 1
fi

DOMAIN="${1:-}"
if [[ ! "$DOMAIN" =~ ^[A-Za-z0-9]([A-Za-z0-9.-]*[A-Za-z0-9])?$ ]] || [[ "$DOMAIN" != *.* ]]; then
  echo "Usage: sudo ./server/install-debian13.sh your-public-domain.example" >&2
  echo "Enter a domain name only, without https:// or a path." >&2
  exit 2
fi

if [[ ! -r /etc/os-release ]]; then
  echo "Cannot identify this Linux system." >&2
  exit 1
fi
# shellcheck disable=SC1091
. /etc/os-release
if [[ "${ID:-}" != debian || "${VERSION_ID:-}" != 13 ]]; then
  echo "This installer is prepared for Debian 13. Detected ${PRETTY_NAME:-unknown}." >&2
  exit 1
fi

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
GAME_DIR="$(cd -- "$SCRIPT_DIR/.." && pwd)"
WEB_ROOT=/var/www/sas-school
APP_DIR=/opt/sas-online
SITE=/etc/nginx/sites-available/sas-online
EMAIL="${SAS_CERT_EMAIL:-}"
if [[ -z "$EMAIL" ]]; then
  read -r -p "Email for HTTPS certificate renewal notices: " EMAIL
fi
if [[ ! "$EMAIL" =~ ^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$ ]]; then
  echo "Enter a valid email address for Let's Encrypt certificate notices." >&2
  exit 2
fi

echo "Installing Debian packages..."
apt-get update
DEBIAN_FRONTEND=noninteractive apt-get install -y python3 nginx certbot python3-certbot-nginx

echo "Installing SAS website files at $WEB_ROOT..."
install -d -o root -g www-data -m 0755 "$WEB_ROOT"
# The server folder contains setup files and should not be published as website content.
find "$GAME_DIR" -mindepth 1 -maxdepth 1 ! -name server -exec cp -a -t "$WEB_ROOT" -- {} +
chown -R root:www-data "$WEB_ROOT"
find "$WEB_ROOT" -type d -exec chmod 0755 {} +
find "$WEB_ROOT" -type f -exec chmod 0644 {} +
printf 'window.SAS_ONLINE_SERVER = "wss://%s/ws";\n' "$DOMAIN" > "$WEB_ROOT/sas-online-config.js"

echo "Installing the private lobby relay..."
if ! id sas-online >/dev/null 2>&1; then
  useradd --system --home "$APP_DIR" --shell /usr/sbin/nologin sas-online
fi
install -d -o root -g root -m 0755 "$APP_DIR"
install -o root -g root -m 0755 "$SCRIPT_DIR/sas_online_server.py" "$APP_DIR/sas_online_server.py"
install -o root -g root -m 0644 "$SCRIPT_DIR/sas-online.service" /etc/systemd/system/sas-online.service
systemctl daemon-reload
systemctl enable --now sas-online

echo "Preparing HTTP website and certificate validation for $DOMAIN..."
sed "s/YOUR_GAME_DOMAIN/$DOMAIN/g" "$SCRIPT_DIR/nginx-sas-online-http-bootstrap.conf" > "$SITE"
ln -sfn "$SITE" /etc/nginx/sites-enabled/sas-online
nginx -t
systemctl reload nginx

echo "Requesting the HTTPS certificate..."
certbot --nginx --non-interactive --agree-tos --redirect --email "$EMAIL" -d "$DOMAIN"

echo "Enabling HTTPS website and secure multiplayer relay..."
sed "s/YOUR_GAME_DOMAIN/$DOMAIN/g" "$SCRIPT_DIR/nginx-sas-online.conf" > "$SITE"
nginx -t
systemctl reload nginx

echo
echo "Setup complete. Game: https://$DOMAIN/  Multiplayer: wss://$DOMAIN/ws"
echo "Check the lobby with: systemctl status sas-online"
echo "This computer must be reachable from the public Internet on TCP 80 and 443."
echo "If your ISP uses carrier-grade NAT, this direct port-forward setup cannot provide global access; configure a public tunnel/relay first."
