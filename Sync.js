/**
 * K&L Outreach Logic Sync
 * Automatically applies master formulas to Prospects and Outreach sheets.
 * Uses dynamic header lookup to avoid hardcoded column indices.
 */
function syncCRMLogic() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Sync Prospects Sheet
  const prospectSheet = ss.getSheetByName('Prospects');
  if (prospectSheet) {
    const lastRow = prospectSheet.getLastRow();
    if (lastRow > 1) {
      // Get headers for dynamic column lookup
      const headers = prospectSheet.getRange(1, 1, 1, prospectSheet.getLastColumn()).getValues()[0];
      
      const formulas = [
        ['=XLOOKUP(A2, Outreach!$B:$B, Outreach!$F:$F, "", 0, -1)', 'Last Outcome'],
        ['=XLOOKUP(A2, Outreach!$B:$B, Outreach!$D:$D, "", 0, -1)', 'Last Outreach Date'],
        ['=IF(I2="", "", TODAY() - I2)', 'Days Since Last Contact'],
        ['=L2 - TODAY()', 'Next Step Due Countdown'],
        ['=IF(I2="", TODAY()+14, I2 + IFERROR(XLOOKUP(H2, Settings!$B:$B, Settings!$E:$E), 14))', 'Next Steps Due Date'],
        ['=IFERROR(XLOOKUP(H2, Settings!$B:$B, Settings!$D:$D), "Prospect")', 'Contact Status'],
        ['=IFS(H2="Account Won", 1, H2="Interested (Hot)", 0.75, H2="Interested (Warm)", 0.4, OR(H2="Initial Contact", H2="Follow-Up"), 0.2, TRUE, 0)', 'Close Probability'],
        ['=LET(ind, E2, days, J2, stale, 60, base, IFERROR(XLOOKUP(ind, Settings!$B:$B, Settings!$C:$C), IFERROR(XLOOKUP("*"&ind&"*", Settings!$D:$D, Settings!$C:$C, 50, 2), 50)), mult, IF(days > stale, 0.3, 1), ROUND(base * mult))', 'Priority Score'],
        ['=IFS(K2 < 0, "Overdue", K2 <= 7, "High", K2 <= 30, "Medium", TRUE, "Low")', 'UrgencyBand'],
        ['=IFS(K2 < 0, 150, K2 <= 7, 115, K2 <= 30, 75, TRUE, 25)', 'Urgency Score'],
        ['=(O2 * 0.6) + (Q2 * 0.4)', 'Totals']
      ];
      
      // Apply and fill down using dynamic columns
      for (let i = 0; i < formulas.length; i++) {
        const colName = formulas[i][1];
        const colIndex = headers.indexOf(colName);
        if (colIndex > -1) {
          const targetCol = colIndex + 1; // Convert to 1-indexed
          prospectSheet.getRange(2, targetCol).setFormula(formulas[i][0]);
          prospectSheet.getRange(2, targetCol).copyTo(prospectSheet.getRange(3, targetCol, lastRow - 2));
        } else {
          console.warn('Column not found in Prospects sheet: ' + colName);
        }
      }
    }
  }

  // 2. Sync Outreach Sheet
  const outreachSheet = ss.getSheetByName('Outreach');
  if (outreachSheet) {
    const lastRow = outreachSheet.getLastRow();
    if (lastRow > 1) {
      // Get headers for dynamic column lookup
      const headers = outreachSheet.getRange(1, 1, 1, outreachSheet.getLastColumn()).getValues()[0];
      
      const outreachFormulas = [
        ['=IF(F2="Initial Contact", "Outreach", IFERROR(XLOOKUP(F2, Settings!$B:$B, Settings!$C:$C), "Outreach"))', 'Stage'],
        ['=IFERROR(XLOOKUP(F2, Settings!$B:$B, Settings!$D:$D), "Cold")', 'Status'],
        ['=IF(D2="", "", D2 + IFERROR(XLOOKUP(F2, Settings!$B:$B, Settings!$E:$E), 14))', 'Next Visit Date'],
        ['=IF(D2="", "", TODAY() - D2)', 'Days Since Last Visit'],
        ['=IF(I2="", "", I2 - TODAY())', 'Next Visit Countdown'],
        ['=F2', 'Outcome Category'],
        ['=IFS(F2="Account Won", "Onboard Account", ISNUMBER(SEARCH("Interested", F2)), "Send pricing", OR(F2="Initial Contact", F2="Follow-Up"), "General follow", F2="No Answer", "Try again", OR(F2="Not Interested", F2="Disqualified"), "Check periodic", TRUE, "See Notes")', 'Follow Up Action']
      ];

      for (let i = 0; i < outreachFormulas.length; i++) {
        const colName = outreachFormulas[i][1];
        const colIndex = headers.indexOf(colName);
        if (colIndex > -1) {
          const targetCol = colIndex + 1; // Convert to 1-indexed
          outreachSheet.getRange(2, targetCol).setFormula(outreachFormulas[i][0]);
          outreachSheet.getRange(2, targetCol).copyTo(outreachSheet.getRange(3, targetCol, lastRow - 2));
        } else {
          console.warn('Column not found in Outreach sheet: ' + colName);
        }
      }
    }
  }
}
