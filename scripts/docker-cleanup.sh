#!/bin/bash

# =============================================================================
# 🧹 RiskGuardian AI - Docker Cleanup Script
# =============================================================================
# Remove containers, imagens, volumes e networks problemáticos
# Prepara ambiente para rebuild limpo
# =============================================================================

set -e  # Exit on any error

# Colors for output (with terminal detection)
if [[ -t 1 ]] && command -v tput >/dev/null 2>&1 && [[ $(tput colors 2>/dev/null) -ge 8 ]]; then
    RED=$(tput setaf 1)
    GREEN=$(tput setaf 2)
    YELLOW=$(tput setaf 3)
    BLUE=$(tput setaf 4)
    PURPLE=$(tput setaf 5)
    CYAN=$(tput setaf 6)
    BOLD=$(tput bold)
    NC=$(tput sgr0)
else
    RED=""
    GREEN=""
    YELLOW=""
    BLUE=""
    PURPLE=""
    CYAN=""
    BOLD=""
    NC=""
fi

# Emojis for better UX
CLEAN="🧹"
STOP="🛑"
TRASH="🗑️"
CHECK="✅"
WARNING="⚠️"
ROCKET="🚀"
INFO="ℹ️"

# Project name
PROJECT_NAME="riskguardian-ai"

# =============================================================================
# Helper Functions
# =============================================================================

print_header() {
    echo
    echo "========================================"
    echo "  $1"
    echo "========================================"
    echo
}

print_step() {
    echo "🔄 $2"
}

print_success() {
    echo "✅ $2"
}

print_warning() {
    echo "⚠️  $2"
}

print_info() {
    echo "ℹ️  $2"
}

# Show disk usage
show_disk_usage() {
    print_info "$INFO" "Docker disk usage:"
    docker system df 2>/dev/null || echo "Docker não está rodando"
}

# Count containers, images, volumes, networks
count_docker_objects() {
    local containers=$(docker ps -a -q 2>/dev/null | wc -l)
    local images=$(docker images -q 2>/dev/null | wc -l)
    local volumes=$(docker volume ls -q 2>/dev/null | wc -l)
    local networks=$(docker network ls -q 2>/dev/null | wc -l)
    
    echo -e "${CYAN}📊 Docker Objects:${NC}"
    echo "   Containers: $containers"
    echo "   Images: $images"
    echo "   Volumes: $volumes"
    echo "   Networks: $networks"
}

# Check if Docker is running
check_docker() {
    if ! docker info >/dev/null 2>&1; then
        print_warning "$WARNING" "Docker não está rodando!"
        echo "Por favor, inicie o Docker Desktop ou Docker daemon."
        exit 1
    fi
}

# Confirm action with user
confirm_action() {
    local message="$1"
    local default="${2:-n}"
    
    if [[ "$default" == "y" ]]; then
        local prompt="[Y/n]"
    else
        local prompt="[y/N]"
    fi
    
    read -p "⚠️  $message $prompt: " -n 1 -r
    echo
    
    if [[ "$default" == "y" ]]; then
        [[ $REPLY =~ ^[Nn]$ ]] && return 1 || return 0
    else
        [[ $REPLY =~ ^[Yy]$ ]] && return 0 || return 1
    fi
}

# =============================================================================
# Cleanup Functions
# =============================================================================

stop_riskguardian_containers() {
    print_step "$STOP" "Parando containers do RiskGuardian..."
    
    # Try docker-compose first
    if [[ -f "docker-compose.yml" ]]; then
        docker-compose down 2>/dev/null || true
        print_success "$CHECK" "Docker-compose down executado"
    fi
    
    # Stop any remaining containers with project name
    local containers=$(docker ps -q --filter "name=$PROJECT_NAME" 2>/dev/null)
    if [[ -n "$containers" ]]; then
        docker stop $containers 2>/dev/null || true
        print_success "$CHECK" "Containers parados: $(echo $containers | wc -w)"
    else
        print_info "$INFO" "Nenhum container rodando"
    fi
}

remove_containers() {
    print_step "$TRASH" "Removendo containers..."
    
    # Remove project containers
    local project_containers=$(docker ps -a -q --filter "name=$PROJECT_NAME" 2>/dev/null)
    if [[ -n "$project_containers" ]]; then
        docker rm -f $project_containers 2>/dev/null || true
        print_success "$CHECK" "Containers removidos: $(echo $project_containers | wc -w)"
    fi
    
    # Remove all stopped containers
    local stopped=$(docker container prune -f 2>/dev/null | grep "Total reclaimed space" || echo "")
    if [[ -n "$stopped" ]]; then
        print_success "$CHECK" "Containers parados removidos"
    fi
}

remove_images() {
    print_step "$TRASH" "Removendo imagens..."
    
    # Remove project images
    local project_images=$(docker images --filter "reference=*$PROJECT_NAME*" -q 2>/dev/null)
    if [[ -n "$project_images" ]]; then
        docker rmi -f $project_images 2>/dev/null || true
        print_success "$CHECK" "Imagens do projeto removidas: $(echo $project_images | wc -w)"
    fi
    
    # Remove dangling images
    docker image prune -f >/dev/null 2>&1
    print_success "$CHECK" "Imagens órfãs removidas"
}

remove_images_aggressive() {
    print_step "$TRASH" "Removendo TODAS as imagens não utilizadas..."
    
    local result=$(docker image prune -a -f 2>/dev/null | grep "Total reclaimed space" || echo "")
    if [[ -n "$result" ]]; then
        print_success "$CHECK" "Imagens removidas: $result"
    else
        print_info "$INFO" "Nenhuma imagem para remover"
    fi
}

remove_volumes() {
    print_step "$TRASH" "Removendo volumes..."
    
    # Remove project volumes
    local project_volumes=(
        "${PROJECT_NAME}_postgres_data"
        "${PROJECT_NAME}_redis_data"
        "${PROJECT_NAME}_chromia_data"
        "${PROJECT_NAME}_pgadmin_data"
        "${PROJECT_NAME}_contracts_cache"
        "${PROJECT_NAME}_contracts_out"
    )
    
    for volume in "${project_volumes[@]}"; do
        docker volume rm "$volume" 2>/dev/null && print_success "$CHECK" "Volume removido: $volume" || true
    done
    
    # Remove orphaned volumes
    docker volume prune -f >/dev/null 2>&1
    print_success "$CHECK" "Volumes órfãos removidos"
}

remove_networks() {
    print_step "$TRASH" "Removendo networks..."
    
    # Remove project network
    docker network rm "${PROJECT_NAME}_riskguardian-network" 2>/dev/null && \
        print_success "$CHECK" "Network do projeto removida" || true
    
    # Remove orphaned networks
    docker network prune -f >/dev/null 2>&1
    print_success "$CHECK" "Networks órfãs removidas"
}

clean_build_cache() {
    print_step "$TRASH" "Limpando cache de build..."
    
    docker builder prune -f >/dev/null 2>&1
    print_success "$CHECK" "Cache de build limpo"
}

# =============================================================================
# Main Menu
# =============================================================================

show_menu() {
    echo "========================================="
    echo "  🧹 RiskGuardian AI - Docker Cleanup"
    echo "========================================="
    echo
    echo "Escolha o tipo de limpeza:"
    echo
    echo "1. Limpeza Básica     - Remove apenas containers parados"
    echo "2. Limpeza Moderada   - Remove containers + imagens órfãs"
    echo "3. Limpeza Completa   - Remove TUDO (containers + imagens + volumes)"
    echo "4. Limpeza Custom     - Escolher o que remover"
    echo "5. Status Atual       - Ver uso de espaço atual"
    echo "6. Reset Completo     - Limpar tudo e fazer rebuild"
    echo "0. Sair"
    echo
}

cleanup_basic() {
    print_header "$CLEAN Limpeza Básica"
    
    check_docker
    show_disk_usage
    echo
    
    stop_riskguardian_containers
    remove_containers
    clean_build_cache
    
    print_success "$CHECK" "Limpeza básica concluída!"
    show_disk_usage
}

cleanup_moderate() {
    print_header "$CLEAN Limpeza Moderada"
    
    check_docker
    show_disk_usage
    echo
    
    if confirm_action "Remover containers e imagens não utilizadas?"; then
        stop_riskguardian_containers
        remove_containers
        remove_images
        remove_networks
        clean_build_cache
        
        print_success "$CHECK" "Limpeza moderada concluída!"
        show_disk_usage
    fi
}

cleanup_complete() {
    print_header "$CLEAN Limpeza Completa"
    
    check_docker
    show_disk_usage
    echo
    
    print_warning "$WARNING" "ATENÇÃO: Isso vai remover TODOS os dados do Docker!"
    print_warning "$WARNING" "Incluindo volumes com dados de desenvolvimento."
    echo
    
    if confirm_action "Tem certeza que quer fazer limpeza completa?"; then
        stop_riskguardian_containers
        remove_containers
        remove_images_aggressive
        remove_volumes
        remove_networks
        clean_build_cache
        
        print_success "$CHECK" "Limpeza completa concluída!"
        show_disk_usage
    fi
}

cleanup_custom() {
    print_header "$CLEAN Limpeza Customizada"
    
    check_docker
    
    echo -e "${CYAN}Escolha o que remover:${NC}\n"
    
    confirm_action "Parar e remover containers?" "y" && {
        stop_riskguardian_containers
        remove_containers
    }
    
    confirm_action "Remover imagens do projeto?" && remove_images
    
    confirm_action "Remover TODAS as imagens não utilizadas?" && remove_images_aggressive
    
    confirm_action "Remover volumes? (PERDA DE DADOS!)" && remove_volumes
    
    confirm_action "Remover networks?" "y" && remove_networks
    
    confirm_action "Limpar cache de build?" "y" && clean_build_cache
    
    print_success "$CHECK" "Limpeza customizada concluída!"
    show_disk_usage
}

show_status() {
    print_header "$INFO Status Atual do Docker"
    
    check_docker
    
    echo -e "${CYAN}🔍 Containers:${NC}"
    docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Image}}" 2>/dev/null || echo "Nenhum container"
    
    echo -e "\n${CYAN}🖼️ Imagens:${NC}"
    docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}" 2>/dev/null || echo "Nenhuma imagem"
    
    echo -e "\n${CYAN}💾 Volumes:${NC}"
    docker volume ls 2>/dev/null || echo "Nenhum volume"
    
    echo -e "\n${CYAN}🌐 Networks:${NC}"
    docker network ls 2>/dev/null || echo "Nenhuma network"
    
    echo
    show_disk_usage
    echo
    count_docker_objects
}

reset_complete() {
    print_header "$ROCKET Reset Completo"
    
    check_docker
    
    print_warning "$WARNING" "RESET COMPLETO irá:"
    echo "1. Parar todos os containers"
    echo "2. Remover tudo do Docker"
    echo "3. Fazer rebuild das imagens"
    echo "4. Subir ambiente limpo"
    echo
    
    if confirm_action "Fazer reset completo? (PERDA TOTAL DE DADOS!)"; then
        print_step "$STOP" "Parando tudo..."
        docker-compose down -v 2>/dev/null || true
        
        print_step "$TRASH" "Removendo tudo..."
        docker system prune -a -f --volumes >/dev/null 2>&1
        
        if [[ -f "docker-compose.yml" ]]; then
            print_step "$ROCKET" "Fazendo rebuild..."
            docker-compose build --no-cache
            
            print_step "$ROCKET" "Subindo ambiente..."
            docker-compose up -d
            
            print_success "$CHECK" "Reset completo! Testando serviços..."
            sleep 10
            docker-compose ps
        fi
        
        print_success "$CHECK" "Reset completo concluído!"
    fi
}

# =============================================================================
# Main Script
# =============================================================================

main() {
    while true; do
        clear
        show_menu
        
        read -p "Escolha uma opção [0-6]: " choice
        echo
        
        case $choice in
            1) cleanup_basic ;;
            2) cleanup_moderate ;;
            3) cleanup_complete ;;
            4) cleanup_custom ;;
            5) show_status ;;
            6) reset_complete ;;
            0) 
                print_success "$CHECK" "Saindo... Ambiente Docker limpo!"
                exit 0
                ;;
            *)
                print_warning "$WARNING" "Opção inválida! Escolha 0-6."
                ;;
        esac
        
        echo
        read -p "Pressione Enter para continuar..."
    done
}

# Check if script is being sourced or executed
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi