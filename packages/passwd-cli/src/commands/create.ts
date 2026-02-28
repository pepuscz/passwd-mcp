import { createSecret } from "passwd-lib";
import type { SecretType } from "passwd-lib";
import { formatJson } from "../util/format.js";

export async function createCommand(opts: {
  type: string;
  name: string;
  username?: string;
  password?: string;
  web?: string;
  note?: string;
  tags?: string[];
  groups?: string[];
  totp?: string;
  cardNumber?: string;
  cvvCode?: string;
  credentials?: string;
  privateKey?: string;
  secureNote?: string;
}): Promise<void> {
  const payload: Record<string, unknown> = {
    type: opts.type as SecretType,
    name: opts.name,
  };

  if (opts.username !== undefined) payload.username = opts.username;
  if (opts.password !== undefined) payload.password = opts.password;
  if (opts.web !== undefined) payload.web = opts.web;
  if (opts.note !== undefined) payload.note = opts.note;
  if (opts.tags !== undefined) payload.tags = opts.tags;
  if (opts.groups !== undefined) payload.groups = opts.groups;
  if (opts.totp !== undefined) payload.TOTP = opts.totp;
  if (opts.cardNumber !== undefined) payload.cardNumber = opts.cardNumber;
  if (opts.cvvCode !== undefined) payload.cvvCode = opts.cvvCode;
  if (opts.credentials !== undefined) payload.credentials = opts.credentials;
  if (opts.privateKey !== undefined) payload.privateKey = opts.privateKey;
  if (opts.secureNote !== undefined) payload.secureNote = opts.secureNote;

  const secret = await createSecret(payload);
  console.log(formatJson(secret));
}
