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
  }
};
