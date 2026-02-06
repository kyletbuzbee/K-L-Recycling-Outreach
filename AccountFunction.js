/**
 * Account Functions
 * Manages New Account submissions.
 */

function processNewAccount(rowIndex) {
  try {
    // Validate input parameters
    var validationResult = ValidationUtils.validateRange(rowIndex, 1, 10000, 'rowIndex');
    if (!validationResult.success) {
      throw new Error(validationResult.error);
    }

    // FIX: Use ColumnMapper for consistent column access
    var companyNameIndex = ColumnMapper.getColumnIndex(CONFIG.SHEET_NEW_ACCOUNTS, 'Company name');
    var deployedIndex = ColumnMapper.getColumnIndex(CONFIG.SHEET_NEW_ACCOUNTS, 'Deployed');
    var rollOffFeeIndex = ColumnMapper.getColumnIndex(CONFIG.SHEET_NEW_ACCOUNTS, 'Roll-Off Fee');
    var payoutPriceIndex = ColumnMapper.getColumnIndex(CONFIG.SHEET_NEW_ACCOUNTS, 'Payout Price');

    if (companyNameIndex === null || deployedIndex === null) {
      throw new Error('Required columns not found in New Accounts sheet');
    }

    // Get account data using Safe-Fetch pattern
    var accounts = SharedUtils.getSafeSheetData(CONFIG.SHEET_NEW_ACCOUNTS, ['Company name', 'Deployed', 'Roll-Off Fee', 'Payout Price']);
    if (!accounts || accounts.length === 0) {
      throw new Error('No accounts data available');
    }

    var account = accounts.find(function(a) { return a._rowIndex === rowIndex; });

    if (!account) {
      throw new Error('Account not found at row index: ' + rowIndex);
    }

    // Use ColumnMapper indices for consistent access
    var companyName = account['company name'];
    
    if (!ValidationUtils.isNotEmpty(companyName)) {
      throw new Error('Company name is required for account deployment');
    }

    var deployed = account['deployed'];
    
    if (deployed === true || ValidationUtils.normalizeString(deployed) === 'true') {
      console.log('Account already processed: ' + companyName);
      return { success: true, message: 'Account already processed' };
    }

    // Validate inventory operations using ColumnMapper indices
    if (rollOffFeeIndex !== null && account['roll-off fee'] !== undefined && account['roll-off fee'] !== null) {
      var rollOffFeeValidation = ValidationUtils.validateInventoryOperation(account['roll-off fee'], 'Roll-Off Fee');
      if (!rollOffFeeValidation.success) {
        throw new Error(rollOffFeeValidation.error);
      }
    }

    if (payoutPriceIndex !== null && account['payout price'] !== undefined && account['payout price'] !== null) {
      var payoutPriceValidation = ValidationUtils.validateInventoryOperation(account['payout price'], 'Payout Price');
      if (!payoutPriceValidation.success) {
        throw new Error(payoutPriceValidation.error);
      }
    }

    // Logic to deploy bin or set up service
    console.log('Deploying account: ' + companyName);

    // Use error handling wrapper for the update operation
    var updateResult = ErrorHandling.withErrorHandling(function() {
      return updateCellSafe(CONFIG.SHEET_NEW_ACCOUNTS, rowIndex, 'Deployed', true);
    }, {
      functionName: 'processNewAccount',
      accountName: companyName,
      rowIndex: rowIndex
    });

    if (!updateResult.success) {
      throw new Error('Failed to update account status: ' + updateResult.error);
    }

    return {
      success: true,
      message: 'Account deployed successfully',
      accountName: companyName
    };

  } catch (e) {
    return ErrorHandling.handleError(e, {
      functionName: 'processNewAccount',
      rowIndex: rowIndex,
      severity: 'HIGH'
    });
  }
}

function checkNewAccounts() {
  try {
    // Validate that we can access the spreadsheet
    var accessResult = SharedUtils.checkSpreadsheetAccess('checkNewAccounts');
    if (!accessResult.success) {
      throw new Error(accessResult.error);
    }

    var ss = accessResult.spreadsheet;

    // Get accounts data with comprehensive error handling
    var accountsResult = ErrorHandling.withErrorHandling(function() {
      return SharedUtils.getSafeSheetData(CONFIG.SHEET_NEW_ACCOUNTS, ['Deployed', 'Company name']);
    }, {
      functionName: 'checkNewAccounts',
      operation: 'getAccountsData'
    });

    if (!accountsResult.success) {
      throw new Error('Failed to retrieve accounts data: ' + accountsResult.error);
    }

    var accounts = accountsResult.data || [];
    var processedCount = 0;
    var errorCount = 0;
    var errors = [];

    // Process each account with error handling
    accounts.forEach(function(acc) {
      try {
        if (!acc['deployed']) {
          var result = processNewAccount(acc._rowIndex);
          if (result.success) {
            processedCount++;
          } else {
            errorCount++;
            errors.push({
              rowIndex: acc._rowIndex,
              companyName: acc['company name'] || 'unknown',
              error: result.error
            });
          }
        }
      } catch (e) {
        errorCount++;
        errors.push({
          rowIndex: acc._rowIndex,
          companyName: acc['company name'] || 'unknown',
          error: e.message
        });
        console.error('Error processing account at row ' + acc._rowIndex + ': ' + e.message);
      }
    });

    // Log summary
    console.log('Account processing completed. Processed: ' + processedCount + ', Errors: ' + errorCount);

    // Log errors to system log if any
    if (errorCount > 0) {
      try {
        var opsLogSheet = ss.getSheetByName(CONFIG.SHEETS.SYSTEM_LOG);
        if (opsLogSheet) {
          errors.forEach(function(error) {
            // Use enhanced date validation
            var currentDate = ValidationUtils.createDateSafely(new Date());
            if (currentDate) {
              opsLogSheet.appendRow([
                currentDate,
                'checkNewAccounts',
                'ERROR',
                'Failed to process account: ' + error.companyName,
                'Row: ' + error.rowIndex + ', Error: ' + error.error
              ]);
            } else {
              console.error('Invalid date when trying to log to Ops Log');
            }
          });
        }
      } catch (logError) {
        console.warn('Could not log errors to system log: ' + logError.message);
      }
    }

    return {
      success: true,
      processed: processedCount,
      errors: errorCount,
      errorDetails: errors
    };

  } catch (e) {
    return ErrorHandling.handleError(e, {
      functionName: 'checkNewAccounts',
      severity: 'CRITICAL'
    });
  }
}