#!/usr/bin/env bash
# รัน Codex สร้างภาพหนึ่งชุด: bash art/run_batch.sh b2-phase
cd "$(dirname "$0")/.."
codex exec --skip-git-repo-check --sandbox workspace-write -C "$(pwd)" --image=art/style-board.png - < "art/gen/$1.prompt.txt" > "art/gen/$1.log" 2>&1
echo "$1 exit $?"
ls art/gen/*.png 2>/dev/null | wc -l
