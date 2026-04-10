# YiGuan (弈观) Project Instructions

## Project Overview
弈观 (YiGuan) — AI/Crypto/Finance deep research daily newsletter.
Pure static site deployed on GitHub Pages. Content generated locally via OpenCode CLI + Brave Search API.

## Architecture
- `index.html` — single-page frontend, no build tools
- `data/*.json` — daily reports (V3 theme-based format)
- `data/raw/*.json` — raw Brave Search results
- `scripts/fetch-news.js` — Brave Search API (via python urllib bridge) + RSS fallback
- `scripts/generate-report.sh` — local orchestration script
- `.opencode/commands/bagua-daily.md` — V3 prompt template for report generation
- `.github/workflows/deploy.yml` — deploy-only on push to main

## Data Format Versions
- V3 (current): dynamic `themes` array with `domains`, `analysis`, `outlook`
- V2 (legacy): fixed `sections` with AI/Crypto/Finance tabs
- V1 (legacy): simple link lists
- Frontend auto-detects version and renders accordingly

## Agent Behavior Rules

### DO NOT spin wheels after aborted operations
When an edit/tool operation is aborted or interrupted:
1. Do ONE quick verification (e.g. a single grep) to check actual state
2. If the change landed, move on immediately
3. If it didn't, retry once — do not re-read entire files or over-verify
4. NEVER assume failure without checking

### Efficiency
- Batch independent edits in parallel when possible (e.g. renaming across multiple files)
- One grep to verify is enough. Do not read whole files just to confirm a small change.
- Prefer grep over read for verification tasks.

### Network quirks
- `curl` cannot reach Brave Search API in this environment (SSL timeout)
- Python `urllib` works fine — fetch-news.js uses a python child_process bridge as workaround

### Scheduling
- Daily report generation runs via macOS launchd at **08:00 CST** (Beijing time)
- Plist: `~/Library/LaunchAgents/com.yiguan.daily.plist`
- Manages: `launchctl load/unload ~/Library/LaunchAgents/com.yiguan.daily.plist`
- Logs: `logs/launchd-stdout.log`, `logs/launchd-stderr.log`, `logs/YYYY-MM-DD.log`

### Key credentials
- Brave Search API key: stored in `scripts/generate-report.sh` (exported as env var)
- Do NOT commit `.env` files or expose keys in new locations
