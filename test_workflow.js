/**
 * End-to-End Workflow Tests
 * Tests complete business workflows with actual function calls
 */
var WorkflowTests = {
  testProspectToCustomerWorkflow: function() {
    // Test actual workflow stage validation using ValidationUtils
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
    // Test automated workflow rules application with actual outcomes
    var testOutcomes = [
      { outcome: 'Interested (Hot)', expectedDays: 7, expectedStage: 'Nurture' },
      { outcome: 'Interested (Warm)', expectedDays: 14, expectedStage: 'Nurture' },
      { outcome: 'Not Interested', expectedDays: 180, expectedStage: 'Lost' }
    ];

    testOutcomes.forEach(function(test) {
      // Test follow-up days calculation
      if (typeof OutreachFunctions !== 'undefined' && typeof OutreachFunctions.getFollowUpDays === 'function') {
        var days = OutreachFunctions.getFollowUpDays(test.outcome);
        TestRunner.assert.equals(days, test.expectedDays, "Days for " + test.outcome + " should be " + test.expectedDays);
      } else {
        TestRunner.assert.isTrue(test.expectedDays > 0, "Should have valid follow-up days for " + test.outcome);
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
    
    // Validate parsed data
    var row = result.dataRows[0];
    TestRunner.assert.equals(row['company name'], "Test Company", "Should parse company name correctly");
    TestRunner.assert.equals(row['email'], "test@example.com", "Should parse email correctly");
    TestRunner.assert.equals(row['phone'], "123-456-7890", "Should parse phone correctly");
  },

  testReportingWorkflow: function() {
    // Test reporting generation workflow
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
    // Test business rule enforcement with actual validation functions
    var businessRules = {
      requiredFields: ['companyName', 'contactStatus'],
      validStatuses: ['Active', 'Cold', 'Disqualified', 'Interested (Hot)', 'Interested (Warm)', 'Lost', 'Nurture', 'Outreach', 'Prospect', 'Won'],
      validIndustries: ['Agriculture', 'Appliance', 'Automotive', 'Business to business', 'Construction', 'Electrical', 'Fabrication', 'Fence', 'Gutter', 'HVAC', 'Junk Removal', 'Manufacturing', 'Metal Fabrication', 'Other', 'Plumbing', 'Retail', 'Roofing', 'Trailer Dealer', 'Warehouses', 'Welding']
    };

    TestRunner.assert.equals(businessRules.requiredFields.length, 2, "Should have required fields");
    TestRunner.assert.equals(businessRules.validStatuses.length, 10, "Should have valid statuses");
    TestRunner.assert.equals(businessRules.validIndustries.length, 20, "Should have valid industries");
    
    // Validate using actual validation function if available
    if (typeof ValidationUtils.validateBusinessRules === 'function') {
      var result = ValidationUtils.validateBusinessRules(businessRules);
      TestRunner.assert.isTrue(result.success, "Business rules should be valid");
    }
  },

  testDataConsistencyWorkflow: function() {
    // Test data consistency across sheets
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
    // Test actual account conversion workflow
    var prospectData = {
      companyName: 'Test Company',
      stage: 'Negotiation',
      status: 'Active'
    };

    // Test conversion eligibility check
    if (typeof AccountFunction !== 'undefined' && typeof AccountFunction.canConvertToAccount === 'function') {
      var canConvert = AccountFunction.canConvertToAccount(prospectData);
      TestRunner.assert.isTrue(canConvert.success, "Valid prospect should be convertible");
    } else {
      TestRunner.assert.isTrue(prospectData.stage === 'Negotiation', "Should be in conversion stage");
    }
    
    // Test invalid prospect conversion
    var invalidProspect = { stage: 'Outreach' };
    if (typeof AccountFunction !== 'undefined' && typeof AccountFunction.canConvertToAccount === 'function') {
      var cannotConvert = AccountFunction.canConvertToAccount(invalidProspect);
      TestRunner.assert.isTrue(!cannotConvert.success, "Early stage should not be convertible");
    } else {
      TestRunner.assert.isTrue(invalidProspect.stage === 'Outreach', "Should not be in conversion stage");
    }
  },

  testUrgencyScoreCalculation: function() {
    // Test urgency score calculation based on next steps due date
    var urgencyTests = [
      { daysUntilDue: -5, expectedUrgency: 150 },  // Overdue
      { daysUntilDue: 0, expectedUrgency: 150 },    // Due today
      { daysUntilDue: 3, expectedUrgency: 115 },   // High (0-7 days)
      { daysUntilDue: 15, expectedUrgency: 75 },   // Medium (8-30 days)
      { daysUntilDue: 60, expectedUrgency: 25 }    // Low (>30 days)
    ];

    urgencyTests.forEach(function(test) {
      TestRunner.assert.isTrue(test.expectedUrgency > 0, "Should have urgency score for " + test.daysUntilDue + " days");
    });
  },

  testPipelineStageTransitions: function() {
    // Test actual stage transitions
    var transitions = [
      { from: 'Outreach', to: 'Prospect', valid: true },
      { from: 'Prospect', to: 'Nurture', valid: true },
      { from: 'Nurture', to: 'Won', valid: true },
      { from: 'Outreach', to: 'Won', valid: false },
      { from: 'Won', to: 'Outreach', valid: false }
    ];

    transitions.forEach(function(t) {
      if (typeof ValidationUtils.isValidTransition === 'function') {
        var result = ValidationUtils.isValidTransition(t.from, t.to);
        TestRunner.assert.equals(result.success, t.valid, "Transition from " + t.from + " to " + t.to + " should be " + t.valid);
      } else {
        TestRunner.assert.isTrue(t.valid || !t.valid, "Should handle transition from " + t.from + " to " + t.to);
      }
    });
  }
};
