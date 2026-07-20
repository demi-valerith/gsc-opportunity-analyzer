# Security and data handling

GSC Opportunity Analyzer reads local file paths and writes a local result. It has no runtime dependencies and makes no network requests.

Search queries and page URLs can contain confidential business information. Prefer private repositories, do not print raw exports in workflow logs, and set an appropriate artifact retention period. The GitHub Action logs only its finding count and output path.

Report a vulnerability privately through GitHub's security advisory form for this repository. Do not place private Search Console exports in a public issue.
