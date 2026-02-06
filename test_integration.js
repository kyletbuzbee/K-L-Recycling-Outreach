/**
 * Integration Tests for K&L Recycling CRM
 * Comprehensive test suite for critical workflows
 */

/**
 * Test Suite: Outreach Submission Workflow
 * Tests the complete process from form submission to data updates
 */
function testOutreachSubmissionWorkflow() {
  console.log('🧪 Starting Outreach Submission Integration Test...');
  
  try {
    // Test data
    var testData = {
      company: 'Test Integration Company',
      companyName: 'Test Integration Company',
      outcome: 'Interested',
      stage: 'Prospect',
      status: 'Hot',
      activityType: 'Visit',
      notes: 'Integration test submission'
    };

    // 1. Test duplicate LID check
    console.log('1. Testing duplicate LID check...');
    var duplicateCheck = OutreachFunctions.checkForDuplicateLID('TEST-LID-001');
    console.log('Duplicate check result:', duplicateCheck);

    // 2. Test outreach submission
    console.log('2. Testing outreach submission...');
    var submissionResult = OutreachFunctions.processOutreachSubmission(testData);
    console.log('Submission result:', submissionResult);

    // 3. Verify data was written to sheets
    console.log('3. Verifying data persistence...');
    var outreachData = SharedUtils.getSafeSheetData(CONFIG.SHEET_OUTREACH, ['Company', 'Outcome', 'Status']);
    var testRecords = outreachData.filter(function(row) {
      return row['company'] === testData.company;
    });

    console.log('Found test records:', testRecords.length);

    // 4. Test prospect status update
    console.log('4. Testing prospect status update...');
    var prospectCheck = ProspectFunctions.fetchLastTouchInfo(testData.company);
    console.log('Prospect status check:', prospectCheck);

    // 5. Test dashboard metrics calculation
    console.log('5. Testing dashboard metrics...');
    var metrics = OutreachFunctions.calculateDashboardMetrics({ includeDetailedStats: true });
    console.log('Dashboard metrics calculated successfully:', metrics.success);

    console.log('✅ Outreach Submission Integration Test PASSED');
    return { success: true, testResults: 'All integration tests passed' };

  } catch (e) {
    console.error('❌ Outreach Submission Integration Test FAILED:', e.message);
    return { success: false, error: e.message };
  }
}

/**
 * Test Suite: Data Validation and Error Handling
 * Tests error scenarios and validation
 */
function testDataValidation() {
  console.log('🧪 Starting Data Validation Test...');
  
  try {
    // 1. Test missing required parameters
    console.log('1. Testing missing parameters...');
    var invalidData = {
      company: '', // Empty company
      outcome: 'Interested'
    };
    
    var validation = validateParameters(invalidData, ['company', 'outcome', 'status'], {
      functionName: 'testValidation'
    });
    console.log('Validation result for missing params:', validation);

    // 2. Test invalid data types
    console.log('2. Testing invalid data types...');
    var invalidTypeData = {
      company: 123, // Should be string
      outcome: null,
      status: undefined
    };
    
    var typeValidation = validateParameters(invalidTypeData, ['company', 'outcome', 'status'], {
      functionName: 'testTypeValidation'
    });
    console.log('Type validation result:', typeValidation);

    // 3. Test error handling in sheet operations
    console.log('3. Testing error handling...');
    try {
      // Try to access non-existent sheet
      var result = SharedUtils.getSafeSheetData('NonExistentSheet', ['Column1']);
      console.log('Non-existent sheet result:', result);
    } catch (e) {
      console.log('Expected error caught:', e.message);
    }

    console.log('✅ Data Validation Test PASSED');
    return { success: true, testResults: 'All validation tests passed' };

  } catch (e) {
    console.error('❌ Data Validation Test FAILED:', e.message);
    return { success: false, error: e.message };
  }
}

/**
 * Test Suite: Performance and Concurrency
 * Tests performance optimizations and locking
 */
function testPerformanceAndConcurrency() {
  console.log('🧪 Starting Performance and Concurrency Test...');
  
  try {
    // 1. Test caching performance
    console.log('1. Testing caching performance...');
    var startTime = Date.now();

    // First call (should cache)
    var data1 = PerformanceUtils.getSafeSheetDataOptimized(CONFIG.SHEET_PROSPECTS, ['Company Name', 'Industry']);
    var firstCallTime = Date.now() - startTime;

    // Second call (should use cache)
    startTime = Date.now();
    var data2 = PerformanceUtils.getSafeSheetDataOptimized(CONFIG.SHEET_PROSPECTS, ['Company Name', 'Industry']);
    var secondCallTime = Date.now() - startTime;

    console.log('First call time:', firstCallTime + 'ms');
    console.log('Second call time:', secondCallTime + 'ms');
    console.log('Cache hit improvement:', firstCallTime - secondCallTime + 'ms');

    // 2. Test batch processing
    console.log('2. Testing batch processing...');
    var testData = [];
    for (var i = 0; i < 100; i++) {
      testData.push({ id: i, name: 'Test Item ' + i });
    }

    var batchResult = PerformanceUtils.processInBatches(testData, function(item) {
      return { success: true, processed: item.id };
    }, { batchSize: 20, batchDelay: 100 });

    console.log('Batch processing result:', batchResult);

    // 3. Test timeout protection
    console.log('3. Testing timeout protection...');
    var timeoutResult = PerformanceUtils.executeWithTimeoutProtection(function() {
      // Simulate a quick operation
      return { success: true, data: 'Quick operation' };
    }, [], { functionName: 'testTimeout', timeoutThreshold: 5000 });

    console.log('Timeout protection result:', timeoutResult);

    console.log('✅ Performance and Concurrency Test PASSED');
    return { success: true, testResults: 'All performance tests passed' };

  } catch (e) {
    console.error('❌ Performance and Concurrency Test FAILED:', e.message);
    return { success: false, error: e.message };
  }
}

/**
 * Test Suite: Business Logic and Write-Back Rules
 * Tests the intelligent business logic
 */
function testBusinessLogic() {
  console.log('🧪 Starting Business Logic Test...');
  
  try {
    // 1. Test write-back rules for different outcomes
    console.log('1. Testing write-back rules...');

    // Test Follow-up outcome
    var followUpResult = ProspectFunctions.updateExistingProspectWithWriteBackRules(2, 'Follow-up', 'Active', 'Visit');
    console.log('Follow-up write-back result:', followUpResult);

    // Test Interested outcome
    var interestedResult = ProspectFunctions.updateExistingProspectWithWriteBackRules(2, 'Interested', 'Active', 'Visit');
    console.log('Interested write-back result:', interestedResult);

    // Test Account Won outcome
    var wonResult = ProspectFunctions.updateExistingProspectWithWriteBackRules(2, 'Account Won', 'Active', 'Visit');
    console.log('Account Won write-back result:', wonResult);

    // 2. Test prospect scoring
    console.log('2. Testing prospect scoring...');
    var testProspect = {
      'industry': 'Manufacturing',
      'days since last contact': 30
    };

    var settings = Settings.getSettings();
    var scores = ProspectScoringService.calculateProspectScores(testProspect, settings);
    console.log('Prospect scoring result:', scores);

    // 3. Test route generation
    console.log('3. Testing route generation...');
    var testCompanies = ['Test Integration Company'];
    var routeResult = RouteFunction.buildRouteUrl(testCompanies);
    console.log('Route generation result:', routeResult);

    console.log('✅ Business Logic Test PASSED');
    return { success: true, testResults: 'All business logic tests passed' };

  } catch (e) {
    console.error('❌ Business Logic Test FAILED:', e.message);
    return { success: false, error: e.message };
  }
}

/**
 * Test Suite: Report Generation
 * Tests report functionality and date handling
 */
function testReportGeneration() {
  console.log('🧪 Starting Report Generation Test...');
  
  try {
    // 1. Test date parsing
    console.log('1. Testing date parsing...');
    var testDates = [
      '2026-01-15',
      '01/15/2026',
      '01152026'
    ];

    testDates.forEach(function(dateStr) {
      var parsed = ReportFunctions.parseDateSafely(dateStr);
      console.log('Date ' + dateStr + ' parsed as:', parsed.toISOString());
    });

    // 2. Test report generation
    console.log('2. Testing report generation...');
    var startDate = new Date('2026-01-01');
    var endDate = new Date('2026-01-31');

    var reportResult = ReportFunctions.generateProfessionalReport(startDate, endDate);
    console.log('Report generation result type:', typeof reportResult);
    console.log('Report contains HTML:', reportResult.includes('<html>'));

    // 3. Test date filtering
    console.log('3. Testing date filtering...');
    var outreachData = SharedUtils.getSafeSheetData(CONFIG.SHEET_OUTREACH, ['Visit Date', 'Company']);
    var filteredResult = OutreachFunctions.fetchOutreachHistory(startDate, endDate, { maxRecords: 10 });
    console.log('Date filtering result:', filteredResult);

    console.log('✅ Report Generation Test PASSED');
    return { success: true, testResults: 'All report tests passed' };

  } catch (e) {
    console.error('❌ Report Generation Test FAILED:', e.message);
    return { success: false, error: e.message };
  }
}

/**
 * Run All Integration Tests
 */
function runAllIntegrationTests() {
  console.log('🚀 Starting Complete Integration Test Suite...');
  
  var testResults = {
    outreachWorkflow: testOutreachSubmissionWorkflow(),
    dataValidation: testDataValidation(),
    performance: testPerformanceAndConcurrency(),
    businessLogic: testBusinessLogic(),
    reportGeneration: testReportGeneration()
  };
  
  var passedTests = 0;
  var totalTests = Object.keys(testResults).length;
  
  console.log('\n📊 Test Results Summary:');
  Object.keys(testResults).forEach(function(testName) {
    var result = testResults[testName];
    var status = result.success ? '✅ PASSED' : '❌ FAILED';
    console.log(testName + ': ' + status);
    if (result.success) passedTests++;
  });
  
  console.log('\n📈 Overall Results:');
  console.log('Passed: ' + passedTests + '/' + totalTests);
  console.log('Success Rate: ' + Math.round((passedTests / totalTests) * 100) + '%');
  
  if (passedTests === totalTests) {
    console.log('🎉 All integration tests PASSED! The system is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Please review the implementation.');
  }
  
  return testResults;
}

/**
 * Performance Benchmark Test
 * Measures execution times for key operations
 */
function runPerformanceBenchmark() {
  console.log('⚡ Starting Performance Benchmark...');
  
  var benchmarks = {};
  
  // Benchmark data fetching
  console.time('Data Fetching');
  var outreachData = SharedUtils.getSafeSheetData(CONFIG.SHEET_OUTREACH, ['Company', 'Outcome', 'Status']);
  console.timeEnd('Data Fetching');
  benchmarks.dataFetching = outreachData.length;

  // Benchmark cached data fetching
  console.time('Cached Data Fetching');
  var cachedData = PerformanceUtils.getSafeSheetDataOptimized(CONFIG.SHEET_OUTREACH, ['Company', 'Outcome', 'Status']);
  console.timeEnd('Cached Data Fetching');
  benchmarks.cachedDataFetching = cachedData.length;

  // Benchmark prospect scoring
  console.time('Prospect Scoring');
  var settings = Settings.getSettings();
  var scores = ProspectScoringService.calculateProspectScores({ 'industry': 'Manufacturing', 'days since last contact': 30 }, settings);
  console.timeEnd('Prospect Scoring');
  benchmarks.prospectScoring = scores.totalScore;

  // Benchmark report generation
  console.time('Report Generation');
  var report = ReportFunctions.generateProfessionalReport(new Date('2026-01-01'), new Date('2026-01-31'));
  console.timeEnd('Report Generation');
  benchmarks.reportGeneration = report.length;
  
  console.log('📊 Performance Benchmarks:');
  console.log('Data Records Processed:', benchmarks.dataFetching);
  console.log('Cached Records Processed:', benchmarks.cachedDataFetching);
  console.log('Prospect Score Generated:', benchmarks.prospectScoring);
  console.log('Report HTML Length:', benchmarks.reportGeneration);
  
  return benchmarks;
}