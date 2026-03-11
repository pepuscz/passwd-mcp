const MIME_MAP: Record<string, string> = {
  txt: "text/plain",
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  json: "application/json",
  xml: "application/xml",
  csv: "text/csv",
  zip: "application/zip",
};

export function guessMime(ext: string): string {
  return MIME_MAP[ext.toLowerCase()] ?? "application/octet-stream";
}
