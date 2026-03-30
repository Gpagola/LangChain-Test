#!/bin/bash
# Ejecutar desde tu Mac para subir la app al servidor.
# Requiere: sshpass  →  brew install sshpass
set -e

SERVER="debian@sb0.braintrust-cs.com"
APP_DIR="/opt/smartretain"
PASS="SERVERtrust1.0+-"
SSH="sshpass -p $PASS ssh -o LogLevel=ERROR -o StrictHostKeyChecking=no $SERVER"
RSYNC="sshpass -p $PASS rsync -az --delete -e 'ssh -o LogLevel=ERROR -o StrictHostKeyChecking=no'"

echo "==> Compilando frontend..."
cd frontend
npm install --silent
npm run build
cd ..

echo "==> Subiendo archivos al servidor..."
eval "$RSYNC \
  --exclude='.venv' \
  --exclude='node_modules' \
  --exclude='__pycache__' \
  --exclude='.git' \
  --exclude='*.pyc' \
  --exclude='.env' \
  ./ ${SERVER}:${APP_DIR}/"

# Primera vez: crear venv e instalar todo
if $SSH "test ! -d ${APP_DIR}/.venv"; then
  echo "==> Primera vez: ejecutando setup completo..."
  $SSH "bash ${APP_DIR}/deploy/setup_server.sh"
else
  echo "==> Instalando dependencias Python..."
  $SSH "${APP_DIR}/.venv/bin/pip install -q -r ${APP_DIR}/requirements.txt"
  echo "==> Reiniciando servicio Flask..."
  $SSH "sudo systemctl restart smartretain"
fi

echo ""
echo "===================================================="
echo " Deploy completado."
echo " App disponible en: http://sb0.braintrust-cs.com"
echo "===================================================="
