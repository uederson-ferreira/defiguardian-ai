#!/usr/bin/env bash
set -euo pipefail

OWNER="uederson-ferreira"
REPO="riskguardian-ai"

# Lista de sprints e datas correspondentes
sprints=(
  "Sprint 1" "Sprint 2" "Sprint 3" "Sprint 4"
  "Sprint 5" "Sprint 6" "Sprint 7" "Sprint 8"
  "Sprint 9" "Sprint 10" "Sprint 11" "Sprint 12" "Sprint 13"
)
due_dates=(
  "2025-06-18T00:00:00Z" "2025-06-25T00:00:00Z" "2025-07-02T00:00:00Z" "2025-07-09T00:00:00Z"
  "2025-07-16T00:00:00Z" "2025-07-23T00:00:00Z" "2025-07-30T00:00:00Z" "2025-08-06T00:00:00Z"
  "2025-08-13T00:00:00Z" "2025-08-20T00:00:00Z" "2025-08-27T00:00:00Z" "2025-09-03T00:00:00Z" "2025-09-10T00:00:00Z"
)

for i in "${!sprints[@]}"; do
  title="${sprints[$i]}"
  due="${due_dates[$i]}"

  # obter ID da milestone existente
  num=$(gh api repos/$OWNER/$REPO/milestones \
    --jq ".[] | select(.title==\"$title\").number")

  echo "Updating $title (ID $num) to due_on $due"

  # patch da milestone
  gh api repos/$OWNER/$REPO/milestones/$num \
    -X PATCH \
    -f due_on="$due"
done