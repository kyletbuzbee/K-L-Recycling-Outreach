/**
 * Outreach to Prospects Sync Function
 * Reads all outreach records and updates prospects with latest information
 * Uses fuzzy matching to handle company name/ID differences
 * Version: 1.0.0
 */

/**
 * Syncs Outreach data to Prospects sheet
 * Reads all outreach records and updates prospects with latest information
 * Uses fuzzy matching to handle company name/ID differences
 * @return {Object} Result with success flag and statistics
 */
function syncOutreachToProspects() {
  try {
    console.log('Starting Outreach to Prospects sync...');
    
    // Get all outreach data
    var outreachResult = ErrorHandling.withErrorHandling(function() {
      return SharedUtils.getSafeSheetData(CONFIG.SHEET_OUTREACH, [
        'Outreach ID', 'Company ID', 'Company', 'Visit Date', 
        'Outcome', 'Stage', 'Status', 'Contact Type'
      ]);
    }, {
      functionName: 'syncOutreachToProspects',
      step: 'fetch_outreach'
    });

    if (!outreachResult.success) {
      throw new Error('Failed to retrieve outreach data: ' + outreachResult.error);
    }

    var outreach = outreachResult.data || [];
    console.log('Found ' + outreach.length + ' outreach records');

    // Get all prospects data
    var prospectsResult = ErrorHandling.withErrorHandling(function() {
      return SharedUtils.getSafeSheetData(CONFIG.SHEET_PROSPECTS, [
        'Company ID', 'Company Name', 'Contact Status', 'Last Outcome',
        'Last Outreach Date', 'Days Since Last Contact', 'Next Steps Due Date',
        'Urgency Score', 'UrgencyBand'
      ]);
    }, {
      functionName: 'syncOutreachToProspects',
      step: 'fetch_prospects'
    });

    if (!prospectsResult.success) {
      throw new Error('Failed to retrieve prospect data: ' + prospectsResult.error);
    }

    var prospects = prospectsResult.data || [];
    console.log('Found ' + prospects.length + ' prospect records');

    // Group outreach by company (find most recent per company)
    var outreachByCompany = {};
    outreach.forEach(function(o) {
      var key = o['company id'] || o['company'] || '';
      if (!key) return;
      
      var visitDate = new Date(o['visit date']);
      
      if (!outreachByCompany[key] || visitDate > new Date(outreachByCompany[key]['visit date'])) {
        outreachByCompany[key] = o;
      }
    });

    console.log('Grouped outreach by ' + Object.keys(outreachByCompany).length + ' companies');

    // Track updates
    var updateCount = 0;
    var createCount = 0;
    var noMatchCount = 0;
    var updates = [];

    // Process each company's most recent outreach
    Object.keys(outreachByCompany).forEach(function(companyKey) {
      var latestOutreach = outreachByCompany[companyKey];
      
      // Use fuzzy matching to find prospect
      var matchResult = fuzzyMatchCompany(latestOutreach, prospects);
      
      if (matchResult.match) {
        // Update existing prospect
        var prospect = matchResult.match;
        var rowIndex = prospect._rowIndex;
        
        // Calculate days since last contact
        var lastContactDate = new Date(latestOutreach['visit date']);
        var today = new Date();
        today.setHours(0, 0, 0, 0);
        lastContactDate.setHours(0, 0, 0, 0);
        var daysSince = Math.floor((today.getTime() - lastContactDate.getTime()) / (1000 * 60 * 60 * 24));
        
        // Apply write-back rules based on outcome
        var outcome = latestOutreach['outcome'] || '';
        var normalizedOutcome = outcome.toString().toLowerCase().trim();
        
        var updatesToApply = {
          'Last Outcome': outcome,
          'Last Outreach Date': SharedUtils.formatDate(lastContactDate),
          'Days Since Last Contact': daysSince
        };
        
        // Calculate next steps due date based on outcome
        var nextStepsDueDate = calculateNextStepsDueDate(outcome, lastContactDate);
        if (nextStepsDueDate) {
          updatesToApply['Next Steps Due Date'] = SharedUtils.formatDate(nextStepsDueDate);
        }
        
        // Calculate urgency score and band
        var urgencyScore = calculateUrgencyScore(daysSince);
        var urgencyBand = calculateUrgencyBand(daysSince);
        updatesToApply['Urgency Score'] = urgencyScore;
        updatesToApply['UrgencyBand'] = urgencyBand;
        
        // Update contact status based on outcome
        if (normalizedOutcome.includes('follow-up') || normalizedOutcome.includes('follow up')) {
          updatesToApply['Contact Status'] = 'Nurture';
        } else if (normalizedOutcome.includes('interested')) {
          updatesToApply['Contact Status'] = normalizedOutcome.includes('hot') ? 'Interested (Hot)' : 'Interested (Warm)';
        } else if (normalizedOutcome.includes('not interested') || normalizedOutcome.includes('disqualified')) {
          updatesToApply['Contact Status'] = normalizedOutcome.includes('disqualified') ? 'Disqualified' : 'Lost';
        } else if (normalizedOutcome.includes('account won') || normalizedOutcome.includes('won')) {
          updatesToApply['Contact Status'] = 'Active';
        } else if (normalizedOutcome.includes('initial contact')) {
          updatesToApply['Contact Status'] = 'Interested (Warm)';
        } else if (normalizedOutcome.includes('no answer') || normalizedOutcome.includes('not contacted')) {
          updatesToApply['Contact Status'] = 'Cold';
        }
        
        // Apply updates to prospect
        Object.keys(updatesToApply).forEach(function(field) {
          updateCellSafe(CONFIG.SHEET_PROSPECTS, rowIndex, field, updatesToApply[field]);
        });
        
        updateCount++;
        console.log('Updated prospect: ' + prospect['company name'] + ' (match: ' + matchResult.matchType + ')');
        
      } else {
        // No match found - log for review
        noMatchCount++;
        console.warn('No prospect match for outreach company: ' + latestOutreach['company']);
        console.warn('  Company ID: ' + latestOutreach['company id']);
        console.warn('  Company Name: ' + latestOutreach['company']);
      }
    });

    console.log('Sync complete: ' + updateCount + ' updated, ' + noMatchCount + ' no match');
    
    return {
      success: true,
      updated: updateCount,
      noMatch: noMatchCount,
      totalOutreach: outreach.length,
      totalProspects: prospects.length
    };

  } catch (e) {
    console.error('Error in syncOutreachToProspects:', e);
    return ErrorHandling.handleError(e, {
      functionName: 'syncOutreachToProspects',
      severity: 'HIGH'
    });
  }
}

/**
 * Calculates next steps due date based on outcome
 * @param {string} outcome - Outreach outcome
 * @param {Date} lastContactDate - Last contact date
 * @return {Date|null} Next steps due date
 */
function calculateNextStepsDueDate(outcome, lastContactDate) {
  var normalizedOutcome = (outcome || '').toLowerCase().trim();
  var daysOffset = 14; // Default

  // Get workflow rules from settings
  try {
    var settings = getSettings();
    if (settings.workflowRules && settings.workflowRules[outcome]) {
      var rule = settings.workflowRules[outcome];
      daysOffset = parseInt(rule.Value_3) || daysOffset;
    }
  } catch (e) {
    console.warn('Failed to get workflow rules:', e.message);
  }

  // Calculate next steps due date
  var nextStepsDate = new Date(lastContactDate);
  nextStepsDate.setDate(nextStepsDate.getDate() + daysOffset);
  return nextStepsDate;
}

/**
 * Calculates urgency score based on days since last contact
 * @param {number} daysSince - Days since last contact
 * @return {number} Urgency score
 */
function calculateUrgencyScore(daysSince) {
  if (daysSince < 0) {
    return 150; // Overdue
  } else if (daysSince <= 7) {
    return 115; // High
  } else if (daysSince <= 30) {
    return 75; // Medium
  } else {
    return 25; // Low
  }
}

/**
 * Calculates urgency band based on days since last contact
 * @param {number} daysSince - Days since last contact
 * @return {string} Urgency band
 */
function calculateUrgencyBand(daysSince) {
  if (daysSince < 0) {
    return 'Overdue';
  } else if (daysSince <= 7) {
    return 'High';
  } else if (daysSince <= 30) {
    return 'Medium';
  } else {
    return 'Low';
  }
}
