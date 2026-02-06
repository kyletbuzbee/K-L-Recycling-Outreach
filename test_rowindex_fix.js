/**
 * Test Script for Row Index Fix Verification
 * Tests that getSafeSheetData properly injects _rowIndex
 */

function testRowIndexInjection() {
  console.log('🧪 Testing Row Index Injection Fix...\n');
  
  var testResults = {
    getSafeSheetData: false,
    rowIndexPresent: false,
    rowIndexValue: false,
    rowIndexOneBased: false
  };
  
  try {
    // Test 1: Verify getSafeSheetData returns array
    console.log('Test 1: Calling getSafeSheetData...');
    var prospects = SharedUtils.getSafeSheetData(CONFIG.SHEET_PROSPECTS, ['Company Name', 'Company ID']);
    
    if (!Array.isArray(prospects)) {
      console.error('❌ FAILED: getSafeSheetData did not return an array');
      return testResults;
    }
    
    console.log('✅ PASSED: getSafeSheetData returned array with ' + prospects.length + ' rows');
    testResults.getSafeSheetData = true;
    
    if (prospects.length === 0) {
      console.warn('⚠️  WARNING: No data found in Prospects sheet');
      return testResults;
    }
    
    // Test 2: Verify _rowIndex is present in first row
    console.log('\nTest 2: Checking for _rowIndex property...');
    var firstRow = prospects[0];
    
    if (!firstRow.hasOwnProperty('_rowIndex')) {
      console.error('❌ FAILED: _rowIndex property not found in row object');
      console.log('Row object keys:', Object.keys(firstRow));
      return testResults;
    }
    
    console.log('✅ PASSED: _rowIndex property is present');
    testResults.rowIndexPresent = true;
    
    // Test 3: Verify _rowIndex has a valid value
    console.log('\nTest 3: Checking _rowIndex value...');
    var rowIndex = firstRow._rowIndex;
    
    if (typeof rowIndex !== 'number' || rowIndex <= 0) {
      console.error('❌ FAILED: _rowIndex is not a valid positive number');
      console.log('_rowIndex value:', rowIndex, 'Type:', typeof rowIndex);
      return testResults;
    }
    
    console.log('✅ PASSED: _rowIndex is a valid number: ' + rowIndex);
    testResults.rowIndexValue = true;
    
    // Test 4: Verify _rowIndex is 1-based (not 0-based)
    console.log('\nTest 4: Checking if _rowIndex is 1-based...');
    if (rowIndex < 2) {
      console.error('❌ FAILED: _rowIndex appears to be 0-based (value: ' + rowIndex + ')');
      console.log('Expected: 2 or greater (since row 1 is headers)');
      return testResults;
    }
    
    console.log('✅ PASSED: _rowIndex is 1-based (value: ' + rowIndex + ')');
    testResults.rowIndexOneBased = true;
    
    // Test 5: Verify all rows have _rowIndex
    console.log('\nTest 5: Checking all rows for _rowIndex...');
    var allHaveRowIndex = prospects.every(function(row) {
      return row.hasOwnProperty('_rowIndex') && typeof row._rowIndex === 'number' && row._rowIndex > 1;
    });
    
    if (!allHaveRowIndex) {
      console.error('❌ FAILED: Not all rows have valid _rowIndex');
      var invalidRows = prospects.filter(function(row) {
        return !row.hasOwnProperty('_rowIndex') || typeof row._rowIndex !== 'number' || row._rowIndex <= 1;
      });
      console.log('Invalid rows found:', invalidRows.length);
      return testResults;
    }
    
    console.log('✅ PASSED: All ' + prospects.length + ' rows have valid _rowIndex');
    
    // Test 6: Verify rowIndex values are sequential
    console.log('\nTest 6: Checking if rowIndex values are sequential...');
    var isSequential = true;
    for (var i = 0; i < prospects.length - 1; i++) {
      if (prospects[i + 1]._rowIndex !== prospects[i]._rowIndex + 1) {
        isSequential = false;
        console.warn('Row ' + i + ' has _rowIndex ' + prospects[i]._rowIndex + 
                    ', but row ' + (i + 1) + ' has _rowIndex ' + prospects[i + 1]._rowIndex);
        break;
      }
    }
    
    if (!isSequential) {
      console.warn('⚠️  WARNING: _rowIndex values are not perfectly sequential');
      console.log('This may be expected if there are empty rows in the sheet');
    } else {
      console.log('✅ PASSED: _rowIndex values are sequential');
    }
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));
    console.log('getSafeSheetData returns array: ' + (testResults.getSafeSheetData ? '✅' : '❌'));
    console.log('_rowIndex property present: ' + (testResults.rowIndexPresent ? '✅' : '❌'));
    console.log('_rowIndex has valid value: ' + (testResults.rowIndexValue ? '✅' : '❌'));
    console.log('_rowIndex is 1-based: ' + (testResults.rowIndexOneBased ? '✅' : '❌'));
    
    var allPassed = testResults.getSafeSheetData && 
                  testResults.rowIndexPresent && 
                  testResults.rowIndexValue && 
                  testResults.rowIndexOneBased;
    
    console.log('\nOverall Result: ' + (allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'));
    console.log('='.repeat(60));
    
    return testResults;
    
  } catch (e) {
    console.error('❌ Test execution failed:', e.message);
    console.error('Stack trace:', e.stack);
    return testResults;
  }
}

/**
 * Test updateCellSafe with _rowIndex
 */
function testUpdateCellSafeWithRowIndex() {
  console.log('\n🧪 Testing updateCellSafe with _rowIndex...\n');
  
  try {
    // Get a prospect to update
    var prospects = SharedUtils.getSafeSheetData(CONFIG.SHEET_PROSPECTS, ['Company Name', 'Company ID']);
    
    if (prospects.length === 0) {
      console.warn('⚠️  No prospects found to test updateCellSafe');
      return { success: false, reason: 'No data' };
    }
    
    var testProspect = prospects[0];
    var rowIndex = testProspect._rowIndex;
    var testValue = 'TEST-' + new Date().getTime();
    
    console.log('Test Prospect:');
    console.log('  Company Name:', testProspect['company name']);
    console.log('  Company ID:', testProspect['company id']);
    console.log('  Row Index:', rowIndex);
    
    // Test updateCellSafe
    console.log('\nAttempting to update "Last Outcome" column...');
    var updateResult = updateCellSafe(CONFIG.SHEET_PROSPECTS, rowIndex, 'Last Outcome', testValue);
    
    if (updateResult === false) {
      console.error('❌ FAILED: updateCellSafe returned false');
      return { success: false, reason: 'Update failed' };
    }
    
    console.log('✅ PASSED: updateCellSafe executed successfully');
    
    // Verify the update
    console.log('\nVerifying update...');
    var updatedProspects = SharedUtils.getSafeSheetData(CONFIG.SHEET_PROSPECTS, ['Company Name', 'Last Outcome']);
    var updatedProspect = updatedProspects.find(function(p) {
      return p['company name'] === testProspect['company name'];
    });
    
    if (!updatedProspect) {
      console.error('❌ FAILED: Could not find updated prospect');
      return { success: false, reason: 'Verification failed' };
    }
    
    if (updatedProspect['last outcome'] !== testValue) {
      console.error('❌ FAILED: Value was not updated correctly');
      console.log('Expected:', testValue);
      console.log('Actual:', updatedProspect['last outcome']);
      return { success: false, reason: 'Value mismatch' };
    }
    
    console.log('✅ PASSED: Value updated and verified successfully');
    console.log('Updated value:', updatedProspect['last outcome']);
    
    // Clean up - restore original value
    console.log('\nCleaning up test data...');
    updateCellSafe(CONFIG.SHEET_PROSPECTS, rowIndex, 'Last Outcome', '');
    
    return { success: true };
    
  } catch (e) {
    console.error('❌ Test execution failed:', e.message);
    console.error('Stack trace:', e.stack);
    return { success: false, reason: e.message };
  }
}

/**
 * Run all row index tests
 */
function runRowIndexTests() {
  console.log('🚀 Starting Row Index Fix Verification Tests...\n');
  console.log('📅 Test Date:', new Date().toISOString());
  console.log('='.repeat(60));
  
  var results = {
    injectionTest: testRowIndexInjection(),
    updateTest: testUpdateCellSafeWithRowIndex()
  };
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 FINAL TEST RESULTS');
  console.log('='.repeat(60));
  console.log('Row Index Injection Test: ' + 
             (results.injectionTest.getSafeSheetData && 
              results.injectionTest.rowIndexPresent && 
              results.injectionTest.rowIndexValue && 
              results.injectionTest.rowIndexOneBased ? '✅ PASSED' : '❌ FAILED'));
  console.log('Update Cell Safe Test: ' + 
             (results.updateTest.success ? '✅ PASSED' : '❌ FAILED'));
  
  var allPassed = (results.injectionTest.getSafeSheetData && 
                  results.injectionTest.rowIndexPresent && 
                  results.injectionTest.rowIndexValue && 
                  results.injectionTest.rowIndexOneBased) &&
                 results.updateTest.success;
  
  console.log('\nOverall Result: ' + (allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'));
  console.log('='.repeat(60));
  
  return results;
}
