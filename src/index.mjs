import { readFile } from "node:fs/promises";
import { parseMetricCsv } from "./csv.mjs";
import { analyzeOpportunities, KIND_LABELS, RULES_VERSION } from "./engine.mjs";
import { formatFindings, toCsv, toJson, toMarkdown } from "./format.mjs";

export { analyzeOpportunities, formatFindings, KIND_LABELS, parseMetricCsv, RULES_VERSION, toCsv, toJson, toMarkdown };

export async function analyzeFiles({ currentPath, previousPath, pagesPath, minimumImpressions = 20, strikingDistance = [8, 20] }) {
  if (!currentPath) throw new Error("A current Queries CSV path is required.");
  const [currentText, previousText, pagesText] = await Promise.all([
    readFile(currentPath, "utf8"),
    previousPath ? readFile(previousPath, "utf8") : Promise.resolve(null),
    pagesPath ? readFile(pagesPath, "utf8") : Promise.resolve(null),
  ]);
  return analyzeOpportunities({
    current: parseMetricCsv(currentText, "query"),
    previous: previousText ? parseMetricCsv(previousText, "query") : [],
    pages: pagesText ? parseMetricCsv(pagesText, "page") : [],
    minimumImpressions,
    strikingDistance,
  });
}
