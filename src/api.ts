import { getApiUrl, getAccessToken, refreshToken, loadTokens } from "./auth.js";
import type {
  Secret,
  SecretListItem,
  TOTPResponse,
  ShareResponse,
  UserProfile,
} from "./types.js";

async function authFetch(
  path: string,
  options: RequestInit = {},
  baseVersion: "v2" | "v3" = "v2",
  retry = true,
): Promise<Response> {
  const apiUrl = getApiUrl();
  const token = await getAccessToken();
  const url = `${apiUrl}/${baseVersion}${path}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 401 && retry) {
    // Try refreshing the token
    try {
      const newTokens = await refreshToken(token);
      const retryResponse = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${newTokens.access_token}`,
        },
      });
      return retryResponse;
    } catch {
      throw new Error("Authentication expired. Please use passwd_login to re-authenticate.");
    }
  }

  return response;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API error (${response.status}): ${text}`);
  }
  return response.json() as Promise<T>;
}

// --- Secrets ---

export interface ListSecretsParams {
  query?: string;
  secretType?: string;
  offset?: number;
  limit?: number;
}

export interface ListSecretsResult {
  secrets: SecretListItem[];
  totalCount: number;
}

export async function listSecrets(params: ListSecretsParams = {}): Promise<ListSecretsResult> {
  const searchParams = new URLSearchParams();
  if (params.query) searchParams.set("query", params.query);
  if (params.secretType) searchParams.set("secretType", params.secretType);
  if (params.offset !== undefined) searchParams.set("offset", String(params.offset));
  if (params.limit !== undefined) searchParams.set("limit", String(params.limit));

  const qs = searchParams.toString();
  const path = `/secrets${qs ? `?${qs}` : ""}`;

  const response = await authFetch(path, {}, "v3");
  const totalCount = parseInt(response.headers.get("x-total-count") || "0", 10);
  const data = await handleResponse<Record<string, SecretListItem> | SecretListItem[]>(response);

  // API may return object keyed by id or array
  let secrets: SecretListItem[];
  if (Array.isArray(data)) {
    secrets = data;
  } else if (data && typeof data === "object") {
    secrets = Object.values(data);
  } else {
    secrets = [];
  }

  return { secrets, totalCount };
}

export async function getSecret(id: string): Promise<Secret> {
  const response = await authFetch(`/secrets/${encodeURIComponent(id)}`);
  return handleResponse<Secret>(response);
}

export async function createSecret(secret: Partial<Secret>): Promise<Secret> {
  const response = await authFetch("/secrets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(secret),
  });
  return handleResponse<Secret>(response);
}

export async function updateSecret(id: string, updates: Partial<Secret>): Promise<Secret> {
  const response = await authFetch(`/secrets/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  return handleResponse<Secret>(response);
}

export async function deleteSecret(id: string): Promise<void> {
  const response = await authFetch(`/secrets/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Delete failed (${response.status}): ${text}`);
  }
}

// --- TOTP ---

export async function getTotpCode(id: string): Promise<TOTPResponse> {
  const response = await authFetch(`/secrets/${encodeURIComponent(id)}/TOTP`);
  return handleResponse<TOTPResponse>(response);
}

// --- Sharing ---

export async function enableSharing(id: string): Promise<ShareResponse> {
  const response = await authFetch(`/secrets/${encodeURIComponent(id)}/share`, {
    method: "POST",
  });
  return handleResponse<ShareResponse>(response);
}

export async function revokeSharing(id: string): Promise<void> {
  const response = await authFetch(`/secrets/${encodeURIComponent(id)}/share`, {
    method: "DELETE",
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Revoke sharing failed (${response.status}): ${text}`);
  }
}

// --- User ---

export async function getCurrentUser(): Promise<UserProfile> {
  const response = await authFetch("/me");
  return handleResponse<UserProfile>(response);
}
