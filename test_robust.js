/**
 * Robust Unit Tests for K&L Recycling CRM
 * Enhanced tests with proper mocking, error handling, and environment detection
 * 
 * Key improvements:
 * - Automatic detection of test environment (Apps Script vs standalone)
 * - Mock services for standalone test execution
 * - Better timezone handling for date tests
 * - Graceful degradation when dependencies are unavailable
 */

// ============================================================================
// TEST ENVIRONMENT SETUP
// ============================================================================

var TEST_MODE = {
  IS_APPS_SCRIPT: typeof SpreadsheetApp !== 'undefined',
  IS_STANDALONE: typeof SpreadsheetApp === 'undefined',
  TIMEZONE: 'America/Chicago'
};

// Mock CONFIG for standalone testing
var TEST_CONFIG = {
  TIMEZONE: 'America/Chicago',
  DATE_FORMAT: 'MM/dd/yyyy',
  SHEET_PROSPECTS: 'Prospects',
  SHEET_OUTREACH: 'Outreach',
  SHEET_SETTINGS: 'Settings',
  SHEET_NEW_ACCOUNTS: 'New Accounts',
  DEFAULT_OWNER: 'Kyle'
};

// ============================================================================
// MOCK SERVICES FOR STANDALONE TESTING
// ============================================================================

(function setupMockServices() {
  if (TEST_MODE.IS_STANDALONE) {
    console.log('🔧 Setting up mock services for standalone testing...');
    
    // Mock SpreadsheetApp
    var SpreadsheetApp = {
      getActiveSpreadsheet: function() {
        return {
          getSheetByName: function(name) {
            return {
              getDataRange: function() {
                return {
                  getValues: function() {
                    // Return mock header and data rows
                    return [['Header1', 'Header2', 'Header3']];
                  }
                };
              },
              appendRow: function() {},
              getName: function() { return name; }
            };
          }
        };
      },
      getActive: function() { return null; }
    };
    
    // Mock Utilities
    var Utilities = {
      formatDate: function(date, timezone, format) {
        // Simple date formatter for testing
        var mm = String(date.getMonth() + 1).padStart(2, '0');
        var dd = String(date.getDate()).padStart(2, '0');
        var yyyy = date.getFullYear();
        return mm + '/' + dd + '/' + yyyy;
      },
      sleep: function(ms) { /* No-op for testing */ }
    };
    
    // Mock CacheService
    var CacheService = {
      getPrivateCache: function() {
        return {
          get: function() { return null; },
          put: function() {},
          remove: function() {}
        };
      }
    };
    
    // Make mocks globally available
    global.SpreadsheetApp = SpreadsheetApp;
    global.Utilities = Utilities;
    global.CacheService = CacheService;
    
    // Make CONFIG available
    global.CONFIG = TEST_CONFIG;
    
    console.log('✅ Mock services configured for standalone testing');
  }
})();

// ============================================================================
// TEST HELPER FUNCTIONS
// ============================================================================

/**
 * Assert helper with detailed error messages
 */
function assertEqual(actual, expected, testName) {
  if (actual !== expected) {
    return {
      success: false,
      error: 'Expected "' + expected + '" but got "' + actual + '"',
      actual: actual,
      expected: expected
    };
  }
  return { success: true };
}

/**
 * Assert array contains expected value
 */
function assertContains(array, value, testName) {
  var found = array.indexOf(value) !== -1;
  if (!found) {
    return {
      success: false,
      error: 'Array does not contain expected value',
      array: array,
      expected: value
    };
  }
  return { success: true };
}

/**
 * Assert object has required properties
 */
function assertHasProperties(obj, props, testName) {
  var missing = [];
  props.forEach(function(prop) {
    if (!obj.hasOwnProperty(prop)) {
      missing.push(prop);
    }
  });
  if (missing.length > 0) {
    return {
      success: false,
      error: 'Missing required properties',
      missing: missing
    };
  }
  return { success: true };
}

/**
 * Safe test runner - catches errors and reports gracefully
 */
function runSafeTest(testFn, testName) {
  try {
    var result = testFn();
    return {
      success: result && result.success !== false,
      testName: testName,
      result: result
    };
  } catch (e) {
    return {
      success: false,
      testName: testName,
      error: e.message,
      stack: e.stack
    };
  }
}

// ============================================================================
// DATE PARSING TESTS (Fixed timezone handling)
// ============================================================================

function testDateParsing() {
  console.log('🧪 Testing Date Parsing Functions...');
  
  var results = {};
  
  // Helper to compare dates by YYYY-MM-DD portion only (ignoring time/tz)
  function datesMatchByDatePart(date1, date2) {
    if (!date1 || !date2) return false;
    var d1 = new Date(date1);
    var d2 = new Date(date2);
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  }
  
  // Test parseDateSafely with timezone-aware comparison
  var testDates = [
    { 
      input: '01/15/2026', 
      expectedDate: new Date('2026-01-15'),
      description: 'US format date string'
    },
    { 
      input: '2026-01-15', 
      expectedDate: new Date('2026-01-15'),
      description: 'ISO format date string'
    },
    { 
      input: new Date('2026-01-15'), 
      expectedDate: new Date('2026-01-15'),
      description: 'Date object'
    },
    { 
      input: '', 
      expectedDate: null,
      description: 'Empty string should return null'
    },
    { 
      input: null, 
      expectedDate: null,
      description: 'Null should return null'
    },
    { 
      input: undefined, 
      expectedDate: null,
      description: 'Undefined should return null'
    }
  ];
  
  results.parseDateSafely = [];
  testDates.forEach(function(testCase) {
    try {
      var result = parseDateSafely(testCase.input);
      var success;
      
      if (testCase.expectedDate === null) {
        success = result === null;
      } else {
        // Compare date portions to handle timezone issues
        success = datesMatchByDatePart(result, testCase.expectedDate);
      }
      
      results.parseDateSafely.push({
        success: success,
        input: testCase.input,
        output: result ? 'Date(' + result.toDateString() + ')' : null,
        expected: testCase.expectedDate ? 'Date(' + testCase.expectedDate.toDateString() + ')' : null,
        description: testCase.description
      });
    } catch (e) {
      results.parseDateSafely.push({
        success: false,
        input: testCase.input,
        error: e.message
      });
    }
  });
  
  // Test parseDateForReport
  var reportTestDates = [
    { 
      input: '2026-01-15', 
      expected: new Date('2026-01-15'),
      description: 'ISO format for report'
    }
  ];
  
  results.parseDateForReport = [];
  reportTestDates.forEach(function(testCase) {
    try {
      var result = parseDateForReport(testCase.input);
      var success = datesMatchByDatePart(result, testCase.expected);
      
      results.parseDateForReport.push({
        success: success,
        input: testCase.input,
        output: result ? 'Date(' + result.toDateString() + ')' : null,
        expected: 'Date(' + testCase.expected.toDateString() + ')',
        description: testCase.description
      });
    } catch (e) {
      results.parseDateForReport.push({
        success: false,
        input: testCase.input,
        error: e.message
      });
    }
  });
  
  console.log('✅ Date Parsing Tests:', JSON.stringify(results, null, 2));
  return results;
}

// ============================================================================
// UTILITY FUNCTIONS TESTS (Fixed for missing dependencies)
// ============================================================================

function testUtilityFunctions() {
  console.log('🧪 Testing Utility Functions...');
  
  var results = {};
  
  // Test mapStatusToStage with proper error handling
  var statusTests = [
    { input: 'Hot', expected: 'Active Pursuit', description: 'Hot status maps to Active Pursuit' },
    { input: 'Warm', expected: 'Nurture', description: 'Warm status maps to Nurture' },
    { input: 'Cold', expected: 'Prospect', description: 'Cold status maps to Prospect' },
    { input: 'Account Won', expected: 'Customer', description: 'Account Won maps to Customer' },
    { input: 'Lost', expected: 'Lost', description: 'Lost maps to Lost' },
    { input: 'Unknown', expected: 'Prospect', description: 'Unknown status defaults to Prospect' },
    { input: '', expected: 'Prospect', description: 'Empty status defaults to Prospect' },
    { input: null, expected: 'Prospect', description: 'Null status defaults to Prospect' }
  ];
  
  results.mapStatusToStage = [];
  statusTests.forEach(function(testCase) {
    try {
      // Check if function exists
      if (typeof mapStatusToStage !== 'function') {
        results.mapStatusToStage.push({
          success: false,
          input: testCase.input,
          error: 'mapStatusToStage function not defined - OutreachFunctions.js may not be loaded'
        });
        return;
      }
      
      var result = mapStatusToStage(testCase.input);
      var success = result === testCase.expected;
      
      results.mapStatusToStage.push({
        success: success,
        input: testCase.input,
        output: result,
        expected: testCase.expected,
        description: testCase.description
      });
    } catch (e) {
      results.mapStatusToStage.push({
        success: false,
        input: testCase.input,
        error: e.message
      });
    }
  });
  
  // Test calculateNextBusinessDay
  results.calculateNextBusinessDay = [];
  try {
    if (typeof calculateNextBusinessDay !== 'function') {
      results.calculateNextBusinessDay.push({
        success: false,
        error: 'calculateNextBusinessDay function not defined'
      });
    } else {
      var today = new Date('2026-01-15'); // Thursday
      var nextBusinessDay = calculateNextBusinessDay(1, today); // Pass start date as second parameter
      var expectedDate = new Date('2026-01-16'); // Friday
      
      var success = nextBusinessDay.toDateString() === expectedDate.toDateString();
      
      results.calculateNextBusinessDay.push({
        success: success,
        input: '2026-01-15 (Thursday)',
        output: nextBusinessDay ? nextBusinessDay.toDateString() : null,
        expected: expectedDate.toDateString(),
        description: 'Next business day from Thursday should be Friday'
      });
    }
  } catch (e) {
    results.calculateNextBusinessDay.push({
      success: false,
      error: e.message
    });
  }
  
  console.log('✅ Utility Function Tests:', JSON.stringify(results, null, 2));
  return results;
}

// ============================================================================
// BUSINESS LOGIC TESTS (Fixed for missing dependencies)
// ============================================================================

function testBusinessLogic() {
  console.log('🧪 Testing Business Logic Functions...');
  
  var results = {};
  
  // Test Settings.getSettings with proper mocking
  results.getSettings = [];
  try {
    if (typeof getSettings !== 'function') {
      results.getSettings.push({
        success: false,
        error: 'getSettings function not defined'
      });
    } else if (TEST_MODE.IS_STANDALONE) {
      // In standalone mode, we expect getSettings to either:
      // 1. Work with our mock SpreadsheetApp, or
      // 2. Return default settings on error
      try {
        var settings = getSettings();
        var success = typeof settings === 'object' && 
                      settings.industryScores !== undefined &&
                      settings.urgencyBands !== undefined;
        
        results.getSettings.push({
          success: success,
          output: 'Settings object returned',
          note: 'Mock SpreadsheetApp is working'
        });
      } catch (e) {
        // This is expected in some test environments
        results.getSettings.push({
          success: false,
          error: 'getSettings failed: ' + e.message,
          note: 'This is expected if SpreadsheetApp is not available'
        });
      }
    } else {
      // In Apps Script environment
      var settings = getSettings();
      var success = typeof settings === 'object';
      
      results.getSettings.push({
        success: success,
        output: settings ? 'Settings retrieved' : 'No settings',
        environment: 'Apps Script'
      });
    }
  } catch (e) {
    results.getSettings.push({
      success: false,
      error: e.message
    });
  }
  
  // Test mapStatusToStage is exported correctly
  results.OutreachFunctionsExports = [];
  try {
    if (typeof OutreachFunctions !== 'undefined') {
      var hasMapStatusToStage = typeof OutreachFunctions.mapStatusToStage === 'function';
      results.OutreachFunctionsExports.push({
        success: hasMapStatusToStage,
        exports: Object.keys(OutreachFunctions),
        hasMapStatusToStage: hasMapStatusToStage
      });
    } else {
      results.OutreachFunctionsExports.push({
        success: false,
        error: 'OutreachFunctions namespace not defined'
      });
    }
  } catch (e) {
    results.OutreachFunctionsExports.push({
      success: false,
      error: e.message
    });
  }
  
  console.log('✅ Business Logic Tests:', JSON.stringify(results, null, 2));
  return results;
}

// ============================================================================
// SHARED UTILS TESTS
// ============================================================================

function testSharedUtils() {
  console.log('🧪 Testing SharedUtils Functions...');
  
  var results = {};
  
  // Test formatDate
  results.formatDate = [];
  try {
    if (typeof SharedUtils === 'undefined' || !SharedUtils.formatDate) {
      results.formatDate.push({
        success: false,
        error: 'SharedUtils.formatDate not available'
      });
    } else {
      var testDate = new Date('2026-01-15');
      var formatted = SharedUtils.formatDate(testDate);
      var success = typeof formatted === 'string' && formatted.length > 0;
      
      results.formatDate.push({
        success: success,
        input: 'Date(2026-01-15)',
        output: formatted,
        environment: TEST_MODE.IS_APPS_SCRIPT ? 'Apps Script' : 'Standalone'
      });
    }
  } catch (e) {
    results.formatDate.push({
      success: false,
      error: e.message
    });
  }
  
  // Test normalizeHeader
  results.normalizeHeader = [];
  try {
    if (typeof SharedUtils === 'undefined' || !SharedUtils.normalizeHeader) {
      results.normalizeHeader.push({
        success: false,
        error: 'SharedUtils.normalizeHeader not available'
      });
    } else {
      var normalized = SharedUtils.normalizeHeader('  Company Name  ');
      var success = normalized === 'company name';
      
      results.normalizeHeader.push({
        success: success,
        input: '  Company Name  ',
        output: normalized,
        expected: 'company name'
      });
    }
  } catch (e) {
    results.normalizeHeader.push({
      success: false,
      error: e.message
    });
  }
  
  // Test generateUniqueId
  results.generateUniqueId = [];
  try {
    if (typeof SharedUtils === 'undefined' || !SharedUtils.generateUniqueId) {
      results.generateUniqueId.push({
        success: false,
        error: 'SharedUtils.generateUniqueId not available'
      });
    } else {
      var id1 = SharedUtils.generateUniqueId('TEST');
      var id2 = SharedUtils.generateUniqueId('TEST');
      var success = typeof id1 === 'string' && id1 !== id2;
      
      results.generateUniqueId.push({
        success: success,
        id1: id1,
        id2: id2,
        unique: success
      });
    }
  } catch (e) {
    results.generateUniqueId.push({
      success: false,
      error: e.message
    });
  }
  
  // Test parseCurrency
  results.parseCurrency = [];
  try {
    if (typeof SharedUtils === 'undefined' || !SharedUtils.parseCurrency) {
      results.parseCurrency.push({
        success: false,
        error: 'SharedUtils.parseCurrency not available'
      });
    } else {
      var currency1 = SharedUtils.parseCurrency('$1,234.56');
      var currency2 = SharedUtils.parseCurrency('1234.56');
      var currency3 = SharedUtils.parseCurrency('invalid');
      var success = currency1 === 1234.56 && currency2 === 1234.56 && currency3 === 0;
      
      results.parseCurrency.push({
        success: success,
        tests: { 
          '$1,234.56': currency1, 
          '1234.56': currency2, 
          'invalid': currency3 
        }
      });
    }
  } catch (e) {
    results.parseCurrency.push({
      success: false,
      error: e.message
    });
  }
  
  console.log('✅ SharedUtils Tests:', JSON.stringify(results, null, 2));
  return results;
}

// ============================================================================
// RUN ALL ROBUST TESTS
// ============================================================================

function runAllRobustTests() {
  console.log('🚀 Starting Robust Unit Test Suite...');
  console.log('📍 Environment: ' + (TEST_MODE.IS_APPS_SCRIPT ? 'Apps Script' : 'Standalone'));
  console.log('');
  
  var testResults = {
    environment: TEST_MODE.IS_APPS_SCRIPT ? 'Apps Script' : 'Standalone',
    timestamp: new Date().toISOString(),
    sharedUtils: testSharedUtils(),
    dateParsing: testDateParsing(),
    utilityFunctions: testUtilityFunctions(),
    businessLogic: testBusinessLogic()
  };
  
  // Calculate summary
  var totalTests = 0;
  var passedTests = 0;
  
  function countResults(obj) {
    Object.keys(obj).forEach(function(key) {
      var item = obj[key];
      if (Array.isArray(item)) {
        item.forEach(function(subItem) {
          totalTests++;
          if (subItem.success) passedTests++;
        });
      } else if (typeof item === 'object' && item !== null) {
        if (item.success !== undefined) {
          totalTests++;
          if (item.success) passedTests++;
        }
      }
    });
  }
  
  Object.keys(testResults).forEach(function(module) {
    if (typeof testResults[module] === 'object') {
      countResults(testResults[module]);
    }
  });
  
  console.log('\n📊 Robust Test Results Summary:');
  console.log('Total Tests: ' + totalTests);
  console.log('Passed: ' + passedTests);
  console.log('Failed: ' + (totalTests - passedTests));
  console.log('Success Rate: ' + (totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0) + '%');
  
  if (passedTests === totalTests) {
    console.log('🎉 All robust tests PASSED!');
  } else {
    console.log('⚠️  Some tests failed. Check the detailed output above.');
  }
  
  return testResults;
}

// ============================================================================
// STANDALONE TEST ENTRY POINT
// ============================================================================

// For standalone testing, run the tests
if (typeof describe === 'undefined') {
  // Not in a test framework, run our tests
  var standaloneResults = runAllRobustTests();
  console.log('\n📋 Final Results Object:');
  console.log(JSON.stringify(standaloneResults, null, 2));
}
