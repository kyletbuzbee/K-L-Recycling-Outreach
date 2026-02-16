/**
 * CSV Import Functions (Enhanced & Audited)
 * Handles importing CSV data into Google Sheets with strict schema alignment.
 */

/**
 * Imports CSV data into a specified sheet, appending to the bottom
 * Uses Safe-Fetch pattern with dynamic, case-insensitive header mapping.
 * @param {string} csvText - The CSV text to import
 * @param {string} sheetName - Name of the target sheet
 * @return {Object} Result object with success status and import details
 */
function importCSVData(csvText, sheetName) {
  try {
    if (!csvText || !sheetName) {
      throw new Error('CSV text and sheet name are required');
    }
    
    // 1. Sanitize Input (Remove BOM and standardize newlines)
    csvText = csvText.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    console.log('CSV Import Parameters:', { csvTextLength: csvText.length, sheetName: sheetName });

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

    // --- DYNAMIC HEADER MAPPING (The Fix) ---
    // We map everything to lowercase for comparison to avoid "undefined" errors
    var sheetHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var sheetHeaderMap = {};

    sheetHeaders.forEach(function(header, index) {
      if (header) {
        sheetHeaderMap[normalizeHeaderSafe(header)] = index;
      }
    });

    var columnMapping = {};
    var mappingWarnings = [];

    csvHeaders.forEach(function(csvHeader, csvIndex) {
      var normalizedCsvHeader = normalizeHeaderSafe(csvHeader);
      
      // Try exact match (normalized)
      if (sheetHeaderMap.hasOwnProperty(normalizedCsvHeader)) {
        columnMapping[csvIndex] = sheetHeaderMap[normalizedCsvHeader];
      } else {
        // Fuzzy matching fallback
        var foundMatch = false;
        for (var sheetHeaderKey in sheetHeaderMap) {
          if (areSimilarHeaders(normalizedCsvHeader, sheetHeaderKey)) {
            columnMapping[csvIndex] = sheetHeaderMap[sheetHeaderKey];
            mappingWarnings.push('CSV header "' + csvHeader + '" mapped to sheet header (fuzzy match)');
            foundMatch = true;
            break;
          }
        }
        
        if (!foundMatch) {
          mappingWarnings.push('CSV header "' + csvHeader + '" not found in sheet headers. Data will be skipped.');
        }
      }
    });

    // Prepare data for appending
    var rowsToAppend = [];
    var skippedCount = 0;
    var dataWarnings = [];

    csvDataRows.forEach(function(csvRow, rowIndex) {
      var sheetRow = new Array(sheetHeaders.length).fill('');

      csvRow.forEach(function(cellValue, csvIndex) {
        if (columnMapping.hasOwnProperty(csvIndex)) {
          var sheetColumnIndex = columnMapping[csvIndex];
          sheetRow[sheetColumnIndex] = cellValue.trim(); // Always trim values
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
      }
    });

    // 🔧 FIX: Apply default values from Config.SCHEMA
    var schemaDefaults = getSchemaDefaults(sheetName);
    
    rowsToAppend.forEach(function(sheetRow) {
      sheetHeaders.forEach(function(header, colIdx) {
        var normalizedHeader = normalizeHeaderSafe(header);
        // Apply default if cell is empty and schema has a default
        if (!sheetRow[colIdx] && schemaDefaults[normalizedHeader] !== undefined) {
          sheetRow[colIdx] = schemaDefaults[normalizedHeader];
        }
      });
    });

    if (rowsToAppend.length === 0) {
      throw new Error('No valid data rows to import after mapping');
    }

    // Batch append for performance
    var lastRow = sheet.getLastRow();
    var targetRange = sheet.getRange(lastRow + 1, 1, rowsToAppend.length, sheetHeaders.length);
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
    // Log to Ops Log... (Code omitted for brevity, identical to your existing error logging)
    return { success: false, error: e.message };
  }
}

/**
 * Enhanced CSV parsing with header detection and robust error handling
 */
function parseCSVWithHeaders(csvText) {
  try {
    var lines = csvText.split('\n').filter(function(line) {
      return line.trim().length > 0;
    });

    if (lines.length === 0) throw new Error('No valid CSV data found');

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

    if (data.length === 0) throw new Error('No valid data rows could be parsed');

    var headers = data[0];
    var dataRows = data.slice(1);

    return {
      success: true,
      headers: headers,
      dataRows: dataRows,
      warnings: parseWarnings
    };

  } catch (e) {
    return { success: false, error: e.message };
  }
}

/**
 * Parse a single CSV line with robust quote handling
 */
function parseCSVLine(line, lineNumber) {
  try {
    var row = [];
    var current = '';
    var inQuotes = false;
    var quoteChar = '"';

    for (var i = 0; i < line.length; i++) {
      var char = line[i];

      if (char === '"' || char === "'") {
        if (!inQuotes) {
          inQuotes = true;
          quoteChar = char;
        } else if (char === quoteChar) {
          if (i + 1 < line.length && line[i + 1] === quoteChar) {
            current += quoteChar;
            i++; 
          } else {
            inQuotes = false;
          }
        } else {
          current += char;
        }
      } else if (char === ',' && !inQuotes) {
        row.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    row.push(current.trim());

    // Cleanup quotes
    row = row.map(function(field) {
      if (field.length >= 2 &&
          ((field.startsWith('"') && field.endsWith('"')) ||
           (field.startsWith("'") && field.endsWith("'")))) {
        return field.slice(1, -1);
      }
      return field;
    });

    return { success: true, row: row };

  } catch (e) {
    return { success: false, error: 'Failed to parse line ' + lineNumber + ': ' + e.message };
  }
}

/**
 * STRICT HEADER NORMALIZER
 * Forces lowercase and trims to ensure "Visit Date" matches "visit date"
 */
function normalizeHeaderSafe(header) {
  if (!header) return '';
  return header.toString().toLowerCase().trim().replace(/\s+/g, ' ');
}

/**
 * Check if two headers are similar (for fuzzy matching)
 */
function areSimilarHeaders(header1, header2) {
  if (!header1 || !header2) return false;
  
  // Normalize both for comparison
  var h1 = normalizeHeaderSafe(header1);
  var h2 = normalizeHeaderSafe(header2);

  if (h1 === h2) return true;

  var variations = [
    ['company name', 'company'],
    ['contact phone', 'phone'],
    ['contact name', 'name'],
    ['address', 'location'],
    ['latitude', 'lat'],
    ['longitude', 'lng', 'long'],
    ['visit date', 'date'],
    ['company id', 'id']
  ];

  for (var i = 0; i < variations.length; i++) {
    var v = variations[i];
    if (v.indexOf(h1) !== -1 && v.indexOf(h2) !== -1) return true;
  }

  return h1.includes(h2) || h2.includes(h1);
}

/**
 * Get schema defaults for a given sheet type
 * Extracts default values from CONFIG.SCHEMA
 * @param {string} sheetName - Name of the sheet (Prospects, Outreach, Accounts, etc.)
 * @return {Object} Map of normalized header names to default values
 */
function getSchemaDefaults(sheetName) {
  var defaults = {};
  
  try {
    // Map sheet name to schema key
    var schemaKey = null;
    if (sheetName === 'Prospects') schemaKey = 'PROSPECTS';
    else if (sheetName === 'Outreach') schemaKey = 'OUTREACH';
    else if (sheetName === 'Accounts') schemaKey = 'ACCOUNTS';
    else if (sheetName === 'Contacts') schemaKey = 'CONTACTS';
    
    if (!schemaKey) return defaults;
    
    // Check if CONFIG and CONFIG.SCHEMA exist
    if (typeof CONFIG === 'undefined' || !CONFIG.SCHEMA) {
      console.warn('CONFIG.SCHEMA not available, using hardcoded defaults');
      // Hardcoded defaults as fallback
      defaults = {
        'owner': 'Kyle Buzbee',
        'contact type': 'Visit',
        'email sent': false,
        'deployed': 'FALSE',
        'roll-off fee': 'Yes',
        'roll off container size': '30 yd',
        'priority score': 60
      };
      return defaults;
    }
    
    var schema = CONFIG.SCHEMA[schemaKey];
    if (!schema) return defaults;
    
    // Extract defaults from schema
    for (var key in schema) {
      if (schema.hasOwnProperty(key) && schema[key].default !== undefined) {
        var headerName = schema[key].header.toLowerCase().trim();
        defaults[headerName] = schema[key].default;
      }
    }
    
  } catch (e) {
    console.error('Error getting schema defaults:', e);
  }
  
  return defaults;
}
