#!/usr/bin/env bash
set -euo pipefail

# ID do seu Project e do campo “Sprint Due Date”
PROJECT_ID=5
FIELD_ID="PVTF_lAHOA759Hs4A7WoPzgvrkTY"

# Arrays Sprint→data (YYYY-MM-DD)
sprints=(1 2 3 4 5 6 7 8 9 10 11 12 13)
due_dates=(
  "2025-06-18" "2025-06-25" "2025-07-02" "2025-07-09"
  "2025-07-16" "2025-07-23" "2025-07-30" "2025-08-06"
  "2025-08-13" "2025-08-20" "2025-08-27" "2025-09-03" "2025-09-10"
)

# 1) Liste todos os cards e extraia "ITEM_ID ISSUE_NUM"
gh project item-list "$PROJECT_ID" \
  --owner uederson-ferreira \
  --limit 200 \
  --format json \
| jq -r '.items[] | "\(.id) \(.content.number)"' \
| while read -r ITEM_ID ISSUE_NUM; do

    # 2) Encontre a data correspondente
    for idx in "${!sprints[@]}"; do
      if [ "${sprints[$idx]}" = "$ISSUE_NUM" ]; then
        DATE="${due_dates[$idx]}"

        # 3) Atualize o campo de data no card
        gh project item-edit \
          --project-id "$PROJECT_ID" \
          --id "$ITEM_ID" \
          --field-id "$FIELD_ID" \
          --date "$DATE"
        echo "✅ Sprint $ISSUE_NUM → $DATE"
        break
      fi
    done
  done
