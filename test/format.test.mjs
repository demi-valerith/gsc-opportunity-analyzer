import assert from "node:assert/strict";
import test from "node:test";
import { toCsv, toJson, toMarkdown } from "../src/index.mjs";

const finding = {
  kind: "striking_distance",
  label: "Striking distance",
  dimension: "query",
  subject: "=IMPORTXML(example)",
  score: 70,
  confidence: "medium",
  evidence: "100 impressions at position 9.0.",
  action: "Inspect the ranking page.",
  clicks: 2,
  impressions: 100,
  ctr: 0.02,
  position: 9,
};

test("formats reproducible JSON without a volatile generation timestamp", () => {
  const parsed = JSON.parse(toJson([finding]));
  assert.equal(parsed.rulesVersion, "1.0.0");
  assert.equal(parsed.findingCount, 1);
  assert.equal(parsed.findings[0].subject, finding.subject);
});

test("protects CSV consumers from formula injection", () => {
  assert.match(toCsv([finding]), /"'=IMPORTXML\(example\)"/);
});

test("labels Markdown output as triage rather than causation", () => {
  const output = toMarkdown([finding]);
  assert.match(output, /triage signals, not causal claims/i);
  assert.match(output, /Verify next:/);
});
