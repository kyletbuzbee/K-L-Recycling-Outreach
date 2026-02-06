# kl-crm-rule.md

## Guidelines

# K&L Recycling CRM - System Source of Truth

## 1. Core Sheets & Primary Keys
- **Outreach**: Activity Log. Primary Key: `Outreach ID`. Foreign Key: `Company ID`.
- **Prospects**: Master Lead List. Primary Key: `Company ID`.
- **Settings**: Logic Engine. Key/Value store for scores and workflow rules.

## 2. Dynamic Workflow Rules (Settings Driven)
The system MUST read from `Settings.csv` for the following logic:
- **Follow-up Intervals**: Use `WORKFLOW_RULE -> Value_3` (Days offset).
- **Stage Transitions**:
    - `Initial Contact` results in Stage: `Outreach`.
    - `Account Won` results in Stage: `Won` and Status: `Active`.
- **Priority Scoring**: 
    - Base Score = `INDUSTRY_SCORE -> Value_1`.
    - Penalty: Apply a `0.3x` multiplier if `Days Since Last Contact` > `GLOBAL_CONST -> Stale_Prospect_Days` (60).

## 3. Mandatory Formula Logic
When generating or repairing spreadsheet formulas:
- **Latest Entry First**: Always use `XLOOKUP` with `search_mode: -1` when pulling activity from Outreach into Prospects.
- **Urgency Logic**:
    - < 0 Days: Overdue (Urgency Score: 150)
    - 0-7 Days: High (Urgency Score: 115)
    - 8-30 Days: Medium (Urgency Score: 75)
    - > 30 Days: Low (Urgency Score: 25)

## 4. Header Preservation
Refer strictly to `CONFIG.HEADERS` in `config.gs`. Never use hardcoded column indices (e.g., `row[4]`). Always use `headers.indexOf(CONFIG.HEADERS.PROSPECTS[4])`.
