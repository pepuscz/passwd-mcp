export interface AuthTokens {
  access_token: string;
  saved_at?: number;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  picture?: string;
  [key: string]: unknown;
}

export type SecretType =
  | "password"
  | "paymentCard"
  | "apiCredentials"
  | "databaseCredentials"
  | "sshKey"
  | "secureNote";

export interface SecretBase {
  id?: string;
  type: SecretType;
  name: string;
  username?: string;
  web?: string;
  note?: string;
  tags?: string[];
  groups?: string[];
  hasTOTP?: boolean;
  TOTP?: string | null;
  passwordUpdatedAt?: string;
  shareId?: string | null;
  securityLevel?: string;
  securityLeaks?: string;
  ignoreSecurityReport?: boolean;
  duplicities?: number;
}

export interface PasswordSecret extends SecretBase {
  type: "password";
  password?: string;
}

export interface PaymentCardSecret extends SecretBase {
  type: "paymentCard";
  cardNumber?: string;
  cvvCode?: string;
}

export interface ApiCredentialsSecret extends SecretBase {
  type: "apiCredentials";
  password?: string;
}

export interface DatabaseCredentialsSecret extends SecretBase {
  type: "databaseCredentials";
  credentials?: string;
}

export interface SshKeySecret extends SecretBase {
  type: "sshKey";
  privateKey?: string;
}

export interface SecureNoteSecret extends SecretBase {
  type: "secureNote";
  secureNote?: string;
}

export type Secret =
  | PasswordSecret
  | PaymentCardSecret
  | ApiCredentialsSecret
  | DatabaseCredentialsSecret
  | SshKeySecret
  | SecureNoteSecret;

export interface SecretListItem {
  id: string;
  name: string;
  type: SecretType;
  username?: string;
  web?: string;
  tags?: string[];
  hasTOTP?: boolean;
  securityLevel?: string;
  securityLeaks?: string;
  duplicities?: number;
  [key: string]: unknown;
}

export interface ListSecretsResponse {
  secrets: Record<string, SecretListItem> | SecretListItem[];
  totalCount?: number;
}

export interface TOTPCode {
  code: string;
  validityStart: number;
  validityEnd: number;
}

export type TOTPResponse = TOTPCode[];

export interface ShareResponse {
  shareId?: string;
  [key: string]: unknown;
}
