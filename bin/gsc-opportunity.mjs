#!/usr/bin/env node
import { writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { analyzeFiles, formatFindings, RULES_VERSION } from "../src/index.mjs";

const HELP = `GSC Opportunity Analyzer ${RULES_VERSION}

Usage:
  gsc-opportunity <current.csv> [options]
  gsc-opportunity --current <current.csv> [options]

Options:
  --previous <file>          Equal-length prior Queries CSV
  --pages <file>             Current Pages CSV using the same filters
  --minimum <number>         Minimum impressions (default: 20)
  --range <start-end>        Striking-distance positions (default: 8-20)
  --format <markdown|json|csv>
  --output <file>            Write output to a file instead of stdout
  --help                     Show this help
`;

export function parseArgs(argv) {
  const options = { format: "markdown", minimumImpressions: 20, strikingDistance: [8, 20] };
  const args = [...argv];
  while (args.length) {
    const arg = args.shift();
    if (arg === "--help" || arg === "-h") return { help: true };
    if (!arg.startsWith("-") && !options.currentPath) {
      options.currentPath = arg;
      continue;
    }
    const value = args.shift();
    if (value === undefined) throw new Error(`Missing value for ${arg}.`);
    if (arg === "--current") options.currentPath = value;
    else if (arg === "--previous") options.previousPath = value;
    else if (arg === "--pages") options.pagesPath = value;
    else if (arg === "--minimum") options.minimumImpressions = Number(value);
    else if (arg === "--range") options.strikingDistance = value.split(/[-,:]/).map(Number);
    else if (arg === "--format") options.format = value.toLowerCase();
    else if (arg === "--output" || arg === "-o") options.outputPath = value;
    else throw new Error(`Unknown option: ${arg}`);
  }
  return options;
}

export async function main(argv = process.argv.slice(2)) {
  const options = parseArgs(argv);
  if (options.help) {
    process.stdout.write(HELP);
    return;
  }
  if (!options.currentPath) throw new Error("A current Queries CSV is required. Run with --help for usage.");
  const findings = await analyzeFiles(options);
  const output = formatFindings(findings, options.format);
  if (options.outputPath) {
    await writeFile(options.outputPath, output, "utf8");
    process.stderr.write(`Wrote ${findings.length} findings to ${options.outputPath}.\n`);
  } else {
    process.stdout.write(output);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    process.stderr.write(`Error: ${error.message}\n`);
    process.exitCode = 1;
  });
}
