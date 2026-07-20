import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { analyzeOpportunities, parseMetricCsv } from "../src/index.mjs";

const fixture = (name) => readFile(new URL(`./fixtures/${name}`, import.meta.url), "utf8");

test("parses ordinary Search Console query and page exports", async () => {
  const current = parseMetricCsv(await fixture("current.csv"), "query");
  const pages = parseMetricCsv(await fixture("pages.csv"), "page");
  assert.equal(current.length, 8);
  assert.ok(Math.abs(current[0].ctr - 0.014) < Number.EPSILON);
  assert.equal(pages[0].key, "https://example.com/templates/seo-report-template/");
});

test("handles quoted commas, escaped quotes, CRLF, and BOM", () => {
  const rows = parseMetricCsv(`\uFEFFTop queries,Clicks,Impressions,CTR,Position\r\n"seo, ""report""",2,100,2%,9.5\r\n`, "query");
  assert.equal(rows[0].key, 'seo, "report"');
  assert.equal(rows[0].ctr, 0.02);
});

test("rejects missing columns instead of treating metrics as zero", () => {
  assert.throws(
    () => parseMetricCsv("Top queries,Clicks,Impressions\nexample,1,10\n", "query"),
    /missing required columns: ctr, position/i,
  );
});

test("emits all five transparent opportunity types from synthetic fixtures", async () => {
  const findings = analyzeOpportunities({
    current: parseMetricCsv(await fixture("current.csv"), "query"),
    previous: parseMetricCsv(await fixture("previous.csv"), "query"),
    pages: parseMetricCsv(await fixture("pages.csv"), "page"),
  });
  const kinds = new Set(findings.map((finding) => finding.kind));
  assert.deepEqual(kinds, new Set(["striking_distance", "low_ctr", "rising", "decay", "page_opportunity"]));
  assert.ok(findings.every((finding) => finding.evidence && finding.action));
  assert.ok(findings.every((finding, index) => index === 0 || findings[index - 1].score >= finding.score));
});

test("does not infer query-to-page relationships", async () => {
  const findings = analyzeOpportunities({
    current: parseMetricCsv(await fixture("current.csv"), "query"),
    pages: parseMetricCsv(await fixture("pages.csv"), "page"),
  });
  assert.ok(findings.filter((item) => item.dimension === "page").every((item) => item.kind === "page_opportunity"));
  assert.ok(findings.every((item) => !Object.hasOwn(item, "rankingPage")));
});
