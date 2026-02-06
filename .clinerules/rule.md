# Cline CRM Development Constraints
- **File Access**: Always read `config.gs` first to determine sheet names and header structures.
- **Workflow**: When an "Account Won" outcome is detected, verify the data migration function maps `Contact Name` and `Contact Phone` from `Contacts.csv` to the `Accounts` sheet.
- **Validation**: Every new `Outreach` log must validate that the `Outcome` exists in `Settings!VALIDATION_LIST!Outcomes`.
- **Safety**: Ensure `LockService` is used during any `writeBack` operation to prevent data collisions.