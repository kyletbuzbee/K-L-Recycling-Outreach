/**
 * Data Validation and Normalization Utilities
 * Addresses data quality issues in Outreach and Prospects sheets
 */

var Normalization = {
  /**
   * Status normalization - converts all status values to consistent case
   */
  normalizeStatus: function(status) {
    if (!status || typeof status !== 'string') {
      return null;
    }
    
    var normalized = status.trim().toLowerCase();
    
    // Standardize common status values
    var statusMap = {
      'warm': 'Warm',
      'cold': 'Cold',
      'hot': 'Hot',
      'active': 'Active',
      'inactive': 'Inactive'
    };
    
    return statusMap[normalized] || normalized.charAt(0).toUpperCase() + normalized.slice(1);
  },
  
  /**
   * Date validation and fixing
   */
  validateAndFixDate: function(dateValue) {
    if (!dateValue) {
      return null;
    }
    
    var dateObj;
    
    // Handle Date objects
    if (dateValue instanceof Date) {
      dateObj = dateValue;
    }
    // Handle string dates
    else if (typeof dateValue === 'string') {
      var trimmed = dateValue.trim();
      if (!trimmed) return null;
      
      // Try to parse
      dateObj = new Date(trimmed);
    }
    // Handle numeric timestamps
    else if (typeof dateValue === 'number') {
      dateObj = new Date(dateValue);
    }
    
    // Validate date is valid
    if (!dateObj || isNaN(dateObj.getTime())) {
      return null;
    }
    
    var year = dateObj.getFullYear();
    
    // Reject dates before business founding date (1900) and more than 2 years in future
    var twoYearsFromNow = new Date();
    twoYearsFromNow.setFullYear(twoYearsFromNow.getFullYear() + 2);
    
    if (year < 1900 || dateObj > twoYearsFromNow) {
      return null;
    }
    
    return dateObj;
  },
  
  /**
   * Find duplicate Outreach IDs in sheet
   */
  findDuplicateIDs: function(sheetName) {
    try {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var sheet = ss.getSheetByName(sheetName);
      
      if (!sheet) {
        throw new Error('Sheet not found: ' + sheetName);
      }
      
      var data = sheet.getDataRange().getValues();
      if (data.length <= 1) {
        return []; // No data to check
      }
      
      var headers = data[0];
      var idColIndex = headers.indexOf('Outreach ID');
      
      if (idColIndex === -1) {
        throw new Error('Outreach ID column not found');
      }
      
      var idMap = {};
      var duplicates = [];
      
      // Skip header row (i starts at 1)
      for (var i = 1; i < data.length; i++) {
        var row = data[i];
        var lid = row[idColIndex];
        
        if (lid && lid.toString().trim()) {
          var normalizedLid = lid.toString().trim().toUpperCase();
          
          if (idMap[normalizedLid]) {
            // Found duplicate
            duplicates.push({
              lid: normalizedLid,
              rows: [idMap[normalizedLid], i + 1] // Convert to 1-based index
            });
          } else {
            idMap[normalizedLid] = i + 1; // 1-based index
          }
        }
      }
      
      return duplicates;
    } catch (e) {
      console.error('Error finding duplicates:', e.message);
      return [];
    }
  },
  
  /**
   * Find orphaned records with missing Company IDs
   */
  findOrphanedRecords: function() {
    try {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var outreachSheet = ss.getSheetByName(CONFIG.SHEET_OUTREACH);
      var prospectsSheet = ss.getSheetByName(CONFIG.SHEET_PROSPECTS);
      
      if (!outreachSheet || !prospectsSheet) {
        throw new Error('Required sheets not found');
      }
      
      // Get all company IDs from prospects
      var prospectData = prospectsSheet.getDataRange().getValues();
      var companyIds = new Set();
      
      if (prospectData.length > 1) {
        var prospectHeaders = prospectData[0];
        var companyIdColIndex = prospectHeaders.indexOf('Company ID');
        
        if (companyIdColIndex !== -1) {
          for (var i = 1; i < prospectData.length; i++) {
            var companyId = prospectData[i][companyIdColIndex];
            if (companyId && companyId.toString().trim()) {
              companyIds.add(companyId.toString().trim().toUpperCase());
            }
          }
        }
      }
      
      // Find outreach records with missing or invalid company IDs
      var outreachData = outreachSheet.getDataRange().getValues();
      var orphanedRecords = [];
      
      if (outreachData.length > 1) {
        var outreachHeaders = outreachData[0];
        var outreachCompanyIdColIndex = outreachHeaders.indexOf('Company ID');
        var outreachLidColIndex = outreachHeaders.indexOf('Outreach ID');
        
        for (var i = 1; i < outreachData.length; i++) {
          var row = outreachData[i];
          var companyId = row[outreachCompanyIdColIndex];
          var lid = row[outreachLidColIndex];
          
          var isOrphan = false;
          var reason = '';
          
          if (!companyId || companyId.toString().trim() === '') {
            isOrphan = true;
            reason = 'Missing Company ID';
          } else {
            var normalizedCompanyId = companyId.toString().trim().toUpperCase();
            if (!companyIds.has(normalizedCompanyId)) {
              isOrphan = true;
              reason = 'Company ID not in Prospects: ' + normalizedCompanyId;
            }
          }
          
          if (isOrphan) {
            orphanedRecords.push({
              row: i + 1, // 1-based index
              lid: lid ? lid.toString().trim() : 'Unknown',
              companyId: companyId ? companyId.toString().trim() : 'Missing',
              reason: reason
            });
          }
        }
      }
      
      return orphanedRecords;
    } catch (e) {
      console.error('Error finding orphaned records:', e.message);
      return [];
    }
  },
  
  /**
   * Run full data validation on Outreach sheet
   */
  runFullDataValidation: function() {
    try {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var outreachSheet = ss.getSheetByName(CONFIG.SHEET_OUTREACH);
      
      if (!outreachSheet) {
        throw new Error('Outreach sheet not found');
      }
      
      var report = {
        timestamp: new Date(),
        totalRecords: 0,
        duplicates: [],
        orphanedRecords: [],
        invalidDates: [],
        invalidStatuses: []
      };
      
      // Get sheet data
      var data = outreachSheet.getDataRange().getValues();
      if (data.length <= 1) {
        report.totalRecords = 0;
        return report;
      }
      
      report.totalRecords = data.length - 1; // Subtract header row
      
      // Find duplicates
      report.duplicates = this.findDuplicateIDs(CONFIG.SHEET_OUTREACH);
      
      // Find orphaned records
      report.orphanedRecords = this.findOrphanedRecords();
      
      // Check invalid dates and statuses
      var headers = data[0];
      var visitDateColIndex = headers.indexOf('Visit Date');
      var statusColIndex = headers.indexOf('Status');
      
      for (var i = 1; i < data.length; i++) {
        var row = data[i];
        
        // Check date
        if (visitDateColIndex !== -1) {
          var dateValue = row[visitDateColIndex];
          var validDate = this.validateAndFixDate(dateValue);
          
          if (!validDate) {
            report.invalidDates.push({
              row: i + 1,
              value: dateValue ? dateValue.toString() : 'Empty'
            });
          }
        }
        
        // Check status
        if (statusColIndex !== -1) {
          var status = row[statusColIndex];
          var normalizedStatus = this.normalizeStatus(status);
          
          if (!normalizedStatus || normalizedStatus.toString().trim() === '') {
            report.invalidStatuses.push({
              row: i + 1,
              value: status ? status.toString() : 'Empty'
            });
          }
        }
      }
      
      return report;
    } catch (e) {
      console.error('Error running full validation:', e.message);
      return null;
    }
  },
  
  /**
   * Clean Outreach data (apply normalization fixes)
   */
  cleanOutreachData: function() {
    try {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var outreachSheet = ss.getSheetByName(CONFIG.SHEET_OUTREACH);
      
      if (!outreachSheet) {
        throw new Error('Outreach sheet not found');
      }
      
      var data = outreachSheet.getDataRange().getValues();
      if (data.length <= 1) {
        return { success: true, changes: 0 };
      }
      
      var headers = data[0];
      var visitDateColIndex = headers.indexOf('Visit Date');
      var statusColIndex = headers.indexOf('Status');
      var changes = 0;
      
      // Clean each row
      for (var i = 1; i < data.length; i++) {
        var row = data[i];
        var rowChanged = false;
        
        // Normalize status
        if (statusColIndex !== -1) {
          var originalStatus = row[statusColIndex];
          var normalizedStatus = this.normalizeStatus(originalStatus);
          
          if (normalizedStatus && normalizedStatus.toString() !== originalStatus.toString()) {
            row[statusColIndex] = normalizedStatus;
            rowChanged = true;
          }
        }
        
        // Validate and fix date
        if (visitDateColIndex !== -1) {
          var originalDate = row[visitDateColIndex];
          var validDate = this.validateAndFixDate(originalDate);
          
          if (validDate && validDate.getTime() !== originalDate.getTime()) {
            row[visitDateColIndex] = validDate;
            rowChanged = true;
          }
        }
        
        if (rowChanged) {
          changes++;
          data[i] = row;
        }
      }
      
      // Update sheet if changes were made
      if (changes > 0) {
        outreachSheet.getDataRange().setValues(data);
        console.log('Data cleaning completed: ' + changes + ' changes made');
      } else {
        console.log('No changes needed');
      }
      
      return { success: true, changes: changes };
    } catch (e) {
      console.error('Error cleaning outreach data:', e.message);
      return { success: false, error: e.message };
    }
  },
  
  /**
   * Generate comprehensive validation report
   */
  generateValidationReport: function() {
    try {
      var validationReport = this.runFullDataValidation();
      
      if (!validationReport) {
        throw new Error('Validation report generation failed');
      }
      
      // Create report sheet if it doesn't exist
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var reportSheet = ss.getSheetByName('Data Validation Report');
      
      if (!reportSheet) {
        reportSheet = ss.insertSheet('Data Validation Report');
      } else {
        reportSheet.clearContents();
      }
      
      // Write report
      var reportData = [];
      reportData.push(['Data Validation Report', '', '', '', '', '', '']);
      reportData.push(['Generated:', validationReport.timestamp, '', '', '', '', '']);
      reportData.push(['Total Records:', validationReport.totalRecords, '', '', '', '', '']);
      reportData.push(['']);
      
      // Duplicates
      reportData.push(['=== Duplicate Records ===']);
      reportData.push(['Outreach ID', 'Row Numbers']);
      
      validationReport.duplicates.forEach(function(duplicate) {
        reportData.push([
          duplicate.lid,
          duplicate.rows.join(', ')
        ]);
      });
      
      reportData.push(['']);
      
      // Orphaned Records
      reportData.push(['=== Orphaned Records ===']);
      reportData.push(['Row', 'Outreach ID', 'Company ID', 'Reason']);
      
      validationReport.orphanedRecords.forEach(function(orphan) {
        reportData.push([
          orphan.row,
          orphan.lid,
          orphan.companyId,
          orphan.reason
        ]);
      });
      
      reportData.push(['']);
      
      // Invalid Dates
      reportData.push(['=== Invalid Dates ===']);
      reportData.push(['Row', 'Value']);
      
      validationReport.invalidDates.forEach(function(invalidDate) {
        reportData.push([
          invalidDate.row,
          invalidDate.value
        ]);
      });
      
      reportData.push(['']);
      
      // Invalid Statuses
      reportData.push(['=== Invalid Statuses ===']);
      reportData.push(['Row', 'Value']);
      
      validationReport.invalidStatuses.forEach(function(invalidStatus) {
        reportData.push([
          invalidStatus.row,
          invalidStatus.value
        ]);
      });
      
      // Write data to sheet
      reportSheet.getRange(1, 1, reportData.length, reportData[0].length).setValues(reportData);
      
      // Auto-resize columns
      reportSheet.autoResizeColumns(1, reportData[0].length);
      
      console.log('Validation report generated successfully');
      
      return {
        success: true,
        reportSheet: 'Data Validation Report',
        duplicatesCount: validationReport.duplicates.length,
        orphanedCount: validationReport.orphanedRecords.length,
        invalidDatesCount: validationReport.invalidDates.length,
        invalidStatusesCount: validationReport.invalidStatuses.length
      };
    } catch (e) {
      console.error('Error generating validation report:', e.message);
      return { success: false, error: e.message };
    }
  }
};
