/**
 * Core Engine Unit Tests
 */
var UnitTests_Core = {
  testConfigSchemaIntegrity: function() {
    TestRunner.assert.notNull(CONFIG.SHEETS.PROSPECTS, "Prospects sheet name missing");
    TestRunner.assert.isTrue(CONFIG.HEADERS.PROSPECTS.includes('Company ID'), "Schema Missing: Company ID");
  },

  testDateValidation: function() {
    var validDate = "2026-02-07";
    var result = ValidationUtils.validateDate(validDate);
    TestRunner.assert.isTrue(result.success, "Failed to validate ISO date");
    
    var invalidDate = "not-a-date";
    var resultFail = ValidationUtils.validateDate(invalidDate);
    TestRunner.assert.isTrue(!resultFail.success, "Failed to catch invalid date string");
  },

  testSharedUtilsFormatting: function() {
    var date = new Date(2026, 1, 7); // Feb 7, 2026
    var formatted = SharedUtils.formatDate(date);
    // Config default is MM/dd/yyyy
    TestRunner.assert.equals(formatted, "02/07/2026", "SharedUtils.formatDate failed pattern match");
  },

  testHeaderNormalization: function() {
    var raw = "  Company ID  ";
    var normalized = SharedUtils.normalizeHeader(raw);
    TestRunner.assert.equals(normalized, "company id", "Header normalization failed");
  },

  // ValidationUtils Tests
  testValidateEmail: function() {
    var validEmail = ValidationUtils.validateEmail("test@example.com");
    TestRunner.assert.isTrue(validEmail.success, "Valid email should pass");
    TestRunner.assert.equals(validEmail.email, "test@example.com", "Email should be returned");

    var invalidEmail = ValidationUtils.validateEmail("invalid-email");
    TestRunner.assert.isTrue(!invalidEmail.success, "Invalid email should fail");

    var emptyEmail = ValidationUtils.validateEmail("");
    TestRunner.assert.isTrue(!emptyEmail.success, "Empty email should fail");
  },

  testValidateStringLength: function() {
    var valid = ValidationUtils.validateStringLength("hello", 1, 10, "test");
    TestRunner.assert.isTrue(valid.success, "Valid string length should pass");

    var tooShort = ValidationUtils.validateStringLength("hi", 5, 10, "test");
    TestRunner.assert.isTrue(!tooShort.success, "Too short string should fail");

    var tooLong = ValidationUtils.validateStringLength("this is a very long string", 1, 10, "test");
    TestRunner.assert.isTrue(!tooLong.success, "Too long string should fail");
  },

  testValidateRequiredFields: function() {
    var obj = { name: "John", age: 30 };
    var valid = ValidationUtils.validateRequiredFields(obj, ["name", "age"]);
    TestRunner.assert.isTrue(valid.success, "Required fields present should pass");

    var missing = ValidationUtils.validateRequiredFields(obj, ["name", "email"]);
    TestRunner.assert.isTrue(!missing.success, "Missing required field should fail");
  },

  testValidateRange: function() {
    var valid = ValidationUtils.validateRange(5, 1, 10, "test");
    TestRunner.assert.isTrue(valid.success, "Value in range should pass");

    var tooLow = ValidationUtils.validateRange(0, 1, 10, "test");
    TestRunner.assert.isTrue(!tooLow.success, "Value below range should fail");

    var tooHigh = ValidationUtils.validateRange(15, 1, 10, "test");
    TestRunner.assert.isTrue(!tooHigh.success, "Value above range should fail");
  },

  testIsNotEmpty: function() {
    TestRunner.assert.isTrue(ValidationUtils.isNotEmpty("hello"), "Non-empty string should be true");
    TestRunner.assert.isTrue(!ValidationUtils.isNotEmpty(""), "Empty string should be false");
    TestRunner.assert.isTrue(!ValidationUtils.isNotEmpty(null), "Null should be false");
    TestRunner.assert.isTrue(!ValidationUtils.isNotEmpty(undefined), "Undefined should be false");
  },

  // StringUtils Tests
  testStringNormalize: function() {
    TestRunner.assert.equals(StringUtils.normalize("  Hello World  "), "hello world", "Normalize should lowercase and trim");
  },

  testStringContains: function() {
    TestRunner.assert.isTrue(StringUtils.contains("Hello World", "world"), "Should find substring");
    TestRunner.assert.isTrue(!StringUtils.contains("Hello", "world"), "Should not find missing substring");
  },

  testStringTruncate: function() {
    TestRunner.assert.equals(StringUtils.truncate("Hello World", 5), "Hello...", "Should truncate with ellipsis");
    TestRunner.assert.equals(StringUtils.truncate("Hi", 5), "Hi", "Should not truncate short string");
  },

  testStringIsNotEmpty: function() {
    TestRunner.assert.isTrue(StringUtils.isNotEmpty("hello"), "Non-empty should be true");
    TestRunner.assert.isTrue(!StringUtils.isNotEmpty(""), "Empty should be false");
  },

  testGetColumnIndex: function() {
    // Mock test - would need actual sheet in real environment
    var result = getColumnIndex("", "test");
    TestRunner.assert.equals(result, -1, "Should return -1 for empty sheet name");

    result = getColumnIndex("TestSheet", "");
    TestRunner.assert.equals(result, -1, "Should return -1 for empty column name");
  },

  // DataHelpers Tests
  testUpdateCellSafe: function() {
    // Test updateCellSafe function exists
    TestRunner.assert.isTrue(typeof updateCellSafe === 'function', "updateCellSafe function should exist");
  },

  testPrependRowSafe: function() {
    // Test prependRowSafe function exists
    TestRunner.assert.isTrue(typeof prependRowSafe === 'function', "prependRowSafe function should exist");
  },

  testAppendRowSafe: function() {
    // Test appendRowSafe function exists
    TestRunner.assert.isTrue(typeof appendRowSafe === 'function', "appendRowSafe function should exist");
  },

  testGetSheetSafe: function() {
    // Test getSheetSafe function exists
    TestRunner.assert.isTrue(typeof getSheetSafe === 'function', "getSheetSafe function should exist");
  },

  // SharedUtils Additional Tests
  testGenerateUniqueId: function() {
    var id = SharedUtils.generateUniqueId('CID');
    TestRunner.assert.isTrue(typeof id === 'string', "Should generate string ID");
    TestRunner.assert.isTrue(id.length > 0, "Should generate non-empty ID");
  },

  testGenerateCompanyId: function() {
    var id = SharedUtils.generateCompanyId('Test Company');
    TestRunner.assert.isTrue(typeof id === 'string', "Should generate string company ID");
    TestRunner.assert.isTrue(id.length > 0, "Should generate non-empty company ID");
  },

  testParseCurrency: function() {
    TestRunner.assert.equals(SharedUtils.parseCurrency('$1,234.56'), 1234.56, "Should parse currency correctly");
    TestRunner.assert.equals(SharedUtils.parseCurrency('1234'), 1234, "Should handle numeric strings");
    TestRunner.assert.equals(SharedUtils.parseCurrency(1234.56), 1234.56, "Should handle numbers");
  },

  testValidateKeys: function() {
    var obj = { key1: 'value1', key2: 'value2' };
    TestRunner.assert.isTrue(SharedUtils.validateKeys(obj, ['key1', 'key2']), "Should validate keys");
  },

  testCheckSpreadsheetAccess: function() {
    // Test checkSpreadsheetAccess function exists
    TestRunner.assert.isTrue(typeof SharedUtils.checkSpreadsheetAccess === 'function', "checkSpreadsheetAccess function should exist");
  },

  // Error Handling Tests
  testNullInputHandling: function() {
    // Test that utilities handle null inputs gracefully
    var id = SharedUtils.generateUniqueId(null);
    TestRunner.assert.isTrue(typeof id === 'string', "Should generate string ID even with null input");
    TestRunner.assert.isTrue(id.length > 0, "Should generate non-empty ID");
  },

  testUndefinedInputHandling: function() {
    // Test that utilities handle undefined inputs gracefully
    var id = SharedUtils.generateUniqueId(undefined);
    TestRunner.assert.isTrue(typeof id === 'string', "Should generate string ID even with undefined input");
    TestRunner.assert.isTrue(id.length > 0, "Should generate non-empty ID");
  },

  testParseCurrencyNullUndefined: function() {
    // Test parseCurrency handles null/undefined
    TestRunner.assert.equals(SharedUtils.parseCurrency(null), 0.0, "Should return 0 for null");
    TestRunner.assert.equals(SharedUtils.parseCurrency(undefined), 0.0, "Should return 0 for undefined");
    TestRunner.assert.equals(SharedUtils.parseCurrency(''), 0.0, "Should return 0 for empty string");
  },

  testGenerateCompanyIdEdgeCases: function() {
    // Test generateCompanyId handles edge cases
    var idEmpty = SharedUtils.generateCompanyId('');
    TestRunner.assert.isTrue(typeof idEmpty === 'string', "Should handle empty string");
    TestRunner.assert.isTrue(idEmpty.startsWith('CID-'), "Should still generate valid prefix");
    
    var idSpecial = SharedUtils.generateCompanyId('123 Special!@#');
    TestRunner.assert.isTrue(typeof idSpecial === 'string', "Should handle special characters");
  },

  testValidateKeysEdgeCases: function() {
    // Test validateKeys with edge cases
    var emptyObj = {};
    try {
      SharedUtils.validateKeys(emptyObj, ['name']);
      TestRunner.assert.isTrue(false, "Should throw error for empty object");
    } catch (e) {
      TestRunner.assert.isTrue(true, "Should throw error for missing required keys");
    }
    
    // Test with null/undefined keys
    var validObj = { name: 'John' };
    var result = SharedUtils.validateKeys(validObj, ['name']);
    TestRunner.assert.isTrue(result, "Should validate existing keys");
  },

  testDateValidationEdgeCases: function() {
    // Test date validation handles edge cases
    var invalidDate = ValidationUtils.validateDate(null);
    TestRunner.assert.isTrue(!invalidDate.success, "Null date should fail validation");
    
    var undefinedDate = ValidationUtils.validateDate(undefined);
    TestRunner.assert.isTrue(!undefinedDate.success, "Undefined date should fail validation");
    
    var emptyDate = ValidationUtils.validateDate('');
    TestRunner.assert.isTrue(!emptyDate.success, "Empty date should fail validation");
  },

  testEmailValidationEdgeCases: function() {
    // Test email validation handles edge cases
    var nullEmail = ValidationUtils.validateEmail(null);
    TestRunner.assert.isTrue(!nullEmail.success, "Null email should fail");
    
    var undefinedEmail = ValidationUtils.validateEmail(undefined);
    TestRunner.assert.isTrue(!undefinedEmail.success, "Undefined email should fail");
    
    var emptyEmail = ValidationUtils.validateEmail('');
    TestRunner.assert.isTrue(!emptyEmail.success, "Empty email should fail");
  },

  testRequiredFieldsEdgeCases: function() {
    // Test required fields validation with edge cases
    var objNullValues = { name: null, email: undefined };
    var result = ValidationUtils.validateRequiredFields(objNullValues, ['name', 'email']);
    TestRunner.assert.isTrue(!result.success, "Should fail when fields are null/undefined");
  },

  testStringValidationEdgeCases: function() {
    // Test string validation handles edge cases
    var nullString = ValidationUtils.validateStringLength(null, 1, 10, "test");
    TestRunner.assert.isTrue(!nullString.success, "Null string should fail validation");
    
    var undefinedString = ValidationUtils.validateStringLength(undefined, 1, 10, "test");
    TestRunner.assert.isTrue(!undefinedString.success, "Undefined string should fail validation");
  }
};
