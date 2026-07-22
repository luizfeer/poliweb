#!/usr/bin/env bash
# Instala worker e media-processor como serviços systemd em /opt/hail-mary.
# Requer: sudo, pnpm, node, ffmpeg. Rodar da raiz do repo.
set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
INSTALL_DIR="/opt/hail-mary"
SYSTEMD_DIR="/etc/systemd/system"
MEDIA_ENV_DIR="/etc/hail-mary"

echo "==> Criando estrutura em $INSTALL_DIR"
sudo mkdir -p "$INSTALL_DIR"
sudo rsync -a --delete \
  --exclude='node_modules' --exclude='.env' --exclude='dist' \
  "$REPO_DIR/" "$INSTALL_DIR/"

echo "==> Instalando dependências"
sudo pnpm install --frozen-lockfile --dir "$INSTALL_DIR"

echo "==> Build do worker"
sudo pnpm --filter worker build --dir "$INSTALL_DIR"

echo "==> Build do media-processor"
sudo pnpm --filter media-processor build --dir "$INSTALL_DIR"

echo "==> Copiando .env do worker"
sudo cp "$REPO_DIR/apps/worker/.env" "$INSTALL_DIR/apps/worker/.env"
sudo chmod 600 "$INSTALL_DIR/apps/worker/.env"

echo "==> Copiando .env do media-processor"
sudo mkdir -p "$MEDIA_ENV_DIR"
sudo cp "$REPO_DIR/apps/media-processor/.env" "$MEDIA_ENV_DIR/media-processor.env"
sudo chmod 600 "$MEDIA_ENV_DIR/media-processor.env"

echo "==> Criando usuário hailmary (se necessário)"
id hailmary &>/dev/null || sudo useradd --system --no-create-home --shell /usr/sbin/nologin hailmary
sudo chown -R hailmary:hailmary "$INSTALL_DIR"

echo "==> Instalando units systemd"
WORKER_SYSTEMD="$REPO_DIR/apps/worker/deploy/systemd"
MEDIA_SYSTEMD="$REPO_DIR/apps/media-processor/deploy/systemd"

sudo cp "$WORKER_SYSTEMD/hail-mary-worker@.service" "$SYSTEMD_DIR/"
sudo cp "$WORKER_SYSTEMD/hail-mary-worker-diario.timer" "$SYSTEMD_DIR/"
sudo cp "$WORKER_SYSTEMD/hail-mary-worker-atas.timer" "$SYSTEMD_DIR/"
sudo cp "$WORKER_SYSTEMD/hail-mary-worker-licitacoes.timer" "$SYSTEMD_DIR/"
sudo cp "$MEDIA_SYSTEMD/hail-mary-media-processor.service" "$SYSTEMD_DIR/"

echo "==> Recarregando systemd e habilitando serviços"
sudo systemctl daemon-reload
sudo systemctl enable --now hail-mary-media-processor.service
sudo systemctl enable --now hail-mary-worker-diario.timer
sudo systemctl enable --now hail-mary-worker-atas.timer
sudo systemctl enable --now hail-mary-worker-licitacoes.timer

echo ""
echo "Instalação concluída."
echo "  Status media-processor: sudo systemctl status hail-mary-media-processor"
echo "  Rodar worker manualmente: sudo systemctl start hail-mary-worker@scrape:all"
echo "  Logs: sudo journalctl -u hail-mary-media-processor -f"
