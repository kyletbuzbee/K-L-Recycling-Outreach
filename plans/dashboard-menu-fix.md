# Dashboard Menu Fix Instructions

The "K&L CRM" menu is not showing up in Google Sheets after script changes. Here's how to fix it:

## Quick Fix (Try This First)

1. **Open Apps Script editor:**
   - In your Google Sheet, go to **Extensions → Apps Script**

2. **Run the onOpen function manually:**
   - In the Apps Script editor, look for the **function dropdown** (top left, says "Select function")
   - Choose **onOpen** from the list
   - Click the **▶ Run** button (play icon)
   - Grant authorization if prompted

3. **Return to your spreadsheet and refresh:**
   - Press **F5** or click the refresh button
   - Look for the **"K&L CRM"** menu between "Help" and "Extensions"

---

## Alternative: Create a Custom Menu Function

If the above doesn't work, create a new function to rebuild the menu:

1. In Apps Script, create a new file called `RebuildMenu.gs`

2. Add this code:
```javascript
function rebuildMenu() {
  var ui = SpreadsheetApp.getUi();
  
  // Create the main CRM menu
  var crmMenu = ui.createMenu('K&L CRM');
  
  // Add primary CRM views
  crmMenu.addItem('📋 Show Dashboard (Sidepanel)', 'showSidebar');
  crmMenu.addItem('🚀 Open SuiteCRM (Full Screen)', 'openSuiteCRM');
  crmMenu.addSeparator();
  
  // Add System Maintenance submenu
  var maintenanceMenu = ui.createMenu('⚙️ System Maintenance');
  maintenanceMenu.addItem('Run Daily Automation', 'runDailyAutomation');
  maintenanceMenu.addItem('Update Geocodes', 'updateGeocodes');
  maintenanceMenu.addItem('Refresh Priority Scores', 'runBatchScoring');
  
  crmMenu.addSubMenu(maintenanceMenu);
  crmMenu.addSeparator();
  crmMenu.addItem('📊 Generate Professional Report', 'showProfessionalReport');
  
  // Add to UI
  crmMenu.addToUi();
  
  SpreadsheetApp.getUi().alert('✅ Menu rebuilt successfully! Refresh your spreadsheet.');
}
```

3. **Run `rebuildMenu()`** from the function dropdown

4. **Refresh your spreadsheet**

---

## If You See Errors

If the Apps Script editor shows **red error icons** or execution fails:

1. Check the **"Execution log"** at the bottom for error messages
2. Common issues:
   - Missing dependencies
   - Syntax errors in edited files
   - Authorization required

3. To authorize:
   - Go to **Extensions → Apps Script**
   - Click on **Project Settings** (gear icon)
   - Scroll down and check **"Show appsscript.json manifest file"**
   - Save and try running again

---

## Web App Alternative

If the sidebar still won't open, you can access the dashboard directly:

1. Go to **Extensions → Apps Script**
2. Click **Deploy → New deployment**
3. Select type: **Web app**
4. Set:
   - Execute as: **Me**
   - Who has access: **Only myself**
5. Click **Deploy**
6. Copy the **Web app URL**
7. Open it in a new browser tab

---

## Still Not Working?

- Close the spreadsheet completely and reopen it
- Try a different browser (Chrome recommended)
- Clear browser cache
- Check that you're logged into the correct Google account
