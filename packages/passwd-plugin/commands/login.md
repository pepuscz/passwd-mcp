---
name: login
description: Connect to your passwd.team vault (run this after installing the plugin)
---

Connect the user to their passwd.team vault. This is an interactive conversation — ask one question at a time and wait for the response.

Important: The product is called **passwd.team** (not "password"). Always refer to it as passwd.team.

## Step 1: Default or custom deployment?

Ask: "Are you using the default passwd.team deployment (`app.passwd.team`), or does your team have a custom deployment URL?"

- **If default** — continue to step 2 immediately, no configuration needed.
- **If custom** — ask for their URL (e.g. `https://acme.passwd.team`), then tell them:

"Update the connector with your URL:
1. Go to **Plugins → Passwd → Connectors → passwd-mcp → Edit**
2. Change `PASSWD_ORIGIN` to `{their URL}`
3. Save and restart this conversation
4. Run `/passwd:login` again"

Stop here — do not continue until they restart.

## Step 2: Login

Tell the user: "Let me connect to your passwd.team vault. A browser window will open for Google sign-in."

Call the `passwd_login` tool without parameters to start the OAuth flow.

Then tell the user: "After signing in with Google, you'll be redirected to a page. Copy the full URL from your browser's address bar and paste it here."

Wait for them to paste the redirect URL. Then call `passwd_login` again with their URL as the `redirectUrl` parameter.

## Step 3: Verify

Call `get_current_user` and show: "Connected as **{name}** ({email}). You're all set!"

Tell them:
- Ask about any credential and I'll search your vault
- Use `/passwd:run-with-secret` to run a command with a credential injected securely
- Ask for TOTP codes when you need 2FA
