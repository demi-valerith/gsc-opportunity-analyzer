import { appendFile, writeFile } from "node:fs/promises";
import { analyzeFiles, formatFindings } from "../src/index.mjs";

function input(name, fallback = "") {
  return process.env[`INPUT_${name.replace(/ /g, "_").toUpperCase()}`] || fallback;
}

async function setOutput(name, value) {
  if (!process.env.GITHUB_OUTPUT) return;
  await appendFile(process.env.GITHUB_OUTPUT, `${name}=${value}\n`, "utf8");
}

async function run() {
  const range = input("range", "8-20").split(/[-,:]/).map(Number);
  const format = input("format", "markdown").toLowerCase();
  const outputPath = input("output", `gsc-opportunities.${format === "markdown" ? "md" : format}`);
  const findings = await analyzeFiles({
    currentPath: input("current"),
    previousPath: input("previous") || undefined,
    pagesPath: input("pages") || undefined,
    minimumImpressions: Number(input("minimum-impressions", "20")),
    strikingDistance: range,
  });
  await writeFile(outputPath, formatFindings(findings, format), "utf8");
  await setOutput("finding-count", findings.length);
  await setOutput("output-file", outputPath);
  process.stdout.write(`GSC Opportunity Analyzer wrote ${findings.length} findings to ${outputPath}.\n`);
}

run().catch((error) => {
  process.stderr.write(`::error title=GSC Opportunity Analyzer::${error.message}\n`);
  process.exitCode = 1;
});
