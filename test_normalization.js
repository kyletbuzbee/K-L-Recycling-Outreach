/**
 * Tests for Normalization utility functions
 */

function testNormalization() {
  console.log('🧪 Running Normalization Tests...');
  
  var testResults = {
    normalizeStatus: [],
    validateAndFixDate: [],
    findDuplicateIDs: [],
    findOrphanedRecords: [],
    runFullDataValidation: [],
    cleanOutreachData: [],
    generateValidationReport: []
  };
  
  // Test normalizeStatus
  testResults.normalizeStatus = testNormalizeStatus();
  
  // Test validateAndFixDate
  testResults.validateAndFixDate = testValidateAndFixDate();
  
  // Test findDuplicateIDs
  testResults.findDuplicateIDs = testFindDuplicateIDs();
  
  // Test findOrphanedRecords
  testResults.findOrphanedRecords = testFindOrphanedRecords();
  
  // Test runFullDataValidation
  testResults.runFullDataValidation = testRunFullDataValidation();
  
  // Test cleanOutreachData
  testResults.cleanOutreachData = testCleanOutreachData();
  
  // Test generateValidationReport
  testResults.generateValidationReport = testGenerateValidationReport();
  
  // Log results
  logTestResults(testResults);
  
  return testResults;
}

function testNormalizeStatus() {
  var testCases = [
    { input: 'warm', expected: 'Warm' },
    { input: 'WARM', expected: 'Warm' },
    { input: 'Warm', expected: 'Warm' },
    { input: 'cold', expected: 'Cold' },
    { input: 'COLD', expected: 'Cold' },
    { input: 'Cold', expected: 'Cold' },
    { input: 'hot', expected: 'Hot' },
    { input: 'HOT', expected: 'Hot' },
    { input: 'Hot', expected: 'Hot' },
    { input: 'active', expected: 'Active' },
    { input: 'inactive', expected: 'Inactive' },
    { input: 'Unknown', expected: 'Unknown' },
    { input: '', expected: null },
    { input: null, expected: null },
    { input: undefined, expected: null }
  ];
  
  var results = [];
  
  testCases.forEach(function(testCase) {
    try {
      var result = Normalization.normalizeStatus(testCase.input);
      var success = result === testCase.expected;
      
      results.push({
        success: success,
        input: testCase.input,
        output: result,
        expected: testCase.expected
      });
    } catch (e) {
      results.push({
        success: false,
        input: testCase.input,
        error: e.message
      });
    }
  });
  
  return results;
}

function testValidateAndFixDate() {
  var testCases = [
    { input: '01/15/2026', expected: true },
    { input: '2026-01-15', expected: true },
    { input: '01152026', expected: true },
    { input: new Date('2026-01-15'), expected: true },
    { input: '12/20/1773', expected: false },
    { input: '01/05/2036', expected: false },
    { input: '', expected: false },
    { input: null, expected: false },
    { input: 'invalid', expected: false }
  ];
  
  var results = [];
  
  testCases.forEach(function(testCase) {
    try {
      var result = Normalization.validateAndFixDate(testCase.input);
      var success = testCase.expected ? (result instanceof Date && !isNaN(result.getTime())) : (result === null);
      
      results.push({
        success: success,
        input: testCase.input,
        output: result ? result.toISOString() : null,
        expected: testCase.expected
      });
    } catch (e) {
      results.push({
        success: false,
        input: testCase.input,
        error: e.message
      });
    }
  });
  
  return results;
}

function testFindDuplicateIDs() {
  var results = [];
  
  try {
    var duplicates = Normalization.findDuplicateIDs(CONFIG.SHEET_OUTREACH);
    results.push({
      success: true,
      input: CONFIG.SHEET_OUTREACH,
      output: duplicates.length + ' duplicates found',
      details: duplicates
    });
  } catch (e) {
    results.push({
      success: false,
      input: CONFIG.SHEET_OUTREACH,
      error: e.message
    });
  }
  
  return results;
}

function testFindOrphanedRecords() {
  var results = [];
  
  try {
    var orphaned = Normalization.findOrphanedRecords();
    results.push({
      success: true,
      input: 'Outreach and Prospects sheets',
      output: orphaned.length + ' orphaned records found',
      details: orphaned
    });
  } catch (e) {
    results.push({
      success: false,
      input: 'Outreach and Prospects sheets',
      error: e.message
    });
  }
  
  return results;
}

function testRunFullDataValidation() {
  var results = [];
  
  try {
    var report = Normalization.runFullDataValidation();
    results.push({
      success: true,
      input: 'Full data validation',
      output: 'Validation completed: ' + report.totalRecords + ' records processed',
      details: {
        duplicates: report.duplicates.length,
        orphans: report.orphanedRecords.length,
        invalidDates: report.invalidDates.length,
        invalidStatuses: report.invalidStatuses.length
      }
    });
  } catch (e) {
    results.push({
      success: false,
      input: 'Full data validation',
      error: e.message
    });
  }
  
  return results;
}

function testCleanOutreachData() {
  var results = [];
  
  try {
    var result = Normalization.cleanOutreachData();
    results.push({
      success: true,
      input: 'Outreach data cleaning',
      output: result.changes + ' changes made',
      details: result
    });
  } catch (e) {
    results.push({
      success: false,
      input: 'Outreach data cleaning',
      error: e.message
    });
  }
  
  return results;
}

function testGenerateValidationReport() {
  var results = [];
  
  try {
    var report = Normalization.generateValidationReport();
    results.push({
      success: true,
      input: 'Validation report generation',
      output: 'Report generated: ' + report.reportSheet,
      details: report
    });
  } catch (e) {
    results.push({
      success: false,
      input: 'Validation report generation',
      error: e.message
    });
  }
  
  return results;
}

function logTestResults(testResults) {
  console.log('\n📊 Normalization Test Results:');
  
  Object.keys(testResults).forEach(function(testName) {
    var results = testResults[testName];
    
    console.log('\n✅ ' + testName + ':');
    
    results.forEach(function(result, index) {
      var status = result.success ? '✅' : '❌';
      
      if (result.success) {
        console.log('  ' + status + ' Test ' + (index + 1) + ': ' + 
                    (result.input ? JSON.stringify(result.input) : 'null') + 
                    ' -> ' + (result.output ? JSON.stringify(result.output) : 'null'));
        
        if (result.details) {
          console.log('  Details:', JSON.stringify(result.details));
        }
      } else {
        console.error('  ' + status + ' Test ' + (index + 1) + ': ' + 
                     (result.input ? JSON.stringify(result.input) : 'null') + 
                     ' -> Error: ' + result.error);
      }
    });
  });
  
  // Calculate summary
  var totalTests = 0;
  var passedTests = 0;
  
  Object.values(testResults).forEach(function(results) {
    results.forEach(function(result) {
      totalTests++;
      if (result.success) passedTests++;
    });
  });
  
  console.log('\n📈 Test Summary:');
  console.log('  Total Tests: ' + totalTests);
  console.log('  Passed: ' + passedTests);
  console.log('  Failed: ' + (totalTests - passedTests));
  console.log('  Success Rate: ' + Math.round((passedTests / totalTests) * 100) + '%');
}

// Add to test runner
function runNormalizationTests() {
  return testNormalization();
}
