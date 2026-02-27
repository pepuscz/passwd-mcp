# passwd-mcp

MCP (Model Context Protocol) server for the [passwd.team](https://passwd.team) password manager. Enables Claude and other MCP clients to manage password records, generate TOTP codes, and handle sharing.

## Setup

```bash
npm install
npm run build
```

## Configuration

All configuration is done via environment variables. No URLs are hardcoded — the server works with any passwd deployment.

| Variable | Required | Description |
|---|---|---|
| `PASSWD_ORIGIN` | **Yes** | Frontend origin URL (e.g. `https://your-company.passwd.team`) |
| `PASSWD_API_URL` | No | API base URL override. Defaults to `{PASSWD_ORIGIN}/api` |
| `PASSWD_CLIENT_ID` | No | Google OAuth client ID override for custom OAuth apps |
| `PASSWD_ACCESS_TOKEN` | No | Skip OAuth flow entirely and use a pre-existing Bearer token |

## Usage with Claude Code

Add to your project's `.mcp.json`:

```json
{
  "mcpServers": {
    "passwd-mcp": {
      "type": "stdio",
      "command": "node",
      "args": ["/path/to/passwd-mcp/dist/index.js"],
      "env": {
        "PASSWD_ORIGIN": "https://your-company.passwd.team"
      }
    }
  }
}
```

Then restart Claude Code. Verify with `/mcp`.

## Authentication

The server uses Google OAuth2. On first use:

1. Call the `passwd_login` tool (no arguments) to get the Google OAuth URL
2. Open the URL in a browser, authenticate with Google
3. Copy the full redirect URL you land on
4. Call `passwd_login` again with the redirect URL as the `redirectUrl` parameter

The token is saved to `~/.passwd-mcp/tokens.json` and auto-refreshes on 401 responses.

Alternatively, set `PASSWD_ACCESS_TOKEN` to skip the OAuth flow entirely.

## Tools

| Tool | Description |
|---|---|
| `passwd_login` | Interactive Google OAuth login flow |
| `list_secrets` | List/search secrets with filtering by query, type, and pagination |
| `get_secret` | Get full secret details (password, notes, TOTP status) |
| `create_secret` | Create a new secret (password, paymentCard, apiCredentials, databaseCredentials, sshKey, secureNote) |
| `update_secret` | Update an existing secret |
| `delete_secret` | Delete a secret |
| `get_totp_code` | Get current TOTP code for a secret |
| `share_secret` | Enable or revoke sharing for a secret |
| `get_current_user` | Get authenticated user profile |

## Project Structure

```
src/
  index.ts   # MCP server entry point, tool registration
  auth.ts    # Google OAuth flow, token storage/refresh
  api.ts     # Passwd REST API client
  types.ts   # TypeScript interfaces
```
