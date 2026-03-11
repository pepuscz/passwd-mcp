import { readFileSync } from "node:fs";
import { basename } from "node:path";
import { updateSecret } from "@passwd/passwd-lib";
import { formatJson } from "../util/format.js";
import { parseRefFlag } from "../util/parse-ref.js";
import { guessMime } from "../util/mime.js";

export async function updateCommand(
  id: string,
  opts: {
    name?: string;
    username?: string;
    password?: string;
    web?: string;
    note?: string;
    tags?: string[];
    group?: string[];
    user?: string[];
    file?: string;
    removeFile?: boolean;
    visibleToAll?: boolean;
    totp?: string;
    cardNumber?: string;
    cvvCode?: string;
    credentials?: string;
    privateKey?: string;
    publicKey?: string;
    secureNote?: string;
    expirationDate?: string;
    cardholderName?: string;
    hostname?: string;
    databaseName?: string;
    databaseType?: string;
    server?: string;
    port?: string;
  },
): Promise<void> {
  const updates: Record<string, unknown> = {};

  if (opts.name !== undefined) updates.name = opts.name;
  if (opts.username !== undefined) updates.username = opts.username;
  if (opts.password !== undefined) updates.password = opts.password;
  if (opts.web !== undefined) updates.web = opts.web;
  if (opts.note !== undefined) updates.note = opts.note;
  if (opts.tags !== undefined) updates.tags = opts.tags;
  if (opts.group !== undefined) {
    updates.groups = opts.group.map(parseRefFlag);
  }
  if (opts.user !== undefined) {
    updates.whitelistUsers = opts.user.map(parseRefFlag);
  }
  if (opts.removeFile) {
    updates.file = null;
  } else if (opts.file !== undefined) {
    const buf = readFileSync(opts.file);
    const name = basename(opts.file);
    const ext = name.split(".").pop() ?? "";
    const mime = guessMime(ext);
    updates.file = { name, data: `data:${mime};base64,${buf.toString("base64")}` };
  }
  if (opts.visibleToAll !== undefined) updates.visibleToAll = opts.visibleToAll;
  if (opts.totp !== undefined) updates.TOTP = opts.totp;
  if (opts.cardNumber !== undefined) updates.cardNumber = opts.cardNumber;
  if (opts.cvvCode !== undefined) updates.cvvCode = opts.cvvCode;
  if (opts.credentials !== undefined) updates.credentials = opts.credentials;
  if (opts.privateKey !== undefined) updates.privateKey = opts.privateKey;
  if (opts.publicKey !== undefined) updates.publicKey = opts.publicKey;
  if (opts.secureNote !== undefined) updates.secureNote = opts.secureNote;
  if (opts.expirationDate !== undefined) updates.expirationDate = opts.expirationDate;
  if (opts.cardholderName !== undefined) updates.cardholderName = opts.cardholderName;
  if (opts.hostname !== undefined) updates.hostname = opts.hostname;
  if (opts.databaseName !== undefined) updates.databaseName = opts.databaseName;
  if (opts.databaseType !== undefined) updates.databaseType = opts.databaseType;
  if (opts.server !== undefined) updates.server = opts.server;
  if (opts.port !== undefined) updates.port = opts.port;

  const secret = await updateSecret(id, updates);
  console.log(formatJson(secret));
}
