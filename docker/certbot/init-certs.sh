#!/bin/bash
set -euo pipefail

DOMAIN="mmc.ilinqsoft.com"
EMAIL="admin@ilinqsoft.com"
CERT_DIR="/etc/letsencrypt/live/$DOMAIN"

# Step 1: Create self-signed placeholder if no cert exists (allows nginx to start)
if [ ! -f "$CERT_DIR/fullchain.pem" ]; then
  echo "No certificate found. Creating self-signed placeholder..."
  mkdir -p "$CERT_DIR"
  openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
    -keyout "$CERT_DIR/privkey.pem" \
    -out "$CERT_DIR/fullchain.pem" \
    -subj "/CN=$DOMAIN"
  echo "Self-signed placeholder created. Starting nginx..."
  echo ""
  echo "Now run this script again with '--real' to obtain a Let's Encrypt certificate."
  exit 0
fi

# Step 2: Request real Let's Encrypt cert (run after nginx is up)
if [ "${1:-}" = "--real" ]; then
  echo "Requesting Let's Encrypt certificate for $DOMAIN..."
  # Remove self-signed placeholder
  rm -rf "$CERT_DIR"
  certbot certonly \
    --webroot \
    -w /var/www/certbot \
    -d "$DOMAIN" \
    --email "$EMAIL" \
    --non-interactive \
    --agree-tos \
    --no-eff-email
  echo "Certificate obtained! Reload nginx:"
  echo "  docker compose exec nginx nginx -s reload"
else
  echo "Certificates exist for $DOMAIN, attempting renewal..."
  certbot renew --quiet
  echo "Done. Reload nginx to pick up renewed certs:"
  echo "  docker compose exec nginx nginx -s reload"
fi
