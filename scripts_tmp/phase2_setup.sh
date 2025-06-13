#!/usr/bin/env bash
set -euo pipefail

# Use o project #6 já existente
PHASE2_PROJECT=6

# Para cada Sprint de 9 a 13, adiciona as issues ao project #6
for M in "Sprint 9" "Sprint 10" "Sprint 11" "Sprint 12" "Sprint 13"; do
  echo "Adding issues from $M..."
  gh issue list \
    --repo uederson-ferreira/riskguardian-ai \
    --milestone "$M" \
    --json number \
  | jq -r '.[].number' \
  | while read -r n; do
      ISSUE_URL="https://github.com/uederson-ferreira/riskguardian-ai/issues/$n"
      gh project item-add "$PHASE2_PROJECT" \
        --owner uederson-ferreira \
        --url "$ISSUE_URL"
      echo "  -> Added issue #$n"
    done
done