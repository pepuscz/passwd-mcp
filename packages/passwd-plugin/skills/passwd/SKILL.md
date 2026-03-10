# passwd

Find and use credentials from your team's passwd.team vault. Credentials are never exposed in chat.

## MCP tools

- `list_secrets` — search and browse secrets (filter by query, type; paginate)
- `get_secret` — view secret details (credentials are **redacted** — you will see `••••••••`)
- `get_totp_code` — get current TOTP code for 2FA flows
- `get_current_user` — check who is authenticated

## Use credentials (exec --inject)

Credential fields (password, keys, etc.) are always redacted in MCP responses. This is intentional — the agent never sees raw secrets.

To **use** a credential (e.g. connect to a database, call an API), inject it as an environment variable:

```bash
npx -y @passwd/passwd-agent-cli@1.3.0 exec --inject VAR=SECRET_ID:field -- command
```

Examples:
```bash
# Inject a database password
npx -y @passwd/passwd-agent-cli@1.3.0 exec --inject DB_PASS=abc123:password -- psql -h host -U user

# Inject an API key
npx -y @passwd/passwd-agent-cli@1.3.0 exec --inject API_KEY=def456:password -- curl -H "Authorization: Bearer $API_KEY" https://api.example.com

# Multiple secrets
npx -y @passwd/passwd-agent-cli@1.3.0 exec --inject DB_PASS=abc123:password --inject API_KEY=def456:password -- ./deploy.sh
```

The agent CLI (`@passwd/passwd-agent-cli`) has no command that outputs raw credential values — no `--field`, no `--no-masking`. The secret value goes directly to the subprocess environment and stdout is always masked.

## Rules

- NEVER attempt to extract raw credential values — they are redacted for security
- Use `exec --inject` via `@passwd/passwd-agent-cli` to pass credentials to commands
- Use `/passwd:use-credential` for guided credential injection
- Manage secrets (create, update, delete, share) in the passwd.team web interface, not in chat
