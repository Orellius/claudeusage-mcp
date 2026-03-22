# claudeusage-mcp

An MCP server that gives you real-time visibility into your Claude Pro/Max subscription usage — directly inside Claude Code.

No API keys. No scraping. No browser automation. It reads the OAuth token that Claude Code already stores on your machine and calls Anthropic's usage endpoint to get the exact same data shown on [claude.ai/settings/usage](https://claude.ai/settings/usage).

---

## What it shows

| Metric | Description |
|--------|-------------|
| **Session (5-hour)** | Current burst window utilization and reset time |
| **Weekly - All Models** | 7-day rolling limit across all models |
| **Weekly - Opus** | 7-day Opus-specific usage (Max plans) |
| **Weekly - Sonnet** | 7-day Sonnet-specific usage |
| **Extra Usage** | Enabled/disabled status, monthly limit, credits used |

```
=== Claude Plan Usage ===

SESSION (5-hour window)
  ████████░░░░░░░░░░░░  37%
  Resets in 2h 14m

WEEKLY - All Models (7-day)
  █████░░░░░░░░░░░░░░░  26%
  Resets in 4d 3h

WEEKLY - Opus
  ░░░░░░░░░░░░░░░░░░░░   0%

WEEKLY - Sonnet
  ░░░░░░░░░░░░░░░░░░░░   1%
  Resets in 4d 3h

EXTRA USAGE: Disabled

(live data)
```

## Tools

| Tool | Purpose |
|------|---------|
| `get_usage` | Full dashboard with all metrics |
| `get_session_usage` | 5-hour session window only |
| `get_weekly_limits` | 7-day limits with per-model breakdown |
| `check_rate_status` | Am I about to be rate-limited? (LOW / MODERATE / HIGH) |

## Requirements

- **Node.js** >= 18
- **Claude Code** logged in with a Pro or Max subscription
- **macOS** or **Linux** (reads credentials from Keychain or `~/.claude/.credentials.json`)

## Installation

### Option 1: Add to Claude Code settings

```bash
# Clone and build
git clone https://github.com/OrelliusAI/claudeusage-mcp.git
cd claudeusage-mcp
npm install && npm run build
```

Add to `~/.claude/settings.json`:

```json
{
  "mcpServers": {
    "claudeusage": {
      "command": "node",
      "args": ["/absolute/path/to/claudeusage-mcp/dist/index.js"]
    }
  }
}
```

### Option 2: Use `claude mcp add`

```bash
git clone https://github.com/OrelliusAI/claudeusage-mcp.git
cd claudeusage-mcp
npm install && npm run build

claude mcp add claudeusage -- node /absolute/path/to/claudeusage-mcp/dist/index.js
```

Then restart Claude Code.

## How it works

```
Claude Code (your session)
    │
    ├── Reads OAuth token from:
    │   ├── macOS Keychain ("Claude Code-credentials")
    │   └── ~/.claude/.credentials.json (Linux/WSL)
    │
    ├── Calls: GET https://api.anthropic.com/api/oauth/usage
    │   Headers: Authorization: Bearer <your-oauth-token>
    │            anthropic-beta: oauth-2025-04-20
    │
    ├── Caches response for 60 seconds
    │   └── On 429 (rate limit): serves stale cache
    │
    └── Returns formatted usage data via MCP tools
```

**Zero configuration.** The OAuth token is created automatically when you sign into Claude Code with your Pro/Max subscription. No API keys, no environment variables, no `.env` files.

## Authentication

This server uses the **same OAuth token** that Claude Code creates when you log in. The token is stored:

| Platform | Location |
|----------|----------|
| macOS | Keychain (service: `Claude Code-credentials`) |
| Linux / WSL | `~/.claude/.credentials.json` |

Required OAuth scopes: `user:inference`, `user:profile`

### Token issues?

If the server reports authentication errors:

1. Your token may be expired — **restart Claude Code** to trigger a fresh OAuth login
2. Token created via `claude setup-token` or `/login` may have wrong scopes — delete credentials and restart Claude Code

**Do NOT use API keys** (`sk-ant-api...`). This server is for Pro/Max subscribers, not API users.

## Rate limiting

Anthropic's `/api/oauth/usage` endpoint is aggressively rate-limited. This server handles it by:

1. **Caching** responses for 60 seconds (skips API call if cache is fresh)
2. **Stale fallback** — if the API returns 429, the last successful response is served
3. **Graceful errors** — clear messages when the API is unavailable

## Who is this for?

Claude **Pro** and **Max** subscribers who use Claude Code and want to see their plan usage without opening a browser. This is **not** for API users — if you have an API key (`sk-ant-api...`), use the [Usage and Cost API](https://platform.claude.com/docs/en/build-with-claude/usage-cost-api) instead.

## License

MIT
