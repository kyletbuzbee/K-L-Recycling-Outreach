# Cline Rules for K&L CRM Development

## Naming Conventions
- Always use **Title Case** for sheet headers as per the Schema (e.g., `Company Name`, NOT `company_name`).
- Use the `CONFIG.HEADERS` object in `config.gs` for all column indexing. Do not use hardcoded index numbers (e.g., `data[i][5]`).

## Sheet Operations
- **Prospects Update**: Triggered by any new row in `Outreach`.
- **Account Transition**: When `Outcome == 'Account Won'`, logic must trigger a copy of data to the `Accounts` sheet using field mapping (Contact Name, Phone, Role).
- **Stale Check**: Respect the `Stale_Prospect_Days` global constant (60).

## Formula Injection
- If a formula is being written to a cell via script, use the `LET` or `XLOOKUP` syntax provided in the Master Formula TSV.
- Always use `searchMode: -1` in script-based lookups.

## Proactive Alerts
- Alert the user if a Prospect exceeds 60 days without contact.
- Alert the user if `Company ID` is missing during a log entry.