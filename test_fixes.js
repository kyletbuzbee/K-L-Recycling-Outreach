/**
 * Test Script for Critical Fixes
 * Tests the implemented safety improvements.
 */

/**
 * Test all critical fixes
 */
function testAllFixes() {
  console.log('=== Testing Critical Fixes ===');
  
  var results = {
    config: testConfigFixes(),
    dataHelpers: testDataHelpersFixes(),
    csvImport: testCSVImportFixes(),
    settings: testSettingsFixes(),
    prospectFunctions: testProspectFunctionsFixes(),
    validationUtils: testValidationUtils()
  };
  
  console.log('=== Test Results ===');
  console.log(JSON.stringify(results, null, 2));
  
  return results;
}

/**
 * Test Config.gs fixes
 */
function testConfigFixes() {
  var results = {
    formatDate: false,
    getGlobalConstant: false
  };
  
  try {
    // Test formatDate with various inputs
    var testDate = new Date();
    var formatted = formatDate(testDate);
    results.formatDate = typeof formatted === 'string' && formatted.length > 0;
    
    // Test getGlobalConstant with fallback
    var constant = getGlobalConstant('TestKey', 'DefaultValue');
    results.getGlobalConstant = constant === 'DefaultValue';
    
    console.log('Config fixes test passed');
  } catch (e) {
    console.error('Config fixes test failed:', e.message);
  }
  
  return results;
}

/**
 * Test DataHelpers.gs fixes
 */
function testDataHelpersFixes() {
  var results = {
    updateCellSafe: false,
    appendRowSafe: false,
    getColumnIndex: false,
    getSheetSafe: false
  };
  
  try {
    // Test updateCellSafe with null checks
    var updateResult = updateCellSafe('NonExistentSheet', 1, 'TestColumn', 'TestValue');
    results.updateCellSafe = updateResult.success === false;
    
    // Test appendRowSafe with null checks
    var appendResult = appendRowSafe('NonExistentSheet', { test: 'value' });
    results.appendRowSafe = appendResult.success === false;
    
    // Test getColumnIndex with null checks
    var columnIndex = getColumnIndex('NonExistentSheet', 'TestColumn');
    results.getColumnIndex = columnIndex === -1;
    
    // Test getSheetSafe with null checks
    var sheet = getSheetSafe('NonExistentSheet');
    results.getSheetSafe = sheet === null;
    
    console.log('DataHelpers fixes test passed');
  } catch (e) {
    console.error('DataHelpers fixes test failed:', e.message);
  }
  
  return results;
}

/**
 * Test CSVImport.gs fixes
 */
function testCSVImportFixes() {
  var results = {
    importCSVData: false
  };
  
  try {
    // Test importCSVData with null checks
    var importResult = importCSVData('test,data', 'NonExistentSheet');
    results.importCSVData = importResult.success === false;
    
    console.log('CSVImport fixes test passed');
  } catch (e) {
    console.error('CSVImport fixes test failed:', e.message);
  }
  
  return results;
}

/**
 * Test Settings.gs fixes
 */
function testSettingsFixes() {
  var results = {
    getSettings: false
  };
  
  try {
    // Test getSettings with error handling
    var settings = getSettings();
    results.getSettings = typeof settings === 'object';
    
    console.log('Settings fixes test passed');
  } catch (e) {
    console.error('Settings fixes test failed:', e.message);
  }
  
  return results;
}

/**
 * Test ProspectFunctions.gs fixes
 */
function testProspectFunctionsFixes() {
  var results = {
    updateExistingProspectWithWriteBackRules: false,
    calculateNextBusinessDay: false
  };
  
  try {
    // Test calculateNextBusinessDay
    var nextDay = calculateNextBusinessDay(1);
    results.calculateNextBusinessDay = nextDay instanceof Date;
    
    // Test updateExistingProspectWithWriteBackRules with error handling
    try {
      updateExistingProspectWithWriteBackRules(1, 'Test Outcome', 'Test Status', 'Test Activity');
      results.updateExistingProspectWithWriteBackRules = false; // Should fail with invalid row
    } catch (e) {
      results.updateExistingProspectWithWriteBackRules = true; // Expected to fail
    }
    
    console.log('ProspectFunctions fixes test passed');
  } catch (e) {
    console.error('ProspectFunctions fixes test failed:', e.message);
  }
  
  return results;
}

/**
 * Test ValidationUtils.gs
 */
function testValidationUtils() {
  var results = {
    validateDate: false,
    validateEmail: false,
    validateCompanyName: false,
    validatePhoneNumber: false,
    validateAddress: false,
    validateZipCode: false,
    validateNumericRange: false,
    validateAllowedValues: false,
    validateProspectData: false,
    validateOutreachData: false,
    validateAccountData: false,
    sanitizeString: false,
    validateAndSanitizeInput: false
  };
  
  try {
    // Test validateDate
    var dateResult = validateDate(new Date());
    results.validateDate = dateResult.success === true;
    
    // Test validateEmail
    var emailResult = validateEmail('test@example.com');
    results.validateEmail = emailResult.success === true;
    
    // Test validateCompanyName
    var companyResult = validateCompanyName('Test Company');
    results.validateCompanyName = companyResult.success === true;
    
    // Test validatePhoneNumber
    var phoneResult = validatePhoneNumber('555-123-4567');
    results.validatePhoneNumber = phoneResult.success === true;
    
    // Test validateAddress
    var addressResult = validateAddress('123 Test Street');
    results.validateAddress = addressResult.success === true;
    
    // Test validateZipCode
    var zipResult = validateZipCode('12345');
    results.validateZipCode = zipResult.success === true;
    
    // Test validateNumericRange
    var rangeResult = validateNumericRange(50, 0, 100, 'Test Field');
    results.validateNumericRange = rangeResult.success === true;
    
    // Test validateAllowedValues
    var allowedResult = validateAllowedValues('Phone', ['Phone', 'Email', 'In-Person'], 'Contact Type');
    results.validateAllowedValues = allowedResult.success === true;
    
    // Test validateProspectData
    var prospectResult = validateProspectData({
      'company name': 'Test Company',
      address: '123 Test Street',
      'zip code': '12345'
    });
    results.validateProspectData = prospectResult.success === true;
    
    // Test validateOutreachData
    var outreachResult = validateOutreachData({
      company: 'Test Company',
      'visit date': new Date(),
      outcome: 'Test Outcome'
    });
    results.validateOutreachData = outreachResult.success === true;
    
    // Test validateAccountData
    var accountResult = validateAccountData({
      'company name': 'Test Company',
      'contact name': 'Test Contact',
      'contact phone': '555-123-4567'
    });
    results.validateAccountData = accountResult.success === true;
    
    // Test sanitizeString
    var sanitized = sanitizeString('<script>alert("test")</script>');
    results.sanitizeString = sanitized.indexOf('<') === -1 && sanitized.indexOf('>') === -1;
    
    // Test validateAndSanitizeInput
    var inputResult = validateAndSanitizeInput('Test Company', 'company');
    results.validateAndSanitizeInput = inputResult.success === true;
    
    console.log('ValidationUtils test passed');
  } catch (e) {
    console.error('ValidationUtils test failed:', e.message);
  }
  
  return results;
}

/**
 * Run a comprehensive test of the system
 */
function runComprehensiveTest() {
  console.log('=== Comprehensive System Test ===');
  
  try {
    // Test that all critical functions can be called without crashing
    var testResults = testAllFixes();
    
    // Check if all critical fixes are working
    var allWorking = true;
    for (var category in testResults) {
      for (var test in testResults[category]) {
        if (testResults[category][test] === false) {
          allWorking = false;
          console.warn('Test failed:', category, test);
        }
      }
    }
    
    if (allWorking) {
      console.log('✅ All critical fixes are working correctly!');
      return { success: true, message: 'All tests passed' };
    } else {
      console.log('❌ Some tests failed. Please review the output above.');
      return { success: false, message: 'Some tests failed' };
    }
    
  } catch (e) {
    console.error('Comprehensive test failed:', e);
    return { success: false, message: 'Test execution failed: ' + e.message };
  }
}