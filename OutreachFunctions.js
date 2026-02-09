/**
 * Outreach Functions
 * Handles Logging, Duplicate Checks, and History Retrieval.
 */

// Create OutreachFunctions namespace object
var OutreachFunctions = {
  checkForDuplicateLID: checkForDuplicateLID,
  processOutreachSubmission: processOutreachSubmission,
  fetchOutreachHistory: fetchOutreachHistory,
  calculateDashboardMetrics: calculateDashboardMetrics,
  mapStatusToStage: mapStatusToStage,
  getLastTouchInfo: getLastTouchInfo,
  addOutreachComplete: addOutreachComplete,
  getCompanyDetailsForAutofill: getCompanyDetailsForAutofill,
  checkProspectStatus: checkProspectStatus,
  getOutreachData: getOutreachData
};

/**
 * Enhanced Check if an Outreach ID (LID) already exists with error handling and performance optimization.
 */
function checkForDuplicateLID(lid) {
  // Validate input parameter
  if (!lid) {
    return {
      success: true,
      isDuplicate: false,
      message: 'No LID provided - treating as unique'
    };
  }

  try {
    // Validate LID format
    if (typeof lid !== 'string' || lid.trim().length === 0) {
      return {
        success: false,
        error: 'Invalid LID format provided',
        isDuplicate: false
      };
    }

    // Use optimized data fetching with caching for better performance
    var outreach = getSafeSheetDataOptimized(CONFIG.SHEET_OUTREACH, ['Outreach ID', 'Company'], {
      useCache: true,
      cacheDuration: 30000 // Cache for 30 seconds since LID checks happen frequently
    });

    if (!outreach || outreach.length === 0) {
      console.log('No outreach data found for duplicate check');
      return {
        success: true,
        isDuplicate: false,
        message: 'No existing outreach records found'
      };
    }

    // Search for duplicate with case-insensitive matching and error handling
    var normalizedLid = lid.toString().toLowerCase().trim();
    var match = null;

    try {
      match = outreach.find(function(row) {
        if (!row || !row['outreach id']) return false;
        var existingLid = row['outreach id'].toString().toLowerCase().trim();
        return existingLid === normalizedLid;
      });
    } catch (searchError) {
      console.warn('Error during LID search: ' + searchError.message);
      return {
        success: false,
        error: 'Error searching for duplicate LID: ' + searchError.message,
        isDuplicate: false
      };
    }

    if (match) {
      return {
        success: true,
        isDuplicate: true,
        existingCompany: match['company'] || 'Unknown',
        existingLid: match['outreach id'],
        message: 'Duplicate LID found for company: ' + (match['company'] || 'Unknown')
      };
    }

    return {
      success: true,
      isDuplicate: false,
      message: 'LID is unique'
    };

  } catch (e) {
    return handleErrorWithContext(e, {
      functionName: 'checkForDuplicateLID',
      lid: lid
    });
  }
}

/**
 * Enhanced Core Save Logic: Updates Outreach, Prospects, and New Accounts.
 * Includes batch processing, sheet locking, timeout protection, and comprehensive error handling.
 * Now aligned with Settings Engine for dynamic Stage/Status mapping.
 */
function processOutreachSubmission(data) {
  // Validate required parameters
  var validation = validateParameters(data, ['company', 'outcome'], {
    functionName: 'processOutreachSubmission'
  });

  if (!validation.success) {
    return validation;
  }

  // Use sheet locking for concurrency control
  return executeWithSheetLock(CONFIG.SHEET_OUTREACH, function() {
    return executeWithTimeoutProtection(function() {
      try {
        // Generate IDs with error handling
        var companyId = data.companyId || SharedUtils.generateCompanyId(data.companyName || data.company);
        var outreachId = data.outreachId || SharedUtils.generateUniqueId('LID');

        // Check for duplicate outreach ID
        var duplicateCheck = checkForDuplicateLID(outreachId);
        if (!duplicateCheck.success) {
          return duplicateCheck;
        }

        // Check if company exists in Prospects sheet with optimized data fetching
        var prospects = getSafeSheetDataOptimized(CONFIG.SHEET_PROSPECTS, ['Company Name', 'Company ID'], {
          useCache: true,
          cacheDuration: 30000
        });

        var isExistingProspect = prospects.some(function(p) {
          return (p['company name'] || '').toLowerCase() === (data.companyName || data.company || '').toLowerCase() ||
                 (p['company id'] === companyId && companyId);
        });

        // Calculate Next Visit Countdown with date validation
        var nextVisitCountdown = '';
        if (data.nextVisitDate) {
          try {
            var nextDate = new Date(data.nextVisitDate);
            var today = new Date();
            today.setHours(0, 0, 0, 0);
            nextDate.setHours(0, 0, 0, 0);

            if (isNaN(nextDate.getTime())) {
              console.warn('Invalid next visit date provided: ' + data.nextVisitDate);
            } else {
              var diffTime = nextDate.getTime() - today.getTime();
              nextVisitCountdown = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            }
          } catch (dateError) {
            console.warn('Error calculating next visit countdown: ' + dateError.message);
          }
        }

        // Get dynamic Stage and Status from Settings Engine
        var settings = getSettings();
        var rule = settings.workflowRules[data.outcome] || {};

        // Prepare outreach data with comprehensive field mapping
        var outreachRow = {
          'outreach id': outreachId,
          'company id': companyId,
          'company': data.companyName || data.company,
          'visit date': SharedUtils.formatDate(new Date()),
          'notes': data.notes || '',
          'outcome': data.outcome,
          'stage': rule.stage || data.stage || 'Outreach', // Pulls from Value_1 in Settings, fallback to data.stage
          'status': rule.status || data.status || 'Cold',   // Pulls from Value_2 in Settings, fallback to data.status
          'next visit date': data.nextVisitDate ? SharedUtils.formatDate(data.nextVisitDate) : '',
          'days since last visit': 0,
          'next visit countdown': nextVisitCountdown,
          'outcome category': data.outcome,
          'follow up action': 'See Notes',
          'owner': CONFIG.DEFAULT_OWNER,
          'prospects match': isExistingProspect,
          'contact type': data.activityType || 'Visit',
          'email sent': false,
          'competitor': data.competitor || 'None' // Ensure this matches Column R
        };

        // 1. Log to Outreach Sheet with error handling
        try {
          prependRowSafe(CONFIG.SHEET_OUTREACH, outreachRow);
          console.log('Successfully logged outreach entry for company: ' + (data.companyName || data.company));
        } catch (outreachError) {
          return handleErrorWithContext(outreachError, {
            functionName: 'processOutreachSubmission',
            step: 'outreach_logging',
            data: outreachRow
          });
        }

        // 2. Update Prospect Sheet (Status, Last Contact) with timeout protection
        try {
          var prospectUpdateResult = updateProspectAfterVisit(companyId, data.companyName, data.outcome, outreachRow['status'], data.activityType, data.newCompanyData);
          if (prospectUpdateResult && prospectUpdateResult.success === false) {
            console.warn('Prospect update warning: ' + prospectUpdateResult.error);
            // Continue processing despite prospect update issues
          }
        } catch (prospectError) {
          console.warn('Prospect update failed, continuing with submission: ' + prospectError.message);
          // Continue processing despite prospect update issues
        }

        // 3. If Account Won, Add to Accounts Sheet with validation and full schema alignment
        if (data.outcome === 'Account Won') {
          try {
            var accountRow = {
              'deployed': 'No', // Default from Schema
              'timestamp': SharedUtils.formatDate(new Date()),
              'company name': data.companyName || data.company,
              'contact name': data.contact || '',
              'contact phone': data.phone || '',
              'contact role': data.contactRole || '',
              'site location': data.site || data.address || '',
              'mailing location': data.mailingAddress || data.site || data.address || '',
              'roll-off fee': 'Yes', // Default from Schema
              'handling of metal': data.handlingOfMetal || 'All together',
              'roll off container size': data.containerSize || '30 yd',
              'notes': data.notes || '',
              'payout price': data.payoutPrice || ''
            };

            // Validate required fields for new account
            if (!accountRow['company name']) {
              console.warn('Cannot create new account: missing company name');
            } else {
              appendRowSafe(CONFIG.SHEET_ACCOUNTS, accountRow);
              console.log('Successfully created new account for: ' + accountRow['company name']);
            }
          } catch (accountError) {
            console.warn('New account creation failed, continuing: ' + accountError.message);
            // Continue processing despite new account creation issues
          }
        }

        // Memory optimization after processing
        optimizeMemory();

        return {
          success: true,
          outreachId: outreachId,
          companyId: companyId,
          message: 'Outreach submission processed successfully'
        };

      } catch (e) {
        return handleErrorWithContext(e, {
          functionName: 'processOutreachSubmission',
          data: data
        });
      }
    }, [], {
      functionName: 'processOutreachSubmission',
      maxRetries: 2,
      retryDelay: 1000,
      timeoutThreshold: 30000
    });
  });
}

/**
 * Enhanced Fetch Outreach History for Stats/Calendar with batch processing and timeout protection.
 * Handles large datasets efficiently by processing data in batches.
 */
function fetchOutreachHistory(startDateStr, endDateStr, options) {
  options = options || {};
  var maxRecords = options.maxRecords || 1000; // Default limit to prevent memory issues
  var includeAllColumns = options.includeAllColumns || false;

  // Validate date parameters
  var validation = validateParameters({ startDateStr: startDateStr, endDateStr: endDateStr }, ['startDateStr', 'endDateStr'], {
    functionName: 'fetchOutreachHistory'
  });

  if (!validation.success) {
    return validation;
  }

  return executeWithTimeoutProtection(function() {
    try {
      // Parse and validate dates
      var start = new Date(startDateStr);
      var end = new Date(endDateStr);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return handleErrorWithContext(new Error('Invalid date format provided'), {
          functionName: 'fetchOutreachHistory',
          startDateStr: startDateStr,
          endDateStr: endDateStr
        });
      }

      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);

      // Determine which columns to fetch
      var requiredColumns = includeAllColumns ?
        ['Outreach ID', 'Company ID', 'Company', 'Visit Date', 'Notes', 'Outcome', 'Stage', 'Status', 'Next Visit Date', 'Contact Type', 'Owner', 'Competitor'] :
        ['Visit Date', 'Company', 'Outcome', 'Status', 'Notes'];

      // Use optimized data fetching with caching
      var outreach = getSafeSheetDataOptimized(CONFIG.SHEET_OUTREACH, requiredColumns, {
        useCache: true,
        cacheDuration: 60000 // Cache for 1 minute since outreach data changes frequently
      });

      if (!outreach || outreach.length === 0) {
        console.log('No outreach data found');
        return { success: true, data: [], count: 0 };
      }

      console.log('Processing ' + outreach.length + ' outreach records for date range');

      // Use batch processing for filtering large datasets
      var filterBatchSize = 500; // Process 500 records at a time
      var filtered = [];

      for (var i = 0; i < outreach.length; i += filterBatchSize) {
        var batch = outreach.slice(i, i + filterBatchSize);
        var batchFiltered = batch.filter(function(row) {
          try {
            var rowDate = new Date(row['visit date']);
            return !isNaN(rowDate.getTime()) && rowDate >= start && rowDate <= end;
          } catch (dateError) {
            console.warn('Invalid date in outreach record: ' + row['visit date']);
            return false;
          }
        });

        filtered = filtered.concat(batchFiltered);

        // Check for timeout warnings during processing
        checkExecutionTime(Date.now() - 30000, 'fetchOutreachHistory'); // Started 30 seconds ago

        // Prevent memory issues by limiting results
        if (filtered.length >= maxRecords) {
          console.log('Reached maximum record limit: ' + maxRecords);
          break;
        }

        // Small delay between batches to prevent throttling
        if (i + filterBatchSize < outreach.length) {
          Utilities.sleep(10);
        }
      }

      // Sort by date descending (most recent first)
      filtered.sort(function(a, b) {
        var dateA = new Date(a['visit date']);
        var dateB = new Date(b['visit date']);
        return dateB - dateA;
      });

      // Apply final limit
      if (filtered.length > maxRecords) {
        filtered = filtered.slice(0, maxRecords);
      }

      // Clean and format data for frontend
      var cleanData = filtered.map(function(row) {
        return {
          company: row['company'] || '',
          outcome: row['outcome'] || '',
          status: row['status'] || '',
          notes: row['notes'] || '',
          visitDate: SharedUtils.formatDate(row['visit date']) || '',
          contactType: row['contact type'] || 'Visit',
          outreachId: row['outreach id'] || '',
          owner: row['owner'] || CONFIG.DEFAULT_OWNER,
          competitor: row['competitor'] || 'None'
        };
      });

      console.log('Fetched ' + cleanData.length + ' outreach records for date range');

      return {
        success: true,
        data: cleanData,
        count: cleanData.length,
        dateRange: {
          start: SharedUtils.formatDate(start),
          end: SharedUtils.formatDate(end)
        }
      };

    } catch (e) {
      return handleErrorWithContext(e, {
        functionName: 'fetchOutreachHistory',
        startDateStr: startDateStr,
        endDateStr: endDateStr,
        options: options
      });
    }
  }, [startDateStr, endDateStr, options], {
    functionName: 'fetchOutreachHistory',
    maxRetries: 2,
    retryDelay: 500,
    timeoutThreshold: 45000 // Longer timeout for data processing
  });
}

/**
 * Specifically for the Sidebar "Last Touch" card.
 * Gets only the most recent interaction for a company.
 */
function getLastTouchInfo(companyName) {
  try {
    var outreach = getSafeSheetDataOptimized(CONFIG.SHEET_OUTREACH, 
      ['Visit Date', 'Outcome', 'Notes', 'Next Visit Date', 'Company'], 
      { useCache: true });

    var match = outreach.reverse().find(function(r) {
      return r['company'] === companyName;
    });
    
    if (!match) return { success: false };

    var visitDate = new Date(match['visit date']);
    var today = new Date();
    var daysSince = Math.floor((today - visitDate) / (86400000));

    return {
      success: true,
      data: {
        lastContact: match['visit date'],
        lastOutcome: match['outcome'],
        notes: match['notes'],
        daysSince: daysSince
      }
    };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

/**
 * Enhanced Calculate Metrics for Pipeline Modal with timeout protection and batch processing.
 * Handles large datasets efficiently and provides comprehensive error handling.
 */
function calculateDashboardMetrics(options) {
  options = options || {};
  var includeDetailedStats = options.includeDetailedStats || false;
  var maxActivityRecords = options.maxActivityRecords || 10;

  return executeWithTimeoutProtection(function() {
    try {
      console.log('Starting dashboard metrics calculation');

      // Use optimized data fetching with caching for better performance
      var prospects = getSafeSheetDataOptimized(CONFIG.SHEET_PROSPECTS,
        ['Contact Status', 'Company Name', 'Last Outcome', 'Last Outreach Date', 'Priority Score'], {
        useCache: true,
        cacheDuration: 120000 // Cache for 2 minutes since prospect data changes less frequently
      });

      var outreach = getSafeSheetDataOptimized(CONFIG.SHEET_OUTREACH,
        ['Visit Date', 'Company', 'Outcome', 'Contact Type', 'Owner'], {
        useCache: true,
        cacheDuration: 60000 // Cache for 1 minute for outreach data
      });

      if (!prospects || prospects.length === 0) {
        console.warn('No prospect data found for metrics calculation');
        prospects = [];
      }

      if (!outreach || outreach.length === 0) {
        console.warn('No outreach data found for metrics calculation');
        outreach = [];
      }

      console.log('Processing ' + prospects.length + ' prospects and ' + outreach.length + ' outreach records');

      // Initialize pipeline counts with enhanced categorization
      var pipelineCounts = {
        'Prospect': 0,
        'Outreach': 0,
        'Nurture': 0,
        'Won': 0,
        'Lost': 0
      };

      var statusBreakdown = {}; // For detailed stats
      var activeTotal = 0;
      var totalProspects = prospects.length;

      // Process prospects in batches to prevent timeout
      var prospectBatchSize = 200;
      for (var i = 0; i < prospects.length; i += prospectBatchSize) {
        var prospectBatch = prospects.slice(i, i + prospectBatchSize);

        prospectBatch.forEach(function(p) {
          try {
            var status = p['contact status'] || 'Prospect';
            var stage = mapStatusToStage(status);

            // Count by stage
            if (pipelineCounts.hasOwnProperty(stage)) {
              pipelineCounts[stage]++;
            }

            // Track detailed status breakdown if requested
            if (includeDetailedStats) {
              statusBreakdown[status] = (statusBreakdown[status] || 0) + 1;
            }

            // Count active prospects
            if (stage !== 'Lost' && stage !== 'Disqualified') {
              activeTotal++;
            }

          } catch (prospectError) {
            console.warn('Error processing prospect record: ' + prospectError.message);
            // Continue processing other prospects
          }
        });

        // Check for timeout warnings during processing
        checkExecutionTime(Date.now() - 20000, 'calculateDashboardMetrics');

        // Small delay between batches
        if (i + prospectBatchSize < prospects.length) {
          Utilities.sleep(5);
        }
      }

      // Get recent activity with enhanced information
      var recentActivity = [];
      if (outreach.length > 0) {
        try {
          // Sort outreach by date descending and take the most recent records
          var sortedOutreach = outreach.sort(function(a, b) {
            var dateA = new Date(a['visit date']);
            var dateB = new Date(b['visit date']);
            return dateB - dateA;
          });

          recentActivity = sortedOutreach.slice(0, maxActivityRecords).map(function(o) {
            return {
              company: o['company'] || 'Unknown',
              outcome: o['outcome'] || 'Unknown',
              date: SharedUtils.formatDate(o['visit date']) || '',
              contactType: o['contact type'] || 'Visit',
              owner: o['owner'] || CONFIG.DEFAULT_OWNER
            };
          });
        } catch (activityError) {
          console.warn('Error processing recent activity: ' + activityError.message);
          recentActivity = [];
        }
      }

      // Calculate additional metrics if detailed stats requested
      var detailedMetrics = {};
      if (includeDetailedStats) {
        detailedMetrics = {
          totalProspects: totalProspects,
          conversionRate: totalProspects > 0 ? (pipelineCounts.Customer / totalProspects * 100).toFixed(1) + '%' : '0%',
          statusBreakdown: statusBreakdown,
          averageActivityPerProspect: outreach.length > 0 ? (outreach.length / totalProspects).toFixed(1) : 0,
          lastUpdated: SharedUtils.formatDate(new Date())
        };
      }

      console.log('Dashboard metrics calculated successfully. Active prospects: ' + activeTotal);

      var result = {
        success: true,
        data: {
          pipeline: {
            totalActive: activeTotal,
            byStage: pipelineCounts
          },
          activity: recentActivity
        }
      };

      // Add detailed metrics if requested
      if (includeDetailedStats) {
        result.data.detailedMetrics = detailedMetrics;
      }

      // Memory optimization after processing
      optimizeMemory();

      return result;

    } catch (e) {
      return handleErrorWithContext(e, {
        functionName: 'calculateDashboardMetrics',
        options: options,
        prospectCount: prospects ? prospects.length : 0,
        outreachCount: outreach ? outreach.length : 0
      });
    }
  }, [], {
    functionName: 'calculateDashboardMetrics',
    maxRetries: 2,
    retryDelay: 1000,
    timeoutThreshold: 50000 // Longer timeout for complex calculations
  });
}

/**
 * Helper function to map contact status to pipeline stage
 * Note: This is now used as a fallback. Primary mapping comes from Settings Engine.
 */
function mapStatusToStage(status) {
  if (!status) return 'Prospect';

  var statusMapping = {
    'Interested (Hot)': 'Active Pursuit',
    'Interested (Warm)': 'Nurture',
    'Hot': 'Active Pursuit',
    'Warm': 'Nurture',
    'Cold': 'Outreach',
    'Account Won': 'Won',
    'Won': 'Won',
    'Disqualified': 'Lost',
    'Lost': 'Lost',
    'No Answer': 'Outreach',
    'Not Interested': 'Lost',
    'Follow-Up': 'Nurture',
    'Initial Contact': 'Outreach',
    'Active': 'Won',
    'Outreach': 'Outreach',
    'Prospect': 'Prospect'
  };

  return statusMapping[status] || 'Prospect';
}

/**
 * Feeds the sidebar the full list of companies for the autocomplete datalist.
 * Returns array of {name: companyName, id: companyId} objects.
 */
function getCompanyAutocompleteList() {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEETS.PROSPECTS);
    if (!sheet || sheet.getLastRow() <= 1) {
      return [];
    }

    var data = sheet.getDataRange().getValues();
    var headers = data[0];

    // Find column indices
    var nameIdx = -1;
    var idIdx = -1;

    for (var i = 0; i < headers.length; i++) {
      var h = headers[i].toString().toLowerCase().trim();
      if (h === 'company name' || h === 'company') {
        nameIdx = i;
      } else if (h === 'company id') {
        idIdx = i;
      }
    }

    if (nameIdx === -1) {
      console.warn('Company Name column not found in Prospects sheet');
      return [];
    }

    var companies = [];

    // Process data rows (skip header)
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      var companyName = row[nameIdx] ? row[nameIdx].toString().trim() : '';

      if (companyName && companyName.length > 0) {
        companies.push({
          name: companyName,
          id: idIdx > -1 ? (row[idIdx] ? row[idIdx].toString().trim() : '') : ''
        });
      }
    }

    console.log('getCompanyAutocompleteList: Returning ' + companies.length + ' companies');
    return companies;

  } catch (e) {
    console.error('Error in getCompanyAutocompleteList: ' + e.message);
    return [];
  }
}

/**
 * Fetches specific details for autofilling the sidebar form.
 * Gets company info from Prospects sheet and contact info from Contacts sheet.
 * Returns {address, industry, contactName, phone, email, role, department} or null if not found.
 * Updated to query Contacts sheet for contact info per system schema.
 */
function getProspectDetails(companyIdOrName) {
  try {
    var searchTerm = companyIdOrName || '';
    if (!searchTerm || searchTerm.trim().length === 0) {
      return null;
    }
    searchTerm = searchTerm.trim();

    // Step 1: Get company details from Prospects sheet
    var prospectSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEETS.PROSPECTS);
    var companyData = null;
    
    if (prospectSheet && prospectSheet.getLastRow() > 1) {
      var prospectData = prospectSheet.getDataRange().getValues();
      var prospectHeaders = prospectData[0];
      
      // Find column indices in Prospects sheet
      var nameIdx = -1;
      var idIdx = -1;
      var addrIdx = -1;
      var indIdx = -1;
      
      for (var i = 0; i < prospectHeaders.length; i++) {
        var h = prospectHeaders[i].toString().toLowerCase().trim();
        if (h === 'company name' || h === 'company') {
          nameIdx = i;
        } else if (h === 'company id') {
          idIdx = i;
        } else if (h === 'address') {
          addrIdx = i;
        } else if (h === 'industry') {
          indIdx = i;
        }
      }
      
      // Search for matching company (by ID or name)
      for (var i = 1; i < prospectData.length; i++) {
        var row = prospectData[i];
        var rowCompanyId = idIdx > -1 && row[idIdx] ? row[idIdx].toString().trim() : '';
        var rowCompanyName = nameIdx > -1 && row[nameIdx] ? row[nameIdx].toString().trim() : '';
        
        if (rowCompanyId === searchTerm || rowCompanyName.toLowerCase() === searchTerm.toLowerCase()) {
          companyData = {
            address: addrIdx > -1 ? (row[addrIdx] ? row[addrIdx].toString().trim() : '') : '',
            industry: indIdx > -1 ? (row[indIdx] ? row[indIdx].toString().trim() : '') : '',
            companyName: rowCompanyName
          };
          break;
        }
      }
    }
    
    // Step 2: Get contact details from Contacts sheet (joined by company name)
    var contactData = getContactDetails(companyData ? companyData.companyName : searchTerm);
    
    // Step 3: Return combined data
    if (companyData || contactData) {
      return {
        address: companyData ? companyData.address : '',
        industry: companyData ? companyData.industry : '',
        contactName: contactData ? contactData.name : '',
        phone: contactData ? contactData.phone : '',
        email: contactData ? contactData.email : '',
        role: contactData ? contactData.role : '',
        department: contactData ? contactData.department : ''
      };
    }
    
    console.log('getProspectDetails: Company not found: ' + searchTerm);
    return null;

  } catch (e) {
    console.error('Error in getProspectDetails: ' + e.message);
    return null;
  }
}

/**
 * Fetches contact details from the Contacts sheet by company name.
 * Returns {name, phone, email, role, department, accountType} or null if not found.
 * Added to support getProspectDetails() with proper Contacts sheet query.
 */
function getContactDetails(companyName) {
  try {
    if (!companyName || companyName.trim().length === 0) {
      return null;
    }
    
    var company = companyName.trim();
    var contactsSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Contacts');
    
    if (!contactsSheet || contactsSheet.getLastRow() <= 1) {
      return null;
    }
    
    var contactsData = contactsSheet.getDataRange().getValues();
    var contactsHeaders = contactsData[0];
    
    // Find column indices in Contacts sheet
    var nameIdx = -1;
    var companyIdx = -1;
    var phoneIdx = -1;
    var emailIdx = -1;
    var roleIdx = -1;
    var deptIdx = -1;
    var typeIdx = -1;
    
    for (var i = 0; i < contactsHeaders.length; i++) {
      var h = contactsHeaders[i].toString().toLowerCase().trim();
      if (h === 'name') {
        nameIdx = i;
      } else if (h === 'company') {
        companyIdx = i;
      } else if (h === 'phone number' || h === 'phone') {
        phoneIdx = i;
      } else if (h === 'email') {
        emailIdx = i;
      } else if (h === 'role') {
        roleIdx = i;
      } else if (h === 'department') {
        deptIdx = i;
      } else if (h === 'account') {
        typeIdx = i;
      }
    }
    
    // Search for matching company
    for (var i = 1; i < contactsData.length; i++) {
      var row = contactsData[i];
      var rowCompany = companyIdx > -1 && row[companyIdx] ? row[companyIdx].toString().trim() : '';
      
      if (rowCompany.toLowerCase() === company.toLowerCase()) {
        return {
          name: nameIdx > -1 ? (row[nameIdx] ? row[nameIdx].toString().trim() : '') : '',
          phone: phoneIdx > -1 ? (row[phoneIdx] ? row[phoneIdx].toString().trim() : '') : '',
          email: emailIdx > -1 ? (row[emailIdx] ? row[emailIdx].toString().trim() : '') : '',
          role: roleIdx > -1 ? (row[roleIdx] ? row[roleIdx].toString().trim() : '') : '',
          department: deptIdx > -1 ? (row[deptIdx] ? row[deptIdx].toString().trim() : '') : '',
          accountType: typeIdx > -1 ? (row[typeIdx] ? row[typeIdx].toString().trim() : '') : ''
        };
      }
    }
    
    console.log('getContactDetails: Company not found in Contacts: ' + company);
    return null;
    
  } catch (e) {
    console.error('Error in getContactDetails: ' + e.message);
    return null;
  }
}

/**
 * Simplified outreach entry function for dashboard save button.
 * Validates input and calls processOutreachSubmission.
 * Returns {success: true/false, error?: string}
 */
function addOutreachComplete(formData) {
  try {
    // Validate required fields
    if (!formData || !formData.company) {
      return { success: false, error: 'Company name is required' };
    }
    
    if (!formData.outcome) {
      return { success: false, error: 'Outcome is required' };
    }
    
    // Build data object for processOutreachSubmission
    var outreachData = {
      company: formData.company,
      companyName: formData.company,
      outcome: formData.outcome,
      stage: formData.stage || '',
      status: formData.status || '',
      notes: formData.notes || '',
      nextVisitDate: formData.nextVisitDate || '',
      activityType: formData.activityType || 'Visit',
      outreachId: formData.outreachId || '',
      competitor: formData.competitor || 'None',
      newCompanyData: formData.newCompanyData || null
    };
    
    // Process the outreach submission
    var result = processOutreachSubmission(outreachData);
    
    if (result && result.success) {
      return { 
        success: true, 
        outreachId: result.outreachId,
        companyId: result.companyId,
        message: result.message 
      };
    } else {
      return { success: false, error: result.error || 'Failed to save outreach entry' };
    }
    
  } catch (e) {
    console.error('Error in addOutreachComplete: ' + e.message);
    return { success: false, error: e.message };
  }
}

/**
 * Gets comprehensive company details for dashboard autofill.
 * Combines data from Prospects and Contacts sheets.
 * Returns {companyName, companyId, address, city, state, zip, phone, email, contactName, industry, status} or null.
 */
function getCompanyDetailsForAutofill(companyIdOrName) {
  try {
    var searchTerm = companyIdOrName || '';
    if (!searchTerm || searchTerm.trim().length === 0) {
      return null;
    }
    searchTerm = searchTerm.trim();
    
    // Get company details from Prospects sheet
    var prospectSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEETS.PROSPECTS);
    var companyData = null;
    
    if (prospectSheet && prospectSheet.getLastRow() > 1) {
      var prospectData = prospectSheet.getDataRange().getValues();
      var headers = prospectData[0];
      
      // Find column indices
      var nameIdx = headers.findIndex(function(h) { return (h + '').toLowerCase().trim() === 'company name' || (h + '').toLowerCase().trim() === 'company'; });
      var idIdx = headers.findIndex(function(h) { return (h + '').toLowerCase().trim() === 'company id'; });
      var addrIdx = headers.findIndex(function(h) { return (h + '').toLowerCase().trim() === 'address'; });
      var indIdx = headers.findIndex(function(h) { return (h + '').toLowerCase().trim() === 'industry'; });
      var statusIdx = headers.findIndex(function(h) { return (h + '').toLowerCase().trim() === 'contact status'; });
      
      // Search for matching company
      for (var i = 1; i < prospectData.length; i++) {
        var row = prospectData[i];
        var rowCompanyId = idIdx > -1 && row[idIdx] ? (row[idIdx] + '').trim() : '';
        var rowCompanyName = nameIdx > -1 && row[nameIdx] ? (row[nameIdx] + '').trim() : '';
        
        if (rowCompanyId === searchTerm || rowCompanyName.toLowerCase() === searchTerm.toLowerCase()) {
          companyData = {
            companyName: rowCompanyName,
            companyId: rowCompanyId,
            address: addrIdx > -1 && row[addrIdx] ? (row[addrIdx] + '').trim() : '',
            industry: indIdx > -1 && row[indIdx] ? (row[indIdx] + '').trim() : '',
            status: statusIdx > -1 && row[statusIdx] ? (row[statusIdx] + '').trim() : ''
          };
          break;
        }
      }
    }
    
    // Get contact details from Contacts sheet
    var contactData = getContactDetails(companyData ? companyData.companyName : searchTerm);
    
    // Combine and return
    if (companyData || contactData) {
      return {
        companyName: companyData ? companyData.companyName : (contactData ? contactData.name : ''),
        companyId: companyData ? companyData.companyId : '',
        address: companyData ? companyData.address : '',
        city: '',
        state: '',
        zip: '',
        phone: contactData ? contactData.phone : '',
        email: contactData ? contactData.email : '',
        contactName: contactData ? contactData.name : '',
        industry: companyData ? companyData.industry : '',
        status: companyData ? companyData.status : ''
      };
    }
    
    return null;
    
  } catch (e) {
    console.error('Error in getCompanyDetailsForAutofill: ' + e.message);
    return null;
  }
}

/**
 * Checks if a company exists in Prospects sheet.
 * Returns {success: true, exists: true/false, companyId?: string, status?: string, error?: string}
 */
function checkProspectStatus(companyName) {
  try {
    if (!companyName || companyName.trim().length === 0) {
      return { success: false, error: 'Company name is required' };
    }
    
    var searchTerm = companyName.trim();
    var prospectSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEETS.PROSPECTS);
    
    if (!prospectSheet || prospectSheet.getLastRow() <= 1) {
      return { success: true, exists: false };
    }
    
    var prospectData = prospectSheet.getDataRange().getValues();
    var headers = prospectData[0];
    
    // Find column indices
    var nameIdx = headers.findIndex(function(h) { return (h + '').toLowerCase().trim() === 'company name' || (h + '').toLowerCase().trim() === 'company'; });
    var idIdx = headers.findIndex(function(h) { return (h + '').toLowerCase().trim() === 'company id'; });
    var statusIdx = headers.findIndex(function(h) { return (h + '').toLowerCase().trim() === 'contact status'; });
    var lastOutcomeIdx = headers.findIndex(function(h) { return (h + '').toLowerCase().trim() === 'last outcome'; });
    
    // Search for matching company
    for (var i = 1; i < prospectData.length; i++) {
      var row = prospectData[i];
      var rowCompanyName = nameIdx > -1 && row[nameIdx] ? (row[nameIdx] + '').trim() : '';
      
      if (rowCompanyName.toLowerCase() === searchTerm.toLowerCase()) {
        return {
          success: true,
          exists: true,
          companyId: idIdx > -1 && row[idIdx] ? (row[idIdx] + '').trim() : '',
          status: statusIdx > -1 && row[statusIdx] ? (row[statusIdx] + '').trim() : '',
          lastOutcome: lastOutcomeIdx > -1 && row[lastOutcomeIdx] ? (row[lastOutcomeIdx] + '').trim() : ''
        };
      }
    }
    
    return { success: true, exists: false };
    
  } catch (e) {
    console.error('Error in checkProspectStatus: ' + e.message);
    return { success: false, error: e.message };
  }
}

/**
 * Gets outreach data for a date range (for stats and route planning).
 * Returns {success: true, data: [...], error?: string}
 */
function getOutreachData(startDateStr, endDateStr) {
  try {
    // Use fetchOutreachHistory which already exists
    var result = fetchOutreachHistory(startDateStr, endDateStr, { maxRecords: 1000 });
    
    if (result && result.success) {
      return { success: true, data: result.data };
    } else {
      return { success: false, error: result.error || 'Failed to fetch outreach data' };
    }
    
  } catch (e) {
    console.error('Error in getOutreachData: ' + e.message);
    return { success: false, error: e.message };
  }
}
