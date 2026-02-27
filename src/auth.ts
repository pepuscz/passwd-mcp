import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { homedir } from "node:os";
import type { AuthTokens } from "./types.js";

const GOOGLE_AUTH_ORIGIN = "https://accounts.google.com/o/oauth2/v2/auth";
const SCOPES = "https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email";

const TOKEN_DIR = join(homedir(), ".passwd-mcp");
const TOKEN_FILE = join(TOKEN_DIR, "tokens.json");

function getOrigin(): string {
  const origin = process.env.PASSWD_ORIGIN;
  if (!origin) {
    throw new Error(
      "PASSWD_ORIGIN environment variable is required (e.g. https://your-company.passwd.team)"
    );
  }
  return origin.replace(/\/+$/, "");
}

function getClientId(): string {
  return process.env.PASSWD_CLIENT_ID || "953910800667-j781s3cmu5isaie59t01195i2ns6l3pj.apps.googleusercontent.com";
}

let _discoveredApiUrl: string | null = null;

async function discoverApiUrl(origin: string): Promise<string> {
  try {
    const response = await fetch(origin, {
      headers: { Accept: "text/html" },
    });
    const html = await response.text();
    const match = html.match(/<meta\s+name=["']app-api["']\s+content=["']([^"']+)["']/i);
    if (match?.[1]) {
      return match[1].replace(/\/+$/, "");
    }
  } catch {
    // Fall through to default
  }
  return `${origin}/api`;
}

export async function getApiUrl(): Promise<string> {
  const envUrl = process.env.PASSWD_API_URL;
  if (envUrl) return envUrl.replace(/\/+$/, "");

  if (_discoveredApiUrl) return _discoveredApiUrl;
  _discoveredApiUrl = await discoverApiUrl(getOrigin());
  return _discoveredApiUrl;
}

function getRedirectUri(): string {
  return `${getOrigin()}/oauth/redirect`;
}

export function buildOAuthUrl(): string {
  const url = new URL(GOOGLE_AUTH_ORIGIN);
  url.searchParams.set("client_id", getClientId());
  url.searchParams.set("redirect_uri", getRedirectUri());
  url.searchParams.set("state", encodeURIComponent(JSON.stringify({ url: "/secrets" })));
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("scope", SCOPES);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("access_type", "offline");
  return url.toString();
}

export function extractCodeFromRedirectUrl(redirectUrl: string): string {
  const url = new URL(redirectUrl);
  const code = url.searchParams.get("code");
  if (!code) {
    throw new Error("No 'code' parameter found in the redirect URL");
  }
  return code;
}

export async function exchangeCode(code: string): Promise<AuthTokens> {
  const apiUrl = await getApiUrl();
  const url = `${apiUrl}/v2/oauth/callback?code=${encodeURIComponent(code)}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-islocalhost": "false",
    },
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OAuth code exchange failed (${response.status}): ${text}`);
  }

  const data = await response.json() as AuthTokens;
  if (!data.access_token) {
    throw new Error("No access_token in OAuth response");
  }

  data.saved_at = Date.now();
  await saveTokens(data);
  return data;
}

export async function refreshToken(currentToken: string): Promise<AuthTokens> {
  const apiUrl = await getApiUrl();
  const url = `${apiUrl}/v2/oauth/refresh-token`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${currentToken}`,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Token refresh failed (${response.status}): ${text}`);
  }

  const data = await response.json() as AuthTokens;
  if (!data.access_token) {
    throw new Error("No access_token in refresh response");
  }

  data.saved_at = Date.now();
  await saveTokens(data);
  return data;
}

async function saveTokens(tokens: AuthTokens): Promise<void> {
  await mkdir(TOKEN_DIR, { recursive: true });
  await writeFile(TOKEN_FILE, JSON.stringify(tokens, null, 2), "utf-8");
}

export async function loadTokens(): Promise<AuthTokens | null> {
  // Check env var first
  const envToken = process.env.PASSWD_ACCESS_TOKEN;
  if (envToken) {
    return { access_token: envToken };
  }

  try {
    const content = await readFile(TOKEN_FILE, "utf-8");
    return JSON.parse(content) as AuthTokens;
  } catch {
    return null;
  }
}

export async function getAccessToken(): Promise<string> {
  const tokens = await loadTokens();
  if (!tokens) {
    throw new Error("Not authenticated. Use the passwd_login tool to log in first.");
  }
  return tokens.access_token;
}
