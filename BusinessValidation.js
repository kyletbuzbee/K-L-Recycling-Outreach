/**
 * Business Validation Utilities
 * Centralized business rule validation functions for K&L Recycling CRM.
 * Ensures data integrity and business logic consistency across the application.
 */

var BusinessValidation = {
  /**
   * Validates prospect data against business rules with enhanced error handling
   */
  validateProspectWithErrorHandling: function(prospectData, options) {
    try {
      return this.validateProspect(prospectData, options);
    } catch (e) {
      return ErrorHandling.handleError(e, {
        functionName: 'validateProspect',
        entityType: 'prospect',
        data: prospectData
      });
    }
  },

  /**
   * Validates outreach data against business rules with enhanced error handling
   */
  validateOutreachWithErrorHandling: function(outreachData, options) {
    try {
      return this.validateOutreach(outreachData, options);
    } catch (e) {
      return ErrorHandling.handleError(e, {
        functionName: 'validateOutreach',
        entityType: 'outreach',
        data: outreachData
      });
    }
  },

  /**
   * Validates new account data against business rules with enhanced error handling
   */
  validateNewAccountWithErrorHandling: function(accountData, options) {
    try {
      return this.validateNewAccount(accountData, options);
    } catch (e) {
      return ErrorHandling.handleError(e, {
        functionName: 'validateNewAccount',
        entityType: 'account',
        data: accountData
      });
    }
  },

  /**
   * Validates business logic with enhanced error handling
   */
  validateBusinessLogicWithErrorHandling: function(data, options) {
    try {
      return this.validateBusinessLogic(data, options);
    } catch (e) {
      return ErrorHandling.handleError(e, {
        functionName: 'validateBusinessLogic',
        data: data
      });
    }
  },

  /**
   * Validates complete submission with enhanced error handling
   */
  validateCompleteSubmissionWithErrorHandling: function(entityType, data, options) {
    try {
      return this.validateCompleteSubmission(entityType, data, options);
    } catch (e) {
      return ErrorHandling.handleError(e, {
        functionName: 'validateCompleteSubmission',
        entityType: entityType,
        data: data
      });
    }
  }
};

/**
 * Business rule validation constants and configurations
 */
var BUSINESS_RULES = {
  // Date validation rules
  DATE_RULES: {
    MIN_YEAR: 1900,
    MAX_YEAR: 2100,
    MAX_FUTURE_DAYS: 365, // Max 1 year in future for next steps
    MIN_PAST_DAYS: 1825, // Max 5 years in past for historical data
    ALLOW_FUTURE_NEXT_STEPS: true,
    ALLOW_PAST_NEXT_STEPS: true
  },
  
  // Prospect validation rules
  PROSPECT_RULES: {
    MIN_PRIORITY_SCORE: 0,
    MAX_PRIORITY_SCORE: 100,
    MIN_URGENCY_SCORE: 0,
    MAX_URGENCY_SCORE: 100,
    REQUIRED_FIELDS: ['Company Name', 'Address'],
    ALLOW_DUPLICATE_COMPANIES: false
  },
  
   // Outreach validation rules
  OUTREACH_RULES: {
    VALID_OUTCOMES: ['Account Won', 'Disqualified', 'Follow-Up', 'Initial Contact', 'Interested', 'Interested (Hot)', 'Interested (Warm)', 'No Answer', 'Not Interested'],
    VALID_STAGES: ['Disqualified', 'Lost', 'Nurture', 'Outreach', 'Prospect', 'Won'],
    VALID_STATUSES: ['Active', 'Cold', 'Disqualified', 'Hot', 'Interested (Hot)', 'Interested (Warm)', 'Lost', 'Warm', 'Won'],
    VALID_CONTACT_TYPES: ['Email', 'Phone', 'Visit'],
    REQUIRED_FIELDS: ['Company', 'Visit Date', 'Outcome'],
    MAX_NOTES_LENGTH: 1000
  },
  
  // New Accounts validation rules
  ACCOUNT_RULES: {
    REQUIRED_FIELDS: ['Company name', 'Contact name', 'Site Location'],
    VALID_ROLL_OFF_SIZES: ['10 yd', '20 yd', '30 yd', '40 yd', 'Lugger'],
    MIN_ROLL_OFF_FEE: 0,
    MAX_ROLL_OFF_FEE: 10000,
    VALID_HANDLING_METHODS: ['All together', 'Separate', 'Employees take', 'Scrap guy picks up', 'Haul themselves', 'Roll-off vendor', 'Unknown']
  }
};

/**
 * Validates prospect data against business rules
 * @param {Object} prospectData - Prospect data object
 * @param {Object} options - Validation options
 * @param {boolean} options.strictMode - Whether to enforce strict validation (default: false)
 * @return {Object} Validation result with success flag, errors, and warnings
 */
BusinessValidation.validateProspect = function(prospectData, options) {
  options = options || {};
  var strictMode = options.strictMode || false;
  
  var result = {
    success: true,
    errors: [],
    warnings: [],
    validatedData: {}
  };
  
  if (!prospectData || typeof prospectData !== 'object') {
    result.success = false;
    result.errors.push('Invalid prospect data: must be an object');
    return result;
  }
  
  // Validate required fields
  BUSINESS_RULES.PROSPECT_RULES.REQUIRED_FIELDS.forEach(function(field) {
    var normalizedField = SharedUtils.normalizeHeader(field);
    if (!prospectData.hasOwnProperty(normalizedField) || 
        prospectData[normalizedField] === null || 
        prospectData[normalizedField] === undefined ||
        prospectData[normalizedField].toString().trim() === '') {
      result.success = false;
      result.errors.push('Missing required field: ' + field);
    }
  });
  
  // Validate company name format
  if (prospectData['company name']) {
    var companyName = prospectData['company name'].toString().trim();
    if (companyName.length < 2) {
      result.success = false;
      result.errors.push('Company name must be at least 2 characters long');
    } else if (companyName.length > 200) {
      result.warnings.push('Company name seems unusually long: ' + companyName.length + ' characters');
    }
    
    // Check for duplicate companies if strict mode
    if (strictMode && BUSINESS_RULES.PROSPECT_RULES.ALLOW_DUPLICATE_COMPANIES === false) {
      var existingCompanies = this._checkForDuplicateCompanies(companyName);
      if (existingCompanies.length > 0) {
        result.warnings.push('Potential duplicate company found: ' + companyName + 
                           ' (existing: ' + existingCompanies.join(', ') + ')');
      }
    }
  }
  
  // Validate address format
  if (prospectData['address']) {
    var address = prospectData['address'].toString().trim();
    if (address.length < 5) {
      result.warnings.push('Address seems unusually short: ' + address);
    }
  }
  
  // Validate priority score
  if (prospectData['priority score'] !== undefined) {
    var priorityScore = SharedUtils.validateNumber(
      prospectData['priority score'], 
      'priority score', 
      {
        min: BUSINESS_RULES.PROSPECT_RULES.MIN_PRIORITY_SCORE,
        max: BUSINESS_RULES.PROSPECT_RULES.MAX_PRIORITY_SCORE,
        allowNegative: false
      }
    );
    
    if (typeof priorityScore === 'number') {
      result.validatedData['priority score'] = priorityScore;
    } else {
      result.success = false;
      result.errors.push('Invalid priority score: must be between ' + 
                        BUSINESS_RULES.PROSPECT_RULES.MIN_PRIORITY_SCORE + ' and ' + 
                        BUSINESS_RULES.PROSPECT_RULES.MAX_PRIORITY_SCORE);
    }
  }
  
  // Validate urgency score
  if (prospectData['urgency score'] !== undefined) {
    var urgencyScore = SharedUtils.validateNumber(
      prospectData['urgency score'], 
      'urgency score', 
      {
        min: BUSINESS_RULES.PROSPECT_RULES.MIN_URGENCY_SCORE,
        max: BUSINESS_RULES.PROSPECT_RULES.MAX_URGENCY_SCORE,
        allowNegative: false
      }
    );
    
    if (typeof urgencyScore === 'number') {
      result.validatedData['urgency score'] = urgencyScore;
    } else {
      result.success = false;
      result.errors.push('Invalid urgency score: must be between ' + 
                        BUSINESS_RULES.PROSPECT_RULES.MIN_URGENCY_SCORE + ' and ' + 
                        BUSINESS_RULES.PROSPECT_RULES.MAX_URGENCY_SCORE);
    }
  }
  
  // Validate last outreach date
  if (prospectData['last outreach date']) {
    var lastOutreachDate = DateValidationUtils.parseDate(
      prospectData['last outreach date'], 
      {
        maxYear: new Date().getFullYear() + 1,
        allowFuture: false
      },
      'last outreach date'
    );
    
    if (!lastOutreachDate) {
      result.warnings.push('Invalid last outreach date format');
    } else {
      result.validatedData['last outreach date'] = lastOutreachDate;
    }
  }
  
  // Validate next steps due date
  if (prospectData['next steps due date']) {
    var nextStepsDate = DateValidationUtils.parseDate(
      prospectData['next steps due date'], 
      {
        minYear: BUSINESS_RULES.DATE_RULES.MIN_YEAR,
        maxYear: BUSINESS_RULES.DATE_RULES.MAX_YEAR,
        allowFuture: BUSINESS_RULES.DATE_RULES.ALLOW_FUTURE_NEXT_STEPS,
        allowPast: BUSINESS_RULES.DATE_RULES.ALLOW_PAST_NEXT_STEPS
      },
      'next steps due date'
    );
    
    if (!nextStepsDate) {
      result.warnings.push('Invalid next steps due date format');
    } else {
      result.validatedData['next steps due date'] = nextStepsDate;
    }
  }
  
  // Copy other fields that passed basic validation
  for (var key in prospectData) {
    if (!result.validatedData.hasOwnProperty(key) && 
        key !== 'priority score' && 
        key !== 'urgency score' && 
        key !== 'last outreach date' && 
        key !== 'next steps due date') {
      result.validatedData[key] = prospectData[key];
    }
  }
  
  return result;
};

/**
 * Validates outreach data against business rules
 * @param {Object} outreachData - Outreach data object
 * @param {Object} options - Validation options
 * @param {boolean} options.strictMode - Whether to enforce strict validation (default: false)
 * @return {Object} Validation result with success flag, errors, and warnings
 */
BusinessValidation.validateOutreach = function(outreachData, options) {
  options = options || {};
  var strictMode = options.strictMode || false;
  
  var result = {
    success: true,
    errors: [],
    warnings: [],
    validatedData: {}
  };
  
  if (!outreachData || typeof outreachData !== 'object') {
    result.success = false;
    result.errors.push('Invalid outreach data: must be an object');
    return result;
  }
  
  // Validate required fields
  BUSINESS_RULES.OUTREACH_RULES.REQUIRED_FIELDS.forEach(function(field) {
    var normalizedField = SharedUtils.normalizeHeader(field);
    if (!outreachData.hasOwnProperty(normalizedField) || 
        outreachData[normalizedField] === null || 
        outreachData[normalizedField] === undefined ||
        outreachData[normalizedField].toString().trim() === '') {
      result.success = false;
      result.errors.push('Missing required field: ' + field);
    }
  });
  
  // Validate visit date
  if (outreachData['visit date']) {
    var visitDate = DateValidationUtils.parseDate(
      outreachData['visit date'], 
      {
        minYear: BUSINESS_RULES.DATE_RULES.MIN_YEAR,
        maxYear: BUSINESS_RULES.DATE_RULES.MAX_YEAR,
        allowFuture: true, // Allow future dates for scheduled visits
        allowPast: true
      },
      'visit date'
    );
    
    if (!visitDate) {
      result.success = false;
      result.errors.push('Invalid visit date format');
    } else {
      result.validatedData['visit date'] = visitDate;
    }
  }
  
  // Validate outcome
  if (outreachData['outcome']) {
    var outcome = outreachData['outcome'].toString().trim();
    if (BUSINESS_RULES.OUTREACH_RULES.VALID_OUTCOMES.indexOf(outcome) === -1) {
      result.warnings.push('Unrecognized outcome: ' + outcome + 
                          ' (valid: ' + BUSINESS_RULES.OUTREACH_RULES.VALID_OUTCOMES.join(', ') + ')');
    }
    result.validatedData['outcome'] = outcome;
  }
  
  // Validate stage
  if (outreachData['stage']) {
    var stage = outreachData['stage'].toString().trim();
    if (BUSINESS_RULES.OUTREACH_RULES.VALID_STAGES.indexOf(stage) === -1) {
      result.warnings.push('Unrecognized stage: ' + stage + 
                          ' (valid: ' + BUSINESS_RULES.OUTREACH_RULES.VALID_STAGES.join(', ') + ')');
    }
    result.validatedData['stage'] = stage;
  }
  
  // Validate status
  if (outreachData['status']) {
    var status = outreachData['status'].toString().trim();
    if (BUSINESS_RULES.OUTREACH_RULES.VALID_STATUSES.indexOf(status) === -1) {
      result.warnings.push('Unrecognized status: ' + status + 
                          ' (valid: ' + BUSINESS_RULES.OUTREACH_RULES.VALID_STATUSES.join(', ') + ')');
    }
    result.validatedData['status'] = status;
  }
  
  // Validate contact type
  if (outreachData['contact type']) {
    var contactType = outreachData['contact type'].toString().trim();
    if (BUSINESS_RULES.OUTREACH_RULES.VALID_CONTACT_TYPES.indexOf(contactType) === -1) {
      result.warnings.push('Unrecognized contact type: ' + contactType + 
                          ' (valid: ' + BUSINESS_RULES.OUTREACH_RULES.VALID_CONTACT_TYPES.join(', ') + ')');
    }
    result.validatedData['contact type'] = contactType;
  }
  
  // Validate notes length
  if (outreachData['notes']) {
    var notes = outreachData['notes'].toString();
    if (notes.length > BUSINESS_RULES.OUTREACH_RULES.MAX_NOTES_LENGTH) {
      result.warnings.push('Notes exceed maximum length of ' + 
                          BUSINESS_RULES.OUTREACH_RULES.MAX_NOTES_LENGTH + ' characters');
    }
    result.validatedData['notes'] = notes.substring(0, BUSINESS_RULES.OUTREACH_RULES.MAX_NOTES_LENGTH);
  }
  
  // Validate company ID format if present
  if (outreachData['company id']) {
    var companyId = outreachData['company id'].toString().trim();
    var companyIdPattern = /^CID-[A-Z0-9]{3}\d{2}$/;
    if (!companyIdPattern.test(companyId)) {
      result.warnings.push('Company ID format may be invalid: ' + companyId + 
                          ' (expected: CID-XXX##)');
    }
    result.validatedData['company id'] = companyId;
  }
  
  // Copy other fields
  for (var key in outreachData) {
    if (!result.validatedData.hasOwnProperty(key)) {
      result.validatedData[key] = outreachData[key];
    }
  }
  
  return result;
};

/**
 * Validates new account data against business rules
 * @param {Object} accountData - New account data object
 * @param {Object} options - Validation options
 * @param {boolean} options.strictMode - Whether to enforce strict validation (default: false)
 * @return {Object} Validation result with success flag, errors, and warnings
 */
BusinessValidation.validateNewAccount = function(accountData, options) {
  options = options || {};
  var strictMode = options.strictMode || false;
  
  var result = {
    success: true,
    errors: [],
    warnings: [],
    validatedData: {}
  };
  
  if (!accountData || typeof accountData !== 'object') {
    result.success = false;
    result.errors.push('Invalid account data: must be an object');
    return result;
  }
  
  // Validate required fields
  BUSINESS_RULES.ACCOUNT_RULES.REQUIRED_FIELDS.forEach(function(field) {
    var normalizedField = SharedUtils.normalizeHeader(field);
    if (!accountData.hasOwnProperty(normalizedField) || 
        accountData[normalizedField] === null || 
        accountData[normalizedField] === undefined ||
        accountData[normalizedField].toString().trim() === '') {
      result.success = false;
      result.errors.push('Missing required field: ' + field);
    }
  });
  
  // Validate company name
  if (accountData['company name']) {
    var companyName = accountData['company name'].toString().trim();
    if (companyName.length < 2) {
      result.success = false;
      result.errors.push('Company name must be at least 2 characters long');
    }
    result.validatedData['company name'] = companyName;
  }
  
  // Validate contact name
  if (accountData['contact name']) {
    var contactName = accountData['contact name'].toString().trim();
    if (contactName.length < 2) {
      result.warnings.push('Contact name seems unusually short: ' + contactName);
    }
    result.validatedData['contact name'] = contactName;
  }
  
  // Validate site location
  if (accountData['site location']) {
    var siteLocation = accountData['site location'].toString().trim();
    if (siteLocation.length < 5) {
      result.warnings.push('Site location seems unusually short: ' + siteLocation);
    }
    result.validatedData['site location'] = siteLocation;
  }
  
  // Validate roll-off container size
  if (accountData['roll off container size']) {
    var containerSize = accountData['roll off container size'].toString().trim();
    if (BUSINESS_RULES.ACCOUNT_RULES.VALID_ROLL_OFF_SIZES.indexOf(containerSize) === -1) {
      result.warnings.push('Unrecognized container size: ' + containerSize + 
                          ' (valid: ' + BUSINESS_RULES.ACCOUNT_RULES.VALID_ROLL_OFF_SIZES.join(', ') + ')');
    }
    result.validatedData['roll off container size'] = containerSize;
  }
  
  // Validate roll-off fee
  if (accountData['roll-off fee'] !== undefined) {
    var rollOffFee = SharedUtils.parseCurrency(accountData['roll-off fee']);
    if (rollOffFee < BUSINESS_RULES.ACCOUNT_RULES.MIN_ROLL_OFF_FEE || 
        rollOffFee > BUSINESS_RULES.ACCOUNT_RULES.MAX_ROLL_OFF_FEE) {
      result.warnings.push('Roll-off fee seems unusual: $' + rollOffFee + 
                          ' (range: $' + BUSINESS_RULES.ACCOUNT_RULES.MIN_ROLL_OFF_FEE + 
                          ' - $' + BUSINESS_RULES.ACCOUNT_RULES.MAX_ROLL_OFF_FEE + ')');
    }
    result.validatedData['roll-off fee'] = rollOffFee;
  }
  
  // Validate payout price
  if (accountData['payout price'] !== undefined) {
    var payoutPrice = SharedUtils.parseCurrency(accountData['payout price']);
    if (payoutPrice < 0) {
      result.success = false;
      result.errors.push('Payout price cannot be negative');
    }
    result.validatedData['payout price'] = payoutPrice;
  }
  
  // Validate handling of metal
  if (accountData['handling of metal']) {
    var handlingMethod = accountData['handling of metal'].toString().trim();
    if (BUSINESS_RULES.ACCOUNT_RULES.VALID_HANDLING_METHODS.indexOf(handlingMethod) === -1) {
      result.warnings.push('Unrecognized handling method: ' + handlingMethod + 
                          ' (valid: ' + BUSINESS_RULES.ACCOUNT_RULES.VALID_HANDLING_METHODS.join(', ') + ')');
    }
    result.validatedData['handling of metal'] = handlingMethod;
  }
  
  // Validate timestamp
  if (accountData['timestamp']) {
    var timestamp = DateValidationUtils.parseDate(
      accountData['timestamp'], 
      {
        minYear: BUSINESS_RULES.DATE_RULES.MIN_YEAR,
        maxYear: new Date().getFullYear() + 1,
        allowFuture: true
      },
      'timestamp'
    );
    
    if (!timestamp) {
      result.warnings.push('Invalid timestamp format');
    } else {
      result.validatedData['timestamp'] = timestamp;
    }
  }
  
  // Copy other fields
  for (var key in accountData) {
    if (!result.validatedData.hasOwnProperty(key)) {
      result.validatedData[key] = accountData[key];
    }
  }
  
  return result;
};

/**
 * Validates business logic relationships between entities
 * @param {Object} data - Data object containing related entities
 * @param {Object} options - Validation options
 * @return {Object} Validation result with success flag and relationship errors
 */
BusinessValidation.validateBusinessLogic = function(data, options) {
  options = options || {};
  
  var result = {
    success: true,
    errors: [],
    warnings: []
  };
  
  // Validate prospect-outreach relationships
  if (data.prospect && data.outreach) {
    // Check if outreach company matches prospect company
    var prospectCompany = data.prospect['company name'] || '';
    var outreachCompany = data.outreach['company'] || '';
    
    if (prospectCompany && outreachCompany && 
        !ValidationUtils.compareStrings(prospectCompany, outreachCompany, 'prospect-outreach company match')) {
      result.warnings.push('Outreach company (' + outreachCompany + ') does not match prospect company (' + prospectCompany + ')');
    }
    
    // Validate date relationships
    if (data.prospect['last outreach date'] && data.outreach['visit date']) {
      var lastOutreach = DateValidationUtils.parseDate(data.prospect['last outreach date'], {}, 'last outreach date');
      var visitDate = DateValidationUtils.parseDate(data.outreach['visit date'], {}, 'visit date');
      
      if (lastOutreach && visitDate && visitDate < lastOutreach) {
        result.warnings.push('Visit date (' + SharedUtils.formatDate(visitDate) + ') is before last outreach date (' + 
                           SharedUtils.formatDate(lastOutreach) + ')');
      }
    }
  }
  
  // Validate outreach-account conversion logic
  if (data.outreach && data.account) {
    // Check if account won outcome matches account creation
    var outcome = data.outreach['outcome'] || '';
    if (outcome.toLowerCase() !== 'account won') {
      result.warnings.push('Creating account without "Account Won" outcome: ' + outcome);
    }
    
    // Validate company name consistency
    var outreachCompany = data.outreach['company'] || '';
    var accountCompany = data.account['company name'] || '';
    
    if (outreachCompany && accountCompany && 
        !ValidationUtils.compareStrings(outreachCompany, accountCompany, 'outreach-account company match')) {
      result.errors.push('Account company (' + accountCompany + ') does not match outreach company (' + outreachCompany + ')');
    }
  }
  
  return result;
};

/**
 * Internal method to check for duplicate companies
 * @private
 * @param {string} companyName - Company name to check
 * @return {Array} Array of existing company names that match
 */
BusinessValidation._checkForDuplicateCompanies = function(companyName) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var prospectsSheet = ss.getSheetByName(CONFIG.SHEET_PROSPECTS);
    
    if (!prospectsSheet) {
      return [];
    }
    
    var data = prospectsSheet.getDataRange().getValues();
    if (data.length <= 1) {
      return [];
    }
    
    var headers = data[0];
    var companyCol = -1;
    
    // Find company name column
    for (var i = 0; i < headers.length; i++) {
      if (SharedUtils.normalizeHeader(headers[i]) === 'company name') {
        companyCol = i;
        break;
      }
    }
    
    if (companyCol === -1) {
      return [];
    }
    
    var matches = [];
    var normalizedCompanyName = companyName.toLowerCase().trim();
    
    // Check existing companies
    for (var j = 1; j < data.length; j++) {
      var existingCompany = data[j][companyCol];
      if (existingCompany && existingCompany.toString().toLowerCase().trim() === normalizedCompanyName) {
        matches.push(existingCompany.toString());
      }
    }
    
    return matches;
    
  } catch (e) {
    console.warn('Could not check for duplicate companies:', e.message);
    return [];
  }
};

/**
 * Gets business validation rules summary
 * @return {Object} Summary of all business rules
 */
BusinessValidation.getRulesSummary = function() {
  return {
    dateRules: BUSINESS_RULES.DATE_RULES,
    prospectRules: BUSINESS_RULES.PROSPECT_RULES,
    outreachRules: BUSINESS_RULES.OUTREACH_RULES,
    accountRules: BUSINESS_RULES.ACCOUNT_RULES
  };
};

/**
 * Validates a complete data submission with all business rules
 * @param {string} entityType - Type of entity ('prospect', 'outreach', 'account')
 * @param {Object} data - Data object to validate
 * @param {Object} options - Validation options
 * @return {Object} Complete validation result
 */
BusinessValidation.validateCompleteSubmission = function(entityType, data, options) {
  options = options || {};
  
  var result = {
    success: true,
    entityValidation: null,
    businessLogicValidation: null,
    overallErrors: [],
    overallWarnings: []
  };
  
  // Validate entity-specific rules
  switch (entityType.toLowerCase()) {
    case 'prospect':
      result.entityValidation = this.validateProspect(data, options);
      break;
    case 'outreach':
      result.entityValidation = this.validateOutreach(data, options);
      break;
    case 'account':
      result.entityValidation = this.validateNewAccount(data, options);
      break;
    default:
      result.success = false;
      result.overallErrors.push('Unknown entity type: ' + entityType);
      return result;
  }
  
  // Check overall entity validation success
  if (!result.entityValidation.success) {
    result.success = false;
    result.overallErrors = result.overallErrors.concat(result.entityValidation.errors);
  }
  
  result.overallWarnings = result.overallWarnings.concat(result.entityValidation.warnings);
  
  // Apply business logic validation if additional context provided
  if (options.relatedData) {
    result.businessLogicValidation = this.validateBusinessLogic(
      { [entityType]: data, ...options.relatedData }, 
      options
    );
    
    if (!result.businessLogicValidation.success) {
      result.success = false;
      result.overallErrors = result.overallErrors.concat(result.businessLogicValidation.errors);
    }
    
    result.overallWarnings = result.overallWarnings.concat(result.businessLogicValidation.warnings);
  }
  
  return result;
};