🏗️ K&L Recycling CRM: System Blueprint & Architecture
1. Project Mission
Objective: To architect and maintain a production-grade, Google Apps Script-based CRM for K&L Recycling that automates prospect management, outreach tracking, and account conversion. Key Goals:

Data Integrity: Enforce strict schema validation across all sheets (Prospects, Outreach, Accounts).

Performance: Eliminate execution timeouts using batch operations (getValues/setValues) and efficient caching.

Automation: Automate "Account Won" migration, prospect scoring, and daily maintenance workflows.

User Experience: Provide a responsive UI via CRM_Suite.html and dashboard.html.

2. System Architecture
The system follows a Service-Oriented Architecture (SOA) within Google Apps Script, organized into four distinct tiers to separate concerns and ensure modularity.

🏛️ Tier 1: Core Engine (The Foundation)
Role: Provides low-level utilities, configuration, and data access methods used by all other modules.

Key Files:

Config.js: Centralized configuration (Sheet names, Column mappings, Global constants).

SharedUtils.js: Universal utilities (Date formatting, ID generation, Spreadsheet access checks).

DataHelpers.js: Safe sheet interaction methods (getSafeSheetData, updateCellSafe) that handle locks and boundaries.

ErrorHandling.js: Centralized error logging and alert system.

⚙️ Tier 2: Business Services (The Logic)
Role: Implements specific business rules for different CRM entities.

Key Files:

ProspectFunctions.js: Manages prospect creation, updates, and "Last Touch" logic.

OutreachFunctions.js: Handles logging visits/calls, "Next Visit" calculations, and history retrieval.

AccountFunction.js: Manages the "Account Won" lifecycle, migrating data from Prospects -> Accounts.

ProspectScoringService.js: Calculates "Priority Score" and "Urgency Score" based on recency and industry.

🔄 Tier 3: Workflow & Automation (The Glue)
Role: Orchestrates processes that span multiple services or run on triggers.

Key Files:

WorkflowAutomationService.js: Handles daily triggers, form submissions, and maintenance tasks.

OutreachSyncFunctions.js / Sync.js: Ensures Outreach log entries correctly update the Prospects master list.

AlertingService.js: Sends email/system notifications for critical errors or "Account Won" events.

🖥️ Tier 4: User Interface (The Frontend)
Role: Provides interactive tools for users to interact with the CRM data.

Key Files:

CRM_Suite.html / dashboard.html: Main web app interfaces.

DashboardBackend.js: Server-side handlers for the HTML frontend.

MenuFunctions.js: Custom Google Sheets menu items (K&L CRM).

3. Critical Logic Flows
🟢 Flow A: Outreach Logging & Sync
Goal: When a rep logs a visit, update the Prospect's status and schedule the next step.

Input: User logs a visit via Sidebar/Dashboard or Outreach Sheet.

Validation: BusinessValidation.js checks for required fields (Company, Outcome, Date).

Processing:

OutreachFunctions.js generates a unique LID (Log ID).

Calculates Next Visit Date based on Outcome (e.g., "Interested" = +7 days).

Sync: OutreachSyncFunctions.js triggers:

Updates Prospects sheet: Last Outreach Date, Last Outcome, Contact Status.

Recalculates Priority Score.

🔵 Flow B: Account Conversion (The "Won" Cycle)
Goal: Automatically migrate a "Won" prospect to the Active Accounts list.

Trigger: Outreach entry logged with Outcome = "Account Won".

Detection: WorkflowAutomationService.js detects the "Won" flag.

Action: AccountFunction.js executes processNewAccount:

Validates all required Account fields (Service Type, Container Size, Pricing).

Moves data to Accounts sheet.

Updates Prospects status to "Won".

Sends email alert via AlertingService.js.

🟠 Flow C: Daily Maintenance
Goal: Keep data fresh and identify stale leads.

Trigger: Time-based trigger (e.g., 6:00 AM).

Action: WorkflowAutomationService.js runs:

checkStaleProspects(): Flags prospects with no contact > 60 days.

updateDashboardStats(): Caches daily KPIs for the UI.

ValidationUtils.validateSchema(): Checks if sheet columns match Config.gs.

4. Current State & Action Plan
Based on the CRM_BLUEPRINT_REPORT.txt and CRM_FULL_REPORT.txt analysis.

🚨 Immediate Priorities (The "To-Fix" List)
Critical Bug - _rowIndex Injection:

Issue: SharedUtils.getSafeSheetData creates objects with a _rowIndex property that is manually injected, causing alignment issues if rows move.

Fix: Implement a robust ID-based lookup or strict lock handling during updates.

Performance - Batch Operations:

Issue: 41 detected instances of reading/writing inside loops (Anti-pattern).

Fix: Refactor OutreachSyncFunctions.js and Normalization.js to use batch getValues() and setValues().

Error Handling:

Issue: 8 critical files lack try/catch blocks.

Fix: Wrap all entry points in ErrorHandling.handleError() or withErrorHandling().

Schema Alignment:

Issue: Discrepancies between Config.HEADERS and actual Sheet headers.

Fix: Run ColumnMapper.js validation to ensure code matches the physical sheet layout.

5. Technical Standards & Rules
As K&L CRM Operations Analyst, I enforce the following:

No "Magic Strings": All column names and sheet names must be referenced via CONFIG object.

Bad: sheet.getRange("A1").setValue("Active")

Good: sheet.getRange(CONFIG.COLS.STATUS).setValue(CONFIG.STATUS.ACTIVE)

Batch-First: No SpreadsheetApp calls inside for loops.

Safe Date Handling: Always use SharedUtils.parseDate() and SharedUtils.formatDate() to prevent timezone drift between Script (CST) and Sheet.

Explicit Returns: Every function must return a standard result object: { success: boolean, data: any, error: string }.