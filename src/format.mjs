import { RULES_VERSION } from "./engine.mjs";

const escapeMarkdown = (value) => String(value).replace(/([\\`*_{}\[\]()#+.!|>~-])/g, "\\$1");
const csvCell = (value) => {
  const raw = String(value ?? "");
  const safe = /^[=+\-@]/.test(raw) ? `'${raw}` : raw;
  return `"${safe.replace(/"/g, '""')}"`;
};

export function toMarkdown(findings) {
  const body = findings.length
    ? findings.map((item, index) => `${index + 1}. **${escapeMarkdown(item.subject)}** - ${item.label} (priority ${item.score}, ${item.confidence} confidence)\n   - Evidence: ${item.evidence}\n   - Verify next: ${item.action}`).join("\n")
    : "No rows matched the selected rules and thresholds.";
  return `# GSC opportunity analysis\n\nRules version: ${RULES_VERSION}. Generated locally. Treat findings as triage signals, not causal claims.\n\n${body}\n`;
}

export function toJson(findings) {
  return `${JSON.stringify({ rulesVersion: RULES_VERSION, findingCount: findings.length, findings }, null, 2)}\n`;
}

export function toCsv(findings) {
  const keys = ["kind", "dimension", "subject", "score", "confidence", "evidence", "action", "clicks", "impressions", "ctr", "position"];
  const rows = [keys, ...findings.map((item) => keys.map((key) => item[key]))];
  return `${rows.map((row) => row.map(csvCell).join(",")).join("\n")}\n`;
}

export function formatFindings(findings, format = "markdown") {
  if (format === "markdown" || format === "md") return toMarkdown(findings);
  if (format === "json") return toJson(findings);
  if (format === "csv") return toCsv(findings);
  throw new Error(`Unsupported output format: ${format}`);
}
