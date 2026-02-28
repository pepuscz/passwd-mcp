# passwd

TypeScript toolkit for [passwd.team](https://passwd.team) — three packages in one monorepo:

| Package | Description |
|---|---|
| **passwd-mcp** | MCP server for Claude Code, Cursor, Windsurf, OpenClaw |
| **passwd-cli** | Command-line interface for humans and scripts |
| **passwd-lib** | Core library — auth, API client, types (zero dependencies) |

## Quick start: MCP server for Claude Code

```bash
claude mcp add passwd-mcp -e PASSWD_ORIGIN=https://your-company.passwd.team -- npx passwd-mcp
```

Restart Claude Code and verify with `/mcp`. Then ask Claude to list your passwords — it will prompt you to authenticate on first use.

### Other MCP clients (Cursor, Windsurf, OpenClaw)

Add to your MCP client config:

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

### MCP tools

| Tool | Description |
|---|---|
| `passwd_login` | Interactive Google OAuth login flow |
| `list_secrets` | List/search secrets (filter by query, type; default limit: 50) |
| `get_secret` | Get full secret details |
| `create_secret` | Create a new secret |
| `update_secret` | Update an existing secret |
| `delete_secret` | Delete a secret |
| `get_totp_code` | Get current TOTP code |
| `share_secret` | Enable or revoke sharing |
| `get_current_user` | Get authenticated user profile |

## Quick start: CLI

```bash
npx passwd-cli login
npx passwd-cli list
npx passwd-cli get <id>
npx passwd-cli get <id> --field password
```

### Inject secrets into a command

```bash
npx passwd-cli exec --inject DB_PASSWORD=abc123:password -- env
```

This fetches the `password` field from secret `abc123`, sets it as `DB_PASSWORD` in the environment, and runs `env`.

### All CLI commands

```
passwd login                     Authenticate with Google OAuth
passwd whoami                    Show current user
passwd list [-q text] [-t type]  List/search secrets
passwd get <id> [--field name]   Get a secret (--field outputs raw value)
passwd create -t type -n name    Create a new secret
passwd update <id> [options]     Update a secret
passwd delete <id> [-y]          Delete a secret
passwd totp <id>                 Get current TOTP code
passwd share <id> [--revoke]     Enable/revoke sharing
passwd exec --inject VAR=ID:FIELD -- cmd   Run command with secrets as env vars
```

## Library usage

```typescript
import { listSecrets, getSecret, getAccessToken } from "passwd-lib";

// Requires PASSWD_ORIGIN env var and prior authentication
const { secrets } = await listSecrets({ query: "github" });
const secret = await getSecret(secrets[0].id);
console.log(secret.password);
```

## Configuration

All configuration is via environment variables:

| Variable | Required | Description |
|---|---|---|
| `PASSWD_ORIGIN` | **Yes** | Frontend origin (e.g. `https://your-company.passwd.team`) |
| `PASSWD_API_URL` | No | API base URL override |
| `PASSWD_CLIENT_ID` | No | Google OAuth client ID override |
| `PASSWD_ACCESS_TOKEN` | No | Skip OAuth — use a pre-existing Bearer token |

## Authentication

Both the MCP server and CLI use Google OAuth2. Tokens are cached at `~/.passwd-mcp/tokens.json` and auto-refresh on 401 responses.

Set `PASSWD_ACCESS_TOKEN` to skip the OAuth flow entirely.

## Development

```bash
git clone https://github.com/pepuscz/passwd-mcp.git
cd passwd-mcp
npm install
npm run build        # tsc -b builds lib -> mcp + cli
npx passwd --help
npx passwd-mcp       # starts MCP server on stdio
```

## Project structure

```
packages/
  passwd-lib/   Core library (types, auth, API client)
  passwd-mcp/   MCP server (depends on passwd-lib)
  passwd-cli/   CLI tool (depends on passwd-lib)
```

## License

MIT
