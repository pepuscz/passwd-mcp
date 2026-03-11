import { readFile } from "node:fs/promises";
import { join } from "node:path";

export interface EnvInfo {
  origin: string;
  savedAt?: number;
}

export async function listEnvironments(tokenDir: string): Promise<EnvInfo[]> {
  try {
    const content = await readFile(join(tokenDir, "environments.json"), "utf-8");
    const data = JSON.parse(content) as EnvInfo[];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function resolveEnv(
  name: string,
  tokenDir: string,
): Promise<string> {
  const envs = await listEnvironments(tokenDir);
  if (envs.length === 0) {
    throw new Error(
      "No known environments. Log in with PASSWD_ORIGIN set first.",
    );
  }

  const lower = name.toLowerCase();
  const matches = envs.filter((e) => e.origin.toLowerCase().includes(lower));

  if (matches.length === 0) {
    const known = envs.map((e) => `  ${e.origin}`).join("\n");
    throw new Error(
      `No environment matching "${name}". Known environments:\n${known}`,
    );
  }
  if (matches.length > 1) {
    const list = matches.map((e) => `  ${e.origin}`).join("\n");
    throw new Error(
      `Ambiguous match for "${name}". Matching environments:\n${list}\nBe more specific.`,
    );
  }
  return matches[0].origin;
}
