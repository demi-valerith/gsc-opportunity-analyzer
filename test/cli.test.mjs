import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const root = new URL("../", import.meta.url).pathname;

test("CLI writes an evidence ledger from all three exports", async () => {
  const directory = await mkdtemp(join(tmpdir(), "gsc-opportunity-"));
  const output = join(directory, "findings.json");
  const result = spawnSync(process.execPath, [
    join(root, "bin/gsc-opportunity.mjs"),
    join(root, "test/fixtures/current.csv"),
    "--previous", join(root, "test/fixtures/previous.csv"),
    "--pages", join(root, "test/fixtures/pages.csv"),
    "--format", "json",
    "--output", output,
  ], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  const parsed = JSON.parse(await readFile(output, "utf8"));
  assert.ok(parsed.findingCount >= 5);
  assert.match(result.stderr, /Wrote \d+ findings/);
});

test("CLI exits non-zero for an unknown option", () => {
  const result = spawnSync(process.execPath, [join(root, "bin/gsc-opportunity.mjs"), "--wrong", "value"], { encoding: "utf8" });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Unknown option/);
});
