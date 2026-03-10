import { getSecret, redactSecret } from "@passwd/passwd-lib";
import { formatJson } from "../util/format.js";

export async function getCommand(
  id: string,
  opts: { json?: boolean },
): Promise<void> {
  const secret = await getSecret(id);
  // Always redacted — no --field flag exists in the agent CLI
  console.log(formatJson(redactSecret(secret)));
}
