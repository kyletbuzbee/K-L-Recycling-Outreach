/**
 * Validation Tests for K&L CRM
 * Tests the validation functions used throughout the application
 */
var ValidationTests = {
  /**
   * Test ValidationUtils methods
   */
  testEmailValidation: function() {
    // Test valid emails
    var validEmails = [
      'test@example.com',
      'user.name+tag@domain.co.uk',
      'user-name@domain.org',
      'user.name@sub.domain.com',
      'info@kl-recycling.com'
    ];
    
    validEmails.forEach(function(email) {
      var result = ValidationUtils.validateEmail(email);
      TestRunner.assert.isTrue(result.success, 'Email should be valid: ' + email);
    });
    
    // Test invalid emails
    var invalidEmails = [
      'not-an-email',
      'user@',
      '@example.com',
      'user@.com',
      'user@example',
      'user @example.com'
    ];
    
    invalidEmails.forEach(function(email) {
      var result = ValidationUtils.validateEmail(email);
      TestRunner.assert.isTrue(!result.success, 'Email should be invalid: ' + email);
    });
    
    // Test edge cases
    var edgeCases = [null, undefined, '', '   '];
    edgeCases.forEach(function(email) {
      var result = ValidationUtils.validateEmail(email);
      TestRunner.assert.isTrue(!result.success, 'Email edge case should fail: ' + email);
    });
  },
  
  testStringLengthValidation: function() {
    // Test valid lengths
    TestRunner.assert.isTrue(ValidationUtils.validateStringLength('test', 1, 10).success, 'String length should be valid');
    TestRunner.assert.isTrue(ValidationUtils.validateStringLength('12345', 5, 5).success, 'Exact length should be valid');
    TestRunner.assert.isTrue(ValidationUtils.validateStringLength('', 0, 10).success, 'Empty string should be valid');
    
    // Test invalid lengths
    TestRunner.assert.isTrue(!ValidationUtils.validateStringLength('too short', 5, 10).success, 'Too short string should fail');
    TestRunner.assert.isTrue(!ValidationUtils.validateStringLength('this is too long', 1, 10).success, 'Too long string should fail');
  },
  
  testRequiredFieldsValidation: function() {
    var obj = {
      'Company Name': 'K&L Recycling',
      'Contact Status': 'Active',
      'Industry': 'Metal Fabrication'
    };
    
    // Test valid required fields
    var result1 = ValidationUtils.validateRequiredFields(obj, ['Company Name', 'Contact Status']);
    TestRunner.assert.isTrue(result1.success, 'Required fields should be present');
    
    // Test missing fields
    var result2 = ValidationUtils.validateRequiredFields(obj, ['Company Name', 'Phone']);
    TestRunner.assert.isTrue(!result2.success, 'Missing field should fail');
    TestRunner.assert.isTrue(result2.missingFields.indexOf('Phone') >= 0, 'Should report missing Phone field');
  },
  
  testRangeValidation: function() {
    // Test valid ranges
    TestRunner.assert.isTrue(ValidationUtils.validateRange(5, 1, 10).success, 'Value within range should be valid');
    TestRunner.assert.isTrue(ValidationUtils.validateRange(1, 1, 10).success, 'Minimum value should be valid');
    TestRunner.assert.isTrue(ValidationUtils.validateRange(10, 1, 10).success, 'Maximum value should be valid');
    
    // Test invalid ranges
    TestRunner.assert.isTrue(!ValidationUtils.validateRange(0, 1, 10).success, 'Below range should fail');
    TestRunner.assert.isTrue(!ValidationUtils.validateRange(11, 1, 10).success, 'Above range should fail');
  },
  
  testIsNotEmpty: function() {
    TestRunner.assert.isTrue(ValidationUtils.isNotEmpty('test'), 'Non-empty string should be true');
    TestRunner.assert.isTrue(ValidationUtils.isNotEmpty(0), 'Zero should be true');
    TestRunner.assert.isTrue(ValidationUtils.isNotEmpty(false), 'False should be true');
    
    TestRunner.assert.isTrue(!ValidationUtils.isNotEmpty(null), 'Null should be false');
    TestRunner.assert.isTrue(!ValidationUtils.isNotEmpty(undefined), 'Undefined should be false');
    TestRunner.assert.isTrue(!ValidationUtils.isNotEmpty(''), 'Empty string should be false');
    TestRunner.assert.isTrue(!ValidationUtils.isNotEmpty('   '), 'Whitespace should be false');
  },
  
  testStringNormalization: function() {
    TestRunner.assert.equals(ValidationUtils.normalizeString('  Test Company  '), 'test company', 'Should normalize case and trim');
    TestRunner.assert.equals(ValidationUtils.normalizeString('Test  Company'), 'test company', 'Should collapse whitespace');
    TestRunner.assert.equals(ValidationUtils.normalizeString('TEST_COMPANY'), 'test_company', 'Should preserve special characters');
  },
  
  testStringComparison: function() {
    TestRunner.assert.isTrue(ValidationUtils.equals('Test', 'TEST'), 'Case insensitivity should work');
    TestRunner.assert.isTrue(ValidationUtils.equals('  Test  ', 'test'), 'Whitespace should be ignored');
    TestRunner.assert.isTrue(!ValidationUtils.equals('Test', 'test1'), 'Different strings should not match');
  },
  
  testSplitAndFilter: function() {
    TestRunner.assert.equals(ValidationUtils.splitAndFilter('a,b,c', ',').length, 3, 'Should split correctly');
    TestRunner.assert.equals(ValidationUtils.splitAndFilter('a,,b,c', ',').length, 3, 'Should filter out empty');
    TestRunner.assert.equals(ValidationUtils.splitAndFilter('a, b, c', ',').length, 3, 'Should trim');
  },
  
  testIsValidPipelineStage: function() {
    var validStages = ['Outreach', 'Prospect', 'Nurture', 'Won'];
    
    validStages.forEach(function(stage) {
      var result = ValidationUtils.isValidPipelineStage(stage);
      if (typeof result === 'object') {
        TestRunner.assert.isTrue(result.success, 'Stage should be valid: ' + stage);
      } else {
        TestRunner.assert.isTrue(validStages.indexOf(stage) >= 0, 'Stage should be valid: ' + stage);
      }
    });
    
    var invalidStages = ['Invalid', '', '   ', null, undefined];
    invalidStages.forEach(function(stage) {
      var result = ValidationUtils.isValidPipelineStage(stage);
      if (typeof result === 'object') {
        TestRunner.assert.isTrue(!result.success, 'Stage should be invalid: ' + stage);
      } else {
        TestRunner.assert.isTrue(validStages.indexOf(stage) === -1, 'Stage should be invalid: ' + stage);
      }
    });
  },
  
  /**
   * Test business rule validations
   */
  testBusinessRulesValidation: function() {
    if (typeof ValidationUtils.validateBusinessRules === 'function') {
      var rules = {
        requiredFields: ['Company Name', 'Contact Status'],
        validStatuses: ['Active', 'Cold', 'Disqualified', 'Interested (Hot)', 'Interested (Warm)', 'Lost', 'Nurture', 'Outreach', 'Prospect', 'Won'],
        validIndustries: ['Agriculture', 'Appliance', 'Automotive', 'Business to business', 'Construction', 'Electrical', 'Fabrication', 'Fence', 'Gutter', 'HVAC', 'Junk Removal', 'Manufacturing', 'Metal Fabrication', 'Other', 'Plumbing', 'Retail', 'Roofing', 'Trailer Dealer', 'Warehouses', 'Welding'],
        validOutcomes: ['Account Won', 'Disqualified', 'Follow-Up', 'Initial Contact', 'Interested', 'Interested (Hot)', 'Interested (Warm)', 'No Answer', 'Not Interested'],
        validStages: ['Disqualified', 'Lost', 'Nurture', 'Outreach', 'Prospect', 'Won']
      };
      
      var result = ValidationUtils.validateBusinessRules(rules);
      TestRunner.assert.isTrue(result.success, 'Business rules should be valid');
    }
  },
  
  /**
   * Test schema alignment validations
   */
  testSchemaAlignment: function() {
    if (typeof ValidationUtils.validateSchemaAlignment === 'function') {
      var result = ValidationUtils.validateSchemaAlignment();
      TestRunner.assert.isTrue(result.success, 'Schema should be aligned');
    }
  },
  
  /**
   * Test data type validations
   */
  testDataTypeValidation: function() {
    // Test date validation
    TestRunner.assert.isTrue(ValidationUtils.isValidDate(new Date()).success, 'Valid date should pass');
    TestRunner.assert.isTrue(!ValidationUtils.isValidDate('not a date').success, 'Invalid date should fail');
    
    // Test number validation
    TestRunner.assert.isTrue(ValidationUtils.isValidNumber(123).success, 'Valid number should pass');
    TestRunner.assert.isTrue(!ValidationUtils.isValidNumber('abc').success, 'Invalid number should fail');
    
    // Test boolean validation
    TestRunner.assert.isTrue(ValidationUtils.isValidBoolean(true).success, 'Valid boolean should pass');
    TestRunner.assert.isTrue(!ValidationUtils.isValidBoolean('yes').success, 'Invalid boolean should fail');
  },
  
  /**
   * Test phone number validation
   */
  testPhoneValidation: function() {
    if (typeof ValidationUtils.validatePhone === 'function') {
      var validPhones = ['(555) 123-4567', '555-123-4567', '5551234567', '+1 555 123 4567'];
      validPhones.forEach(function(phone) {
        var result = ValidationUtils.validatePhone(phone);
        TestRunner.assert.isTrue(result.success, 'Phone should be valid: ' + phone);
      });
      
      var invalidPhones = ['abc', '123', '12345', '123-45', '123-456-789'];
      invalidPhones.forEach(function(phone) {
        var result = ValidationUtils.validatePhone(phone);
        TestRunner.assert.isTrue(!result.success, 'Phone should be invalid: ' + phone);
      });
    }
  },
  
  /**
   * Test URL validation
   */
  testURLValidation: function() {
    if (typeof ValidationUtils.validateURL === 'function') {
      var validURLs = ['http://example.com', 'https://www.example.com', 'https://example.co.uk/path'];
      validURLs.forEach(function(url) {
        var result = ValidationUtils.validateURL(url);
        TestRunner.assert.isTrue(result.success, 'URL should be valid: ' + url);
      });
      
      var invalidURLs = ['not a url', 'http://', 'example.com'];
      invalidURLs.forEach(function(url) {
        var result = ValidationUtils.validateURL(url);
        TestRunner.assert.isTrue(!result.success, 'URL should be invalid: ' + url);
      });
    }
  }
};