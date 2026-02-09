# K&L CRM Test Suite - Usage Guide

## Quick Start

### Option 1: Run in Google Sheets

1. **Open your CRM spreadsheet**
2. **Open the script editor**: Extensions > Apps Script
3. **Select a test function to run**:
   - `runQuickTests()` - Runs basic validation tests
   - `runAllTests()` - Runs complete test suite
   - `runUnitTests()` - Runs core utility tests
   - `runIntegrationTests()` - Runs integration tests
4. **Click the Run button ▶️**
5. **View results** in the Logs (View > Logs)

### Option 2: Use the Web Interface

1. **Deploy the web app** (one-time setup):
   - Click "Publish" > "Deploy as web app"
   - Under Project version: Select "New" and click "Save New Version"
   - Execute the app as: "Me (your email)"
   - Who has access: "Anyone, even anonymous"
   - Click "Deploy"
2. **Copy the deployment URL** (e.g., `https://script.google.com/macros/s/...`)
3. **Open the URL in your browser**
4. **Click "Run Quick Tests"** to verify the system is working

## Test Categories

### Quick Tests (`runQuickTests()`)
- **Purpose**: Fast validation of core system functionality
- **Tests included**:
  - TestRunner availability and basic assertions
  - Test suite objects verification
  - Simple configuration schema check
  - CSV import functionality
  - Pipeline stage validation

### All Tests (`runAllTests()`)
- **Purpose**: Complete validation of the entire system
- **Runs all 7+ test categories**
- **Over 100 individual test cases**

### Category-Specific Tests
- **Unit Tests**: Core utilities, error handling, spreadsheet operations
- **Integration Tests**: CSV import/export, data synchronization
- **Workflow Tests**: Business logic, pipeline operations
- **Outreach Tests**: Outreach tracking, performance metrics
- **Validation Tests**: Input validation (emails, phones, dates, etc.)
- **Data Operations Tests**: CSV parsing, string manipulation
- **Schema Tests**: Schema validation, data types

## Viewing Results

### Log Output
```
=== Quick Tests ===
TestRunner is available ✔️
TestRunner.assert is available ✔️
assertEquals works ✔️
isTrue works ✔️
notNull works ✔️
=== Test Suites ===
UnitTests_Core is available ✔️
IntegrationTests_Prospects is available ✔️
WorkflowTests is available ✔️
ValidationTests is available ✔️
OutreachProspectsLogicTests is available ✔️
=== Quick Test Suite ===
UnitTests_Core.testConfigSchemaIntegrity passed ✔️
IntegrationTests_Prospects.testCSVParseWithHeaders passed ✔️
WorkflowTests.testProspectToCustomerWorkflow passed ✔️
=== Quick Test Results ===
Total Quick Tests: 3
Passed: 3
Failed: 0
=== Summary ===
✅ All quick tests passed!
```

### Web Interface Results
- Shows detailed test results in JSON format
- Highlights success/failure
- Shows execution time

## Troubleshooting

### Common Issues

1. **"ReferenceError: [function] is not defined"**
   - Ensure all test files are included in the Apps Script project
   - Check that file names match exactly (case-sensitive)

2. **"TypeError: Cannot read property '...' of undefined"**
   - Verify that the `CONFIG` object is properly defined
   - Check that required fields exist in your spreadsheet

3. **"TestRunner is not defined"**
   - Ensure `test_runner.js` is in your project
   - Check that it's been saved and run permission is granted

### Debugging
- Use the Logs (View > Logs) to see detailed error messages
- Check for red error indicators in the script editor
- Review comments in test files for troubleshooting tips

## Test File Structure

```
test_runner.js        - Core test runner with assertions
test_deploy.js        - Web app deployment functionality
test_runner.html      - User interface
simple_gas_tests.js   - Quick testing functions
count_tests.js        - Test counting and reporting
test_unit.js          - Unit tests
test_integration.js   - Integration tests
test_workflow_aligned.js - Workflow tests
test_outreach_prospects_logic.js - Outreach tests
test_validation.js    - Validation tests
test_data_operations.js - Data operations tests
test_schema_aligned.js - Schema alignment tests
```

## Adding New Tests

1. **Create a new test function** in the appropriate test file
2. **Follow the existing test patterns**
3. **Use TestRunner assertions**:
   - `TestRunner.assert.equals(actual, expected, message)`
   - `TestRunner.assert.isTrue(value, message)`
   - `TestRunner.assert.notNull(value, message)`
4. **Run your test** to verify it works
5. **Add to test suite** if it should run with the complete suite

## Best Practices

1. **Run quick tests regularly** when making changes
2. **Run the complete suite before deploying** to production
3. **Add tests for new functionality** as you build it
4. **Keep tests independent** and focused on specific functionality
5. **Use clear, descriptive test names** that indicate purpose

## Performance Tips

- **Quick tests** run in ~1-2 seconds for fast feedback
- **Complete suite** may take 5-10 seconds for comprehensive testing
- **Test specific categories** if you only modified certain functionality

## Support

If you experience issues:
1. Check the Logs for error messages
2. Verify all test files are properly loaded
3. Ensure you have the latest version of all files
4. Review the `TESTING_COMPLETION_REPORT.md` for test health status