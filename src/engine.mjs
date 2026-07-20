export const RULES_VERSION = "1.0.0";

export const KIND_LABELS = {
  striking_distance: "Striking distance",
  low_ctr: "CTR gap",
  rising: "Rising",
  decay: "Decay",
  page_opportunity: "Page opportunity",
};

export function positionBand(position) {
  if (position <= 3) return "1-3";
  if (position <= 6) return "4-6";
  if (position <= 10) return "7-10";
  if (position <= 20) return "11-20";
  return "21+";
}

function ctrBaselines(rows) {
  const bands = new Map();
  for (const row of rows) {
    const band = positionBand(row.position);
    const current = bands.get(band) || { clicks: 0, impressions: 0 };
    current.clicks += row.clicks;
    current.impressions += row.impressions;
    bands.set(band, current);
  }
  return new Map([...bands].map(([band, value]) => [band, value.impressions ? value.clicks / value.impressions : 0]));
}

function confidence(impressions, hasComparison) {
  if (impressions >= 100 && hasComparison) return "high";
  if (impressions >= 50) return "medium";
  return "low";
}

function scoreFor(row, bonus) {
  return Math.min(100, Math.round(Math.log10(row.impressions + 1) * 22 + bonus));
}

const formatInt = (value) => Math.round(value).toLocaleString("en-US");
const formatPct = (value) => `${(value * 100).toFixed(2)}%`;
const formatSignedPct = (value) => `${value >= 0 ? "+" : ""}${(value * 100).toFixed(1)}%`;

function finding(kind, dimension, row, score, evidence, action, hasComparison = false) {
  return {
    kind,
    label: KIND_LABELS[kind],
    dimension,
    subject: row.key,
    score,
    confidence: confidence(row.impressions, hasComparison),
    evidence,
    action,
    clicks: row.clicks,
    impressions: row.impressions,
    ctr: row.ctr,
    position: row.position,
  };
}

export function analyzeOpportunities({ current, previous = [], pages = [], minimumImpressions = 20, strikingDistance = [8, 20] }) {
  if (!Array.isArray(current) || current.length === 0) throw new Error("Current query rows are required.");
  const minimum = Number(minimumImpressions);
  const range = strikingDistance.map(Number);
  if (!Number.isFinite(minimum) || minimum < 1) throw new Error("Minimum impressions must be at least 1.");
  if (range.length !== 2 || !range.every(Number.isFinite) || range[0] > range[1] || range[0] < 0) {
    throw new Error("Striking-distance range must contain two ascending non-negative positions.");
  }

  const opportunities = [];
  const previousByKey = new Map(previous.map((row) => [row.key.toLowerCase(), row]));
  const baselines = ctrBaselines(current);

  for (const row of current) {
    if (row.impressions < minimum) continue;
    const prior = previousByKey.get(row.key.toLowerCase());
    const baseline = baselines.get(positionBand(row.position)) || 0;

    if (row.position >= range[0] && row.position <= range[1]) {
      opportunities.push(finding(
        "striking_distance", "query", row, scoreFor(row, 22),
        `${formatInt(row.impressions)} impressions at position ${row.position.toFixed(1)}.`,
        "Inspect the ranking page and intent, then strengthen the most relevant section and internal links.",
        Boolean(prior),
      ));
    }

    if (row.position <= 10 && row.impressions >= Math.max(50, minimum) && baseline > 0 && row.ctr < baseline * 0.7) {
      opportunities.push(finding(
        "low_ctr", "query", row, scoreFor(row, 18),
        `${formatPct(row.ctr)} CTR versus ${formatPct(baseline)} for your ${positionBand(row.position)} position band.`,
        "Inspect the live result, SERP features, title, and description before testing snippet changes.",
        Boolean(prior),
      ));
    }

    if (!prior) continue;
    const impressionDelta = row.impressions - prior.impressions;
    const impressionRate = prior.impressions ? impressionDelta / prior.impressions : 0;
    const clickDelta = row.clicks - prior.clicks;
    const clickRate = prior.clicks ? clickDelta / prior.clicks : 0;

    if (impressionDelta >= 20 && impressionRate >= 0.3 && row.position <= 40) {
      opportunities.push(finding(
        "rising", "query", row, scoreFor(row, 20),
        `Impressions rose ${formatSignedPct(impressionRate)} (${formatInt(prior.impressions)} to ${formatInt(row.impressions)}).`,
        "Protect the intent match; add supporting evidence or links without replacing what is already working.",
        true,
      ));
    }

    const clickDecay = clickDelta <= -5 && clickRate <= -0.3;
    const impressionDecay = impressionDelta <= -50 && impressionRate <= -0.4;
    if (clickDecay || impressionDecay) {
      const evidence = clickDecay
        ? `Clicks fell ${formatSignedPct(clickRate)} (${formatInt(prior.clicks)} to ${formatInt(row.clicks)}).`
        : `Impressions fell ${formatSignedPct(impressionRate)} (${formatInt(prior.impressions)} to ${formatInt(row.impressions)}).`;
      const item = finding(
        "decay", "query", row, scoreFor(prior, 16), evidence,
        "Check seasonality, demand, SERP changes, indexing, and recent edits before deciding to refresh.",
        true,
      );
      item.confidence = confidence(prior.impressions, true);
      opportunities.push(item);
    }
  }

  for (const row of pages) {
    if (row.impressions < Math.max(50, minimum) || row.position > 20) continue;
    opportunities.push(finding(
      "page_opportunity", "page", row, scoreFor(row, row.position <= 10 ? 18 : 12),
      `${formatInt(row.impressions)} impressions, ${formatPct(row.ctr)} CTR, position ${row.position.toFixed(1)}.`,
      "Open this page in GSC, inspect its query mix, and choose one evidence-backed page-level action.",
    ));
  }

  return opportunities.sort((a, b) => b.score - a.score || b.impressions - a.impressions);
}
