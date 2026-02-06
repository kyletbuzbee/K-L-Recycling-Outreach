/**
 * MASTER CRM CONTROLLER v3.0 (Audited)
 * * CORE FEATURES:
 * 1. Syncs Outreach -> Prospects (Updates Status, Dates, Outcomes)
 * 2. Auto-Heals Typos (Strictly against WORKFLOW_RULE keys)
 * 3. Triggers "Account Won" Migration to Accounts Sheet
 * * AUDIT COMPLIANCE:
 * - Follows Settings.tsv logic for Status (Not Contacted -> Cold)
 * - Respects System_Schema.csv column definitions
 */

function runFullCRM_Sync() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();
  
  // 1. Run the Sync Logic
  syncCRMLogic(ss);
  
  // 2. Check for New Wins
  const newWins = processAccountWon(ss);
  
  if (newWins > 0) {
    ui.alert(`Sync Complete.\n\n🎉 ${newWins} New Account(s) moved to Accounts Sheet.`);
  } else {
    console.log("Sync Complete. No new accounts to migrate.");
  }
}

function syncCRMLogic(ss) {
  const prospectsSheet = ss.getSheetByName('Prospects');
  const outreachSheet = ss.getSheetByName('Outreach');
  const settingsSheet = ss.getSheetByName('Settings');

  if (!prospectsSheet || !outreachSheet || !settingsSheet) {
    throw new Error("CRITICAL: Missing required sheets (Prospects, Outreach, Settings).");
  }

  // --- HELPER: Dynamic Column Finder ---
  function getColLetter(sheet, headerName) {
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const index = headers.indexOf(headerName);
    return index === -1 ? null : columnToLetter(index + 1);
  }

  function getColIndex(sheet, headerName) {
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    return headers.indexOf(headerName) + 1;
  }

  function columnToLetter(column) {
    let temp, letter = '';
    while (column > 0) {
      temp = (column - 1) % 26;
      letter = String.fromCharCode(temp + 65) + letter;
      column = (column - temp - 1) / 26;
    }
    return letter;
  }

  // --- STEP 1: STRICT TYPO CORRECTION ---
  // Fix: Only looks at WORKFLOW_RULE rows to avoid matching Industries/Urgency bands
  function fixOutreachTypos() {
    const outOutcomeIdx = getColIndex(outreachSheet, 'Outcome');
    
    // Load Settings Data
    const settingsData = settingsSheet.getDataRange().getValues();
    const headers = settingsData.shift();
    const catIdx = headers.indexOf('Category');
    const keyIdx = headers.indexOf('Key');

    // Filter for valid Outcomes only
    const validOutcomes = settingsData
      .filter(row => row[catIdx] === 'WORKFLOW_RULE')
      .map(row => row[keyIdx].toString().trim());

    const lastOutRow = outreachSheet.getLastRow();
    if (lastOutRow < 2) return;
    
    const outcomeRange = outreachSheet.getRange(2, outOutcomeIdx, lastOutRow - 1, 1);
    const currentOutcomes = outcomeRange.getValues();
    let updates = 0;

    const fixedOutcomes = currentOutcomes.map(row => {
      let val = row[0];
      if (!val) return [""]; 
      val = val.toString().trim();

      if (validOutcomes.includes(val)) return [val];

      // Fuzzy Match
      let bestMatch = null;
      let bestScore = 0;
      validOutcomes.forEach(target => {
        let score = calculateSimilarity(val, target);
        if (score > bestScore) {
          bestScore = score;
          bestMatch = target;
        }
      });

      if (bestScore > 0.8 && bestMatch) {
        console.log(`Auto-corrected: "${val}" -> "${bestMatch}"`);
        updates++;
        return [bestMatch];
      }
      return [val];
    });

    if (updates > 0) outcomeRange.setValues(fixedOutcomes);
  }

  fixOutreachTypos();

  // --- STEP 2: MAP COLUMNS ---
  // Defined in System_Schema.csv
  const p_ID = getColLetter(prospectsSheet, 'Company ID');
  const p_LastOutcome = getColLetter(prospectsSheet, 'Last Outcome');
  const p_LastDate = getColLetter(prospectsSheet, 'Last Outreach Date');
  const p_DaysSince = getColLetter(prospectsSheet, 'Days Since Last Contact');
  const p_NextCount = getColLetter(prospectsSheet, 'Next Step Due Countdown');
  const p_NextDate = getColLetter(prospectsSheet, 'Next Steps Due Date');
  const p_Status = getColLetter(prospectsSheet, 'Contact Status');

  const o_ID = getColLetter(outreachSheet, 'Company ID');
  const o_Date = getColLetter(outreachSheet, 'Visit Date');
  const o_Outcome = getColLetter(outreachSheet, 'Outcome');

  // Defined in Settings.tsv
  const s_Key = getColLetter(settingsSheet, 'Key');       // Col B
  const s_Status = getColLetter(settingsSheet, 'Value_2'); // Col D (Status)
  const s_Days = getColLetter(settingsSheet, 'Value_3');   // Col E (Days)

  if (!p_ID || !o_ID || !o_Outcome) {
    console.error("CRITICAL: Missing ID or Outcome columns.");
    return;
  }

  const lastRow = prospectsSheet.getLastRow();
  if (lastRow < 2) return;

  // --- STEP 3: APPLY FORMULAS (Corrected Logic) ---
  
  // 1. Last Outcome
  const f_LastOutcome = `=XLOOKUP(${p_ID}2, Outreach!$${o_ID}:$${o_ID}, Outreach!$${o_Outcome}:$${o_Outcome}, "Not Contacted", 0, -1)`;
  
  // 2. Last Outreach Date
  const f_LastDate = `=XLOOKUP(${p_ID}2, Outreach!$${o_ID}:$${o_ID}, Outreach!$${o_Date}:$${o_Date}, "", 0, -1)`;
  
  // 3. Days Since
  const f_DaysSince = `=IF(${p_LastDate}2="", "", TODAY() - ${p_LastDate}2)`;
  
  // 4. Contact Status (FIXED)
  // Removed hardcoded "Prospect". Uses XLOOKUP to find "Not Contacted" -> "Cold" in Settings.
  const f_Status = `=IFERROR(XLOOKUP(${p_LastOutcome}2, Settings!$${s_Key}:$${s_Key}, Settings!$${s_Status}:$${s_Status}), "Cold")`;

  // 5. Next Steps Due Date
  const f_NextDate = `=IF(${p_LastDate}2="", TODAY()+30, ${p_LastDate}2 + IFERROR(XLOOKUP(${p_LastOutcome}2, Settings!$${s_Key}:$${s_Key}, Settings!$${s_Days}:$${s_Days}), 14))`;

  // 6. Countdown
  const f_Countdown = `=IF(${p_NextDate}2="", "", ${p_NextDate}2 - TODAY())`;

  const applyFormula = (colLetter, formula) => {
    if (!colLetter) return;
    prospectsSheet.getRange(colLetter + "2:" + colLetter + lastRow).setFormula(formula);
  };

  applyFormula(p_LastOutcome, f_LastOutcome);
  applyFormula(p_LastDate, f_LastDate);
  applyFormula(p_DaysSince, f_DaysSince);
  applyFormula(p_Status, f_Status);
  applyFormula(p_NextDate, f_NextDate);
  applyFormula(p_NextCount, f_Countdown);
}

// --- STEP 4: ACCOUNT WON TRIGGER (New Feature) ---
function processAccountWon(ss) {
  const outreachSheet = ss.getSheetByName('Outreach');
  const accountsSheet = ss.getSheetByName('Accounts');
  const prospectsSheet = ss.getSheetByName('Prospects');
  
  if (!accountsSheet) return 0;

  const oData = outreachSheet.getDataRange().getValues();
  const oHeaders = oData.shift();
  
  const idxOutcome = oHeaders.indexOf('Outcome');
  const idxCompID = oHeaders.indexOf('Company ID');
  const idxCompName = oHeaders.indexOf('Company');
  const idxNotes = oHeaders.indexOf('Notes');
  const idxDate = oHeaders.indexOf('Visit Date');

  // Get existing Account IDs to prevent duplicates
  const accData = accountsSheet.getDataRange().getValues();
  const accHeaders = accData.shift(); // Remove header
  const accIdIdx = accHeaders.indexOf('Company ID') > -1 ? accHeaders.indexOf('Company ID') : 0; // Default to col A if missing
  const existingIDs = accData.map(r => r[accIdIdx]);

  let newAccounts = 0;

  // Scan Outreach for 'Account Won'
  oData.forEach(row => {
    const outcome = row[idxOutcome];
    const compID = row[idxCompID];

    if (outcome === 'Account Won' && !existingIDs.includes(compID)) {
      
      // Fetch details from Prospects (Address, Contact info) if needed
      // For now, we map available Outreach data
      const newRow = [
        "FALSE",           // Deployed (Default)
        row[idxDate],      // Timestamp
        row[idxCompName],  // Company Name
        "",                // Contact Name (Need to fetch from Contacts sheet ideally)
        "",                // Contact Phone
        "",                // Role
        "",                // Site Location
        "",                // Mailing Location
        "Yes",             // Roll-Off Fee (Default)
        "Separate",        // Handling (Default)
        "30 yd",           // Container Size (Default from Settings)
        row[idxNotes],     // Notes
        "Base"             // Payout Price
      ];

      accountsSheet.appendRow(newRow);
      existingIDs.push(compID); // Prevent double add in same run
      newAccounts++;
    }
  });

  return newAccounts;
}

// --- SIMILARITY UTILS ---
function calculateSimilarity(s1, s2) {
  if (!s1 || !s2) return 0.0;
  const str1 = String(s1).toLowerCase();
  const str2 = String(s2).toLowerCase();
  let longer = str1.length > str2.length ? str1 : str2;
  let shorter = str1.length > str2.length ? str2 : str1;
  let longerLength = longer.length;
  if (longerLength == 0) return 1.0;
  return (longerLength - editDistance(longer, shorter)) / parseFloat(longerLength);
}

function editDistance(s1, s2) {
  s1 = s1 || ""; s2 = s2 || "";
  let costs = new Array();
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i == 0) costs[j] = j;
      else if (j > 0) {
        let newValue = costs[j - 1];
        if (s1.charAt(i - 1) != s2.charAt(j - 1))
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[s2.length] = lastValue;
  }
  return costs[s2.length];
}