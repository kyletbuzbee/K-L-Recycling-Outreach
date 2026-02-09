/**
 * K&L Recycling CRM - Automated Test Suite
 * Version: 3.0.0
 */

var TestRunner = {
  /**
   * Run all registered test suites
   */
  runAll: function() {
    console.log('🚀 Starting K&L CRM Comprehensive Test Suite...');
    var results = [];

    // Register Suites
    results.push(this.runSuite('Core Utilities', UnitTests_Core));
    results.push(this.runSuite('Prospect Logic', IntegrationTests_Prospects));
    results.push(this.runSuite('Validation Tests', ValidationTests));

    this.reportResults(results);
  },

  runSuite: function(name, suite) {
    console.log('--- Running Suite: ' + name + ' ---');
    var suiteResults = { name: name, passed: 0, total: 0, failures: [] };
    
    for (var testName in suite) {
      if (typeof suite[testName] === 'function') {
        suiteResults.total++;
        try {
          suite[testName]();
          suiteResults.passed++;
          console.log('✅ PASS: ' + testName);
        } catch (e) {
          suiteResults.failures.push({ test: testName, error: e.message });
          console.error('❌ FAIL: ' + testName + ' | ' + e.message);
        }
      }
    }
    return suiteResults;
  },

  /**
   * Assertion Engine
   */
  assert: {
    equals: function(actual, expected, msg) {
      if (actual !== expected) throw new Error(msg + ' (Expected: ' + expected + ', Got: ' + actual + ')');
    },
    isTrue: function(val, msg) {
      if (!val) throw new Error(msg);
    },
    notNull: function(val, msg) {
      if (val === null || val === undefined) throw new Error(msg);
    }
  },

  reportResults: function(results) {
    var totalPassed = results.reduce((sum, s) => sum + s.passed, 0);
    var totalTests = results.reduce((sum, s) => sum + s.total, 0);
    console.log('================================================');
    console.log('TEST SUMMARY: ' + totalPassed + '/' + totalTests + ' PASSED');
    if (totalPassed < totalTests) {
      console.warn('⚠️ ACTION REQUIRED: Review failures in the log above.');
    } else {
      console.log('🎉 ALL SYSTEMS NOMINAL');
    }
    console.log('================================================');
  }
};

function EXECUTE_CRM_TESTS() {
  TestRunner.runAll();
}