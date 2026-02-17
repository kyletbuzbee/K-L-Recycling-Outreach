 ## 1. Project Overview                                                                            │
│  6                                                                                                   │
│  7 This is a production-grade, Google Apps Script-based CRM for K&L Recycling. Its primary purpose   │
│    is to automate and manage prospect management, outreach tracking, and account conversion.         │
│  8                                                                                                   │
│  9 **Key Technologies:**                                                                             │
│ 10 *   **Backend:** Google Apps Script (V8 Runtime)                                                  │
│ 11 *   **Frontend:** HTML Service (within Google Apps Script)                                        │
│ 12 *   **Database:** Google Sheets                                                                   │
│ 13 *   **Tooling:** Node.js for testing, `clasp` for command-line deployment.                        │
│ 14                                                                                                   │
│ 15 **Architecture:**                                                                                 │
│ 16 The system uses a 4-tier Service-Oriented Architecture (SOA) to ensure modularity and separation  │
│    of concerns:                                                                                      │
│ 17 *   **Tier 1: Core Engine:** Low-level utilities, configuration, and data access (`Config.js`,    │
│    `SharedUtils.js`).                                                                                │
│ 18 *   **Tier 2: Business Services:** Implements business rules for CRM entities                     │
│    (`ProspectFunctions.js`, `OutreachFunctions.js`).                                                 │
│ 19 *   **Tier 3: Workflow & Automation:** Orchestrates processes and timed triggers                  │
│    (`WorkflowAutomationService.js`, `Sync.js`).                                                      │
│ 20 *   **Tier 4: User Interface:** Frontend for user interaction (`CRM_Suite.html`,                  │
│    `DashboardBackend.js`).                                                                           │
│ 21                                                                                                   │
│ 22 ## 2. Building and Running                                                                        │
│ 23                                                                                                   │
│ 24 ### Deployment                                                                                    │
│ 25                                                                                                   │
│ 26 This is a Google Apps Script project. Deployment is handled via `clasp`, the command-line         │
│    interface for Apps Script.                                                                        │
│ 27                                                                                                   │
│ 28 *   **Push Code:** `clasp push`                                                                   │
│ 29     *   This command uploads the local project files to the linked Google Apps Script project.    │
│ 30 *   **Open Project:** `clasp open`                                                                │
│ 31     *   This opens the Google Apps Script project in the browser.                                 │
│ 32                                                                                                   │
│ 33 ### Testing                                                                                       │
│ 34                                                                                                   │
│ 35 The project includes a simple test runner using Node.js.                                          │
│ 36                                                                                                   │
│ 37 *   **Run Tests:** `npm test`                                                                     │
│ 38     *   This command executes the `run_tests.js` script, which may open a browser-based testing   │
│    interface.                                                                                        │
│ 39                                                                                                   │
│ 40 ## 3. Development Conventions                                                                     │
│ 41                                                                                                   │
│ 42 Adherence to the existing conventions is critical for maintaining the stability and integrity of  │
│    the CRM.                                                                                          │
│ 43                                                                                                   │
│ 44 ### Core Principles:                                                                              │
│ 45 *   **Config-First:** Always use the `CONFIG` object from `Config.js` for sheet names and column  │
│    headers. **Do not use "magic strings" or hardcoded values.**                                      │
│ 46 *   **Batch Operations:** To avoid Google Apps Script execution timeouts, all spreadsheet I/O     │
│    must be done in batches. **Do not call `getValue` or `setValue` inside loops.**                   │
│ 47 *   **Safe Data Handling:**                                                                       │
│ 48     *   Use `SharedUtils.getSafeSheetData()` for reading data to ensure consistency.              │
│ 49     *   Use `SharedUtils.parseDate()` and `SharedUtils.formatDate()` for all date manipulations   │
│    to prevent timezone issues.                                                                       │
│ 50 *   **Standardized Returns:** All functions should return a standard object: `{ success: boolean, │
│    data: any, error: string }`.                                                                      │
│ 51 *   **ID-Based Lookups:** Rely on primary keys (`Company ID`, `Outreach ID`) for identifying and  │
│    modifying records. Avoid relying on row indexes, as they are not stable.                          │
│ 52                                                                                                   │
│ 53 ### Schema and Data Model                                                                         │
│ 54 *   The master schema is defined in `system-schema.json`.                                         │
│ 55 *   Sheet names and column headers are defined in `Config.js`. These must be kept in sync with    │
│    the physical Google Sheets and the schema file.                                                   │
│ 56 *   The `SchemaNormalizer.js` utility is used to create a canonical mapping between different     │
│    naming conventions (e.g., `Company Name` vs. `companyName`).                                      │
│ 57                                                                                                   │
│ 58 ### Critical Logic Flows                                                                          │
│ 59 *   **Outreach Sync:** New entries in the 'Outreach' sheet trigger updates to the corresponding   │
│    'Prospects' record.                                                                               │
│ 60 *   **Account Conversion:** An "Account Won" outcome triggers a workflow that migrates a          │
│    prospect's data to the 'Accounts' sheet.                                                          │
│ 61 *   **Daily Maintenance:** A time-based trigger runs daily to identify stale prospects and        │
│    perform other cleanup tasks.            