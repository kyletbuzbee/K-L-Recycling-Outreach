/**
 * CSV Import Functions
 * Handles importing CSV data into Google Sheets.
 */

/**
 * Imports CSV data into a specified sheet, appending to the bottom
 * Uses Safe-Fetch pattern with dynamic header mapping
 * @param {string} csvText - The CSV text to import
 * @param {string} sheetName - Name of the target sheet
 * @return {Object} Result object with success status and import details
 */
function importCSVData(csvText, sheetName) {
  try {
    if (!csvText || !sheetName) {
      throw new Error('CSV text and sheet name are required');
    }
    
    // Log the parameters for debugging
    console.log('CSV Import Parameters:', { csvTextLength: csvText ? csvText.length : 0, sheetName: sheetName });

    // Enhanced null check for SpreadsheetApp
    var accessResult = SharedUtils.checkSpreadsheetAccess('importCSVData');
    if (!accessResult.success) {
      throw new Error(accessResult.error);
    }

    var ss = accessResult.spreadsheet;
    var sheet = ss.getSheetByName(sheetName);

    if (!sheet) {
      throw new Error('Sheet "' + sheetName + '" not found');
    }

    // Parse CSV with enhanced error handling
    var parseResult = parseCSVWithHeaders(csvText);
    if (!parseResult.success) {
      throw new Error('CSV parsing failed: ' + parseResult.error);
    }

    var csvHeaders = parseResult.headers;
    var csvDataRows = parseResult.dataRows;
    var parseWarnings = parseResult.warnings || [];

    if (csvDataRows.length === 0) {
      throw new Error('No data rows found in CSV');
    }

    // Use Safe-Fetch pattern: get sheet headers dynamically
    var sheetHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var sheetHeaderMap = {};

    sheetHeaders.forEach(function(header, index) {
      if (header) {
        sheetHeaderMap[SharedUtils.normalizeHeader(header)] = index;
      }
    });

    // Map CSV columns to sheet columns using Safe-Fetch pattern
    var columnMapping = {};
    var mappingWarnings = [];

    csvHeaders.forEach(function(csvHeader, csvIndex) {
      var normalizedCsvHeader = SharedUtils.normalizeHeader(csvHeader);
      
      // Try exact match first
      if (sheetHeaderMap.hasOwnProperty(normalizedCsvHeader)) {
        columnMapping[csvIndex] = sheetHeaderMap[normalizedCsvHeader];
      } else {
        // Try fuzzy matching for common variations
        var foundMatch = false;
        for (var sheetHeader in sheetHeaderMap) {
          if (areSimilarHeaders(normalizedCsvHeader, sheetHeader)) {
            columnMapping[csvIndex] = sheetHeaderMap[sheetHeader];
            mappingWarnings.push('CSV header "' + csvHeader + '" mapped to sheet header "' + 
              Object.keys(sheetHeaderMap).find(key => sheetHeaderMap[key] === sheetHeaderMap[sheetHeader]) + 
              '" (fuzzy match)');
            foundMatch = true;
            break;
          }
        }
        
        if (!foundMatch) {
          mappingWarnings.push('CSV header "' + csvHeader + '" not found in sheet headers. Data will be skipped.');
        }
      }
    });

    // Prepare data for appending using Safe-Fetch pattern
    var rowsToAppend = [];
    var skippedCount = 0;
    var dataWarnings = [];

    csvDataRows.forEach(function(csvRow, rowIndex) {
      var sheetRow = new Array(sheetHeaders.length).fill('');

      // Map CSV columns to sheet columns using header mapping
      csvRow.forEach(function(cellValue, csvIndex) {
        if (columnMapping.hasOwnProperty(csvIndex)) {
          var sheetColumnIndex = columnMapping[csvIndex];
          sheetRow[sheetColumnIndex] = cellValue;
        }
      });

      // Basic validation - ensure at least one non-empty cell
      var hasData = sheetRow.some(function(cell) {
        return cell && cell.toString().trim().length > 0;
      });

      if (hasData) {
        rowsToAppend.push(sheetRow);
      } else {
        skippedCount++;
        dataWarnings.push('Row ' + (rowIndex + 2) + ' skipped - no valid data found');
      }
    });

    if (rowsToAppend.length === 0) {
      throw new Error('No valid data rows to import');
    }

    // Use batch operation for better performance
    var lastRow = sheet.getLastRow();
    var targetRange = sheet.getRange(lastRow + 1, 1, rowsToAppend.length, sheetHeaders.length);
    
    // Use batch setValues for better performance
    targetRange.setValues(rowsToAppend);

    var allWarnings = parseWarnings.concat(mappingWarnings).concat(dataWarnings);

    return {
      success: true,
      data: {
        sheetName: sheetName,
        importedCount: rowsToAppend.length,
        skippedCount: skippedCount,
        totalProcessed: csvDataRows.length,
        warnings: allWarnings.length > 0 ? allWarnings : null
      }
    };

  } catch (e) {
    console.error('CSV Import Error:', e);
    
    // Log to Ops Log sheet if available
    try {
      var opsLogSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEETS.SYSTEM_LOG);
      if (opsLogSheet) {
        // Use enhanced date validation
        var currentDate = ValidationUtils.createDateSafely(new Date());
        if (currentDate) {
          opsLogSheet.appendRow([
            currentDate,
            'importCSVData',
            'ERROR',
            'CSV Import Error: ' + e.message,
            JSON.stringify({ csvTextLength: csvText ? csvText.length : 0, sheetName: sheetName })
          ]);
        } else {
          console.error('Invalid date when trying to log to Ops Log');
        }
      }
    } catch (logError) {
      console.error('Failed to log to Ops Log:', logError);
    }
    
    return {
      success: false,
      error: e.message
    };
  }
}

/**
 * Enhanced CSV parsing with header detection and robust error handling
 * @param {string} csvText - CSV text to parse
 * @return {Object} Parse result with headers, data rows, and warnings
 */
function parseCSVWithHeaders(csvText) {
  try {
    var lines = csvText.split('\n').filter(function(line) {
      return line.trim().length > 0;
    });

    if (lines.length === 0) {
      throw new Error('No valid CSV data found');
    }

    var data = [];
    var parseWarnings = [];

    for (var lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      var line = lines[lineIndex];
      var parseResult = parseCSVLine(line, lineIndex + 1);

      if (parseResult.success) {
        data.push(parseResult.row);
      } else {
        parseWarnings.push('Line ' + (lineIndex + 1) + ': ' + parseResult.error);
      }
    }

    if (data.length === 0) {
      throw new Error('No valid data rows could be parsed');
    }

    // Assume first row contains headers
    var headers = data[0];
    var dataRows = data.slice(1);

    // Validate headers
    var headerWarnings = [];
    var uniqueHeaders = {};
    
    headers.forEach(function(header, index) {
      if (!header || typeof header !== 'string') {
        headerWarnings.push('Empty or invalid header at column ' + (index + 1));
      } else {
        var normalizedHeader = SharedUtils.normalizeHeader(header);
        if (uniqueHeaders[normalizedHeader]) {
          headerWarnings.push('Duplicate header "' + header + '" at column ' + (index + 1));
        } else {
          uniqueHeaders[normalizedHeader] = true;
        }
      }
    });

    return {
      success: true,
      headers: headers,
      dataRows: dataRows,
      warnings: parseWarnings.concat(headerWarnings)
    };

  } catch (e) {
    return {
      success: false,
      error: e.message
    };
  }
}

/**
 * Parse a single CSV line with robust quote handling
 * @param {string} line - CSV line to parse
 * @param {number} lineNumber - Line number for error reporting
 * @return {Object} Parse result
 */
function parseCSVLine(line, lineNumber) {
  try {
    var row = [];
    var current = '';
    var inQuotes = false;
    var quoteChar = '"';

    for (var i = 0; i < line.length; i++) {
      var char = line[i];

      // Handle quote characters
      if (char === '"' || char === "'") {
        if (!inQuotes) {
          // Starting a quoted field
          inQuotes = true;
          quoteChar = char;
        } else if (char === quoteChar) {
          // Check if this is an escaped quote (like "")
          if (i + 1 < line.length && line[i + 1] === quoteChar) {
            // Escaped quote, add one quote to current field
            current += quoteChar;
            i++; // Skip the next quote
          } else {
            // Ending a quoted field
            inQuotes = false;
          }
        } else {
          // Different quote character, treat as regular character
          current += char;
        }
      }
      // Handle comma separator (only outside quotes)
      else if (char === ',' && !inQuotes) {
        row.push(current.trim());
        current = '';
      }
      // Regular character
      else {
        current += char;
      }
    }

    // Add the last field
    row.push(current.trim());

    // Clean up fields by removing surrounding quotes if present
    row = row.map(function(field) {
      if (field.length >= 2 &&
          ((field.startsWith('"') && field.endsWith('"')) ||
           (field.startsWith("'") && field.endsWith("'")))) {
        return field.slice(1, -1);
      }
      return field;
    });

    return {
      success: true,
      row: row
    };

  } catch (e) {
    return {
      success: false,
      error: 'Failed to parse line ' + lineNumber + ': ' + e.message
    };
  }
}

/**
 * Check if two headers are similar (for fuzzy matching)
 * @param {string} header1 - First header
 * @param {string} header2 - Second header
 * @return {boolean} True if headers are similar
 */
function areSimilarHeaders(header1, header2) {
  if (!header1 || !header2) return false;

  // Exact match
  if (header1 === header2) return true;

  // Check common variations
  var variations = [
    ['company name', 'company'],
    ['contact phone', 'phone'],
    ['contact name', 'name'],
    ['address', 'location'],
    ['latitude', 'lat'],
    ['longitude', 'lng', 'long']
  ];

  for (var i = 0; i < variations.length; i++) {
    var variationSet = variations[i];
    if (variationSet.indexOf(header1) !== -1 && variationSet.indexOf(header2) !== -1) {
      return true;
    }
  }

  // Check if one contains the other
  return header1.includes(header2) || header2.includes(header1);
}
