/**
 * Try to parse the note field as JSON.
 * If the whole note isn't valid JSON, tries to find a JSON object embedded in surrounding text
 * (e.g. "MCP server:\n{...}").
 * Returns the parsed object if found, null otherwise.
 *
 * Security boundary: only structured JSON data gets through as mcpConfig.
 * Free text around the JSON is stripped — the AI never sees it.
 */
export function extractMcpConfig(note: unknown): Record<string, unknown> | null {
  if (typeof note !== "string" || !note.trim()) return null;

  // 1. Try the whole note as JSON
  const full = tryParse(note);
  if (full) return full;

  // 2. Find the outermost { ... } in the text (handles "MCP server:\n{...}" etc.)
  const firstBrace = note.indexOf("{");
  const lastBrace = note.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    const embedded = tryParse(note.slice(firstBrace, lastBrace + 1));
    if (embedded) return embedded;
  }

  return null;
}

function tryParse(text: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed;
    }
  } catch {}
  return null;
}
