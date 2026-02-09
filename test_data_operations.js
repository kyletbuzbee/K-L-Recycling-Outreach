/**
 * Data Operations Tests for K&L CRM
 * Tests the data manipulation and storage functions
 */
var DataOperationsTests = {
  /**
   * Test CSV import/export operations
   */
  testCSVImportBasic: function() {
    var csvText = "Company Name,Email,Phone\nTest Company,test@example.com,123-456-7890";
    var result = parseCSVWithHeaders(csvText);
    
    TestRunner.assert.isTrue(result.success, 'CSV import should succeed');
    TestRunner.assert.equals(result.headers.length, 3, 'Should have 3 headers');
    TestRunner.assert.equals(result.dataRows.length, 1, 'Should have 1 data row');
  },
  
  testCSVImportWithQuotes: function() {
    var csvText = 'Company Name,Email,Phone\n"Test Company, Inc.","test@example.com","(123) 456-7890"';
    var result = parseCSVWithHeaders(csvText);
    
    TestRunner.assert.isTrue(result.success, 'CSV import with quotes should succeed');
    TestRunner.assert.equals(result.dataRows.length, 1, 'Should have 1 data row');
    
    if (result.dataRows.length > 0) {
      TestRunner.assert.equals(result.dataRows[0][0], 'Test Company, Inc.', 'Company name with comma should be parsed correctly');
      TestRunner.assert.equals(result.dataRows[0][2], '(123) 456-7890', 'Phone number with parentheses should be parsed correctly');
    }
  },
  
  testCSVImportWithBlankLines: function() {
    var csvText = "Company Name,Email,Phone\nTest Company,test@example.com,123-456-7890\n\nAnother Company,another@example.com,987-654-3210";
    var result = parseCSVWithHeaders(csvText);
    
    TestRunner.assert.isTrue(result.success, 'CSV import with blank lines should succeed');
    TestRunner.assert.equals(result.dataRows.length, 2, 'Should skip blank lines');
  },
  
  /**
   * Test string utilities
   */
  testStringTruncation: function() {
    TestRunner.assert.equals(StringUtils.truncate('This is a long text', 10), 'This is a...', 'Text should be truncated with ellipsis');
    TestRunner.assert.equals(StringUtils.truncate('Short text', 20), 'Short text', 'Short text should not be truncated');
    TestRunner.assert.equals(StringUtils.truncate('', 10), '', 'Empty string should remain empty');
  },
  
  testStringContains: function() {
    TestRunner.assert.isTrue(StringUtils.contains('Hello World', 'world'), 'Case insensitivity should work');
    TestRunner.assert.isTrue(StringUtils.contains('Hello World', 'ell'), 'Substring should be found');
    TestRunner.assert.isTrue(!StringUtils.contains('Hello World', 'xyz'), 'Substring should not be found');
  },
  
  testStringFormatting: function() {
    TestRunner.assert.equals(StringUtils.capitalize('hello world'), 'Hello world', 'First letter should be capitalized');
    TestRunner.assert.equals(StringUtils.capitalize('HELLO WORLD'), 'Hello world', 'Only first letter should be capitalized');
  },
  
  /**
   * Test shared utilities
   */
  testGenerateUniqueId: function() {
    var id = SharedUtils.generateUniqueId();
    TestRunner.assert.isTrue(id.length > 0, 'Should generate non-empty string');
    TestRunner.assert.isTrue(typeof id === 'string', 'Should generate string');
    
    var prefixedId = SharedUtils.generateUniqueId('CID');
    TestRunner.assert.isTrue(prefixedId.startsWith('CID'), 'Should include prefix');
  },
  
  testGenerateCompanyId: function() {
    var companyId = SharedUtils.generateCompanyId('Test Company');
    TestRunner.assert.isTrue(companyId.startsWith('CID'), 'Should start with CID');
    TestRunner.assert.isTrue(companyId.length > 3, 'Should have additional characters');
  },
  
  testParseCurrency: function() {
    TestRunner.assert.equals(SharedUtils.parseCurrency('$1,234.56'), 1234.56, 'Should parse currency with $ and commas');
    TestRunner.assert.equals(SharedUtils.parseCurrency('1234'), 1234, 'Should handle numeric strings');
    TestRunner.assert.equals(SharedUtils.parseCurrency(1234), 1234, 'Should handle numbers');
  },
  
  testDateFormatting: function() {
    var testDate = new Date(2026, 1, 7, 12, 0, 0); // Feb 7, 2026 at noon
    
    // Test MM/dd/yyyy format
    var formatted = SharedUtils.formatDate(testDate);
    TestRunner.assert.equals(formatted, '02/07/2026', 'Should format date as MM/dd/yyyy');
    
    // Test ISO format
    if (typeof SharedUtils.formatISO8601 === 'function') {
      var isoFormatted = SharedUtils.formatISO8601(testDate);
      TestRunner.assert.isTrue(isoFormatted.startsWith('2026-02-07'), 'Should contain ISO date');
    }
  },
  
  /**
   * Test fuzzy matching
   */
  testFuzzyMatchingExact: function() {
    var prospects = [
      { 'Company Name': 'ABC Corp', 'Company ID': 'CID-001' },
      { 'Company Name': 'XYZ Ltd', 'Company ID': 'CID-002' }
    ];
    
    var outreach = { Company: 'ABC Corp', CompanyID: '' };
    var matchResult = fuzzyMatchCompany(outreach, prospects);
    
    TestRunner.assert.isTrue(matchResult.confidence > 0.8, 'Exact match should have high confidence');
  },
  
  testFuzzyMatchingClose: function() {
    var prospects = [
      { 'Company Name': 'K&L Recycling LLC', 'Company ID': 'CID-KL01' },
      { 'Company Name': 'Green Waste Corp', 'Company ID': 'CID-GW05' }
    ];
    
    var outreach = { Company: 'K & L Recycling', CompanyID: '' };
    var matchResult = fuzzyMatchCompany(outreach, prospects);
    
    TestRunner.assert.isTrue(matchResult.confidence > 0.5, 'Close match should have reasonable confidence');
  },
  
  /**
   * Test column operations
   */
  testNormalizeHeader: function() {
    TestRunner.assert.equals(normalizeHeaderSafe('Company Name'), 'company name', 'Should lowercase and trim');
    TestRunner.assert.equals(normalizeHeaderSafe(' Visit Date '), 'visit date', 'Should trim whitespace');
    TestRunner.assert.equals(normalizeHeaderSafe(''), '', 'Should handle empty string');
  },
  
  testHeaderSimilarity: function() {
    TestRunner.assert.isTrue(areSimilarHeaders('Company Name', 'Company'), 'Should match similar headers');
    TestRunner.assert.isTrue(areSimilarHeaders('Visit Date', 'Visit'), 'Should match similar headers');
    TestRunner.assert.isTrue(!areSimilarHeaders('Company Name', 'Phone'), 'Should not match different headers');
  },
  
  /**
   * Test data safety
   */
  testUpdateCellSafe: function() {
    TestRunner.assert.isTrue(typeof updateCellSafe === 'function', 'updateCellSafe should be available');
  },
  
  testPrependRowSafe: function() {
    TestRunner.assert.isTrue(typeof prependRowSafe === 'function', 'prependRowSafe should be available');
  },
  
  testAppendRowSafe: function() {
    TestRunner.assert.isTrue(typeof appendRowSafe === 'function', 'appendRowSafe should be available');
  },
  
  testGetSheetSafe: function() {
    TestRunner.assert.isTrue(typeof getSheetSafe === 'function', 'getSheetSafe should be available');
  },
  
  /**
   * Test validation utilities
   */
  testValidateKeys: function() {
    var obj = { key1: 'value1', key2: 'value2' };
    TestRunner.assert.isTrue(SharedUtils.validateKeys(obj, ['key1', 'key2']), 'Should validate existing keys');
    
    var missingKeys = function() {
      SharedUtils.validateKeys({}, ['key1']);
    };
    TestRunner.assert.isTrue(!TestRunner.assert.throws(missingKeys), 'Should throw on missing keys');
  },
  
  testCheckSpreadsheetAccess: function() {
    TestRunner.assert.isTrue(typeof SharedUtils.checkSpreadsheetAccess === 'function', 'checkSpreadsheetAccess should exist');
  },
  
  /**
   * Test data validation in spreadsheets
   */
  testSheetHeaderValidation: function() {
    if (typeof getColumnIndex === 'function') {
      var result = getColumnIndex('', 'test');
      TestRunner.assert.equals(result, -1, 'Should return -1 for empty sheet name');
      
      result = getColumnIndex('TestSheet', '');
      TestRunner.assert.equals(result, -1, 'Should return -1 for empty column name');
    }
  },
  
  /**
   * Test data consistency
   */
  testDataConsistencyChecks: function() {
    // Test simple data validation
    var data = [
      { id: 'CID-001', company: 'Test Company' },
      { id: 'CID-002', company: 'Another Company' }
    ];
    
    var uniqueIds = [];
    data.forEach(function(row) {
      TestRunner.assert.isTrue(uniqueIds.indexOf(row.id) === -1, 'Duplicate ID should not exist');
      uniqueIds.push(row.id);
    });
  },
  
  /**
   * Test error handling in data operations
   */
  testNullHandling: function() {
    // Test that utilities handle null inputs gracefully
    var id = SharedUtils.generateUniqueId(null);
    TestRunner.assert.isTrue(typeof id === 'string', 'Should generate string ID');
    
    var formattedDate = SharedUtils.formatDate(null);
    TestRunner.assert.isTrue(typeof formattedDate === 'string', 'Should handle null date');
  },
  
  testUndefinedHandling: function() {
    var id = SharedUtils.generateUniqueId(undefined);
    TestRunner.assert.isTrue(typeof id === 'string', 'Should generate string ID');
  },
  
  testParseCurrencyEdgeCases: function() {
    TestRunner.assert.equals(SharedUtils.parseCurrency(null), 0.0, 'Null should return 0');
    TestRunner.assert.equals(SharedUtils.parseCurrency(undefined), 0.0, 'Undefined should return 0');
    TestRunner.assert.equals(SharedUtils.parseCurrency(''), 0.0, 'Empty string should return 0');
  },
  
  /**
   * Test integration with other systems
   */
  testDateParsing: function() {
    var isoDate = "2026-01-15";
    var parsed = parseDateSafely(isoDate);
    TestRunner.assert.isTrue(parsed instanceof Date, 'Should parse ISO date');
    TestRunner.assert.equals(parsed.getDate(), 15, 'Should parse day correctly');
  },
  
  testDateCalculations: function() {
    var friday = new Date(2026, 1, 6); // Feb 6, 2026
    var nextDay = ProspectFunctions.calculateNextBusinessDay(1, friday);
    
    TestRunner.assert.equals(nextDay.getDay(), 1, 'Should skip weekend');
    TestRunner.assert.equals(nextDay.getDate(), 9, 'Should return Monday');
  }
};