import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { existsSync, readFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { buildOAuthUrl, extractCodeFromRedirectUrl, exchangeCode, setTokenDirOverride } from "@passwd/passwd-lib";

export async function loginCommand(dir?: string): Promise<void> {
  if (dir) {
    const tokenDir = join(resolve(dir), ".passwd");
    setTokenDirOverride(tokenDir);
  }

  const oauthUrl = await buildOAuthUrl();

  console.log("Open this URL in your browser to authenticate:\n");
  console.log(oauthUrl);
  console.log();

  const rl = createInterface({ input: stdin, output: stdout });
  try {
    const redirectUrl = await rl.question("Paste the redirect URL here: ");
    const code = extractCodeFromRedirectUrl(redirectUrl.trim());
    await exchangeCode(code);
    console.log("Authenticated successfully.");

    if (dir) {
      const tokenDir = join(resolve(dir), ".passwd");
      console.log(`Tokens saved to ${tokenDir}`);
      warnGitignore(resolve(dir));
    }
  } finally {
    rl.close();
  }
}

function warnGitignore(dir: string): void {
  const gitignorePath = join(dir, ".gitignore");
  try {
    if (existsSync(gitignorePath)) {
      const content = readFileSync(gitignorePath, "utf-8");
      if (content.includes(".passwd")) return;
    }
    console.log("\n⚠  Add .passwd/ to .gitignore — tokens contain encrypted credentials.");
  } catch {
    // ignore read errors
  }
}
