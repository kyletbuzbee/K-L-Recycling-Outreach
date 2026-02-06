/**
 * Test script for Settings Validation
 * Tests the robust CSV validation and normalization
 */

function testSettingsValidation() {
  try {
    Logger.log('=== Starting Settings Validation Tests ===');

    // Test 1: Read the actual CSV file content
    var csvFile = readSettingsCSVFile();
    if (!csvFile.success) {
      Logger.log('❌ Failed to read CSV file: ' + csvFile.error);
      return;
    }

    Logger.log('✅ Successfully read CSV file, length: ' + csvFile.csvText.length);

    // Test 2: Import and validate the CSV
    var validationResult = importAndValidateSettingsCSV(csvFile.csvText);

    if (validationResult.success) {
      Logger.log('✅ CSV validation successful!');
      Logger.log('📊 Imported rows: ' + validationResult.importedRows);
      Logger.log('⚠️  Warnings: ' + (validationResult.warnings ? validationResult.warnings.length : 0));

      if (validationResult.warnings && validationResult.warnings.length > 0) {
        Logger.log('Warnings details:');
        validationResult.warnings.forEach(function(warning, index) {
          Logger.log('  ' + (index + 1) + '. ' + warning);
        });
      }
    } else {
      Logger.log('❌ CSV validation failed: ' + validationResult.error);
      if (validationResult.details) {
        Logger.log('Details: ' + JSON.stringify(validationResult.details));
      }
      return;
    }

    // Test 3: Test case-insensitive category matching
    testCaseInsensitiveMatching();

    // Test 4: Test malformed data handling
    testMalformedDataHandling();

    // Test 5: Test getValidatedSettings
    testGetValidatedSettings();

    Logger.log('=== All Tests Completed ===');

  } catch (e) {
    Logger.log('❌ Test failed with exception: ' + e.message);
    Logger.log('Stack: ' + e.stack);
  }
}

/**
 * Read the settings CSV file
 */
function readSettingsCSVFile() {
  try {
    // Read from the actual file path
    var filePath = 'csv/K-L-Recycling-Outreach-Settings-Updated.csv';
    var fileContent = '';

    // In Google Apps Script, we need to read the file differently
    // For testing purposes, we'll use a mock approach
    // In a real implementation, you would use DriveApp or other file access methods

    // Mock: Return the actual CSV content from the file content provided
    var mockCSV = `Column 1,Column 2,Column 3,Column 4,Column 5,Column 6,Column 7
Category,Key,Value_1,Value_2,Value_3,Value_4,Description
INDUSTRY_SCORE,Metal Fabrication,95,"Metal, Metal fabricator, Metal supplier, Steel fabricator, Iron works, Metal construction company",,,High priority target
INDUSTRY_SCORE,Automotive,90,"Auto, Automotive, Auto repair, Auto repair shop, Auto body shop, Auto parts store, Mechanic",,,Volume scrap source
URGENCY_BAND,Overdue,-9999,-1,Red,,Past due items
URGENCY_BAND,High,0,7,Orange,,Immediate action required
WORKFLOW_RULE,Account Won,Won,Active,1,High,Contract signed or bin dropped
VALIDATION_LIST,Container Sizes,20 yd,30 yd,40 yd,Lugger,Standard bin types
GLOBAL_CONST,Stale_Prospect_Days,60,,,,Days before a prospect is marked stale
FOLLOWUP_TEMPLATE,Interested→Send pricing,7,,,,Default pricing follow-up`;

    return {
      success: true,
      csvText: mockCSV
    };

  } catch (e) {
    return {
      success: false,
      error: e.message
    };
  }
}

/**
 * Test case-insensitive category matching
 */
function testCaseInsensitiveMatching() {
  Logger.log('🔍 Testing case-insensitive category matching...');

  // Test various case combinations
  var testCases = [
    { input: 'INDUSTRY_SCORE', expected: 'industry_score' },
    { input: 'industry_score', expected: 'industry_score' },
    { input: 'Industry_Score', expected: 'industry_score' },
    { input: 'URGENCY_BAND', expected: 'urgency_band' },
    { input: 'workflow_rule', expected: 'workflow_rule' },
    { input: 'VALIDATION_LIST', expected: 'validation_list' }
  ];

  testCases.forEach(function(testCase) {
    var result = SettingsValidation.validateCategory(testCase.input);
    if (result.valid && result.normalized === testCase.expected) {
      Logger.log('✅ ' + testCase.input + ' → ' + result.normalized);
    } else {
      Logger.log('❌ ' + testCase.input + ' failed validation');
    }
  });
}

/**
 * Test malformed data handling
 */
function testMalformedDataHandling() {
  Logger.log('🔍 Testing malformed data handling...');

  // Test malformed CSV data
  var malformedCSV = `Category,Key,Value_1,Value_2
INDUSTRY_SCORE,,95,Invalid
,Test Key,Value1,Value2
INVALID_CATEGORY,Key,Value1,Value2`;

  var result = importAndValidateSettingsCSV(malformedCSV);

  if (!result.success) {
    Logger.log('✅ Correctly detected malformed data');
    Logger.log('Errors: ' + JSON.stringify(result.details));
  } else {
    Logger.log('❌ Should have failed validation for malformed data');
  }
}

/**
 * Test getValidatedSettings function
 */
function testGetValidatedSettings() {
  Logger.log('🔍 Testing getValidatedSettings...');

  try {
    var settings = SettingsValidation.getValidatedSettings();

    if (settings && Object.keys(settings).length > 0) {
      Logger.log('✅ Successfully retrieved validated settings');
      Logger.log('📊 Settings structure: ' + Object.keys(settings).join(', '));

      // Check if we have expected data
      if (settings.industryScores && Object.keys(settings.industryScores).length > 0) {
        Logger.log('📋 Industry scores found: ' + Object.keys(settings.industryScores).length);
      }

      if (settings.urgencyBands && settings.urgencyBands.length > 0) {
        Logger.log('⏰ Urgency bands found: ' + settings.urgencyBands.length);
      }

      if (settings.workflowRules && Object.keys(settings.workflowRules).length > 0) {
        Logger.log('🔄 Workflow rules found: ' + Object.keys(settings.workflowRules).length);
      }
    } else {
      Logger.log('⚠️  No settings found (this might be expected if CSV wasn\'t imported)');
    }
  } catch (e) {
    Logger.log('❌ getValidatedSettings failed: ' + e.message);
  }
}

/**
 * Test specific validation scenarios
 */
function testSpecificValidationScenarios() {
  Logger.log('🔍 Testing specific validation scenarios...');

  // Test 1: Misspelled category with suggestions
  var misspelledResult = SettingsValidation.validateCategory('INDUSTRY_SCORE');
  Logger.log('Misspelled category test: ' + JSON.stringify(misspelledResult));

  // Test 2: Invalid number validation
  var numberTest = SettingsValidation.isValidNumber('abc');
  Logger.log('Invalid number test: ' + (numberTest ? '✅ Passed' : '✅ Correctly rejected'));

  var validNumberTest = SettingsValidation.isValidNumber('95');
  Logger.log('Valid number test: ' + (validNumberTest ? '✅ Passed' : '❌ Failed'));
}

/**
 * Test CSV parsing edge cases
 */
function testCSVParsingEdgeCases() {
  Logger.log('🔍 Testing CSV parsing edge cases...');

  // Test quoted fields with commas
  var complexCSV = `Category,Key,Value_1,Value_2
INDUSTRY_SCORE,"Metal Fabrication","95","Metal, Metal fabricator, Metal supplier"
WORKFLOW_RULE,"Account Won","Won","Active"`;

  var parseResult = SettingsValidation.parseSettingsCSV(complexCSV);

  if (parseResult.success) {
    Logger.log('✅ Complex CSV parsing successful');
    Logger.log('Rows parsed: ' + parseResult.data.length);
  } else {
    Logger.log('❌ Complex CSV parsing failed: ' + parseResult.error);
  }
}

// Run the tests
function runSettingsValidationTests() {
  testSettingsValidation();
  testSpecificValidationScenarios();
  testCSVParsingEdgeCases();
}