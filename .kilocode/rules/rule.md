# rule.md

# KiloCoder CRM Alignment Rules
- DO NOT hardcode validation lists; pull from `Settings!VALIDATION_LIST`.
- DO NOT update Prospects without checking for `Company ID` consistency.
- DO NOT use lowercase names for columns; use Title Case as per Schema.
- ALWAYS calculate `Totals` as: `(Priority Score * 0.6) + (Urgency Score * 0.4)`.
