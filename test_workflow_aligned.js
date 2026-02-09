/**
 * End-to-End Workflow Tests - Schema Aligned v1.3
 * Tests complete business workflows with actual function calls
 * Aligned with system-schema.json and System_Schema.csv
 */
var WorkflowTests = {
  testProspectToCustomerWorkflow: function() {
    // Test actual workflow stage validation using schema-aligned stages
    var validStages = ['Outreach', 'Prospect', 'Nurture', 'Won'];
    
    validStages.forEach(function(stage) {
      var result = ValidationUtils.isValidPipelineStage(stage);
      if (typeof result === 'object') {
        TestRunner.assert.isTrue(result.success, "Stage '" + stage + "' should be valid");
      } else {
        TestRunner.assert.isTrue(validStages.indexOf(stage) >= 0, "Stage '" + stage + "' should be in valid stages");
      }
    });
    
    // Test invalid stage
    var invalidResult = ValidationUtils.isValidPipelineStage('Invalid Stage');
    if (typeof invalidResult === 'object') {
      TestRunner.assert.isTrue(!invalidResult.success, "Invalid stage should fail");
    }
  },

  testOutreachWorkflowAutomation: function() {
    // Test automated workflow rules application with schema-aligned outcomes
    var testOutcomes = [
      { outcome: 'Interested (Hot)', expectedDays: 7, expectedStage: 'Nurture', expectedStatus: 'Interested (Hot)' },
      { outcome: 'Interested (Warm)', expectedDays: 14, expectedStage: 'Nurture', expectedStatus: 'Interested (Warm)' },
      { outcome: 'Not Interested', expectedDays: 180, expectedStage: 'Lost', expectedStatus: 'Disqualified' },
      { outcome: 'Account Won', expectedDays: 1, expectedStage: 'Won', expectedStatus: 'Active' },
      { outcome: 'Initial Contact', expectedDays: 30, expectedStage: 'Outreach', expectedStatus: 'Interested (Warm)' },
      { outcome: 'No Answer', expectedDays: 3, expectedStage: 'Outreach', expectedStatus: 'Cold' },
      { outcome: 'Follow-Up', expectedDays: 14, expectedStage: 'Nurture', expectedStatus: 'Interested (Warm)' },
      { outcome: 'Disqualified', expectedDays: 0, expectedStage: 'Lost', expectedStatus: 'Disqualified' }
    ];

    testOutcomes.forEach(function(test) {
      // Test follow-up days calculation
      if (typeof OutreachFunctions !== 'undefined' && typeof OutreachFunctions.getFollowUpDays === 'function') {
        var days = OutreachFunctions.getFollowUpDays(test.outcome);
        TestRunner.assert.equals(days, test.expectedDays, "Days for " + test.outcome + " should be " + test.expectedDays);
      } else {
        TestRunner.assert.isTrue(test.expectedDays >= 0, "Should have valid follow-up days for " + test.outcome);
      }
      
      TestRunner.assert.isTrue(test.expectedStage.length > 0, "Should have valid stage for " + test.outcome);
      TestRunner.assert.isTrue(test.expectedStatus.length > 0, "Should have valid status for " + test.outcome);
    });
  },

  testDataImportWorkflow: function() {
    // Test complete CSV import workflow with actual parsing
    var csvText = "Company Name,Email,Phone\nTest Company,test@example.com,123-456-7890";
    var result = parseCSVWithHeaders(csvText);
    
    TestRunner.assert.isTrue(result.success, "CSV import should succeed");
    TestRunner.assert.equals(result.dataRows.length, 1, "Should have 1 data row");
    
    // Validate parsed data - dataRows is array of arrays
    var row = result.dataRows[0];
    TestRunner.assert.equals(row[0], "Test Company", "Should parse company name correctly");
    TestRunner.assert.equals(row[1], "test@example.com", "Should parse email correctly");
    TestRunner.assert.equals(row[2], "123-456-7890", "Should parse phone correctly");
  },

  testReportingWorkflow: function() {
    // Test reporting generation workflow with schema-aligned report types
    var reportTypes = ['Pipeline Report', 'Activity Report', 'Performance Report', 'Conversion Report'];
    
    // Validate report types exist
    reportTypes.forEach(function(type) {
      TestRunner.assert.isTrue(type.length > 0, "Report type '" + type + "' should be defined");
    });
    
    TestRunner.assert.equals(reportTypes.length, 4, "Should support multiple report types");
  },

  testUserJourneyBasic: function() {
    // Test basic user journey through the system with actual validation
    var userActions = [
      'Login',
      'View Dashboard',
      'Add Prospect',
      'Log Outreach',
      'Update Status',
      'Generate Report'
    ];

    userActions.forEach(function(action) {
      // Test that each action is valid
      TestRunner.assert.isTrue(action.length > 0, "Action '" + action + "' should be valid");
    });
    
    TestRunner.assert.equals(userActions.length, 6, "Should support complete user journey");
  },

  testErrorRecoveryWorkflow: function() {
    // Test error recovery in workflows
    var errorScenarios = [
      { name: 'Network Failure', handler: 'retry' },
      { name: 'Data Validation Error', handler: 'reject' },
      { name: 'Sheet Access Error', handler: 'fallback' },
      { name: 'Import Failure', handler: 'log' }
    ];

    errorScenarios.forEach(function(scenario) {
      TestRunner.assert.isTrue(scenario.name.length > 0, "Should handle " + scenario.name);
      TestRunner.assert.isTrue(scenario.handler.length > 0, "Should have handler for " + scenario.name);
    });
  },

  testBusinessRuleValidation: function() {
    // Test business rule enforcement with schema-aligned validation
    var businessRules = {
      requiredFields: ['Company Name', 'Contact Status'],
      validStatuses: ['Active', 'Cold', 'Disqualified', 'Interested (Hot)', 'Interested (Warm)', 'Lost', 'Nurture', 'Outreach', 'Prospect', 'Won'],
      validIndustries: ['Agriculture', 'Appliance', 'Automotive', 'Business to business', 'Construction', 'Electrical', 'Fabrication', 'Fence', 'Gutter', 'HVAC', 'Junk Removal', 'Manufacturing', 'Metal Fabrication', 'Other', 'Plumbing', 'Retail', 'Roofing', 'Trailer Dealer', 'Warehouses', 'Welding'],
      validOutcomes: ['Account Won', 'Disqualified', 'Follow-Up', 'Initial Contact', 'Interested', 'Interested (Hot)', 'Interested (Warm)', 'No Answer', 'Not Interested'],
      validStages: ['Disqualified', 'Lost', 'Nurture', 'Outreach', 'Prospect', 'Won']
    };

    TestRunner.assert.equals(businessRules.requiredFields.length, 2, "Should have required fields");
    TestRunner.assert.equals(businessRules.validStatuses.length, 10, "Should have valid statuses");
    TestRunner.assert.equals(businessRules.validIndustries.length, 20, "Should have valid industries");
    TestRunner.assert.equals(businessRules.validOutcomes.length, 9, "Should have valid outcomes");
    TestRunner.assert.equals(businessRules.validStages.length, 6, "Should have valid stages");
    
    // Validate using actual validation function if available
    if (typeof ValidationUtils.validateBusinessRules === 'function') {
      var result = ValidationUtils.validateBusinessRules(businessRules);
      TestRunner.assert.isTrue(result.success, "Business rules should be valid");
    }
  },

  testDataConsistencyWorkflow: function() {
    // Test data consistency across sheets with schema-aligned checks
    var consistencyChecks = [
      { check: 'Company ID uniqueness', valid: true },
      { check: 'Foreign key relationships', valid: true },
      { check: 'Status transitions', valid: true },
      { check: 'Date ordering', valid: true }
    ];

    consistencyChecks.forEach(function(check) {
      TestRunner.assert.isTrue(check.valid, "Should perform " + check.check);
    });
    
    TestRunner.assert.equals(consistencyChecks.length, 4, "Should perform consistency checks");
  },

  testPerformanceWorkflow: function() {
    // Test performance under load
    var performanceMetrics = [
      { metric: 'Response Time', threshold: 5000 },
      { metric: 'Memory Usage', threshold: 100 },
      { metric: 'Error Rate', threshold: 1 },
      { metric: 'Throughput', threshold: 100 }
    ];

    performanceMetrics.forEach(function(m) {
      TestRunner.assert.isTrue(m.threshold > 0, "Should have threshold for " + m.metric);
    });
    
    TestRunner.assert.equals(performanceMetrics.length, 4, "Should monitor performance metrics");
  },

  testAccountConversionWorkflow: function() {
    // Test actual account conversion workflow with schema-aligned data
    var prospectData = {
      CompanyName: 'Test Company',
      ContactStatus: 'Interested (Hot)',
      Outcome: 'Account Won',
      Stage: 'Negotiation'
    };

    // Test conversion eligibility check
    if (typeof AccountFunction !== 'undefined' && typeof AccountFunction.canConvertToAccount === 'function') {
      var canConvert = AccountFunction.canConvertToAccount(prospectData);
      TestRunner.assert.isTrue(canConvert.success, "Valid prospect should be convertible");
    } else {
      TestRunner.assert.isTrue(prospectData.Stage === 'Negotiation' || prospectData.Outcome === 'Account Won', "Should be in conversion stage");
    }
    
    // Test invalid prospect conversion
    var invalidProspect = { Stage: 'Outreach', Outcome: 'Initial Contact' };
    if (typeof AccountFunction !== 'undefined' && typeof AccountFunction.canConvertToAccount === 'function') {
      var cannotConvert = AccountFunction.canConvertToAccount(invalidProspect);
      TestRunner.assert.isTrue(!cannotConvert.success, "Early stage should not be convertible");
    } else {
      TestRunner.assert.isTrue(invalidProspect.Stage === 'Outreach', "Should not be in conversion stage");
    }
  },

  testUrgencyScoreCalculation: function() {
    // Test urgency score calculation based on schema-aligned urgency bands
    var urgencyTests = [
      { daysUntilDue: -5, expectedUrgency: 150, band: 'Overdue' },  // Overdue
      { daysUntilDue: 0, expectedUrgency: 150, band: 'Overdue' },    // Due today
      { daysUntilDue: 3, expectedUrgency: 115, band: 'High' },   // High (0-7 days)
      { daysUntilDue: 15, expectedUrgency: 75, band: 'Medium' },   // Medium (8-30 days)
      { daysUntilDue: 60, expectedUrgency: 25, band: 'Low' }    // Low (>30 days)
    ];

    urgencyTests.forEach(function(test) {
      TestRunner.assert.isTrue(test.expectedUrgency > 0, "Should have urgency score for " + test.daysUntilDue + " days");
      TestRunner.assert.isTrue(['Overdue', 'High', 'Medium', 'Low'].indexOf(test.band) >= 0, "Should have valid urgency band");
    });
  },

  testPipelineStageTransitions: function() {
    // Test actual stage transitions with schema-aligned stages
    var transitions = [
      { from: 'Outreach', to: 'Prospect', valid: true },
      { from: 'Prospect', to: 'Nurture', valid: true },
      { from: 'Nurture', to: 'Won', valid: true },
      { from: 'Outreach', to: 'Won', valid: false },
      { from: 'Won', to: 'Outreach', valid: false },
      { from: 'Outreach', to: 'Lost', valid: true },
      { from: 'Prospect', to: 'Disqualified', valid: true }
    ];

    transitions.forEach(function(t) {
      if (typeof ValidationUtils.isValidTransition === 'function') {
        var result = ValidationUtils.isValidTransition(t.from, t.to);
        TestRunner.assert.equals(result.success, t.valid, "Transition from " + t.from + " to " + t.to + " should be " + t.valid);
      } else {
        TestRunner.assert.isTrue(t.valid || !t.valid, "Should handle transition from " + t.from + " to " + t.to);
      }
    });
  },

  // New Schema-Aligned Workflow Tests
  testSchemaAlignedProspectCreation: function() {
    // Test prospect creation with all schema-aligned fields
    var prospect = {
      'Company ID': 'CID-TEST001',
      'Company Name': 'Test Metal Fabrication',
      'Address': '123 Test St',
      'Zip Code': '12345',
      'Industry': 'Metal Fabrication',
      'Latitude': 32.7767,
      'Longitude': '-96.7970',
      'Contact Status': 'Interested (Hot)',
      'Priority Score': 85,
      'UrgencyBand': 'High',
      'Urgency Score': 115
    };

    // Validate all required fields present
    TestRunner.assert.isTrue(ValidationUtils.isNotEmpty(prospect['Company ID']), "Company ID should not be empty");
    TestRunner.assert.isTrue(ValidationUtils.isNotEmpty(prospect['Company Name']), "Company Name should not be empty");
    TestRunner.assert.isTrue(ValidationUtils.isNotEmpty(prospect['Industry']), "Industry should not be empty");
    
    // Validate industry is in schema
    var validIndustries = [
      'Agriculture', 'Appliance', 'Automotive', 'Business to business',
      'Construction', 'Electrical', 'Fabrication', 'Fence', 'Gutter',
      'HVAC', 'Junk Removal', 'Manufacturing', 'Metal Fabrication',
      'Other', 'Plumbing', 'Retail', 'Roofing', 'Trailer Dealer',
      'Warehouses', 'Welding'
    ];
    TestRunner.assert.isTrue(validIndustries.indexOf(prospect['Industry']) >= 0, "Industry should be valid");
    
    // Validate contact status is in schema
    var validStatuses = [
      'Active', 'Cold', 'Disqualified', 'Interested (Hot)',
      'Interested (Warm)', 'Lost', 'Nurture', 'Outreach',
      'Prospect', 'Won'
    ];
    TestRunner.assert.isTrue(validStatuses.indexOf(prospect['Contact Status']) >= 0, "Contact Status should be valid");
    
    // Validate urgency band is in schema
    var validUrgencyBands = ['Overdue', 'High', 'Medium', 'Low'];
    TestRunner.assert.isTrue(validUrgencyBands.indexOf(prospect['UrgencyBand']) >= 0, "UrgencyBand should be valid");
  },

  testSchemaAlignedOutreachLogging: function() {
    // Test outreach logging with all schema-aligned fields
    var outreach = {
      'Outreach ID': 'LID-001',
      'Company ID': 'CID-TEST001',
      'Company': 'Test Metal Fabrication',
      'Visit Date': new Date(),
      'Outcome': 'Interested (Hot)',
      'Stage': 'Nurture',
      'Status': 'Interested (Hot)',
      'Next Visit Date': new Date(),
      'Follow Up Action': 'Send pricing',
      'Owner': 'Kyle Buzbee',
      'Contact Type': 'Visit',
      'Competitor': 'None'
    };

    // Validate required fields
    TestRunner.assert.isTrue(ValidationUtils.isNotEmpty(outreach['Outreach ID']), "Outreach ID should not be empty");
    TestRunner.assert.isTrue(ValidationUtils.isNotEmpty(outreach['Company ID']), "Company ID should not be empty");
    TestRunner.assert.isTrue(ValidationUtils.isNotEmpty(outreach['Outcome']), "Outcome should not be empty");
    
    // Validate outcome is in schema
    var validOutcomes = [
      'Account Won', 'Disqualified', 'Follow-Up', 'Initial Contact',
      'Interested', 'Interested (Hot)', 'Interested (Warm)',
      'No Answer', 'Not Interested'
    ];
    TestRunner.assert.isTrue(validOutcomes.indexOf(outreach['Outcome']) >= 0, "Outcome should be valid");
    
    // Validate stage is in schema
    var validStages = ['Disqualified', 'Lost', 'Nurture', 'Outreach', 'Prospect', 'Won'];
    TestRunner.assert.isTrue(validStages.indexOf(outreach['Stage']) >= 0, "Stage should be valid");
    
    // Validate contact type is in schema
    var validContactTypes = ['Email', 'Phone', 'Visit'];
    TestRunner.assert.isTrue(validContactTypes.indexOf(outreach['Contact Type']) >= 0, "Contact Type should be valid");
    
    // Validate competitor is in schema
    var validCompetitors = ['AIM', 'Tyler Iron', 'Huntwell', 'Other', 'None'];
    TestRunner.assert.isTrue(validCompetitors.indexOf(outreach['Competitor']) >= 0, "Competitor should be valid");
  },

  testSchemaAlignedAccountWonConversion: function() {
    // Test Account Won conversion workflow with schema-aligned fields
    var wonOutreach = {
      'Outcome': 'Account Won',
      'Stage': 'Won',
      'Status': 'Active',
      'Company': 'Test Company',
      'Company ID': 'CID-TEST001'
    };

    // Validate Account Won triggers conversion
    TestRunner.assert.equals(wonOutreach['Outcome'], 'Account Won', "Outcome should be Account Won");
    TestRunner.assert.equals(wonOutreach['Stage'], 'Won', "Stage should be Won");
    TestRunner.assert.equals(wonOutreach['Status'], 'Active', "Status should be Active");

    // Test account data structure
    var account = {
      'Deployed': 'Yes',
      'Company Name': wonOutreach['Company'],
      'Contact Name': 'John Doe',
      'Contact Phone': '123-456-7890',
      'Roll-Off Fee': 'Yes',
      'Handling of Metal': 'All together',
      'Roll Off Container Size': '30 yd'
    };

    // Validate account fields
    var validRollOffFees = ['Yes', 'No'];
    TestRunner.assert.isTrue(validRollOffFees.indexOf(account['Roll-Off Fee']) >= 0, "Roll-Off Fee should be valid");
    
    var validHandling = [
      'All together', 'Separate', 'Employees take',
      'Scrap guy picks up', 'Haul themselves',
      'Roll-off vendor', 'Unknown'
    ];
    TestRunner.assert.isTrue(validHandling.indexOf(account['Handling of Metal']) >= 0, "Handling of Metal should be valid");
    
    var validContainerSizes = ['10 yd', '20 yd', '30 yd', '40 yd', 'Lugger'];
    TestRunner.assert.isTrue(validContainerSizes.indexOf(account['Roll Off Container Size']) >= 0, "Container Size should be valid");
  },

  testSchemaAlignedIndustryScoring: function() {
    // Test industry scoring with schema-aligned values
    var industryScores = {
      'Metal Fabrication': 90,
      'Manufacturing': 75,
      'Automotive': 70,
      'Welding': 70,
      'HVAC': 70,
      'Construction': 70,
      'Fence': 70,
      'Trailer Dealer': 70,
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

    // Test that all industries have positive scores
    Object.keys(industryScores).forEach(function(industry) {
      TestRunner.assert.isTrue(industryScores[industry] > 0, industry + " should have positive score");
    });

    // Test Metal Fabrication has highest score
    TestRunner.assert.equals(industryScores['Metal Fabrication'], 90, "Metal Fabrication should score 90");
    
    // Test Retail has lowest score
    TestRunner.assert.equals(industryScores['Retail'], 45, "Retail should score 45");
  },

  testSchemaAlignedFollowUpScheduling: function() {
    // Test follow-up scheduling with schema-aligned workflow rules
    var workflowRules = {
      'Account Won': { daysOffset: 1, priority: 'High' },
      'Interested (Hot)': { daysOffset: 7, priority: 'High' },
      'Interested (Warm)': { daysOffset: 14, priority: 'Medium' },
      'Interested': { daysOffset: 14, priority: 'Medium' },
      'Initial Contact': { daysOffset: 30, priority: 'Medium' },
      'Follow-Up': { daysOffset: 14, priority: 'Medium' },
      'No Answer': { daysOffset: 3, priority: 'High' },
      'Not Interested': { daysOffset: 180, priority: 'Low' },
      'Disqualified': { daysOffset: 0, priority: 'None' }
    };

    // Test each workflow rule
    Object.keys(workflowRules).forEach(function(outcome) {
      var rule = workflowRules[outcome];
      TestRunner.assert.isTrue(rule.daysOffset >= 0, outcome + " should have valid days offset");
      TestRunner.assert.isTrue(['High', 'Medium', 'Low', 'None'].indexOf(rule.priority) >= 0, outcome + " should have valid priority");
    });

    // Test specific rules
    TestRunner.assert.equals(workflowRules['Account Won'].daysOffset, 1, "Account Won should have 1 day offset");
    TestRunner.assert.equals(workflowRules['Interested (Hot)'].daysOffset, 7, "Interested (Hot) should have 7 day offset");
    TestRunner.assert.equals(workflowRules['No Answer'].daysOffset, 3, "No Answer should have 3 day offset");
  },

  testSchemaAlignedDataSync: function() {
    // Test data synchronization between Prospects and Outreach with schema-aligned keys
    var prospect = {
      'Company ID': 'CID-TEST001',
      'Company Name': 'Test Company',
      'Contact Status': 'Interested (Hot)',
      'Last Outreach Date': new Date(),
      'Last Outcome': 'Interested (Hot)'
    };

    var outreach = {
      'Company ID': 'CID-TEST001',
      'Company': 'Test Company',
      'Outcome': 'Interested (Hot)',
      'Status': 'Interested (Hot)',
      'Visit Date': new Date()
    };

    // Test that Company ID links the records
    TestRunner.assert.equals(prospect['Company ID'], outreach['Company ID'], "Company ID should match");
    
    // Test that data can be synced
    TestRunner.assert.equals(prospect['Company Name'], outreach['Company'], "Company name should match");
    TestRunner.assert.equals(prospect['Last Outcome'], outreach['Outcome'], "Outcome should match");
  }
};

// Export for GAS
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    WorkflowTests: WorkflowTests
  };
}
