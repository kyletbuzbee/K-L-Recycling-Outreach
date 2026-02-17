# K&L Recycling CRM - Copilot Instructions

## Project Overview

Production-grade Google Apps Script CRM for K&L Recycling. Manages prospect tracking, outreach activity, and account conversion using Google Sheets as the database.

**Tech Stack:**
- Backend: Google Apps Script (V8 Runtime)
- Frontend: HTML Service
- Database: Google Sheets
- Deployment: `clasp` (Google Apps Script CLI)
- Testing: Node.js (browser-based test runner)

## Build, Test, and Deploy

### Deployment
```bash
# Push local code to Google Apps Script
clasp push

# Open the Apps Script project in browser
clasp open
```

### Testing
```bash
# Run all tests (opens browser-based test runner)
npm test

# Alternative command
npm run test:browser
```

**Note:** Tests run in a browser environment that loads the Apps Script code. There is no single-test runner - all tests run together in the browser interface.

## Architecture: 4-Tier Service-Oriented

The codebase follows a strict layered architecture. Changes must respect these boundaries:

### Tier 1: Core Engine
Low-level utilities and configuration. Changes here affect the entire system.
- `Config.js` - Centralized constants for sheet names and column headers
- `SharedUtils.js` - Safe data access, date handling, schema integration
- `SchemaNormalizer.js` - Canonical field name mappings

### Tier 2: Business Services
Entity-specific business logic. Each module is self-contained.
- `ProspectFunctions.js` - Prospect CRUD operations and search
- `OutreachFunctions.js` - Outreach activity tracking
- `AccountFunction.js` - Account conversion and management
- `BusinessValidation.js` - Entity validation rules

### Tier 3: Workflow & Automation
Orchestration layer that coordinates business services.
- `WorkflowAutomationService.js` - Multi-step workflows
- `Sync.js` - Outreach → Prospects synchronization
- `OutreachSyncFunctions.js` - Outreach data sync logic

### Tier 4: User Interface
Frontend components and server-side rendering.
- `CRM_Suite.html` - Main CRM interface
- `dashboard.html` - Analytics dashboard
- `DashboardBackend.js` - Server-side data preparation
- `WebApp.gs` - Web app entry point

## Critical Development Conventions

### 1. Config-First: Never Hardcode Sheet Names or Columns

**Always use `CONFIG` object:**
```javascript
// ❌ WRONG - Hardcoded values
var sheet = ss.getSheetByName('Prospects');
var companyCol = headers.indexOf('Company Name');

// ✅ CORRECT - Use CONFIG
var sheet = ss.getSheetByName(CONFIG.SHEETS.PROSPECTS);
var companyCol = headers.indexOf(CONFIG.HEADERS.PROSPECTS[4]); // 'Company Name'
```

### 2. Batch Operations: Prevent Script Timeouts

Google Apps Script has execution time limits. All spreadsheet I/O must be batched.

**Never call `getValue`/`setValue` in loops:**
```javascript
// ❌ WRONG - Individual calls in loop (slow, times out)
for (var i = 0; i < rows.length; i++) {
  sheet.getRange(i+1, 1).setValue(rows[i]);
}

// ✅ CORRECT - Single batch operation
sheet.getRange(1, 1, rows.length, 1).setValues(rows);
```

**Use `SharedUtils.getSafeSheetData()` for reads:**
```javascript
// ✅ CORRECT - Batch read with locking
var data = SharedUtils.getSafeSheetData(CONFIG.SHEETS.PROSPECTS);
```

**Use `BatchProcessor` for writes when available:**
```javascript
// ✅ BEST - Use BatchProcessor infrastructure
var bp = getBatchProcessor();
if (bp && bp.appendRows) {
  bp.appendRows(CONFIG.SHEETS.OUTREACH, rowsArray);
} else {
  // Fallback to manual batch
  sheet.getRange(startRow, 1, rows.length, rows[0].length).setValues(rows);
}
```

### 3. Safe Data Handling

**Always use `SharedUtils` for data operations:**
```javascript
// Date handling (timezone-safe)
var date = SharedUtils.parseDate(dateString);
var formatted = SharedUtils.formatDate(dateObject);

// Header normalization (handles case/whitespace variations)
var canonical = SharedUtils.getCanonicalFieldName('Company Name', 'PROSPECTS');
var headerMap = SharedUtils.buildHeaderMap(headers, 'PROSPECTS');
```

### 4. Standardized Return Objects

All functions must return this format:
```javascript
return {
  success: boolean,
  data: any,           // Result data on success
  error: string        // Error message on failure
};
```

### 5. ID-Based Lookups (Not Row Numbers)

Row indexes change when users sort/filter. Always use primary keys.

**Use IDs for updates:**
```javascript
// ❌ WRONG - Row index is unstable
sheet.getRange(rowIndex, 1).setValue(newValue);

// ✅ CORRECT - Find by Company ID
var data = SharedUtils.getSafeSheetData(CONFIG.SHEETS.PROSPECTS);
var targetRow = data.findIndex(row => row[companyIdCol] === companyId);
```

## Schema and Data Model

### Master Schema
- Source of truth: `system-schema.json`
- Config mapping: `CONFIG.HEADERS` in `Config.js`
- Normalizer: `SchemaNormalizer.js` provides canonical field names

### Primary Keys
- **Prospects**: `Company ID`
- **Outreach**: `Outreach ID` (foreign key: `Company ID`)
- **Accounts**: `Company Name` (legacy, not fully normalized)

### Field Name Normalization
The system supports multiple naming conventions:
- Display names: "Company Name", "Last Outreach Date"
- API names: "companyName", "lastOutreachDate"
- Normalized: "company name", "last outreach date"

Use `SchemaNormalizer.getCanonicalName()` to convert between formats.

## Critical Logic Flows

### Outreach → Prospects Sync
When a new outreach activity is logged:
1. `OutreachSyncFunctions` triggers on new row
2. Finds matching prospect by `Company ID`
3. Updates prospect fields: `Last Outcome`, `Last Outreach Date`, `Contact Status`
4. Recalculates urgency scores and follow-up dates

### Account Conversion Workflow
When outreach outcome = "Account Won":
1. Triggers `WorkflowAutomationService.handleAccountWon()`
2. Migrates prospect data to `Accounts` sheet
3. Updates prospect status to "Won"
4. Sets stage to "Won" and status to "Active"

### Daily Maintenance (Stale Prospects)
Time-based trigger runs daily:
1. Identifies prospects with `Days Since Last Contact > 60`
2. Applies 0.3x penalty multiplier to `Priority Score`
3. Updates `Urgency Band` based on countdown values

## Infrastructure Components

The codebase includes six infrastructure utilities. Always use safe access patterns with fallbacks:

### ErrorBoundary.js
```javascript
function getErrorBoundary() {
  try {
    return typeof ErrorBoundary !== 'undefined' ? ErrorBoundary : null;
  } catch (e) { return null; }
}

// Usage
var eb = getErrorBoundary();
if (eb && eb.handleError) {
  return eb.handleError(error, context);
}
```

### LoggerInjector.js
```javascript
var logger = getLoggerInjector();
if (logger && logger.logFunctionEntry) {
  logger.logFunctionEntry('functionName', { context });
}
```

### SchemaNormalizer.js
```javascript
var canonicalName = SharedUtils.getCanonicalFieldName('Company Name', 'PROSPECTS');
var headerMap = SharedUtils.buildHeaderMap(headers, 'PROSPECTS');
```

### BatchProcessor.js
```javascript
var bp = getBatchProcessor();
if (bp && bp.appendRows) {
  bp.appendRows(sheetName, rowsArray);
}
```

### HtmlSafeRenderer.js (Frontend Security)
```javascript
// Always escape user input in HTML
element.textContent = userInput; // Preferred for text
// OR
var safe = HtmlSafeRenderer.escapeHtml(userInput);
element.innerHTML = '<div>' + safe + '</div>';
```

## Settings-Driven Logic

The `Settings` sheet acts as a configuration database. Never hardcode workflow rules.

**Read from Settings for:**
- Follow-up intervals: `WORKFLOW_RULE -> Value_3` (days offset)
- Industry scoring: `INDUSTRY_SCORE -> Value_1` (base score)
- Global constants: `GLOBAL_CONST -> Stale_Prospect_Days` (60 days)

## Common Pitfalls to Avoid

1. **Magic Strings**: Use `CONFIG.SHEETS.*` and `CONFIG.HEADERS.*`, never hardcoded strings
2. **Loop I/O**: Never call `getRange().getValue()` or `setValue()` inside loops
3. **Row Index Dependencies**: Always use ID-based lookups, never assume row stability
4. **Direct `innerHTML`**: Use `textContent` or `HtmlSafeRenderer.escapeHtml()` to prevent XSS
5. **Timezone Issues**: Use `SharedUtils.parseDate()` and `formatDate()` for all date operations
6. **Missing Fallbacks**: Infrastructure components may not load; always check availability

## File Organization

- `*.js` - Backend Google Apps Script files
- `*.html` - Frontend HTML Service files
- `*.csv` - Sample data and schema exports
- `system-schema.json` - Master schema definition
- `.clinerules/`, `.kilocode/` - AI assistant configurations (legacy)
- `scripts/` - Utility scripts
- `plans/` - Implementation planning documents
