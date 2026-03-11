import { execFile } from "node:child_process";

const SERVICE = "passwd.team";
const TIMEOUT = 10_000;

let _available: boolean | null = null;
let _backend: "security" | "secret-tool" | null = null;

function run(cmd: string, args: string[], stdin?: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = execFile(cmd, args, { timeout: TIMEOUT }, (err, stdout) => {
      if (err) reject(err);
      else resolve(stdout);
    });
    if (stdin !== undefined && child.stdin) {
      child.stdin.end(stdin);
    }
  });
}

export async function isKeychainAvailable(): Promise<boolean> {
  if (_available !== null) return _available;

  if (process.platform === "darwin") {
    try {
      await run("security", ["default-keychain"]);
      _available = true;
      _backend = "security";
    } catch {
      _available = false;
    }
  } else if (process.platform === "linux") {
    try {
      await run("which", ["secret-tool"]);
      _available = true;
      _backend = "secret-tool";
    } catch {
      _available = false;
    }
  } else {
    _available = false;
  }

  return _available;
}

export async function keychainSave(account: string, value: string): Promise<boolean> {
  if (!(await isKeychainAvailable())) return false;
  try {
    if (_backend === "security") {
      await run("security", [
        "add-generic-password",
        "-s", SERVICE,
        "-a", account,
        "-w", value,
        "-U",
      ]);
    } else {
      // secret-tool reads the value from stdin (no process list exposure)
      await run("secret-tool", [
        "store",
        "--label", SERVICE,
        "service", SERVICE,
        "account", account,
      ], value);
    }
    return true;
  } catch {
    return false;
  }
}

export async function keychainLoad(account: string): Promise<string | null> {
  if (!(await isKeychainAvailable())) return null;
  try {
    if (_backend === "security") {
      const result = await run("security", [
        "find-generic-password",
        "-s", SERVICE,
        "-a", account,
        "-w",
      ]);
      return result.trim() || null;
    } else {
      const result = await run("secret-tool", [
        "lookup",
        "service", SERVICE,
        "account", account,
      ]);
      return result.trim() || null;
    }
  } catch {
    return null;
  }
}

export async function keychainDelete(account: string): Promise<boolean> {
  if (!(await isKeychainAvailable())) return false;
  try {
    if (_backend === "security") {
      await run("security", [
        "delete-generic-password",
        "-s", SERVICE,
        "-a", account,
      ]);
    } else {
      await run("secret-tool", [
        "clear",
        "service", SERVICE,
        "account", account,
      ]);
    }
    return true;
  } catch {
    return false;
  }
}

export function resetKeychainCache(): void {
  _available = null;
  _backend = null;
}
