/**
 * K&L Recycling CRM - Configuration
 * Centralized constants for Sheet names and Column Headers.
 */

var CONFIG = {
  // Sheet Names
  SHEETS: {
    OUTREACH: 'Outreach',
    PROSPECTS: 'Prospects',
    ACCOUNTS: 'Accounts',
    CONTACTS: 'Contacts',
    DASHBOARD: 'Dashboard',
    METRICS: 'MetricsHistory',
    SYSTEM_LOG: 'System_OpsLog',
    GEO_CACHE: 'System_GeoCache',
    SETTINGS: 'Settings'
  },

  // Legacy compatibility - keep old names but mark as deprecated
  SHEET_OUTREACH: 'Outreach',
  SHEET_PROSPECTS: 'Prospects',
  SHEET_ACCOUNTS: 'Accounts',
  SHEET_CONTACTS: 'Contacts',
  SHEET_NEW_ACCOUNTS: 'Accounts', // Deprecated - use SHEET_ACCOUNTS instead
  SHEET_SETTINGS: 'Settings',

  // Application Settings
  APP_TITLE: 'K&L Recycling CRM',
  
  // Header Definitions (Must match Sheet Headers EXACTLY)
  HEADERS: {
    OUTREACH: [
      'Outreach ID', 'Company ID', 'Company', 'Visit Date', 'Notes', 
      'Outcome', 'Stage', 'Status', 'Next Visit Date', 'Days Since Last Visit', 
      'Next Visit Countdown', 'Outcome Category', 'Follow Up Action', 'Owner', 
      'Prospects Match', 'Contact Type', 'Email Sent', 'Competitor'
    ],
    PROSPECTS: [
      'Company ID', 'Address', 'Zip Code', 'Company Name', 'Industry', 
      'Latitude', 'Longitude', 'Last Outcome', 'Last Outreach Date', 
      'Days Since Last Contact', 'Next Step Due Countdown', 'Next Steps Due Date', 
      'Contact Status', 'Close Probability', 'Priority Score', 
      'UrgencyBand', 'Urgency Score', 'Totals'
    ],
    ACCOUNTS: [
      'Deployed', 'Timestamp', 'Company Name', 'Contact Name', 'Contact Phone', 
      'Contact Role', 'Site Location', 'Mailing Location', 'Roll-Off Fee', 
      'Handling of Metal', 'Roll Off Container Size', 'Notes', 'Payout Price'
    ],
    CONTACTS: [
      'Name', 'Company', 'Account', 'Role', 'Department', 'Phone Number', 
      'Email', 'Address'
    ],
    SETTINGS: [
      'Category', 'Key', 'Value_1', 'Value_2', 'Value_3', 'Value_4', 'Description','Column 8'
    ]
  },

  // Standardized Variables (can be overridden by settings)
  DEFAULT_OWNER: 'Kyle Buzbee',
  get TIMEZONE() { return getGlobalConstant('Timezone', 'America/Chicago'); },
  DATE_FORMAT: 'MM/dd/yyyy'
};

/**
 * Fallback function for formatDate if SharedUtils is not available
 * This ensures formatDate is always available globally
 */
function formatDate(date) {
  // Standard null check pattern
  var accessResult = SharedUtils.checkSpreadsheetAccess('formatDate');
  if (!accessResult.success) {
    throw new Error(accessResult.error);
  }

  var ss = accessResult.spreadsheet;

  if (typeof SharedUtils !== 'undefined' && typeof SharedUtils.formatDate === 'function') {
    return SharedUtils.formatDate(date);
  }

  // Direct implementation as fallback with enhanced date validation
  if (!date) return '';

  try {
    // Use enhanced date validation from ValidationUtils
    var dateValidation = ValidationUtils.validateDate(date, {
      minYear: 1900,
      maxYear: 2100
    });
    
    if (!dateValidation.success) {
      console.warn('Invalid date provided to formatDate:', date, dateValidation.error);
      return '';
    }

    var dateObj = dateValidation.date;

    return Utilities.formatDate(dateObj, CONFIG.TIMEZONE, CONFIG.DATE_FORMAT);
  } catch (e) {
    console.error('Error formatting date:', e);
    return '';
  }
}

/**
 * Get global constant from settings, with fallback
 */
function getGlobalConstant(key, defaultValue) {
  // Standard null check pattern
  var accessResult = SharedUtils.checkSpreadsheetAccess('getGlobalConstant');
  if (!accessResult.success) {
    throw new Error(accessResult.error);
  }

  var ss = accessResult.spreadsheet;

  try {
    var settings = getSettings();
    if (settings.globalConstants && settings.globalConstants[key]) {
      return settings.globalConstants[key].value;
    }
  } catch (e) {
    // Fall back to default if settings can't be loaded
    console.warn('Could not load global constant ' + key + ', using default:', defaultValue);
    // Log to Ops Log sheet if available
    try {
      var opsLogSheet = ss.getSheetByName(CONFIG.SHEETS.SYSTEM_LOG);
      if (opsLogSheet) {
        // Use enhanced date validation
        var currentDate = ValidationUtils.createDateSafely(new Date());
        if (currentDate) {
          opsLogSheet.appendRow([
            currentDate,
            'getGlobalConstant',
            'WARNING',
            'Could not load global constant ' + key + ', using default: ' + defaultValue,
            e.message
          ]);
        } else {
          console.error('Invalid date when trying to log to Ops Log');
        }
      }
    } catch (logError) {
      console.error('Failed to log to Ops Log:', logError);
    }
  }
  return defaultValue;
}