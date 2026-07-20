import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import * as packageApi from "../src/index.mjs";

const rootFile = (name) => readFile(new URL(`../${name}`, import.meta.url), "utf8");

test("publishes under the isolated public npm scope with explicit types", async () => {
  const manifest = JSON.parse(await rootFile("package.json"));
  assert.equal(manifest.name, "@demi-valerith/gsc-opportunity-analyzer");
  assert.equal(manifest.publishConfig.access, "public");
  assert.equal(manifest.types, "./src/index.d.ts");
  assert.equal(manifest.exports["."].types, "./src/index.d.ts");
  assert.equal(manifest.sideEffects, false);
});

test("uses a strict package file allowlist and exposes the documented API", async () => {
  const manifest = JSON.parse(await rootFile("package.json"));
  assert.deepEqual(manifest.files, [
    "action.yml",
    "action/index.mjs",
    "bin/gsc-opportunity.mjs",
    "src/csv.mjs",
    "src/engine.mjs",
    "src/format.mjs",
    "src/index.d.ts",
    "src/index.mjs",
    "LICENSE",
    "README.md",
    "SECURITY.md",
  ]);
  assert.equal(packageApi.RULES_VERSION, "1.0.0");
  assert.equal(typeof packageApi.analyzeFiles, "function");
  assert.equal(typeof packageApi.parseMetricCsv, "function");
});
