# K&L Recycling CRM - Schema Alignment Remaining Work

## Issue Analysis (Completed)

### 1. `getProspectDetails()` Wrong Sheet
**Problem**: The function in `OutreachFunctions.js` tries to fetch contact info (name, phone, email) from the Prospects sheet, but per the schema:
- Prospects sheet contains: `companyID`, `address`, `industry`, `contactStatus`, etc.
- Contacts sheet contains: `name`, `phone`, `email`, `company`, `role`, etc.

**Impact**: Contact autofill will fail or return empty data

### 2. `system-schema.json` Incomplete
**Problem**: The current file only includes 3 tables with partial fields:
- Missing full Prospects fields (latitude, longitude, priorityScore, urgencyScore, totals, etc.)
- Missing full Outreach fields (outreachID, daysSinceLastVisit, etc.)
- Missing full Accounts fields
- Missing Contacts table entirely

### 3. Missing `getContactDetails()` Function
**Problem**: No function to fetch contact information from the Contacts sheet by company name

---

## Plan to Complete Alignment

### Phase 1: Fix `getProspectDetails()` Contact Info Retrieval

1. **Modify `getProspectDetails()` to fetch from Contacts sheet**
   - Query Contacts sheet for matching company name
   - Return combined data (Prospects + Contacts)
   - Update function signature to accept company name instead of company ID

2. **Add `getContactDetails()` function**
   - Search Contacts sheet by company name
   - Return contact info (name, phone, email, role, department)

### Phase 2: Complete `system-schema.json`

1. **Add all Prospects fields**
   - companyID, address, zipCode, companyName
   - latitude, longitude, lastOutcome, lastOutreachDate
   - daysSinceLastContact, nextStepDueCountdown, nextStepsDueDate
   - closeProbability, priorityScore, urgencyScore, totals

2. **Add all Outreach fields**
   - outreachID, companyID, visitDate, outcomeCategory
   - daysSinceLastVisit, nextVisitCountdown
   - prospectsMatch, emailSent

3. **Add Contacts table**
   - name, company, accountType, role, department
   - phone, email, address

4. **Complete Accounts fields**
   - deployed, timestamp, contactName, contactPhone, contactRole
   - siteLocation, mailingLocation, rollOffFee, rolloutContainerSize

### Phase 3: Update Config.js with New Headers

Add any missing headers to CONFIG.HEADERS that correspond to the schema fields.

---

## Files to Modify

1. `OutreachFunctions.js` - Fix `getProspectDetails()` and add `getContactDetails()`
2. `system-schema.json` - Complete with all fields
3. `Config.js` - Add any missing CONFIG.HEADERS entries

---

## Current Alignment Status

| File | Status | Notes |
|------|--------|-------|
| OutreachFunctions.js | ✅ Complete | New autocomplete functions added |
| dashboard.html | ✅ Complete | Competitor dropdown and autocomplete UI |
| ProspectFunctions.js | ✅ Complete | Schema-aligned functions |
| PipelineService.js | ✅ Complete | Stage/status mapping |
| CRM_Suite.html | ✅ Complete | UI updates |
| system-schema.json | ⚠️ Partial | Needs complete field list |
| Config.js | ⚠️ Review | Verify all headers present |
