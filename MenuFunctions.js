/**
 * Menu Functions - K&L Recycling CRM
 * Version: 4.0.0 (Unified & Non-Blocking)
 */

function onOpen() {
  var ui = SpreadsheetApp.getUi();

  ui.createMenu('K&L CRM')
    // Primary CRM Views
    .addItem('📋 Show Dashboard (Sidepanel)', 'showSidebar')
    .addItem('🚀 Open CRM Suite (Full Screen)', 'showCRMSuite')
    .addItem('📱 Open CRM Suite (Sidebar)', 'showCRMSuiteSidebar')
    .addSeparator()
    
    // Data Cleaning & Normalization
    .addSubMenu(ui.createMenu('🛠️ Data Cleaning')
      .addItem('🛠️ Fix Data: Industries', 'runPreciseIndustryMapper')
      .addItem('🆔 Generate IDs', 'normalizeAndGenerateIDs'))
    
    .addSeparator()
    
    // Automation & Maintenance
    .addSubMenu(ui.createMenu('⚙️ System Maintenance')
      .addItem('Run Daily Automation', 'runDailyAutomation')
      .addItem('Update Geocodes', 'updateGeocodes')
      .addItem('Refresh Priority Scores', 'runBatchScoring'))
    
    .addSeparator()
    
    // Specialized Reporting
    .addItem('📊 Generate Professional Report', 'showProfessionalReport')
    .addToUi();
}

/**
 * Note: Legacy functions like addCRMMenu() have been decommissioned 
 * to prevent conflicting UI namespaces.
 */
