const REQUIRED_FIELDS = ["key", "clicks", "impressions", "ctr", "position"];

const HEADER_ALIASES = {
  query: ["top queries", "query", "queries"],
  page: ["top pages", "page", "pages"],
  clicks: ["clicks"],
  impressions: ["impressions"],
  ctr: ["ctr"],
  position: ["position", "average position"],
};

export function parseCsvRecords(input) {
  const text = String(input).replace(/^\uFEFF/, "");
  const records = [];
  let record = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quoted) {
      if (char === '"' && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"' && field.length === 0) {
      quoted = true;
    } else if (char === ",") {
      record.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[index + 1] === "\n") index += 1;
      record.push(field);
      field = "";
      if (record.some((value) => value.trim() !== "")) records.push(record);
      record = [];
    } else {
      field += char;
    }
  }

  if (quoted) throw new Error("CSV contains an unterminated quoted field.");
  record.push(field);
  if (record.some((value) => value.trim() !== "")) records.push(record);
  return records;
}

const normalizeHeader = (value) => String(value).trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

function parseMetric(value, label, rowNumber, { percent = false } = {}) {
  const raw = String(value ?? "").trim();
  if (!raw) throw new Error(`Missing ${label} in CSV row ${rowNumber}.`);
  const parsed = Number(raw.replace(/[%,$\s]/g, ""));
  if (!Number.isFinite(parsed)) throw new Error(`Invalid ${label} in CSV row ${rowNumber}: ${raw}`);
  if (parsed < 0) throw new Error(`${label} cannot be negative in CSV row ${rowNumber}.`);
  return percent && raw.includes("%") ? parsed / 100 : parsed;
}

export function parseMetricCsv(input, dimension = "query") {
  if (!['query', 'page'].includes(dimension)) throw new Error(`Unsupported dimension: ${dimension}`);
  const records = parseCsvRecords(input);
  if (records.length < 2) throw new Error("CSV must include a header and at least one data row.");

  const headers = records[0].map(normalizeHeader);
  const aliases = {
    key: HEADER_ALIASES[dimension],
    clicks: HEADER_ALIASES.clicks,
    impressions: HEADER_ALIASES.impressions,
    ctr: HEADER_ALIASES.ctr,
    position: HEADER_ALIASES.position,
  };
  const indexes = Object.fromEntries(
    Object.entries(aliases).map(([field, candidates]) => [field, headers.findIndex((header) => candidates.includes(header))]),
  );
  const missing = REQUIRED_FIELDS.filter((field) => indexes[field] < 0);
  if (missing.length) {
    throw new Error(`CSV is missing required columns: ${missing.join(", ")}.`);
  }

  const rows = records.slice(1).map((record, offset) => {
    const rowNumber = offset + 2;
    const key = String(record[indexes.key] ?? "").trim();
    if (!key) throw new Error(`Missing ${dimension} in CSV row ${rowNumber}.`);
    const clicks = parseMetric(record[indexes.clicks], "clicks", rowNumber);
    const impressions = parseMetric(record[indexes.impressions], "impressions", rowNumber);
    const rawCtr = record[indexes.ctr];
    const ctr = parseMetric(rawCtr, "CTR", rowNumber, { percent: true });
    const position = parseMetric(record[indexes.position], "position", rowNumber);
    if (ctr > 1) throw new Error(`CTR must be a percentage or decimal from 0 to 1 in CSV row ${rowNumber}.`);
    return { key, clicks, impressions, ctr: ctr || (impressions ? clicks / impressions : 0), position };
  });

  if (!rows.length) throw new Error(`No ${dimension} rows found.`);
  return rows;
}
