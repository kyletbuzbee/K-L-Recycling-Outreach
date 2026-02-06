/**
 * Runtime Fixes Test Suite
 * Tests for the critical runtime issues fixes
 */

/**
 * Test all date validation fixes
 */
function testDateValidationFixes() {
  console.log('=== Testing Date Validation Fixes ===');
  
  var testResults = [];
  
  // Test 1: ValidationUtils enhanced date validation
  try {
    var testDate = new Date('2023-01-01');
    var validation = ValidationUtils.validateDate(testDate);
    testResults.push({
      test: 'ValidationUtils.validateDate with valid date',
      success: validation.success,
      message: validation.success ? 'PASS' : validation.error
    });
  } catch (e) {
    testResults.push({
      test: 'ValidationUtils.validateDate with valid date',
      success: false,
      message: 'ERROR: ' + e.message
    });
  }
  
  // Test 2: Invalid date validation
  try {
    var validation = ValidationUtils.validateDate('invalid-date');
    testResults.push({
      test: 'ValidationUtils.validateDate with invalid date',
      success: !validation.success,
      message: validation.success ? 'FAIL - should have failed' : 'PASS - correctly rejected invalid date'
    });
  } catch (e) {
    testResults.push({
      test: 'ValidationUtils.validateDate with invalid date',
      success: false,
      message: 'ERROR: ' + e.message
    });
  }
  
  // Test 3: Out of range date validation
  try {
    var validation = ValidationUtils.validateDate('1800-01-01', { minYear: 1900, maxYear: 2100 });
    testResults.push({
      test: 'ValidationUtils.validateDate with out of range date',
      success: !validation.success,
      message: validation.success ? 'FAIL - should have failed' : 'PASS - correctly rejected out of range date'
    });
  } catch (e) {
    testResults.push({
      test: 'ValidationUtils.validateDate with out of range date',
      success: false,
      message: 'ERROR: ' + e.message
    });
  }
  
  // Test 4: Safe date creation
  try {
    var safeDate = ValidationUtils.createDateSafely('2023-01-01');
    testResults.push({
      test: 'ValidationUtils.createDateSafely with valid date',
      success: safeDate !== null,
      message: safeDate !== null ? 'PASS' : 'FAIL - should have created date'
    });
  } catch (e) {
    testResults.push({
      test: 'ValidationUtils.createDateSafely with valid date',
      success: false,
      message: 'ERROR: ' + e.message
    });
  }
  
  // Test 5: Safe date creation with invalid date
  try {
    var safeDate = ValidationUtils.createDateSafely('invalid-date');
    testResults.push({
      test: 'ValidationUtils.createDateSafely with invalid date',
      success: safeDate === null,
      message: safeDate === null ? 'PASS - correctly returned null' : 'FAIL - should have returned null'
    });
  } catch (e) {
    testResults.push({
      test: 'ValidationUtils.createDateSafely with invalid date',
      success: false,
      message: 'ERROR: ' + e.message
    });
  }
  
  // Test 6: Config.gs formatDate function
  try {
    var formattedDate = formatDate(new Date('2023-01-01'));
    testResults.push({
      test: 'Config.gs formatDate with valid date',
      success: typeof formattedDate === 'string' && formattedDate.length > 0,
      message: typeof formattedDate === 'string' ? 'PASS' : 'FAIL - should return formatted string'
    });
  } catch (e) {
    testResults.push({
      test: 'Config.gs formatDate with valid date',
      success: false,
      message: 'ERROR: ' + e.message
    });
  }
  
  // Test 7: Config.gs formatDate with invalid date
  try {
    var formattedDate = formatDate('invalid-date');
    testResults.push({
      test: 'Config.gs formatDate with invalid date',
      success: formattedDate === '',
      message: formattedDate === '' ? 'PASS - correctly returned empty string' : 'FAIL - should return empty string'
    });
  } catch (e) {
    testResults.push({
      test: 'Config.gs formatDate with invalid date',
      success: false,
      message: 'ERROR: ' + e.message
    });
  }
  
  // Print results
  console.log('Date Validation Test Results:');
  testResults.forEach(function(result) {
    console.log(result.test + ': ' + (result.success ? '✓' : '✗') + ' ' + result.message);
  });
  
  return testResults;
}

/**
 * Test business logic validation fixes
 */
function testBusinessLogicFixes() {
  console.log('=== Testing Business Logic Fixes ===');
  
  var testResults = [];
  
  // Test 1: Inventory operation validation
  try {
    var validation = ValidationUtils.validateInventoryOperation(100, 'Test Fee');
    testResults.push({
      test: 'ValidationUtils.validateInventoryOperation with positive value',
      success: validation.success,
      message: validation.success ? 'PASS' : validation.error
    });
  } catch (e) {
    testResults.push({
      test: 'ValidationUtils.validateInventoryOperation with positive value',
      success: false,
      message: 'ERROR: ' + e.message
    });
  }
  
  // Test 2: Negative inventory operation validation
  try {
    var validation = ValidationUtils.validateInventoryOperation(-50, 'Test Fee');
    testResults.push({
      test: 'ValidationUtils.validateInventoryOperation with negative value',
      success: !validation.success,
      message: validation.success ? 'FAIL - should have failed' : 'PASS - correctly rejected negative value'
    });
  } catch (e) {
    testResults.push({
      test: 'ValidationUtils.validateInventoryOperation with negative value',
      success: false,
      message: 'ERROR: ' + e.message
    });
  }
  
  // Test 3: Zero inventory operation validation
  try {
    var validation = ValidationUtils.validateInventoryOperation(0, 'Test Fee');
    testResults.push({
      test: 'ValidationUtils.validateInventoryOperation with zero value',
      success: validation.success,
      message: validation.success ? 'PASS' : validation.error
    });
  } catch (e) {
    testResults.push({
      test: 'ValidationUtils.validateInventoryOperation with zero value',
      success: false,
      message: 'ERROR: ' + e.message
    });
  }
  
  // Test 4: Non-numeric inventory operation validation
  try {
    var validation = ValidationUtils.validateInventoryOperation('invalid', 'Test Fee');
    testResults.push({
      test: 'ValidationUtils.validateInventoryOperation with non-numeric value',
      success: !validation.success,
      message: validation.success ? 'FAIL - should have failed' : 'PASS - correctly rejected non-numeric value'
    });
  } catch (e) {
    testResults.push({
      test: 'ValidationUtils.validateInventoryOperation with non-numeric value',
      success: false,
      message: 'ERROR: ' + e.message
    });
  }
  
  // Print results
  console.log('Business Logic Test Results:');
  testResults.forEach(function(result) {
    console.log(result.test + ': ' + (result.success ? '✓' : '✗') + ' ' + result.message);
  });
  
  return testResults;
}

/**
 * Test structure fixes (null checks)
 */
function testStructureFixes() {
  console.log('=== Testing Structure Fixes ===');
  
  var testResults = [];
  
  // Test 1: Check if SharedUtils.checkSpreadsheetAccess is available
  try {
    if (typeof SharedUtils !== 'undefined' && typeof SharedUtils.checkSpreadsheetAccess === 'function') {
      testResults.push({
        test: 'SharedUtils.checkSpreadsheetAccess function exists',
        success: true,
        message: 'PASS - function is available'
      });
    } else {
      testResults.push({
        test: 'SharedUtils.checkSpreadsheetAccess function exists',
        success: false,
        message: 'FAIL - function not available'
      });
    }
  } catch (e) {
    testResults.push({
      test: 'SharedUtils.checkSpreadsheetAccess function exists',
      success: false,
      message: 'ERROR: ' + e.message
    });
  }
  
  // Test 2: Check if ValidationUtils functions are available
  try {
    if (typeof ValidationUtils !== 'undefined' && 
        typeof ValidationUtils.validateDate === 'function' &&
        typeof ValidationUtils.createDateSafely === 'function') {
      testResults.push({
        test: 'ValidationUtils enhanced functions available',
        success: true,
        message: 'PASS - enhanced functions are available'
      });
    } else {
      testResults.push({
        test: 'ValidationUtils enhanced functions available',
        success: false,
        message: 'FAIL - enhanced functions not available'
      });
    }
  } catch (e) {
    testResults.push({
      test: 'ValidationUtils enhanced functions available',
      success: false,
      message: 'ERROR: ' + e.message
    });
  }
  
  // Print results
  console.log('Structure Test Results:');
  testResults.forEach(function(result) {
    console.log(result.test + ': ' + (result.success ? '✓' : '✗') + ' ' + result.message);
  });
  
  return testResults;
}

/**
 * Run all runtime fix tests
 */
function runAllRuntimeFixTests() {
  console.log('=== Running All Runtime Fix Tests ===');
  
  var allResults = [];
  
  try {
    var dateResults = testDateValidationFixes();
    allResults = allResults.concat(dateResults);
    
    var businessResults = testBusinessLogicFixes();
    allResults = allResults.concat(businessResults);
    
    var structureResults = testStructureFixes();
    allResults = allResults.concat(structureResults);
    
    // Summary
    var passed = allResults.filter(function(r) { return r.success; }).length;
    var total = allResults.length;
    
    console.log('=== Test Summary ===');
    console.log('Total tests: ' + total);
    console.log('Passed: ' + passed);
    console.log('Failed: ' + (total - passed));
    console.log('Success rate: ' + Math.round((passed / total) * 100) + '%');
    
    if (passed === total) {
      console.log('🎉 All tests passed! Runtime fixes are working correctly.');
    } else {
      console.log('⚠️ Some tests failed. Please review the failures above.');
    }
    
    return allResults;
    
  } catch (e) {
    console.error('Error running tests:', e);
    return [{ test: 'Test execution', success: false, message: 'ERROR: ' + e.message }];
  }
}

/**
 * Quick health check for runtime fixes
 */
function quickRuntimeHealthCheck() {
  console.log('=== Quick Runtime Health Check ===');
  
  var checks = [];
  
  // Check 1: Date validation
  try {
    var validation = ValidationUtils.validateDate(new Date());
    checks.push('Date validation: ' + (validation.success ? '✓' : '✗'));
  } catch (e) {
    checks.push('Date validation: ✗ (ERROR: ' + e.message + ')');
  }
  
  // Check 2: Inventory validation
  try {
    var validation = ValidationUtils.validateInventoryOperation(100, 'Test');
    checks.push('Inventory validation: ' + (validation.success ? '✓' : '✗'));
  } catch (e) {
    checks.push('Inventory validation: ✗ (ERROR: ' + e.message + ')');
  }
  
  // Check 3: Safe date creation
  try {
    var date = ValidationUtils.createDateSafely(new Date());
    checks.push('Safe date creation: ' + (date !== null ? '✓' : '✗'));
  } catch (e) {
    checks.push('Safe date creation: ✗ (ERROR: ' + e.message + ')');
  }
  
  // Check 4: Format date function
  try {
    var formatted = formatDate(new Date());
    checks.push('Format date function: ' + (typeof formatted === 'string' ? '✓' : '✗'));
  } catch (e) {
    checks.push('Format date function: ✗ (ERROR: ' + e.message + ')');
  }
  
  checks.forEach(function(check) {
    console.log(check);
  });
  
  return checks;
}