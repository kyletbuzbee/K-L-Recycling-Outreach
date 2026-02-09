/**
 * K&L Recycling CRM - Automated Test Suite
 * Version: 3.1.0 - Enhanced with Coverage Metrics
 */

var TestRunner = {
  /**
   * Run all registered test suites with timing and metrics
   */
  runAll: function() {
    console.log('🚀 Starting K&L CRM Comprehensive Test Suite...');
    var startTime = new Date().getTime();
    var results = [];

    // Register Suites
    results.push(this.runSuite('Core Utilities', UnitTests_Core));
    results.push(this.runSuite('Prospect Logic', IntegrationTests_Prospects));
    results.push(this.runSuite('Validation Tests', ValidationTests));
    results.push(this.runSuite('Data Operations', DataOperationsTests));
    results.push(this.runSuite('Workflow Tests', WorkflowTests));

    var endTime = new Date().getTime();
    this.reportResults(results, endTime - startTime);
  },

  /**
   * Run specific test categories
   */
  runCategory: function(category) {
    console.log('🚀 Starting K&L CRM Test Suite for category: ' + category);
    var startTime = new Date().getTime();
    var results = [];

    switch(category.toLowerCase()) {
      case 'unit':
        results.push(this.runSuite('Core Utilities', UnitTests_Core));
        results.push(this.runSuite('Validation Tests', ValidationTests));
        break;
      case 'integration':
        results.push(this.runSuite('Prospect Logic', IntegrationTests_Prospects));
        results.push(this.runSuite('Data Operations', DataOperationsTests));
        break;
      case 'workflow':
        results.push(this.runSuite('Workflow Tests', WorkflowTests));
        break;
      default:
        console.error('Unknown test category: ' + category);
        console.error('Available categories: unit, integration, workflow');
        return;
    }

    var endTime = new Date().getTime();
    this.reportResults(results, endTime - startTime);
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

  /**
   * Enhanced reporting with coverage metrics and timing
   */
  reportResults: function(results, executionTime) {
    var totalPassed = results.reduce(function(sum, s) { return sum + s.passed; }, 0);
    var totalTests = results.reduce(function(sum, s) { return sum + s.total; }, 0);
    var passRate = ((totalPassed / totalTests) * 100).toFixed(1);
    
    console.log('================================================');
    console.log('📊 TEST SUMMARY');
    console.log('================================================');
    console.log('Tests Run: ' + totalTests);
    console.log('Passed: ' + totalPassed);
    console.log('Failed: ' + (totalTests - totalPassed));
    console.log('Pass Rate: ' + passRate + '%');
    console.log('Execution Time: ' + executionTime + 'ms');
    console.log('================================================');
    
    // Suite breakdown
    console.log('📋 SUITE BREAKDOWN');
    console.log('------------------------------------------------');
    results.forEach(function(s) {
      var rate = ((s.passed / s.total) * 100).toFixed(1);
      var status = rate === '100.0' ? '✅' : '⚠️';
      console.log(status + ' ' + s.name + ': ' + rate + '% (' + s.passed + '/' + s.total + ')');
    });
    console.log('================================================');
    
    // Failures summary
    var hasFailures = results.some(function(s) { return s.failures.length > 0; });
    if (hasFailures) {
      console.log('🚨 FAILURES DETAIL');
      console.log('------------------------------------------------');
      results.forEach(function(s) {
        if (s.failures.length > 0) {
          console.log('Suite: ' + s.name);
          s.failures.forEach(function(f) {
            console.log('  ❌ ' + f.test + ': ' + f.error);
          });
        }
      });
      console.log('================================================');
      console.log('⚠️ ACTION REQUIRED: Review failures above.');
    } else {
      console.log('🎉 ALL SYSTEMS NOMINAL - 100% PASS RATE');
    }
    console.log('================================================');
  }
};

function EXECUTE_CRM_TESTS() {
  TestRunner.runAll();
}

function EXECUTE_CRM_TESTS_BY_CATEGORY(category) {
  TestRunner.runCategory(category);
}
