import { spawn } from "node:child_process";
import { getSecret } from "@passwd/passwd-lib";

interface HeaderMapping {
  headerName: string;
  secretId: string;
  field: string;
}

export function parseMapping(spec: string): HeaderMapping {
  const eqIdx = spec.indexOf("=");
  if (eqIdx === -1) {
    throw new Error(`Invalid mapping "${spec}" — expected header=SECRET_ID:field`);
  }
  const headerName = spec.slice(0, eqIdx);
  const rest = spec.slice(eqIdx + 1);
  const colonIdx = rest.indexOf(":");
  if (colonIdx === -1) {
    throw new Error(`Invalid mapping "${spec}" — expected header=SECRET_ID:field`);
  }
  return {
    headerName,
    secretId: rest.slice(0, colonIdx),
    field: rest.slice(colonIdx + 1),
  };
}

export async function mcpWrapCommand(
  url: string,
  mappings: string[],
): Promise<void> {
  // Parse and resolve all header mappings sequentially
  const headers: string[] = [];
  const secretValues: string[] = [];

  for (const spec of mappings) {
    const { headerName, secretId, field } = parseMapping(spec);
    const secret = await getSecret(secretId);
    const value = (secret as unknown as Record<string, unknown>)[field];
    if (value === undefined) {
      throw new Error(`Field '${field}' not found in secret '${secretId}'`);
    }
    const val = String(value);
    secretValues.push(val);
    headers.push("--header", `${headerName}: ${val}`);
  }

  const env: Record<string, string> = { ...process.env } as Record<string, string>;
  delete env.PASSWD_ORIGIN;
  delete env.PASSWD_API_URL;
  delete env.PASSWD_CLIENT_ID;

  const args = ["-y", "mcp-remote", url, ...headers];
  const child = spawn("npx", args, {
    env,
    stdio: ["inherit", "pipe", "pipe"],
  });

  const mask = (chunk: Buffer): Buffer => {
    let str = chunk.toString();
    for (const v of secretValues) {
      str = str.replaceAll(v, "<concealed by passwd>");
    }
    return Buffer.from(str);
  };

  child.stdout?.on("data", (chunk: Buffer) => process.stdout.write(mask(chunk)));
  child.stderr?.on("data", (chunk: Buffer) => process.stderr.write(mask(chunk)));

  child.on("close", (code) => {
    process.exitCode = code ?? 1;
  });
}
