#!/bin/bash

# Caixinha App — Script principal
# Dispatcher para os scripts em scripts/

SCRIPTS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/scripts" && pwd)"

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

case "${1:-}" in
  validate)
    bash "$SCRIPTS_DIR/validate.sh"
    ;;
  setup)
    bash "$SCRIPTS_DIR/setup.sh"
    ;;
  install)
    bash "$SCRIPTS_DIR/install.sh" "${@:2}"
    ;;
  *)
    echo ""
    echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║         🚀 Caixinha App — Scripts disponíveis                ║${NC}"
    echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "  ${GREEN}bash run.sh validate${NC}          ${YELLOW}Verifica a estrutura do projeto${NC}"
    echo -e "  ${GREEN}bash run.sh setup${NC}             ${YELLOW}Instala dependências e configura o .env${NC}"
    echo -e "  ${GREEN}bash run.sh install [IP]${NC}      ${YELLOW}Instalação completa com DNS (Linux)${NC}"
    echo ""
    echo -e "  ${BLUE}ℹ${NC} Scripts individuais em: ${BLUE}scripts/${NC}"
    echo ""
    ;;
esac
