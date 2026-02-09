/**
 * Settings Service
 * Retrieves configuration rules from the Settings sheet.
 */

function getSettings() {
  try {
    // Enhanced null check for SpreadsheetApp
    if (typeof SpreadsheetApp === 'undefined') {
      throw new Error('SpreadsheetApp service not available in getSettings');
    }
    
    var rawData = SharedUtils.getSafeSheetData(CONFIG.SHEET_SETTINGS, ['Category', 'Key', 'Value_1', 'Value_2', 'Value_3', 'Value_4', 'Description']);

    var settings = {
      industryScores: {},
      urgencyBands: [],
      workflowRules: {},
      validationLists: {},
      globalConstants: {},
      followupTemplates: {}
    };

    // Validate rawData
    if (!rawData || !Array.isArray(rawData)) {
      console.warn('No valid settings data found, returning default settings');
      return settings;
    }

    rawData.forEach(function(row) {
      try {
        var category = row.category;
        var key = row.key;
        var value1 = row.value_1;
        var value2 = row.value_2;
        var value3 = row.value_3;
        var value4 = row.value_4;
        var description = row.description || '';

        if (category === 'INDUSTRY_SCORE') {
          // Enhanced industry scoring with keyword matching
          settings.industryScores[key] = {
            score: parseInt(value1, 10) || 0,
            keywords: value2 ? value2.split(',').map(function(k) { return k.trim().toLowerCase(); }) : [],
            description: description
          };
        } else if (category === 'URGENCY_BAND') {
          settings.urgencyBands.push({
            name: key,
            min: parseInt(value1, 10),
            max: parseInt(value2, 10),
            color: value3,
            description: description
          });
        } else if (category === 'WORKFLOW_RULE') {
          settings.workflowRules[key] = {
            stage: value1,
            status: value2,
            days: parseInt(value3, 10),
            priority: value4,
            description: description
          };
        } else if (category === 'VALIDATION_LIST') {
          // Parse comma-separated validation lists
          var values = value1 ? value1.split(',').map(function(v) { return v.trim(); }) : [];
          settings.validationLists[key] = {
            values: values,
            description: description
          };
        } else if (category === 'GLOBAL_CONST') {
          // Global constants with type detection
          var parsedValue;
          if (value1 === 'true' || value1 === 'TRUE') {
            parsedValue = true;
          } else if (value1 === 'false' || value1 === 'FALSE') {
            parsedValue = false;
          } else if (!isNaN(value1) && value1 !== '') {
            parsedValue = parseFloat(value1);
          } else {
            parsedValue = value1;
          }

          settings.globalConstants[key] = {
            value: parsedValue,
            description: description
          };
        } else if (category === 'FOLLOWUP_TEMPLATE') {
          settings.followupTemplates[key] = {
            template: value1,
            days: parseInt(value2, 10) || 14,
            description: description
          };
        }
      } catch (e) {
        console.warn('Error processing settings row:', e.message);
      }
    });

    // Sort urgency bands by priority (overdue first, then by min days ascending)
    try {
      settings.urgencyBands.sort(function(a, b) {
        if (a.name === 'Overdue') return -1;
        if (b.name === 'Overdue') return 1;
        return a.min - b.min;
      });
    } catch (e) {
      console.warn('Error sorting urgency bands:', e.message);
    }

    return settings;
  } catch (e) {
    console.error('Error loading settings:', e);
    
    // Log to system log if available
    try {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      if (ss) {
        var opsLogSheet = ss.getSheetByName(CONFIG.SHEETS.SYSTEM_LOG);
        if (opsLogSheet) {
          opsLogSheet.appendRow([
            new Date(),
            'getSettings',
            'ERROR',
            'Error loading settings: ' + e.message,
            e.stack
          ]);
        }
      }
    } catch (logError) {
      console.warn('Could not log error to system log:', logError.message);
    }
    
    // Return default settings on error
    return {
      industryScores: {},
      urgencyBands: [],
      workflowRules: {},
      validationLists: {},
      globalConstants: {},
      followupTemplates: {}
    };
  }
}

function getCRMSettings() {
  return getSettings();
}

/**
 * Returns validation lists from Settings for dashboard dropdowns.
 * Returns an object with category keys mapping to {values: [], description: ''}.
 * Used by dashboard.html to populate dropdowns dynamically from Settings.
 */
function getValidationLists() {
  try {
    var settings = getSettings();
    
    if (!settings || !settings.validationLists) {
      // Return empty validation lists with defaults
      return {
        'Competitors': { values: ['AIM', 'Tyler Iron', 'Huntwell', 'Other', 'None'], description: 'Top competitors' },
        'Container Sizes': { values: ['20 yd', '30 yd', '40 yd', 'Lugger'], description: 'Standard bin types' },
        'Activity Types': { values: ['Visit', 'Phone', 'Email'], description: 'Contact types' },
        'Outcomes': { values: ['Account Won', 'Interested (Hot)', 'Interested (Warm)', 'Initial Contact', 'Follow-Up', 'No Answer', 'Not Interested', 'Disqualified'], description: 'Visit outcomes' },
        'Stages': { values: ['Prospect', 'Outreach', 'Nurture', 'Won', 'Lost'], description: 'Pipeline stages' },
        'Statuses': { values: ['Active', 'Interested (Hot)', 'Interested (Warm)', 'Cold', 'Disqualified', 'Won'], description: 'Contact statuses' }
      };
    }
    
    return settings.validationLists;
    
  } catch (e) {
    console.error('Error in getValidationLists: ' + e.message);
    return {};
  }
}
