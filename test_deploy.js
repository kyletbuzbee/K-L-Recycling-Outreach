/**
 * Test Deploy Script for K&L CRM
 * This script helps deploy the test runner as a web app
 */

function doGet() {
  var template = HtmlService.createTemplateFromFile('test_runner');
  return template.evaluate()
      .setTitle('K&L CRM Test Runner')
      .setSandboxMode(HtmlService.SandboxMode.IFRAME);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * Run tests from the web interface
 */
function runQuickTests() {
  try {
    var results = simple_gas_tests.runQuickTests();
    return results;
  } catch (e) {
    console.error('Error in runQuickTests:', e);
    return {
      error: e.message,
      stack: e.stack,
      passed: 0,
      failed: 1
    };
  }
}

function runAllTests() {
  try {
    var results = test_runner.runAllTests();
    return results;
  } catch (e) {
    console.error('Error in runAllTests:', e);
    return {
      error: e.message,
      stack: e.stack,
      passed: 0,
      failed: 1
    };
  }
}

function runUnitTests() {
  try {
    var results = test_runner.runUnitTests();
    return results;
  } catch (e) {
    console.error('Error in runUnitTests:', e);
    return {
      error: e.message,
      stack: e.stack,
      passed: 0,
      failed: 1
    };
  }
}

function runIntegrationTests() {
  try {
    var results = test_runner.runIntegrationTests();
    return results;
  } catch (e) {
    console.error('Error in runIntegrationTests:', e);
    return {
      error: e.message,
      stack: e.stack,
      passed: 0,
      failed: 1
    };
  }
}

function runWorkflowTests() {
  try {
    var results = test_runner.runWorkflowTests();
    return results;
  } catch (e) {
    console.error('Error in runWorkflowTests:', e);
    return {
      error: e.message,
      stack: e.stack,
      passed: 0,
      failed: 1
    };
  }
}

function runOutreachTests() {
  try {
    var results = test_runner.runOutreachTests();
    return results;
  } catch (e) {
    console.error('Error in runOutreachTests:', e);
    return {
      error: e.message,
      stack: e.stack,
      passed: 0,
      failed: 1
    };
  }
}

function runValidationTests() {
  try {
    var results = test_runner.runValidationTests();
    return results;
  } catch (e) {
    console.error('Error in runValidationTests:', e);
    return {
      error: e.message,
      stack: e.stack,
      passed: 0,
      failed: 1
    };
  }
}

function runDataTests() {
  try {
    var results = test_runner.runDataTests();
    return results;
  } catch (e) {
    console.error('Error in runDataTests:', e);
    return {
      error: e.message,
      stack: e.stack,
      passed: 0,
      failed: 1
    };
  }

/**
 * Deployment helper functions
 */
function getDeploymentURL() {
  try {
    var projectKey = ScriptApp.getProjectKey();
    var url = 'https://script.google.com/macros/s/' + projectKey + '/exec';
    return url;
  } catch (e) {
    console.error('Error getting deployment URL:', e);
    return 'Error: Could not get deployment URL';
  }
}

function showDeploymentInstructions() {
  var instructions = `
K&L CRM Test Runner Deployment Instructions

1. Open the script editor in Google Sheets
2. Click "Publish" > "Deploy as web app"
3. Under "Project version", select "New" and click "Save New Version"
4. Under "Execute the app as:", select "Me (your email)"
5. Under "Who has access to the app:", select "Anyone, even anonymous"
6. Click "Deploy"
7. Copy the deployment URL (e.g., https://script.google.com/macros/s/...)
8. Click "OK"

Test runner URL: ${getDeploymentURL()}

Note: You may need to authorize the script when you first access the URL.
  `;
  
  Logger.log(instructions);
  
  // Also show in spreadsheet
  var ui = SpreadsheetApp.getUi();
  ui.alert('Test Runner Deployment', instructions, ui.ButtonSet.OK);
  
  return instructions;
}