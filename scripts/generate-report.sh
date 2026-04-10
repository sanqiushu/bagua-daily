#!/bin/bash
set -euo pipefail
REPO="/Users/herrychan/Desktop/Repo/bagua-daily"
OC="/Users/herrychan/.opencode/bin/opencode"
DATE=$(TZ="Asia/Shanghai" date +%Y-%m-%d)

# Brave Search API key for news fetching
export BRAVE_API_KEY="BSALLDxSDbX33KRAm5yZ_RnoqsCx2vI"

mkdir -p "$REPO/logs"
LOG="$REPO/logs/$DATE.log"
echo "[$(date)] Start yiguan V3 $DATE" >>"$LOG"
$OC run "/bagua-daily" --dir "$REPO" --title "bagua-daily-$DATE" >>"$LOG" 2>&1
cd "$REPO"
git add data/ .opencode/ scripts/ index.html
git diff --cached --quiet || git commit -m "data: $DATE deep research daily (V3)"
git push
echo "[$(date)] Done" >>"$LOG"
