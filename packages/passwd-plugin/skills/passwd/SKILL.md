# passwd

Manage team secrets via MCP tools and CLI.

## MCP tools (management)

Use the MCP tools for all read/write operations:

- `list_secrets` — search and browse secrets (filter by query, type; paginate)
- `get_secret` — view secret details (credentials are **redacted** — you will see `••••••••`)
- `create_secret` — create new secrets (all types, sharing, files)
- `update_secret` — update existing secrets
- `delete_secret` — delete a secret (always confirm with user first)
- `get_totp_code` — get current TOTP code
- `share_secret` — enable or revoke share links
- `list_groups` / `list_contacts` — find IDs for sharing
- `get_current_user` — check who is authenticated

## Use credentials (exec --inject)

Credential fields (password, keys, etc.) are always redacted in MCP responses. This is intentional — the agent should never see raw secrets.

To **use** a credential (e.g. connect to a database, call an API), inject it as an environment variable:

```bash
npx -y @passwd/passwd-cli@1.3.0 exec --inject VAR=SECRET_ID:field -- command
```

Examples:
```bash
# Inject a database password
npx -y @passwd/passwd-cli@1.3.0 exec --inject DB_PASS=abc123:password -- psql -h host -U user

# Inject an API key
npx -y @passwd/passwd-cli@1.3.0 exec --inject API_KEY=def456:password -- curl -H "Authorization: Bearer $API_KEY" https://api.example.com

# Multiple secrets
npx -y @passwd/passwd-cli@1.3.0 exec --inject DB_PASS=abc123:password --inject API_KEY=def456:password -- ./deploy.sh
```

The secret value goes directly to the subprocess environment — the agent never sees it. Secret values in stdout are automatically masked as `<concealed by passwd>`.

## Rules

- NEVER attempt to extract raw credential values — they are redacted for security
- Use `exec --inject` to pass credentials to commands
- Use `/passwd:use-credential` for guided credential injection
- Always confirm with the user before deleting secrets
- Use `--json` with CLI commands for structured output
