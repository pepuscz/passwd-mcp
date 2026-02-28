import { getTotpCode } from "passwd-lib";
import { formatJson } from "../util/format.js";

export async function totpCommand(
  id: string,
  opts: { json?: boolean },
): Promise<void> {
  const result = await getTotpCode(id);
  if (opts.json) {
    console.log(formatJson(result));
  } else {
    console.log(result.code);
  }
}
