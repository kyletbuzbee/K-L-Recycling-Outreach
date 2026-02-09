/**
 * Comprehensive Validation Tests
 * Tests all validation utilities and business logic validation
 */
var ValidationTests = {
  testEmailValidation: function() {
    // Valid emails
    var validEmails = [
      "test@example.com",
      "user.name+tag@domain.co.uk",
      "test123@gmail.com"
    ];

    validEmails.forEach(function(email) {
      var result = ValidationUtils.validateEmail(email);
      TestRunner.assert.isTrue(result.success, "Valid email should pass: " + email);
      TestRunner.assert.equals(result.email, email.toLowerCase(), "Email should be lowercased");
    });

    // Invalid emails
    var invalidEmails = [
      "invalid-email",
      "@example.com",
      "test@",
      "",
      null,
      undefined
    ];

    invalidEmails.forEach(function(email) {
      var result = ValidationUtils.validateEmail(email);
      TestRunner.assert.isTrue(!result.success, "Invalid email should fail: " + email);
    });
  },

  testPhoneValidation: function() {
    // Note: Assuming phone validation exists or needs to be added
    // This is a placeholder for phone validation tests
    TestRunner.assert.isTrue(true, "Phone validation placeholder - implement when phone validation is added");
  },

  testRequiredFieldsValidation: function() {
    var obj = { name: "John", age: 30, email: "john@example.com" };

    // All required fields present
    var result = ValidationUtils.validateRequiredFields(obj, ["name", "email"]);
    TestRunner.assert.isTrue(result.success, "Should pass when all required fields present");

    // Missing required field
    var result2 = ValidationUtils.validateRequiredFields(obj, ["name", "phone"]);
    TestRunner.assert.isTrue(!result2.success, "Should fail when required field missing");
    TestRunner.assert.equals(result2.missingFields.length, 1, "Should identify missing field");
    TestRunner.assert.equals(result2.missingFields[0], "phone", "Should identify correct missing field");

    // Empty/null values
    var objWithEmpty = { name: "", age: null, email: undefined };
    var result3 = ValidationUtils.validateRequiredFields(objWithEmpty, ["name", "age", "email"]);
    TestRunner.assert.isTrue(!result3.success, "Should fail when fields are empty/null");
  },

  testStringLengthValidation: function() {
    // Valid lengths
    var result = ValidationUtils.validateStringLength("hello", 1, 10, "test field");
    TestRunner.assert.isTrue(result.success, "Valid length should pass");

    // Too short
    var result2 = ValidationUtils.validateStringLength("hi", 5, 10, "test field");
    TestRunner.assert.isTrue(!result2.success, "Too short should fail");

    // Too long
    var result3 = ValidationUtils.validateStringLength("this is a very long string indeed", 1, 10, "test field");
    TestRunner.assert.isTrue(!result3.success, "Too long should fail");

    // Non-string input
    var result4 = ValidationUtils.validateStringLength(123, 1, 10, "test field");
    TestRunner.assert.isTrue(!result4.success, "Non-string should fail");
  },

  testRangeValidation: function() {
    // Valid range
    var result = ValidationUtils.validateRange(5, 1, 10, "test value");
    TestRunner.assert.isTrue(result.success, "Value in range should pass");
    TestRunner.assert.equals(result.value, 5, "Should return parsed value");

    // Too low
    var result2 = ValidationUtils.validateRange(0, 1, 10, "test value");
    TestRunner.assert.isTrue(!result2.success, "Value below range should fail");

    // Too high
    var result3 = ValidationUtils.validateRange(15, 1, 10, "test value");
    TestRunner.assert.isTrue(!result3.success, "Value above range should fail");

    // Non-numeric
    var result4 = ValidationUtils.validateRange("not-a-number", 1, 10, "test value");
    TestRunner.assert.isTrue(!result4.success, "Non-numeric should fail");
  },

  testInventoryValidation: function() {
    // Valid positive number
    var result = ValidationUtils.validateInventoryOperation(5, "quantity");
    TestRunner.assert.isTrue(result.success, "Positive number should pass");

    // Zero
    var result2 = ValidationUtils.validateInventoryOperation(0, "quantity");
    TestRunner.assert.isTrue(result2.success, "Zero should pass");

    // Negative (should fail)
    var result3 = ValidationUtils.validateInventoryOperation(-1, "quantity");
    TestRunner.assert.isTrue(!result3.success, "Negative should fail");

    // Non-numeric
    var result4 = ValidationUtils.validateInventoryOperation("abc", "quantity");
    TestRunner.assert.isTrue(!result4.success, "Non-numeric should fail");
  },

  testStringNormalization: function() {
    TestRunner.assert.equals(ValidationUtils.normalizeString("  Hello World  "), "hello world", "Should normalize case and trim");
    TestRunner.assert.equals(ValidationUtils.normalizeString(""), "", "Should handle empty string");
    TestRunner.assert.equals(ValidationUtils.normalizeString(null), "", "Should handle null");
    TestRunner.assert.equals(ValidationUtils.normalizeString(undefined), "", "Should handle undefined");
  },

  testStringComparison: function() {
    TestRunner.assert.isTrue(ValidationUtils.equals("Hello", "HELLO"), "Should be case insensitive");
    TestRunner.assert.isTrue(ValidationUtils.equals("  test  ", "TEST"), "Should ignore whitespace");
    TestRunner.assert.isTrue(!ValidationUtils.equals("hello", "world"), "Different strings should not match");
  },

  testSplitAndFilter: function() {
    var result = ValidationUtils.splitAndFilter("a,b,c", ",");
    TestRunner.assert.equals(result.length, 3, "Should split correctly");
    TestRunner.assert.equals(result[0], "a", "Should trim parts");

    var result2 = ValidationUtils.splitAndFilter("a,,b, ", ",");
    TestRunner.assert.equals(result2.length, 2, "Should filter empty parts");
    TestRunner.assert.equals(result2[0], "a", "Should trim and filter");

    var result3 = ValidationUtils.splitAndFilter(null, ",");
    TestRunner.assert.equals(result3.length, 0, "Should handle null input");
  },

  testIsNotEmpty: function() {
    TestRunner.assert.isTrue(ValidationUtils.isNotEmpty("hello"), "Non-empty string should be true");
    TestRunner.assert.isTrue(ValidationUtils.isNotEmpty(" "), "Whitespace string should be true");
    TestRunner.assert.isTrue(!ValidationUtils.isNotEmpty(""), "Empty string should be false");
    TestRunner.assert.isTrue(!ValidationUtils.isNotEmpty(null), "Null should be false");
    TestRunner.assert.isTrue(!ValidationUtils.isNotEmpty(undefined), "Undefined should be false");
  }
};
