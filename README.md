# passwd

MCP server + CLI for [passwd.team](https://passwd.team) password manager.

Gives your AI assistant full access to your team's passwords, TOTP codes, secure notes, and file attachments — create, read, update, delete, and share secrets through natural language.

## What it can do

- **Search & retrieve** passwords, API keys, SSH keys, payment cards, secure notes
- **Create & update** secrets with all field types
- **Generate TOTP codes** on demand
- **Share secrets** with groups or individual users, with granular permissions (read, write, autofillOnly, passkeyOnly)
- **Attach files** to secrets (certificates, configs, etc.)
- **List groups & contacts** in your workspace for easy sharing

## Install

No build step needed — `npx` downloads and runs the package automatically. Packages are hosted on [GitHub Packages](https://github.com/pepuscz/passwd/packages), which requires authentication even for installs.

**One-time setup:** create a GitHub [personal access token](https://github.com/settings/tokens) with `read:packages` scope, then add to `~/.npmrc`:

```
//npm.pkg.github.com/:_authToken=ghp_YOUR_TOKEN_HERE
@pepuscz:registry=https://npm.pkg.github.com
```

## Setup

In all examples below, replace `https://your-company.passwd.team` with your passwd.team deployment URL.

### Claude Code

```bash
claude mcp add passwd-mcp \
  -e PASSWD_ORIGIN=https://your-company.passwd.team \
  -- npx -y @pepuscz/passwd-mcp@1.0.2
```

Restart Claude Code and verify with `/mcp`.

### Claude Desktop / Cowork

Open **Settings → Developer → Edit Config** (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "passwd-mcp": {
      "command": "npx",
      "args": ["-y", "@pepuscz/passwd-mcp@1.0.2"],
      "env": {
        "PASSWD_ORIGIN": "https://your-company.passwd.team"
      }
    }
  }
}
```

Restart Claude Desktop.

### Cursor / Windsurf

Add to your project's `.cursor/mcp.json` or `.windsurf/mcp.json`:

```json
{
  "mcpServers": {
    "passwd-mcp": {
      "command": "npx",
      "args": ["-y", "@pepuscz/passwd-mcp@1.0.2"],
      "env": {
        "PASSWD_ORIGIN": "https://your-company.passwd.team"
      }
    }
  }
}
```

### OpenClaw

Add a server entry to `~/.openclaw/openclaw.json` inside `plugins.entries.openclaw-mcp-adapter.config.servers`:

```json
{
  "name": "passwd-mcp",
  "transport": "stdio",
  "command": "npx",
  "args": ["-y", "@pepuscz/passwd-mcp@1.0.2"],
  "env": {
    "PASSWD_ORIGIN": "https://your-company.passwd.team"
  }
}
```

Restart the gateway (`launchctl bootout` / `bootstrap`). Then add instructions to your `AGENTS.md` so the model knows when to use the tools:

```markdown
## Password Manager (passwd.team)

You have access to the team password manager via MCP tools prefixed with `passwd_` and `list_`/`get_`/`create_`/`update_`/`delete_`/`share_`.

When the user asks about passwords, credentials, API keys, or secrets:
1. Use `list_secrets` to search by name
2. Use `get_secret` to retrieve full details including the password
3. Use `get_totp_code` if they need a one-time code

When the user wants to create or share a secret:
1. Use `list_groups` or `list_contacts` to find the right group/user IDs
2. Use `create_secret` or `update_secret` with the appropriate sharing fields

Always confirm before deleting secrets.
```

### CLI

```bash
export PASSWD_ORIGIN=https://your-company.passwd.team
npx @pepuscz/passwd-cli@1.0.2 login
npx @pepuscz/passwd-cli@1.0.2 list
npx @pepuscz/passwd-cli@1.0.2 --help
```

### Building from source

```bash
git clone https://github.com/pepuscz/passwd.git
cd passwd
npm install && npm run build
```

Then use `node packages/passwd-mcp/dist/index.js` or `node packages/passwd-cli/dist/index.js` in place of `npx` commands above.

## Upgrading

Check [releases](https://github.com/pepuscz/passwd/releases) for new versions, then update the version number in your MCP config (e.g. `@1.0.2` → `@1.0.2`) and restart the client.

## Authentication

Google OAuth2. On first use, the `passwd_login` tool (MCP) or `passwd login` (CLI) will guide you through authentication. Tokens are cached at `~/.passwd-mcp/tokens.json` and auto-refresh.

Set `PASSWD_ACCESS_TOKEN` env var to skip OAuth entirely.

## MCP tools reference

| Tool | Description |
|---|---|
| `passwd_login` | Google OAuth login flow |
| `list_secrets` | Search/list secrets (filter by query, type; paginate) |
| `get_secret` | Get full secret details including password |
| `create_secret` | Create a secret (all types, with sharing, files, visibleToAll) |
| `update_secret` | Update a secret |
| `delete_secret` | Delete a secret |
| `get_totp_code` | Get current TOTP code for a secret |
| `share_secret` | Enable or revoke a share link |
| `get_current_user` | Get authenticated user profile |
| `list_groups` | List workspace groups (IDs for sharing) |
| `list_contacts` | List workspace contacts (IDs for sharing) |

## CLI commands reference

| Command | Description |
|---|---|
| `passwd login` | Authenticate with Google OAuth |
| `passwd whoami` | Show current user |
| `passwd list` | List/search secrets (`-q`, `-t`, `--json`) |
| `passwd get <id>` | Get a secret (`--field` for raw value) |
| `passwd create` | Create a secret (`-t`, `-n`, `--group`, `--user`, `--file`, `--visible-to-all`) |
| `passwd update <id>` | Update a secret (`--group`, `--user`, `--file`, `--remove-file`, `--visible-to-all`) |
| `passwd delete <id>` | Delete a secret (`-y` to skip confirmation) |
| `passwd totp <id>` | Get current TOTP code |
| `passwd share <id>` | Enable/revoke sharing (`--revoke`) |
| `passwd groups` | List workspace groups |
| `passwd contacts` | List workspace contacts |
| `passwd exec` | Run command with secrets as env vars (`--inject VAR=ID:FIELD`) |

## Configuration

| Variable | Required | Description |
|---|---|---|
| `PASSWD_ORIGIN` | **Yes** | Your passwd.team URL (e.g. `https://your-company.passwd.team`) |
| `PASSWD_ACCESS_TOKEN` | No | Skip OAuth — use a pre-existing Bearer token |
| `PASSWD_API_URL` | No | API base URL override |
| `PASSWD_CLIENT_ID` | No | Google OAuth client ID override (auto-discovered from deployment) |

## Project structure

```
packages/
  passwd-lib/   Core library (types, auth, API — zero dependencies)
  passwd-mcp/   MCP server (depends on passwd-lib)
  passwd-cli/   CLI (depends on passwd-lib)
```

## License

MIT
