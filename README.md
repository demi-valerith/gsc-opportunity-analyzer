# GSC Opportunity Analyzer

Turn Google Search Console Performance CSV exports into a deterministic SEO triage queue. The analyzer flags striking-distance queries, site-relative CTR gaps, rising demand, decay, and page-level opportunities while keeping query and URL data in your own process.

[Use the browser tool](https://seoreportkit.com/tools/gsc-opportunity-analysis/) | [Read the methodology](https://seoreportkit.com/tools/gsc-opportunity-analysis/#rules) | [Report an issue](https://github.com/demi-valerith/gsc-opportunity-analyzer/issues)

## Why this exists

A Search Console export can contain hundreds of rows but still leave the operational question unanswered: which existing signal deserves the next hour of work? This tool produces a small evidence ledger with a priority score, confidence label, observed evidence, and a recommended verification step.

It does not forecast traffic, estimate keyword difficulty, infer query-to-page relationships from separate exports, or claim that an SEO edit caused a movement.

## GitHub Action

Commit or generate your Search Console exports inside a private repository, then add this workflow step:

```yaml
- name: Analyze GSC opportunities
  id: gsc
  uses: demi-valerith/gsc-opportunity-analyzer@v1
  with:
    current: data/gsc/current-queries.csv
    previous: data/gsc/previous-queries.csv
    pages: data/gsc/current-pages.csv
    format: markdown
    output: gsc-opportunities.md

- name: Upload evidence ledger
  uses: actions/upload-artifact@v4
  with:
    name: gsc-opportunities
    path: ${{ steps.gsc.outputs.output-file }}
```

The action logs only the finding count and output path. It does not log imported rows or send them to SEO Report Kit. Search queries can still be sensitive, so use a private repository and a suitable artifact retention policy.

### Inputs

| Input | Required | Default | Meaning |
|---|---:|---:|---|
| `current` | yes | - | Current-period Queries CSV |
| `previous` | no | - | Equal-length prior-period Queries CSV |
| `pages` | no | - | Current-period Pages CSV with the same filters |
| `minimum-impressions` | no | `20` | Minimum query impressions |
| `range` | no | `8-20` | Striking-distance average-position range |
| `format` | no | `markdown` | `markdown`, `json`, or `csv` |
| `output` | no | `gsc-opportunities.md` | Generated ledger path |

Outputs are `finding-count` and `output-file`.

## Command line

Node.js 20 or newer is required. Install the public npm package:

```bash
npm install --save-dev @demi-valerith/gsc-opportunity-analyzer
```

Then run the packaged CLI:

```bash
npx gsc-opportunity current-queries.csv \
  --previous previous-queries.csv \
  --pages current-pages.csv \
  --format markdown \
  --output gsc-opportunities.md
```

The analysis API is also available to ESM projects and includes TypeScript declarations:

```js
import { analyzeFiles } from "@demi-valerith/gsc-opportunity-analyzer";

const findings = await analyzeFiles({
  currentPath: "current-queries.csv",
  previousPath: "previous-queries.csv",
});
```

Run directly from GitHub without installing:

```bash
npx github:demi-valerith/gsc-opportunity-analyzer current-queries.csv \
  --previous previous-queries.csv \
  --pages current-pages.csv \
  --format markdown \
  --output gsc-opportunities.md
```

Or clone the repository and run:

```bash
node bin/gsc-opportunity.mjs test/fixtures/current.csv \
  --previous test/fixtures/previous.csv \
  --pages test/fixtures/pages.csv \
  --minimum 20 \
  --range 8-20 \
  --format json
```

Use `--help` for the complete option list. Without `--output`, the result is written to standard output. This makes it straightforward to pipe JSON or CSV into another local workflow.

## Input contract

Export the Search results Performance table from Google Search Console as CSV. The current Queries file is required; the prior Queries and current Pages files are optional.

Supported English headers:

- Query: `Top queries`, `Query`, or `Queries`
- Page: `Top pages`, `Page`, or `Pages`
- Metrics: `Clicks`, `Impressions`, `CTR`, and `Position` or `Average position`

Use complete, equal-length periods with identical search type, country, device, query, and page filters. Separate Queries and Pages exports do not contain a query-to-page relationship, so the analyzer never invents one.

## Transparent rules

Rules version: `1.0.0`.

| Finding | Rule |
|---|---|
| Striking distance | Minimum impressions and average position inside the selected range, default 8-20 |
| CTR gap | Position 10 or better, at least 50 impressions, and CTR below 70% of the uploaded property's pooled position-band baseline |
| Rising | Impressions increased at least 30% and by at least 20 versus the prior period, with current position 40 or better |
| Decay | Clicks fell at least 30% with five lost clicks, or impressions fell at least 40% with 50 lost impressions |
| Page opportunity | Page has at least 50 impressions and average position 20 or better |

Priority is a deterministic logarithmic impression score plus a fixed rule bonus. Confidence reflects sample strength and comparison availability. Neither value is a forecast or causal conclusion.

## Development

```bash
npm test
npm run check
```

The test fixtures are original synthetic data. The analyzer has no runtime dependencies and makes no network requests.

## License

Code is available under the [MIT License](LICENSE).
