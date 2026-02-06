# system_schema.md

# K&L Recycling CRM - System Architecture Rules

## 1. Source of Truth
- **Settings Sheet** is the Engine. Never hardcode days, scores, or status names. Always use `getSettings()` or `getGlobalConstant()`.
- **System Schema** is the Chassis. All column references must use the API_Name defined in the schema.

## 2. Logic Constraints
- **Search Mode**: All `XLOOKUP` equivalents in scripts must search from the bottom (last entry first) to ensure the most recent activity is captured.
- **Outcome -> Status Mapping**: 
    - "Account Won" MUST result in Status: "Active" and Stage: "Won".
    - "Initial Contact" MUST result in Stage: "Outreach".
- **Date Math**: Use `Value_3` from `WORKFLOW_RULE` as the day offset for follow-ups. Default to 14 days if not found.

## 3. Calculation Weights
- **Priority Score**: (Industry Score [Value_1]) * (0.3 if Days Since Contact > 60, else 1.0).
- **Totals**: (Priority Score * 0.6) + (Urgency Score * 0.4).

## 4. Write-Back Protocol
- When updating `Prospects` from `Outreach`, the following columns MUST be updated: `Last Outcome`, `Last Outreach Date`, `Contact Status`, `Next Steps Due Date`, and `Urgency Score`.


