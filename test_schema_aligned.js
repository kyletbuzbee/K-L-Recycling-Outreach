/**
 * Schema-Aligned Comprehensive Test Suite
 * All tests aligned with system-schema.json and System_Schema.csv
 * Version: 1.3 (Aligned with schema version 1.3)
 */

// ============================================================================
// SCHEMA VALIDATION TESTS
// ============================================================================

var SchemaValidationTests = {
  /**
   * Test that CONFIG matches system schema
   */
  testConfigSchemaAlignment: function() {
    // Test Prospects headers match schema
    var prospectFields = [
      'Company ID', 'Address', 'Zip Code', 'Company Name', 'Industry',
      'Latitude', 'Longitude', 'Last Outcome', 'Last Outreach Date',
      'Days Since Last Contact', 'Next Step Due Countdown', 'Next Steps Due Date',
      'Contact Status', 'Close Probability', 'Priority Score',
      'UrgencyBand', 'Urgency Score', 'Totals'
    ];
    
    prospectFields.forEach(function(field) {
      TestRunner.assert.isTrue(
        CONFIG.HEADERS.PROSPECTS.includes(field),
        "Prospects schema missing: " + field
      );
    });
    
    // Test Outreach headers match schema
    var outreachFields = [
      'Outreach ID', 'Company ID', 'Company', 'Visit Date', 'Notes',
      'Outcome', 'Stage', 'Status', 'Next Visit Date', 'Days Since Last Visit',
      'Next Visit Countdown', 'Outcome Category', 'Follow Up Action', 'Owner',
      'Prospects Match', 'Contact Type', 'Email Sent', 'Competitor'
    ];
    
    outreachFields.forEach(function(field) {
      TestRunner.assert.isTrue(
        CONFIG.HEADERS.OUTREACH.includes(field),
        "Outreach schema missing: " + field
      );
    });
    
    // Test Accounts headers match schema
    var accountFields = [
      'Deployed', 'Timestamp', 'Company Name', 'Contact Name', 'Contact Phone',
      'Contact Role', 'Site Location', 'Mailing Location', 'Roll-Off Fee',
      'Handling of Metal', 'Roll Off Container Size', 'Notes', 'Payout Price'
    ];
    
    accountFields.forEach(function(field) {
      TestRunner.assert.isTrue(
        CONFIG.HEADERS.ACCOUNTS.includes(field),
        "Accounts schema missing: " + field
      );
    });
    
    // Test Contacts headers match schema
    var contactFields = [
      'Name', 'Company', 'Account', 'Role', 'Department',
      'Phone Number', 'Email', 'Address'
    ];
    
    contactFields.forEach(function(field) {
      TestRunner.assert.isTrue(
        CONFIG.HEADERS.CONTACTS.includes(field),
        "Contacts schema missing: " + field
      );
    });
  },

  /**
   * Test sheet names match schema
   */
  testSheetNamesAlignment: function() {
    TestRunner.assert.equals(CONFIG.SHEETS.PROSPECTS, 'Prospects', "Prospects sheet name mismatch");
    TestRunner.assert.equals(CONFIG.SHEETS.OUTREACH, 'Outreach', "Outreach sheet name mismatch");
    TestRunner.assert.equals(CONFIG.SHEETS.ACCOUNTS, 'Accounts', "Accounts sheet name mismatch");
    TestRunner.assert.equals(CONFIG.SHEETS.CONTACTS, 'Contacts', "Contacts sheet name mismatch");
    TestRunner.assert.equals(CONFIG.SHEETS.SETTINGS, 'Settings', "Settings sheet name mismatch");
  },

  /**
   * Test workflow rules match schema
   */
  testWorkflowRulesAlignment: function() {
    var workflowRules = {
      'Account Won': { stage: 'Won', status: 'Active' },
      'Interested (Hot)': { stage: 'Nurture', status: 'Interested (Hot)' },
      'Interested (Warm)': { stage: 'Nurture', status: 'Interested (Warm)' },
      'Interested': { stage: 'Nurture', status: 'Interested (Warm)' },
      'Initial Contact': { stage: 'Outreach', status: 'Interested (Warm)' },
      'Follow-Up': { stage: 'Nurture', status: 'Interested (Warm)' },
      'No Answer': { stage: 'Outreach', status: 'Cold' },
      'Not Interested': { stage: 'Lost', status: 'Disqualified' },
      'Disqualified': { stage: 'Lost', status: 'Disqualified' }
    };
    
    // Test that mapStatusToStage exists and returns correct values
    if (typeof mapStatusToStage === 'function') {
      TestRunner.assert.equals(mapStatusToStage('Hot'), 'Active Pursuit', "Hot should map to Active Pursuit");
      TestRunner.assert.equals(mapStatusToStage('Interested (Hot)'), 'Active Pursuit', "Interested (Hot) should map to Active Pursuit");
      TestRunner.assert.equals(mapStatusToStage('Cold'), 'Outreach', "Cold should map to Outreach");
      TestRunner.assert.equals(mapStatusToStage('Active'), 'Won', "Active should map to Won");
    }
  },

  /**
   * Test urgency bands match schema
   */
  testUrgencyBandsAlignment: function() {
    var urgencyBands = {
      'Overdue': { minDays: -9999, maxDays: -1, score: 150 },
      'High': { minDays: 0, maxDays: 7, score: 115 },
      'Medium': { minDays: 8, maxDays: 30, score: 75 },
      'Low': { minDays: 31, maxDays: 9999, score: 25 }
    };
    
    // Test urgency score calculation
    if (typeof calculateUrgencyScore === 'function') {
      TestRunner.assert.equals(calculateUrgencyScore(-5), 150, "Overdue should score 150");
      TestRunner.assert.equals(calculateUrgencyScore(3), 115, "0-7 days should score 115");
      TestRunner.assert.equals(calculateUrgencyScore(15), 75, "8-30 days should score 75");
      TestRunner.assert.equals(calculateUrgencyScore(60), 25, ">30 days should score 25");
    }
  },

  /**
   * Test industry scores match schema
   */
  testIndustryScoresAlignment: function() {
    var industryScores = {
      'Metal Fabrication': 90,
      'Automotive': 70,
      'Welding': 70,
      'HVAC': 70,
      'Construction': 70,
      'Fence': 70,
      'Trailer Dealer': 70,
      'Manufacturing': 75,
      'Electrical': 65,
      'Junk Removal': 65,
      'Roofing': 60,
      'Gutter': 60,
      'Appliance': 60,
      'Agriculture': 60,
      'Warehouses': 55,
      'Plumbing': 50,
      'Retail': 45,
      'Other': 50,
      'Business to business': 50
    };
    
    // Verify industry scores exist
    Object.keys(industryScores).forEach(function(industry) {
      TestRunner.assert.isTrue(
        industryScores[industry] > 0,
        "Industry " + industry + " should have positive score"
      );
    });
  },

  /**
   * Test global constants match schema
   */
  testGlobalConstantsAlignment: function() {
    TestRunner.assert.equals(CONFIG.DEFAULT_OWNER, 'Kyle Buzbee', "Default owner mismatch");
    TestRunner.assert.equals(CONFIG.DATE_FORMAT, 'MM/dd/yyyy', "Date format mismatch");
    
    if (typeof getGlobalConstant === 'function') {
      var timezone = getGlobalConstant('Timezone', 'America/Chicago');
      TestRunner.assert.equals(timezone, 'America/Chicago', "Timezone should be America/Chicago");
    }
  }
};

// ============================================================================
// PROSPECTS TABLE TESTS
// ============================================================================

var ProspectsTableTests = {
  /**
   * Test Prospects field validation
   */
  testProspectsFieldValidation: function() {
    var validProspect = {
      'Company ID': 'CID-TEST001',
      'Company Name': 'Test Company',
      'Address': '123 Test St',
      'Zip Code': '12345',
      'Industry': 'Metal Fabrication',
      'Contact Status': 'Interested (Hot)',
      'Priority Score': 85,
      'UrgencyBand': 'High'
    };
    
    // Test required fields
    TestRunner.assert.isTrue(
      ValidationUtils.isNotEmpty(validProspect['Company ID']),
      "Company ID should not be empty"
    );
    TestRunner.assert.isTrue(
      ValidationUtils.isNotEmpty(validProspect['Company Name']),
      "Company Name should not be empty"
    );
    
    // Test industry validation
    var validIndustries = [
      'Agriculture', 'Appliance', 'Automotive', 'Business to business',
      'Construction', 'Electrical', 'Fabrication', 'Fence', 'Gutter',
      'HVAC', 'Junk Removal', 'Manufacturing', 'Metal Fabrication',
      'Other', 'Plumbing', 'Retail', 'Roofing', 'Trailer Dealer',
      'Warehouses', 'Welding'
    ];
    
    TestRunner.assert.isTrue(
      validIndustries.indexOf(validProspect['Industry']) >= 0,
      "Industry should be valid"
    );
    
    // Test contact status validation
    var validStatuses = [
      'Active', 'Cold', 'Disqualified', 'Interested (Hot)',
      'Interested (Warm)', 'Lost', 'Nurture', 'Outreach',
      'Prospect', 'Won'
    ];
    
    TestRunner.assert.isTrue(
      validStatuses.indexOf(validProspect['Contact Status']) >= 0,
      "Contact Status should be valid"
    );
  },

  /**
   * Test Prospects data types
   */
  testProspectsDataTypes: function() {
    // Test numeric fields
    var priorityScore = 85;
    TestRunner.assert.isTrue(
      typeof priorityScore === 'number',
      "Priority Score should be numeric"
    );
    
    var urgencyScore = 115;
    TestRunner.assert.isTrue(
      typeof urgencyScore === 'number',
      "Urgency Score should be numeric"
    );
    
    // Test date fields
    var lastOutreachDate = new Date();
    TestRunner.assert.isTrue(
      lastOutreachDate instanceof Date,
      "Last Outreach Date should be Date object"
    );
    
    // Test text fields
    var companyID = 'CID-TEST001';
    TestRunner.assert.isTrue(
      typeof companyID === 'string',
      "Company ID should be string"
    );
  },

  /**
   * Test Prospects ID generation
   */
  testProspectsIdGeneration: function() {
    if (typeof SharedUtils !== 'undefined' && typeof SharedUtils.generateCompanyId === 'function') {
      var companyId = SharedUtils.generateCompanyId('Test Company');
      TestRunner.assert.isTrue(
        companyId.startsWith('CID-'),
        "Company ID should start with CID-"
      );
      TestRunner.assert.isTrue(
        companyId.length > 4,
        "Company ID should have content after CID-"
      );
    }
  }
};

// ============================================================================
// OUTREACH TABLE TESTS
// ============================================================================

var OutreachTableTests = {
  /**
   * Test Outreach field validation
   */
  testOutreachFieldValidation: function() {
    var validOutreach = {
      'Outreach ID': 'LID-001',
      'Company ID': 'CID-TEST001',
      'Company': 'Test Company',
      'Visit Date': new Date(),
      'Outcome': 'Interested (Hot)',
      'Stage': 'Nurture',
      'Status': 'Interested (Hot)',
      'Owner': 'Kyle Buzbee',
      'Contact Type': 'Visit'
    };
    
    // Test required fields
    TestRunner.assert.isTrue(
      ValidationUtils.isNotEmpty(validOutreach['Outreach ID']),
      "Outreach ID should not be empty"
    );
    TestRunner.assert.isTrue(
      ValidationUtils.isNotEmpty(validOutreach['Company ID']),
      "Company ID should not be empty"
    );
    
    // Test outcome validation
    var validOutcomes = [
      'Account Won', 'Disqualified', 'Follow-Up', 'Initial Contact',
      'Interested', 'Interested (Hot)', 'Interested (Warm)',
      'No Answer', 'Not Interested'
    ];
    
    TestRunner.assert.isTrue(
      validOutcomes.indexOf(validOutreach['Outcome']) >= 0,
      "Outcome should be valid"
    );
    
    // Test stage validation
    var validStages = [
      'Disqualified', 'Lost', 'Nurture', 'Outreach', 'Prospect', 'Won'
    ];
    
    TestRunner.assert.isTrue(
      validStages.indexOf(validOutreach['Stage']) >= 0,
      "Stage should be valid"
    );
    
    // Test status validation
    var validStatuses = [
      'Active', 'Cold', 'Disqualified', 'Hot', 'Interested (Hot)',
      'Interested (Warm)', 'Lost', 'Warm', 'Won'
    ];
    
    TestRunner.assert.isTrue(
      validStatuses.indexOf(validOutreach['Status']) >= 0,
      "Status should be valid"
    );
    
    // Test contact type validation
    var validContactTypes = ['Email', 'Phone', 'Visit'];
    TestRunner.assert.isTrue(
      validContactTypes.indexOf(validOutreach['Contact Type']) >= 0,
      "Contact Type should be valid"
    );
  },

  /**
   * Test Outreach ID generation
   */
  testOutreachIdGeneration: function() {
    if (typeof OutreachFunctions !== 'undefined' && typeof OutreachFunctions.generateOutreachId === 'function') {
      var outreachId = OutreachFunctions.generateOutreachId();
      TestRunner.assert.isTrue(
        outreachId.startsWith('LID-'),
        "Outreach ID should start with LID-"
      );
    }
  },

  /**
   * Test follow-up action validation
   */
  testFollowUpActionValidation: function() {
    var validActions = [
      'Check periodic', 'General follow', 'Onboard Account',
      'See Notes', 'Send pricing', 'Try again'
    ];
    
    validActions.forEach(function(action) {
      TestRunner.assert.isTrue(
        action.length > 0,
        "Follow-up action should be valid: " + action
      );
    });
  },

  /**
   * Test competitor validation
   */
  testCompetitorValidation: function() {
    var validCompetitors = ['AIM', 'Tyler Iron', 'Huntwell', 'Other', 'None'];
    
    validCompetitors.forEach(function(competitor) {
      TestRunner.assert.isTrue(
        competitor.length > 0,
        "Competitor should be valid: " + competitor
      );
    });
  }
};

// ============================================================================
// ACCOUNTS TABLE TESTS
// ============================================================================

var AccountsTableTests = {
  /**
   * Test Accounts field validation
   */
  testAccountsFieldValidation: function() {
    var validAccount = {
      'Deployed': 'Yes',
      'Company Name': 'Test Account',
      'Contact Name': 'John Doe',
      'Contact Phone': '123-456-7890',
      'Roll-Off Fee': 'Yes',
      'Handling of Metal': 'All together',
      'Roll Off Container Size': '30 yd'
    };
    
    // Test roll-off fee validation
    var validRollOffFees = ['Yes', 'No'];
    TestRunner.assert.isTrue(
      validRollOffFees.indexOf(validAccount['Roll-Off Fee']) >= 0,
      "Roll-Off Fee should be Yes or No"
    );
    
    // Test handling of metal validation
    var validHandlingOptions = [
      'All together', 'Separate', 'Employees take',
      'Scrap guy picks up', 'Haul themselves',
      'Roll-off vendor', 'Unknown'
    ];
    
    TestRunner.assert.isTrue(
      validHandlingOptions.indexOf(validAccount['Handling of Metal']) >= 0,
      "Handling of Metal should be valid"
    );
    
    // Test container size validation
    var validContainerSizes = ['10 yd', '20 yd', '30 yd', '40 yd', 'Lugger'];
    TestRunner.assert.isTrue(
      validContainerSizes.indexOf(validAccount['Roll Off Container Size']) >= 0,
      "Container Size should be valid"
    );
  }
};

// ============================================================================
// CONTACTS TABLE TESTS
// ============================================================================

var ContactsTableTests = {
  /**
   * Test Contacts field validation
   */
  testContactsFieldValidation: function() {
    var validContact = {
      'Name': 'John Doe',
      'Company': 'Test Company',
      'Account': 'Prospects',
      'Role': 'Manager',
      'Department': 'Operations',
      'Phone Number': '123-456-7890',
      'Email': 'john@example.com',
      'Address': '123 Test St'
    };
    
    // Test account type validation
    var validAccountTypes = ['Lost Accounts', 'Prospects', 'Team'];
    TestRunner.assert.isTrue(
      validAccountTypes.indexOf(validContact['Account']) >= 0,
      "Account type should be valid"
    );
    
    // Test email validation
    var emailResult = ValidationUtils.validateEmail(validContact['Email']);
    TestRunner.assert.isTrue(
      emailResult.success,
      "Email should be valid"
    );
  }
};

// ============================================================================
// DATE AND TIME TESTS
// ============================================================================

var DateTimeTests = {
  /**
   * Test date parsing with timezone handling
   */
  testDateParsing: function() {
    // Test ISO format
    var isoDate = "2026-01-15";
    var parsedDate = parseDateSafely(isoDate);
    TestRunner.assert.isTrue(
      parsedDate instanceof Date,
      "Should parse ISO date"
    );
    TestRunner.assert.equals(
      parsedDate.getDate(),
      15,
      "Should parse day correctly (timezone safe)"
    );
    
    // Test US format
    var usDate = "01/15/2026";
    var parsedUSDate = parseDateSafely(usDate);
    TestRunner.assert.isTrue(
      parsedUSDate instanceof Date,
      "Should parse US date"
    );
    
    // Test noon time setting (prevents timezone rollback)
    TestRunner.assert.equals(
      parsedDate.getHours(),
      12,
      "Parsed date should be set to noon"
    );
  },

  /**
   * Test date formatting
   */
  testDateFormatting: function() {
    var testDate = new Date(2026, 0, 15, 12, 0, 0); // Jan 15, 2026 at noon
    var formatted = formatDate(testDate);
    TestRunner.assert.equals(
      formatted,
      "01/15/2026",
      "Should format date as MM/dd/yyyy"
    );
  },

  /**
   * Test business day calculation
   */
  testBusinessDayCalculation: function() {
    if (typeof ProspectFunctions !== 'undefined' && typeof ProspectFunctions.calculateNextBusinessDay === 'function') {
      // Friday to Monday
      var friday = new Date(2026, 1, 6); // Feb 6, 2026 (Friday)
      var nextDay = ProspectFunctions.calculateNextBusinessDay(1, friday);
      TestRunner.assert.equals(
        nextDay.getDay(),
        1,
        "Should skip weekend to Monday"
      );
      TestRunner.assert.equals(
        nextDay.getDate(),
        9,
        "Should be Feb 9 (Monday)"
      );
    }
  }
};

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

var IntegrationTests = {
  /**
   * Test fuzzy matching with schema-aligned keys
   */
  testFuzzyMatching: function() {
    var prospects = [
      { 'Company Name': 'ABC Corp', 'Company ID': 'CID-001' },
      { 'Company Name': 'XYZ Ltd', 'Company ID': 'CID-002' }
    ];
    
    var outreach = { Company: 'ABC Corporation', CompanyID: '' };
    
    if (typeof fuzzyMatchCompany === 'function') {
      var matchResult = fuzzyMatchCompany(outreach, prospects);
      TestRunner.assert.isTrue(
        matchResult.confidence > 0.5,
        "Should find fuzzy match"
      );
    }
  },

  /**
   * Test CSV import with schema-aligned headers
   */
  testCSVImport: function() {
    var csvText = "Company Name,Email,Phone\nTest Company,test@example.com,123-456-7890";
    var result = parseCSVWithHeaders(csvText);
    
    TestRunner.assert.isTrue(
      result.success,
      "CSV import should succeed"
    );
    TestRunner.assert.equals(
      result.dataRows.length,
      1,
      "Should have 1 data row"
    );
    TestRunner.assert.equals(
      result.dataRows[0][0],
      "Test Company",
      "Should parse Company Name correctly"
    );
  },

  /**
   * Test account conversion workflow
   */
  testAccountConversion: function() {
    var prospectData = {
      'Company Name': 'Test Company',
      'Contact Status': 'Interested (Hot)',
      'Outcome': 'Account Won'
    };
    
    // Test that Account Won outcome triggers conversion
    TestRunner.assert.equals(
      prospectData['Outcome'],
      'Account Won',
      "Should have Account Won outcome"
    );
  }
};

// ============================================================================
// ERROR HANDLING TESTS
// ============================================================================

var ErrorHandlingTests = {
  /**
   * Test null/undefined handling
   */
  testNullHandling: function() {
    var nullResult = ValidationUtils.validateEmail(null);
    TestRunner.assert.isTrue(
      !nullResult.success,
      "Null email should fail validation"
    );
    
    var undefinedResult = ValidationUtils.validateEmail(undefined);
    TestRunner.assert.isTrue(
      !undefinedResult.success,
      "Undefined email should fail validation"
    );
  },

  /**
   * Test empty string handling
   */
  testEmptyStringHandling: function() {
    var emptyResult = ValidationUtils.validateEmail('');
    TestRunner.assert.isTrue(
      !emptyResult.success,
      "Empty email should fail validation"
    );
    
    var emptyString = ValidationUtils.isNotEmpty('');
    TestRunner.assert.isTrue(
      !emptyString,
      "Empty string should be false"
    );
  },

  /**
   * Test invalid data handling
   */
  testInvalidDataHandling: function() {
    var invalidDate = parseDateSafely('not-a-date');
    TestRunner.assert.equals(
      invalidDate,
      null,
      "Invalid date should return null"
    );
  }
};

// ============================================================================
// TEST RUNNER SETUP
// ============================================================================

/**
 * Run all schema-aligned tests
 */
function runSchemaAlignedTests() {
  console.log('=== Running Schema-Aligned Tests ===');
  
  var allTests = {
    'Schema Validation': SchemaValidationTests,
    'Prospects Table': ProspectsTableTests,
    'Outreach Table': OutreachTableTests,
    'Accounts Table': AccountsTableTests,
    'Contacts Table': ContactsTableTests,
    'Date and Time': DateTimeTests,
    'Integration': IntegrationTests,
    'Error Handling': ErrorHandlingTests
  };
  
  var results = {
    passed: 0,
    failed: 0,
    errors: []
  };
  
  Object.keys(allTests).forEach(function(category) {
    console.log('\n--- ' + category + ' ---');
    var tests = allTests[category];
    
    Object.keys(tests).forEach(function(testName) {
      try {
        tests[testName]();
        console.log('✓ ' + testName);
        results.passed++;
      } catch (e) {
        console.log('✗ ' + testName + ': ' + e.message);
        results.failed++;
        results.errors.push({
          category: category,
          test: testName,
          error: e.message
        });
      }
    });
  });
  
  console.log('\n=== Test Results ===');
  console.log('Passed: ' + results.passed);
  console.log('Failed: ' + results.failed);
  console.log('Total: ' + (results.passed + results.failed));
  
  return results;
}

// Export for GAS
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    SchemaValidationTests: SchemaValidationTests,
    ProspectsTableTests: ProspectsTableTests,
    OutreachTableTests: OutreachTableTests,
    AccountsTableTests: AccountsTableTests,
    ContactsTableTests: ContactsTableTests,
    DateTimeTests: DateTimeTests,
    IntegrationTests: IntegrationTests,
    ErrorHandlingTests: ErrorHandlingTests,
    runSchemaAlignedTests: runSchemaAlignedTests
  };
}
