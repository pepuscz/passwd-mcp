# passwd-mcp

MCP server for [passwd.team](https://passwd.team) — gives Claude access to your team's password manager.

## Install

```bash
claude mcp add passwd-mcp -- npx passwd-mcp
```

Then set the required environment variable in your MCP config:

```json
{
  "mcpServers": {
    "passwd-mcp": {
      "command": "npx",
      "args": ["passwd-mcp"],
      "env": {
        "PASSWD_ORIGIN": "https://your-company.passwd.team"
      }
    }
  }
}
```

## Required env vars

- `PASSWD_ORIGIN` — your passwd deployment URL (e.g. `https://your-company.passwd.team`)

## Authentication

On first use, call the `passwd_login` tool to start the Google OAuth flow. The server will give you a URL to open in your browser. After authenticating, paste the redirect URL back. Tokens are cached at `~/.passwd-mcp/tokens.json`.

Alternatively, set `PASSWD_ACCESS_TOKEN` to skip OAuth entirely.

## Available tools

- `passwd_login` — authenticate via Google OAuth
- `list_secrets` — list/search secrets (filter by query, type)
- `get_secret` — get full secret details including password
- `create_secret` — create a new secret
- `update_secret` — update an existing secret
- `delete_secret` — delete a secret (irreversible)
- `get_totp_code` — get current TOTP code
- `share_secret` — enable/revoke sharing links
- `get_current_user` — get authenticated user profile

## Project structure

```
src/
  index.ts   — MCP server entry point, tool registration
  auth.ts    — Google OAuth flow, token storage/refresh
  api.ts     — passwd REST API client
  types.ts   — TypeScript interfaces
```

Build: `npm run build` — compiles to `dist/`.
