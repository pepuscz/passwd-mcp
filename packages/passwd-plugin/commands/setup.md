# /passwd:setup

Set up the passwd plugin for first use.

Follow these steps:

1. **Login** — use the `passwd_login` tool to start the Google OAuth flow.

2. **If login fails** — the most likely cause is that `PASSWD_ORIGIN` is still set to the placeholder value. Tell the user:
   - Go to **Plugins → Passwd → Connectors → passwd-mcp → Edit**
   - Change `PASSWD_ORIGIN` to your actual passwd.team URL (e.g. `https://acme.passwd.team`)
   - Restart the conversation and run `/passwd:setup` again

3. **If login succeeds** — guide the user through pasting back the redirect URL from the browser, then call `passwd_login` again with the redirect URL.

4. **Verify** — use `get_current_user` to confirm authentication worked. Show the user their name and email.

5. **Done** — tell the user they're all set. They can now:
   - Ask about credentials and you'll search the vault
   - Use `/passwd:use-credential` to inject secrets into commands
   - Ask for TOTP codes for 2FA flows
