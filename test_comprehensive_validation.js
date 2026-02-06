/**
 * Comprehensive Validation System Tests
 * Tests for the enhanced validation system with case-insensitive matching and robust error handling
 */

function testComprehensiveValidation() {
  console.log('🧪 Running Comprehensive Validation Tests...');

  var testResults = {
    prospectsValidation: [],
    outreachValidation: [],
    csvParsing: [],
    validationReport: [],
    caseInsensitiveMatching: [],
    dataNormalization: []
  };

  // Test prospects validation
  testResults.prospectsValidation = testProspectsValidation();

  // Test outreach validation
  testResults.outreachValidation = testOutreachValidation();

  // Test CSV parsing
  testResults.csvParsing = testCSVParsing();

  // Test validation report generation
  testResults.validationReport = testValidationReport();

  // Test case-insensitive matching
  testResults.caseInsensitiveMatching = testCaseInsensitiveMatching();

  // Test data normalization
  testResults.dataNormalization = testDataNormalization();

  // Log results
  logComprehensiveTestResults(testResults);

  return testResults;
}

/**
 * Test prospects data validation
 */
function testProspectsValidation() {
  var results = [];

  // Test 1: Valid prospects data
  try {
    var validProspectsData = [
      ['Company ID', 'Address', 'Zip Code', 'Company Name', 'Industry', 'Latitude', 'Longitude',
       'Last Outcome', 'Last Outreach Date', 'Days Since Last Contact', 'Next Step Due Countdown',
       'Next Steps Due Date', 'Contact Status', 'Close Probability', 'Priority Score',
       'UrgencyBand', 'Urgency Score', 'Last Activity Type'],
      ['1', '123 Main St', '75001', 'Acme Corp', 'Auto Repair', '32.978', '-96.805',
       'Interested', '01/15/2026', '10', '5', '01/20/2026', 'Warm', '75', '85',
       'High', '90', 'Phone']
    ];

    var validationResult = validateProspectsData(validProspectsData);
    results.push({
      success: validationResult.success,
      test: 'Valid prospects data',
      details: {
        validRows: validationResult.statistics.validRows,
        invalidRows: validationResult.statistics.invalidRows,
        warnings: validationResult.statistics.warnings
      }
    });
  } catch (e) {
    results.push({
      success: false,
      test: 'Valid prospects data',
      error: e.message
    });
  }

  // Test 2: Invalid industry
  try {
    var invalidIndustryData = [
      ['Company ID', 'Address', 'Zip Code', 'Company Name', 'Industry', 'Latitude', 'Longitude',
       'Last Outcome', 'Last Outreach Date', 'Days Since Last Contact', 'Next Step Due Countdown',
       'Next Steps Due Date', 'Contact Status', 'Close Probability', 'Priority Score',
       'UrgencyBand', 'Urgency Score', 'Last Activity Type'],
      ['2', '456 Oak Ave', '75002', 'Beta Inc', 'Invalid Industry', '32.978', '-96.805',
       'Interested', '01/15/2026', '10', '5', '01/20/2026', 'Warm', '75', '85',
       'High', '90', 'Phone']
    ];

    var validationResult = validateProspectsData(invalidIndustryData);
    results.push({
      success: !validationResult.success,
      test: 'Invalid industry detection',
      details: {
        errors: validationResult.invalidRows.length > 0 ? validationResult.invalidRows[0].errors : []
      }
    });
  } catch (e) {
    results.push({
      success: false,
      test: 'Invalid industry detection',
      error: e.message
    });
  }

  // Test 3: Missing required fields
  try {
    var missingFieldsData = [
      ['Company ID', 'Address', 'Zip Code', 'Company Name', 'Industry', 'Latitude', 'Longitude',
       'Last Outcome', 'Last Outreach Date', 'Days Since Last Contact', 'Next Step Due Countdown',
       'Next Steps Due Date', 'Contact Status', 'Close Probability', 'Priority Score',
       'UrgencyBand', 'Urgency Score', 'Last Activity Type'],
      ['', '', '', '', '', '', '',
       '', '', '', '', '', '', '', '',
       '', '', '']
    ];

    var validationResult = validateProspectsData(missingFieldsData);
    results.push({
      success: !validationResult.success,
      test: 'Missing required fields detection',
      details: {
        errors: validationResult.invalidRows.length > 0 ? validationResult.invalidRows[0].errors : []
      }
    });
  } catch (e) {
    results.push({
      success: false,
      test: 'Missing required fields detection',
      error: e.message
    });
  }

  return results;
}

/**
 * Test outreach data validation
 */
function testOutreachValidation() {
  var results = [];

  // Test 1: Valid outreach data
  try {
    var validOutreachData = [
      ['Outreach ID', 'Company ID', 'Company', 'Visit Date', 'Notes', 'Outcome', 'Stage',
       'Status', 'Next Visit Date', 'Days Since Last Visit', 'Next Visit Countdown',
       'Outcome Category', 'Follow Up Action', 'Owner', 'Prospects Match', 'Contact Type', 'Email Sent'],
      ['1', '1', 'Acme Corp', '01/15/2026', 'Great meeting', 'Interested', 'Qualification',
       'Warm', '01/20/2026', '10', '5', 'Interested', 'Follow up call', 'Kyle Buzbee', 'TRUE', 'Phone', 'TRUE']
    ];

    var validationResult = validateOutreachData(validOutreachData);
    results.push({
      success: validationResult.success,
      test: 'Valid outreach data',
      details: {
        validRows: validationResult.statistics.validRows,
        invalidRows: validationResult.statistics.invalidRows,
        warnings: validationResult.statistics.warnings
      }
    });
  } catch (e) {
    results.push({
      success: false,
      test: 'Valid outreach data',
      error: e.message
    });
  }

  // Test 2: Invalid outcome category
  try {
    var invalidOutcomeData = [
      ['Outreach ID', 'Company ID', 'Company', 'Visit Date', 'Notes', 'Outcome', 'Stage',
       'Status', 'Next Visit Date', 'Days Since Last Visit', 'Next Visit Countdown',
       'Outcome Category', 'Follow Up Action', 'Owner', 'Prospects Match', 'Contact Type', 'Email Sent'],
      ['2', '2', 'Beta Inc', '01/15/2026', 'Meeting', 'Interested', 'Qualification',
       'Warm', '01/20/2026', '10', '5', 'Invalid Category', 'Follow up', 'Kyle Buzbee', 'TRUE', 'Phone', 'TRUE']
    ];

    var validationResult = validateOutreachData(invalidOutcomeData);
    results.push({
      success: !validationResult.success,
      test: 'Invalid outcome category detection',
      details: {
        errors: validationResult.invalidRows.length > 0 ? validationResult.invalidRows[0].errors : []
      }
    });
  } catch (e) {
    results.push({
      success: false,
      test: 'Invalid outcome category detection',
      error: e.message
    });
  }

  // Test 3: Invalid date format
  try {
    var invalidDateData = [
      ['Outreach ID', 'Company ID', 'Company', 'Visit Date', 'Notes', 'Outcome', 'Stage',
       'Status', 'Next Visit Date', 'Days Since Last Visit', 'Next Visit Countdown',
       'Outcome Category', 'Follow Up Action', 'Owner', 'Prospects Match', 'Contact Type', 'Email Sent'],
      ['3', '3', 'Gamma LLC', 'invalid-date', 'Meeting', 'Interested', 'Qualification',
       'Warm', '01/20/2026', '10', '5', 'Interested', 'Follow up', 'Kyle Buzbee', 'TRUE', 'Phone', 'TRUE']
    ];

    var validationResult = validateOutreachData(invalidDateData);
    results.push({
      success: !validationResult.success,
      test: 'Invalid date format detection',
      details: {
        errors: validationResult.invalidRows.length > 0 ? validationResult.invalidRows[0].errors : []
      }
    });
  } catch (e) {
    results.push({
      success: false,
      test: 'Invalid date format detection',
      error: e.message
    });
  }

  return results;
}

/**
 * Test CSV parsing functionality
 */
function testCSVParsing() {
  var results = [];

  // Test 1: Simple CSV parsing
  try {
    var simpleCSV = 'Company ID,Company Name,Industry\n1,Acme Corp,Auto Repair\n2,Beta Inc,Plumbing';

    var parseResult = parseCSV(simpleCSV);
    results.push({
      success: parseResult.success && parseResult.data.length === 4, // Header + 2 data rows + empty row
      test: 'Simple CSV parsing',
      details: {
        parsedLines: parseResult.statistics.parsedLines,
        errorLines: parseResult.statistics.errorLines
      }
    });
  } catch (e) {
    results.push({
      success: false,
      test: 'Simple CSV parsing',
      error: e.message
    });
  }

  // Test 2: CSV with quoted fields
  try {
    var quotedCSV = 'Company ID,Company Name,Industry\n1,"Acme Corp, LLC",Auto Repair\n2,"Beta Inc",Plumbing';

    var parseResult = parseCSV(quotedCSV);
    results.push({
      success: parseResult.success && parseResult.data.length > 0,
      test: 'CSV with quoted fields',
      details: {
        parsedLines: parseResult.statistics.parsedLines,
        firstRow: parseResult.data[1] // First data row
      }
    });
  } catch (e) {
    results.push({
      success: false,
      test: 'CSV with quoted fields',
      error: e.message
    });
  }

  return results;
}

/**
 * Test validation report generation
 */
function testValidationReport() {
  var results = [];

  // Create mock validation results
  var mockValidationResults = {
    statistics: {
      totalRows: 10,
      validRows: 8,
      invalidRows: 2,
      warnings: 3
    },
    invalidRows: [
      {
        rowNumber: 2,
        errors: [
          { field: 'Industry', error: 'Invalid industry: InvalidIndustry', severity: 'high' },
          { field: 'Status', error: 'Invalid status: UnknownStatus', severity: 'high' }
        ]
      },
      {
        rowNumber: 5,
        errors: [
          { field: 'Zip Code', error: 'Invalid zip code format: ABC12', severity: 'low' }
        ]
      }
    ],
    warnings: [
      { field: 'Industry', warning: 'Industry normalized from "auto" to "auto"', rowNumber: 3 },
      { field: 'Zip Code', warning: 'Zip code normalized from "75001-" to "75001"', rowNumber: 7 },
      { field: 'Status', warning: 'Status normalized from "WARM" to "warm"', rowNumber: 8 }
    ]
  };

  try {
    var report = generateValidationReport(mockValidationResults);
    results.push({
      success: report.success && report.summary.successRate === 80,
      test: 'Validation report generation',
      details: {
        summary: report.summary,
        errorBreakdown: Object.keys(report.errorBreakdown),
        warningBreakdown: Object.keys(report.warningBreakdown),
        suggestions: report.suggestions
      }
    });
  } catch (e) {
    results.push({
      success: false,
      test: 'Validation report generation',
      error: e.message
    });
  }

  return results;
}

/**
 * Test case-insensitive matching
 */
function testCaseInsensitiveMatching() {
  var results = [];

  // Test 1: Case-insensitive industry validation
  try {
    var caseTestData = [
      ['Company ID', 'Address', 'Zip Code', 'Company Name', 'Industry', 'Latitude', 'Longitude',
       'Last Outcome', 'Last Outreach Date', 'Days Since Last Contact', 'Next Step Due Countdown',
       'Next Steps Due Date', 'Contact Status', 'Close Probability', 'Priority Score',
       'UrgencyBand', 'Urgency Score', 'Last Activity Type'],
      ['1', '123 Main St', '75001', 'Acme Corp', 'AUTO REPAIR', '32.978', '-96.805',
       'Interested', '01/15/2026', '10', '5', '01/20/2026', 'Warm', '75', '85',
       'High', '90', 'Phone']
    ];

    var validationResult = validateProspectsData(caseTestData);
    results.push({
      success: validationResult.success,
      test: 'Case-insensitive industry validation',
      details: {
        validRows: validationResult.statistics.validRows,
        warnings: validationResult.statistics.warnings
      }
    });
  } catch (e) {
    results.push({
      success: false,
      test: 'Case-insensitive industry validation',
      error: e.message
    });
  }

  // Test 2: Case-insensitive status validation
  try {
    var statusTestData = [
      ['Company ID', 'Address', 'Zip Code', 'Company Name', 'Industry', 'Latitude', 'Longitude',
       'Last Outcome', 'Last Outreach Date', 'Days Since Last Contact', 'Next Step Due Countdown',
       'Next Steps Due Date', 'Contact Status', 'Close Probability', 'Priority Score',
       'UrgencyBand', 'Urgency Score', 'Last Activity Type'],
      ['1', '123 Main St', '75001', 'Acme Corp', 'Auto Repair', '32.978', '-96.805',
       'Interested', '01/15/2026', '10', '5', '01/20/2026', 'WARM', '75', '85',
       'High', '90', 'Phone']
    ];

    var validationResult = validateProspectsData(statusTestData);
    results.push({
      success: validationResult.success,
      test: 'Case-insensitive status validation',
      details: {
        validRows: validationResult.statistics.validRows,
        warnings: validationResult.statistics.warnings
      }
    });
  } catch (e) {
    results.push({
      success: false,
      test: 'Case-insensitive status validation',
      error: e.message
    });
  }

  return results;
}

/**
 * Test data normalization
 */
function testDataNormalization() {
  var results = [];

  // Test 1: Data normalization with warnings
  try {
    var normalizationTestData = [
      ['Company ID', 'Address', 'Zip Code', 'Company Name', 'Industry', 'Latitude', 'Longitude',
       'Last Outcome', 'Last Outreach Date', 'Days Since Last Contact', 'Next Step Due Countdown',
       'Next Steps Due Date', 'Contact Status', 'Close Probability', 'Priority Score',
       'UrgencyBand', 'Urgency Score', 'Last Activity Type'],
      ['1', '123 Main St', '75001-1234', 'ACME CORP', 'AUTO REPAIR', '32.978', '-96.805',
       'Interested', '01/15/2026', '10', '5', '01/20/2026', 'WARM', '75', '85',
       'High', '90', 'PHONE']
    ];

    var validationResult = validateProspectsData(normalizationTestData, { normalizeData: true });
    results.push({
      success: validationResult.success && validationResult.statistics.warnings > 0,
      test: 'Data normalization with warnings',
      details: {
        warnings: validationResult.statistics.warnings,
        normalizedData: validationResult.validRows.length > 0 ? validationResult.validRows[0].data : []
      }
    });
  } catch (e) {
    results.push({
      success: false,
      test: 'Data normalization with warnings',
      error: e.message
    });
  }

  // Test 2: Zip code normalization
  try {
    var zipTestData = [
      ['Company ID', 'Address', 'Zip Code', 'Company Name', 'Industry', 'Latitude', 'Longitude',
       'Last Outcome', 'Last Outreach Date', 'Days Since Last Contact', 'Next Step Due Countdown',
       'Next Steps Due Date', 'Contact Status', 'Close Probability', 'Priority Score',
       'UrgencyBand', 'Urgency Score', 'Last Activity Type'],
      ['1', '123 Main St', '75001-1234', 'Acme Corp', 'Auto Repair', '32.978', '-96.805',
       'Interested', '01/15/2026', '10', '5', '01/20/2026', 'Warm', '75', '85',
       'High', '90', 'Phone']
    ];

    var validationResult = validateProspectsData(zipTestData, { normalizeData: true });
    var normalizedZip = validationResult.validRows.length > 0 ?
      validationResult.validRows[0].data[2] : null;

    results.push({
      success: validationResult.success && normalizedZip === '750011234',
      test: 'Zip code normalization',
      details: {
        originalZip: '75001-1234',
        normalizedZip: normalizedZip
      }
    });
  } catch (e) {
    results.push({
      success: false,
      test: 'Zip code normalization',
      error: e.message
    });
  }

  return results;
}

/**
 * Log comprehensive test results
 */
function logComprehensiveTestResults(testResults) {
  console.log('\n📊 Comprehensive Validation Test Results:');

  var totalTests = 0;
  var passedTests = 0;

  Object.keys(testResults).forEach(function(testCategory) {
    var categoryResults = testResults[testCategory];

    console.log('\n✅ ' + testCategory + ':');

    categoryResults.forEach(function(result, index) {
      totalTests++;
      var status = result.success ? '✅' : '❌';

      if (result.success) {
        passedTests++;
        console.log('  ' + status + ' Test ' + (index + 1) + ': ' + result.test);

        if (result.details) {
          console.log('  Details:', JSON.stringify(result.details, null, 2));
        }
      } else {
        console.error('  ' + status + ' Test ' + (index + 1) + ': ' + result.test);
        if (result.error) {
          console.error('  Error:', result.error);
        }
      }
    });
  });

  // Calculate summary
  console.log('\n📈 Test Summary:');
  console.log('  Total Tests: ' + totalTests);
  console.log('  Passed: ' + passedTests);
  console.log('  Failed: ' + (totalTests - passedTests));
  console.log('  Success Rate: ' + Math.round((passedTests / totalTests) * 100) + '%');

  // Return summary for programmatic use
  return {
    totalTests: totalTests,
    passedTests: passedTests,
    failedTests: totalTests - passedTests,
    successRate: Math.round((passedTests / totalTests) * 100)
  };
}

// Add to test runner
function runComprehensiveValidationTests() {
  return testComprehensiveValidation();
}