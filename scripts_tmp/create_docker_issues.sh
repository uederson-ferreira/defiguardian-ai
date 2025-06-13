#!/usr/bin/env bash
set -euo pipefail

# Ajuste se necessário
REPO="uederson-ferreira/riskguardian-ai"
PROJECT_NUM=5

# Para cada item em issues.json
jq -c '.[]' issues.json | while read -r issue; do
  title=$(jq -r '.title'     <<<"$issue")
  body=$(jq -r '.body'       <<<"$issue")
  labels=$(jq -r '.labels|join(",")' <<<"$issue")
  milestone=$(jq -r '.milestone'    <<<"$issue")

  # 1) Cria a issue
  output=$(gh issue create \
    -R "$REPO" \
    -t "$title" \
    -b "$body" \
    -l "$labels" \
    -m "$milestone")

  # 2) Extrai a URL retornada
  url=$(echo "$output" | grep -oE 'https://[^ ]+')

  # 3) Adiciona o card ao Project #5
  gh project item-add "$PROJECT_NUM" \
    --owner uederson-ferreira \
    --url "$url"

  echo "✔ Created and added $url"
done
