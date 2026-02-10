/**
 * Setup Functions
 * Installation scripts.
 */

function installTriggers() {
  // Clear existing to avoid duplicates
  var triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(function(t) { ScriptApp.deleteTrigger(t); });
  
  // Daily cleanup at 6am
  ScriptApp.newTrigger('runDailyAutomation')
    .timeBased()
    .everyDays(1)
    .atHour(6)
    .create();

  // âŒ DO NOT create an onOpen trigger here
  // Google Sheets automatically calls onOpen()
}

// REMOVED: Duplicate onOpen() function - using the one in MenuFunctions.js instead
// The onOpen() function in MenuFunctions.js creates the K&L CRM menu
