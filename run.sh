#!/bin/bash

# Youtuby - Docker Build & Run Script

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

echo -e "${RED}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${RED}║                YOU-TUBY DOCKER SETUP                 ║${NC}"
echo -e "${RED}╚══════════════════════════════════════════════════════╝${NC}"

# Check for Docker
if ! [ -x "$(command -v docker)" ]; then
  echo -e "${RED}Error: Docker no está instalado.${NC}" >&2
  exit 1
fi

echo -e "\n${GREEN}[1/3] Construyendo imagen Docker (esto puede tardar unos minutos)...${NC}"
docker build -t youtuby .

if [ $? -ne 0 ]; then
  echo -e "${RED}Error al construir la imagen.${NC}"
  exit 1
fi

echo -e "\n${GREEN}[2/3] Levantando el contenedor en el puerto 4000...${NC}"
# Detener y eliminar contenedor si ya existe (forzado)
docker rm -f youtuby-app 2>/dev/null

docker run -d \
  --name youtuby-app \
  -p 4000:4000 \
  -v /tmp/youtuby_downloads:/tmp/youtuby \
  youtuby

if [ $? -ne 0 ]; then
  echo -e "${RED}Error al iniciar el contenedor.${NC}"
  exit 1
fi

echo -e "\n${GREEN}[3/3] ¡Todo listo!${NC}"
echo -e "Accede a la aplicación en: ${RED}http://localhost:4000${NC}"
echo -e "Las descargas se guardarán temporalmente en el contenedor y se borrarán al reiniciar."
echo -e "\nPara ver los logs: ${RED}docker logs -f youtuby-app${NC}"
echo -e "Para detener: ${RED}docker stop youtuby-app${NC}"
