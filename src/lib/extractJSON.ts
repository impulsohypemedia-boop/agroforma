/**
 * Extracts the outermost JSON object from Claude's response text,
 * handling trailing text, extra objects, and markdown fences.
 */
export function extractOutermostJSON(text: string): string | null {
  const clean = text.replace(/```(?:json)?\s*/gi, "").replace(/```/g, "");
  const start = clean.indexOf("{");
  if (start === -1) return null;
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < clean.length; i++) {
    const ch = clean[i];
    if (escape)          { escape = false; continue; }
    if (ch === "\\")     { escape = true;  continue; }
    if (ch === '"')      { inString = !inString; continue; }
    if (inString)        continue;
    if (ch === "{")      depth++;
    if (ch === "}")      { depth--; if (depth === 0) return clean.slice(start, i + 1); }
  }
  return null;
}
