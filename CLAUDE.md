# passwd

Monorepo with three npm packages for [passwd.team](https://passwd.team):

- **passwd-lib** — core library (auth, API client, types). Zero dependencies.
- **passwd-mcp** — MCP server for AI assistants. Depends on passwd-lib, @modelcontextprotocol/sdk, zod.
- **passwd-cli** — CLI tool. Depends on passwd-lib, commander.

## Build

```bash
npm install          # links workspaces
npm run build        # tsc -b (builds lib first, then mcp + cli)
npm run clean        # tsc -b --clean
```

## Project structure

```
packages/
  passwd-lib/src/    types.ts, auth.ts, api.ts, index.ts (barrel)
  passwd-mcp/src/    index.ts (MCP server with 9 tools)
  passwd-cli/src/    index.ts (commander), commands/*.ts, util/format.ts
```

## Key design decisions

- npm workspaces with TypeScript project references (`composite: true`, `tsc -b`)
- passwd-lib has zero npm dependencies — only Node.js built-ins
- Client-side filtering: the passwd API returns all secrets at once. Filtering/pagination is done in `listSecrets()`. MCP defaults to limit 50, CLI defaults to no limit.
- `passwd get <id> --field password` outputs raw value with no trailing newline (for `$()` piping)
- `passwd exec --inject VAR=ID:FIELD` fetches secrets in parallel, execs child with `stdio: inherit`

## Required env var

`PASSWD_ORIGIN` — your passwd deployment URL (e.g. `https://your-company.passwd.team`)

## Authentication

Google OAuth2. Tokens cached at `~/.passwd/tokens-<hash>.json`. Auto-refreshes on 401.
Skip with `PASSWD_ACCESS_TOKEN` env var.

## Release process

1. Bump version in all places:
   - `packages/passwd-lib/package.json` — version
   - `packages/passwd-mcp/package.json` — version + `@pepuscz/passwd-lib` dep
   - `packages/passwd-cli/package.json` — version + `@pepuscz/passwd-lib` dep
   - `packages/passwd-mcp/src/index.ts` — MCP server version string
   - `README.md` — all `@x.y.z` references (use replace_all)
2. `npm install` — regenerate lockfile
3. `npm run build` — verify it compiles
4. Commit, push — GitHub Action (`.github/workflows/publish.yml`) auto-publishes all three packages to GitHub Packages on push to main
5. `gh release create vX.Y.Z`

Keep commit messages short for public repo.
