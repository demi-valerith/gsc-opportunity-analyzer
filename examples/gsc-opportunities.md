# GSC opportunity analysis

This example is generated from the synthetic files in `test/fixtures`. Run the CLI to reproduce the complete ledger:

```bash
node bin/gsc-opportunity.mjs test/fixtures/current.csv \
  --previous test/fixtures/previous.csv \
  --pages test/fixtures/pages.csv
```

The output separates observed evidence from the next verification step. It does not claim that any edit caused or will cause a ranking change.
