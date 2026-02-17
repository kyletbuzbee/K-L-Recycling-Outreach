/**
 * Dashboard Backend Functions
 * Exposes PipelineService methods for the dashboard sidebar
 * Version: 2.1.0 - Enhanced error handling and API response standardization
 */

/**
 * Helper function to check if PipelineService is available
 * @returns {boolean} True if PipelineService is available
 */
function isPipelineServiceAvailable() {
  try {
    return typeof PipelineService !== 'undefined' && 
           PipelineService !== null && 
           typeof PipelineService.getAllProspects === 'function';
  } catch (e) {
    console.error('PipelineService availability check failed:', e);
    return false;
  }
}

/**
 * Helper function to check if required services are available
 * @returns {Object} Result with success flag and error message if failed
 */
function checkRequiredServices() {
  var missingServices = [];
  
  if (typeof PipelineService === 'undefined' || PipelineService === null) {
    missingServices.push('PipelineService');
  }
  
  if (typeof SharedUtils === 'undefined' || SharedUtils === null) {
    missingServices.push('SharedUtils');
  }
  
  if (typeof CONFIG === 'undefined' || CONFIG === null) {
    missingServices.push('CONFIG');
  }
  
  if (missingServices.length > 0) {
    return {
      success: false,
      error: 'Required services not loaded: ' + missingServices.join(', '),
      missingServices: missingServices
    };
  }
  
  return { success: true };
}

/**
 * Gets urgent prospects for the dashboard follow-up table
 * @returns {Object} Object with success flag and array of urgent prospects
 */
function getUrgentProspectsForDashboard() {
  try {
    // Check if PipelineService is available
    if (!isPipelineServiceAvailable()) {
      console.warn('getUrgentProspectsForDashboard: PipelineService not available');
      return {
        success: true,
        data: [],
        warning: 'PipelineService not available - returning empty array'
      };
    }
    
    var prospects = PipelineService.getUrgentProspects();
    return {
      success: true,
      data: prospects || []
    };
  } catch (e) {
    console.error('Error in getUrgentProspectsForDashboard:', e);
    return {
      success: false,
      error: e.message,
      data: []
    };
  }
}

/**
 * Gets pipeline funnel data for the dashboard summary tiles
 * @returns {Object} Object with success flag and funnel data
 */
function getPipelineFunnelForDashboard() {
  try {
    // Check if PipelineService is available
    if (!isPipelineServiceAvailable()) {
      console.warn('getPipelineFunnelForDashboard: PipelineService not available');
      return {
        success: true,
        data: {
          total: 0,
          hot: 0,
          warm: 0,
          won: 0,
          nurture: 0,
          outreach: 0,
          lost: 0
        },
        warning: 'PipelineService not available - returning default values'
      };
    }
    
    var funnelData = PipelineService.calculateFunnel();
    
    // DEFENSIVE: Ensure funnelData is always an object with expected properties
    if (!funnelData || typeof funnelData !== 'object') {
      funnelData = { total: 0, hot: 0, warm: 0, won: 0 };
    }
    
    // Get additional stage counts for more detailed tiles
    var allProspects = [];
    try {
      allProspects = PipelineService.getAllProspects();
    } catch (prospectError) {
      console.warn('Could not get all prospects for funnel:', prospectError);
    }
    
    if (!Array.isArray(allProspects)) { allProspects = []; }
    
    var nurtureCount = allProspects.filter(function(p) {
      var status = (p.contactStatus || p.contactstatus || '').toString().toLowerCase();
      return status.includes('warm') || status.includes('follow');
    }).length;
    
    var outreachCount = allProspects.filter(function(p) {
      var status = (p.contactStatus || p.contactstatus || '').toString().toLowerCase();
      return status.includes('cold') || status.includes('initial');
    }).length;
    
    var lostCount = allProspects.filter(function(p) {
      var status = (p.contactStatus || p.contactstatus || '').toString().toLowerCase();
      return status.includes('disqualified') || status.includes('not interested');
    }).length;
    
    return {
      success: true,
      data: {
        total: funnelData.total || 0,
        hot: funnelData.hot || 0,
        warm: funnelData.warm || 0,
        won: funnelData.won || 0,
        nurture: nurtureCount || 0,
        outreach: outreachCount || 0,
        lost: lostCount || 0
      }
    };
  } catch (e) {
    console.error('Error in getPipelineFunnelForDashboard:', e);
    return {
      success: false,
      error: e.message,
      data: {
        total: 0,
        hot: 0,
        warm: 0,
        won: 0,
        nurture: 0,
        outreach: 0,
        lost: 0
      }
    };
  }
}

/**
 * CRM Gateway - Unified entry point for all CRM API calls
 * Routes actions to appropriate handlers
 * @param {Object} payload - Contains action and payload data
 * @returns {Object} Result from the requested action
 */
function crmGateway(payload) {
  try {
    // Check required services first
    var serviceCheck = checkRequiredServices();
    if (!serviceCheck.success) {
      console.error('CRM Gateway: Service check failed:', serviceCheck.error);
      return { 
        success: false, 
        error: serviceCheck.error,
        data: null
      };
    }
    
    if (!payload || !payload.action) {
      return { success: false, error: 'Missing action parameter', data: null };
    }

    var action = payload.action;
    var data = payload.payload || {};

    console.log('CRM Gateway called with action:', action);

    switch (action) {
      case 'GET_DASHBOARD_STATS':
        return getDashboardStats();
      case 'GET_PIPELINE':
        return getPipelineData();
      case 'GET_PROSPECTS':
        return getProspectsData();
      case 'GET_URGENT_PROSPECTS':
        return getUrgentProspectsForDashboard();
      case 'GET_RECENT_WINS':
        return getRecentWins();
      case 'GET_VALIDATION_LISTS':
        return getValidationListsForDashboard();
      case 'GET_PROSPECT_DETAILS':
        return getProspectDetails(data.companyId);
      default:
        console.warn('Unknown CRM Gateway action:', action);
        return { success: false, error: 'Unknown action: ' + action, data: null };
    }
  } catch (e) {
    console.error('Error in crmGateway:', e);
    return { success: false, error: e.message, data: null };
  }
}

/**
 * GET_DASHBOARD_STATS - Returns complete dashboard data
 * Combines pipeline stats, urgent prospects, and recent wins
 * @returns {Object} Dashboard statistics object
 */
function getDashboardStats() {
  try {
    var funnel = getPipelineFunnelForDashboard();
    var prospects = getUrgentProspectsForDashboard();
    var wins = getRecentWins();

    return {
      success: true,
      data: {
        pipeline: funnel.data || {},
        prospects: prospects.data || [],
        accounts: wins.data || []
      },
      warnings: []
    };
  } catch (e) {
    console.error('Error in getDashboardStats:', e);
    return { 
      success: false, 
      error: e.message,
      data: {
        pipeline: {},
        prospects: [],
        accounts: []
      }
    };
  }
}

/**
 * GET_PIPELINE - Returns categorized pipeline data
 * Groups prospects by stage (hot, warm, cold, won)
 * @returns {Object} Pipeline data object
 */
function getPipelineData() {
  try {
    // Check if PipelineService is available
    if (!isPipelineServiceAvailable()) {
      console.warn('getPipelineData: PipelineService not available');
      return {
        success: true,
        data: {
          hot: [],
          warm: [],
          cold: [],
          won: [],
          counts: {
            total: 0,
            hot: 0,
            warm: 0,
            cold: 0,
            won: 0
          }
        },
        warning: 'PipelineService not available'
      };
    }
    
    var allProspects = PipelineService.getAllProspects();
    if (!Array.isArray(allProspects)) {
      allProspects = [];
    }
    
    var funnel = { total: 0, hot: 0, warm: 0, won: 0 };
    try {
      funnel = PipelineService.calculateFunnel();
    } catch (funnelError) {
      console.warn('Could not calculate funnel:', funnelError);
    }

    var hot = [];
    var warm = [];
    var cold = [];
    var won = [];

    // Categorize prospects
    allProspects.forEach(function(p) {
      var status = (p.contactStatus || p.contactstatus || '').toString().toLowerCase();
      var urgency = (p.urgencyBand || p.urgencyband || '').toString().toLowerCase();

      if (status.includes('won') || status.includes('active')) {
        won.push(p);
      } else if (urgency.includes('hot') || status.includes('hot') || status.includes('strong')) {
        hot.push(p);
      } else if (urgency.includes('warm') || status.includes('warm') || status.includes('follow')) {
        warm.push(p);
      } else {
        cold.push(p);
      }
    });

    return {
      success: true,
      data: {
        hot: hot,
        warm: warm,
        cold: cold,
        won: won,
        counts: {
          total: allProspects.length,
          hot: hot.length,
          warm: warm.length,
          cold: cold.length,
          won: won.length
        }
      }
    };
  } catch (e) {
    console.error('Error in getPipelineData:', e);
    return { 
      success: false, 
      error: e.message,
      data: {
        hot: [],
        warm: [],
        cold: [],
        won: [],
        counts: {
          total: 0,
          hot: 0,
          warm: 0,
          cold: 0,
          won: 0
        }
      }
    };
  }
}

/**
 * GET_PROSPECTS - Returns all prospects data
 * @returns {Object} Prospects data object
 */
function getProspectsData() {
  try {
    // Check if PipelineService is available
    if (!isPipelineServiceAvailable()) {
      console.warn('getProspectsData: PipelineService not available');
      return {
        success: true,
        data: {
          all: [],
          total: 0
        },
        warning: 'PipelineService not available'
      };
    }
    
    var allProspects = PipelineService.getAllProspects();
    if (!Array.isArray(allProspects)) {
      allProspects = [];
    }

    return {
      success: true,
      data: {
        all: allProspects,
        total: allProspects.length
      }
    };
  } catch (e) {
    console.error('Error in getProspectsData:', e);
    return { 
      success: false, 
      error: e.message,
      data: {
        all: [],
        total: 0
      }
    };
  }
}

/**
 * GET_RECENT_WINS - Returns recently won accounts
 * @returns {Object} Recent wins data
 */
function getRecentWins() {
  try {
    // Check if PipelineService is available
    if (!isPipelineServiceAvailable()) {
      console.warn('getRecentWins: PipelineService not available');
      return {
        success: true,
        data: [],
        warning: 'PipelineService not available'
      };
    }
    
    var accounts = PipelineService.getWonAccounts();
    if (!Array.isArray(accounts)) {
      accounts = [];
    }

    return {
      success: true,
      data: accounts
    };
  } catch (e) {
    console.error('Error in getRecentWins:', e);
    return { 
      success: false, 
      error: e.message,
      data: []
    };
  }
}

/**
 * GET_PROSPECT_DETAILS - Returns detailed prospect info with outreach history
 * Includes contact info, activity timeline, and all outreach records
 * @param {string} companyId - Company ID to look up
 * @returns {Object} Prospect details with outreach history
 */
function getProspectDetails(companyId) {
  try {
    if (!companyId) {
      return { success: false, error: 'Missing companyId', data: null };
    }
    
    console.log('getProspectDetails: Looking up companyId:', companyId);
    
    // Get prospect data
    var prospectCols = SharedUtils._getHeaders ? SharedUtils._getHeaders('PROSPECTS', [
      'companyId', 'companyName', 'address', 'city', 'zipCode', 'industry',
      'contactStatus', 'lastOutcome', 'lastOutreachDate', 'daysSinceLastContact',
      'nextStepsDueDate', 'priorityScore', 'urgencyScore', 'urgencyBand', 'totals'
    ]) : ['Company ID', 'Company Name', 'Address', 'City', 'Zip Code', 'Industry', 
           'Contact Status', 'Last Outcome', 'Last Outreach Date', 'Days Since Last Contact',
           'Next Steps Due Date', 'Priority Score', 'Urgency Score', 'UrgencyBand', 'Totals'];
    
    var prospects = SharedUtils.getSafeSheetData(CONFIG.SHEETS.PROSPECTS, prospectCols);
    
    // Find matching prospect
    var prospect = null;
    var normalizedCompanyId = companyId.toString().toLowerCase().trim();
    
    for (var i = 0; i < prospects.length; i++) {
      var p = prospects[i];
      var pId = (p.companyid || p.companyId || p['company id'] || '').toString().toLowerCase().trim();
      if (pId === normalizedCompanyId) {
        prospect = p;
        break;
      }
    }
    
    if (!prospect) {
      // Try by company name if ID not found
      for (var j = 0; j < prospects.length; j++) {
        var p2 = prospects[j];
        var pName = (p2.companyname || p2.companyName || p2['company name'] || '').toString().toLowerCase().trim();
        if (pName === normalizedCompanyId) {
          prospect = p2;
          break;
        }
      }
    }
    
    if (!prospect) {
      return { success: false, error: 'Prospect not found: ' + companyId, data: null };
    }
    
    // Get outreach history for this prospect
    var outreachCols = ['Outreach ID', 'Company ID', 'Company', 'Visit Date', 'Outcome', 
                        'Stage', 'Status', 'Next Visit Date', 'Notes', 'Contact Type', 'Owner'];
    var outreach = SharedUtils.getSafeSheetData(CONFIG.SHEETS.OUTREACH, outreachCols);
    
    // Filter to this company's outreach
    var outreachHistory = [];
    for (var k = 0; k < outreach.length; k++) {
      var o = outreach[k];
      var oCompId = (o.companyid || o.companyId || o['company id'] || '').toString().toLowerCase().trim();
      var oCompName = (o.company || o.companyname || o['company'] || '').toString().toLowerCase().trim();
      
      if (oCompId === normalizedCompanyId || oCompName === normalizedCompanyId) {
        outreachHistory.push({
          outreachId: o.outreachid || o.outreachId || o['outreach id'] || '',
          visitDate: o.visitdate || o.visitDate || o['visit date'] || '',
          outcome: o.outcome || '',
          stage: o.stage || '',
          status: o.status || '',
          nextVisitDate: o.nextvisitdate || o.nextVisitDate || o['next visit date'] || '',
          notes: o.notes || '',
          contactType: o.contacttype || o.contactType || o['contact type'] || 'Visit',
          owner: o.owner || ''
        });
      }
    }
    
    // Sort by date descending (most recent first)
    outreachHistory.sort(function(a, b) {
      var dateA = new Date(a.visitDate || 0);
      var dateB = new Date(b.visitDate || 0);
      return dateB - dateA;
    });
    
    // Calculate summary stats
    var totalOutreach = outreachHistory.length;
    var wonCount = outreachHistory.filter(function(o) {
      var outcome = (o.outcome || '').toString().toLowerCase();
      return outcome.includes('won') || outcome.includes('account won');
    }).length;
    var warmCount = outreachHistory.filter(function(o) {
      var outcome = (o.outcome || '').toString().toLowerCase();
      return outcome.includes('warm') || outcome.includes('interested');
    }).length;
    
    // Build activity timeline
    var timeline = [];
    for (var m = 0; m < Math.min(outreachHistory.length, 10); m++) {
      var item = outreachHistory[m];
      timeline.push({
        date: item.visitDate,
        type: item.contactType || 'Visit',
        outcome: item.outcome,
        notes: item.notes ? (item.notes.substring(0, 100) + (item.notes.length > 100 ? '...' : '')) : '',
        nextDate: item.nextVisitDate
      });
    }
    
    var result = {
      success: true,
      data: {
        prospect: {
          companyId: prospect.companyid || prospect.companyId || prospect['company id'] || '',
          companyName: prospect.companyname || prospect.companyName || prospect['company name'] || 'Unknown',
          address: prospect.address || prospect.address || '',
          city: prospect.city || '',
          zipCode: prospect.zipcode || prospect.zipCode || prospect['zip code'] || '',
          industry: prospect.industry || '',
          contactStatus: prospect.contactstatus || prospect.contactStatus || prospect['contact status'] || '',
          lastOutcome: prospect.lastoutcome || prospect.lastOutcome || prospect['last outcome'] || '',
          lastOutreachDate: prospect.lastoutreachdate || prospect.lastOutreachDate || prospect['last outreach date'] || '',
          daysSinceContact: prospect.dayssincelastcontact || prospect.daysSinceLastContact || prospect['days since last contact'] || 0,
          nextStepsDueDate: prospect.nextstepsduedate || prospect.nextStepsDueDate || prospect['next steps due date'] || '',
          priorityScore: prospect.priorityscore || prospect.priorityScore || prospect['priority score'] || 0,
          urgencyScore: prospect.urgencyscore || prospect.urgencyScore || prospect['urgency score'] || 0,
          urgencyBand: prospect.urgencyband || prospect.urgencyBand || prospect['urgency band'] || '',
          totals: prospect.totals || 0
        },
        outreachHistory: outreachHistory,
        timeline: timeline,
        stats: {
          totalOutreach: totalOutreach,
          wonCount: wonCount,
          warmCount: warmCount,
          lastContactDate: outreachHistory.length > 0 ? outreachHistory[0].visitDate : ''
        }
      }
    };
    
    console.log('getProspectDetails: Found', totalOutreach, 'outreach records for', prospect.companyName || companyId);
    
    return result;
  } catch (e) {
    console.error('Error in getProspectDetails:', e);
    return { 
      success: false, 
      error: e.message,
      data: null
    };
  }
}

/**
 * GET_VALIDATION_LISTS - Returns validation lists for dashboard dropdowns
 * Wrapped for dashboard API compatibility
 * @returns {Object} Validation lists with success flag
 */
function getValidationListsForDashboard() {
  try {
    var validationLists = getValidationLists();
    
    return {
      success: true,
      data: validationLists || {}
    };
  } catch (e) {
    console.error('Error in getValidationListsForDashboard:', e);
    return {
      success: false,
      error: e.message,
      data: {}
    };
  }
}

/**
 * showPipelineModal - Returns HTML for pipeline modal display
 * Called by dashboard.html to show pipeline view
 * @returns {Object} Object with success flag and HTML content
 */
function showPipelineModal() {
  try {
    var pipelineData = getPipelineData();
    
    if (!pipelineData.success) {
      return {
        success: false,
        error: pipelineData.error || 'Unknown error',
        html: '<div class="error">Error loading pipeline: ' + (pipelineData.error || 'Unknown error') + '</div>'
      };
    }
    
    var html = '<div class="pipeline-modal">';
    html += '<h2>Pipeline Overview</h2>';
    
    var stages = ['hot', 'warm', 'cold', 'won'];
    var stageLabels = { hot: 'Hot Prospects', warm: 'Warm Prospects', cold: 'Cold Prospects', won: 'Won Accounts' };
    
    stages.forEach(function(stage) {
      var prospects = pipelineData.data[stage] || [];
      html += '<div class="pipeline-stage">';
      html += '<h3>' + stageLabels[stage] + ' (' + prospects.length + ')</h3>';
      
      if (prospects.length === 0) {
        html += '<p class="empty">No prospects in this stage</p>';
      } else {
        html += '<ul class="prospect-list">';
        prospects.slice(0, 10).forEach(function(p) {
          html += '<li>' + (p.companyName || p.companyname || 'Unknown') + '</li>';
        });
        if (prospects.length > 10) {
          html += '<li class="more">... and ' + (prospects.length - 10) + ' more</li>';
        }
        html += '</ul>';
      }
      
      html += '</div>';
    });
    
    html += '</div>';
    return {
      success: true,
      html: html
    };
    
  } catch (e) {
    console.error('Error in showPipelineModal:', e);
    return {
      success: false,
      error: e.message,
      html: '<div class="error">Error loading pipeline modal: ' + e.message + '</div>'
    };
  }
}

/**
 * showAccountsModal - Returns HTML for accounts modal display
 * Called by dashboard.html to show accounts view
 * @returns {Object} Object with success flag and HTML content
 */
function showAccountsModal() {
  try {
    var accountsData = getRecentWins();
    
    if (!accountsData.success) {
      return {
        success: false,
        error: accountsData.error || 'Unknown error',
        html: '<div class="error">Error loading accounts: ' + (accountsData.error || 'Unknown error') + '</div>'
      };
    }
    
    var accounts = accountsData.data || [];
    
    var html = '<div class="accounts-modal">';
    html += '<h2>Active Accounts</h2>';
    
    if (accounts.length === 0) {
      html += '<p class="empty">No active accounts found</p>';
    } else {
      html += '<div class="accounts-list">';
      accounts.forEach(function(account) {
        var companyName = account.companyName || account.companyname || account['company name'] || 'Unknown';
        var status = account.contactStatus || account.contactstatus || account['contact status'] || 'Active';
        var lastContact = account.lastOutreachDate || account.lastoutreachdate || account['last outreach date'] || '';
        
        html += '<div class="account-card">';
        html += '<h4>' + companyName + '</h4>';
        html += '<p>Status: ' + status + '</p>';
        if (lastContact) {
          html += '<p>Last Contact: ' + lastContact + '</p>';
        }
        html += '</div>';
      });
      html += '</div>';
    }
    
    html += '</div>';
    return {
      success: true,
      html: html
    };
    
  } catch (e) {
    console.error('Error in showAccountsModal:', e);
    return {
      success: false,
      error: e.message,
      html: '<div class="error">Error loading accounts modal: ' + e.message + '</div>'
    };
  }
}

/**
 * showCalendarModal - Returns HTML for calendar modal display
 * Called by dashboard.html to show calendar view
 * @returns {Object} Object with success flag and HTML content
 */
function showCalendarModal() {
  try {
    var prospectsData = getUrgentProspectsForDashboard();
    
    if (!prospectsData.success) {
      return {
        success: false,
        error: prospectsData.error || 'Unknown error',
        html: '<div class="error">Error loading calendar data: ' + (prospectsData.error || 'Unknown error') + '</div>'
      };
    }
    
    var prospects = prospectsData.data || [];
    
    var html = '<div class="calendar-modal">';
    html += '<h2>Upcoming Follow-ups</h2>';
    
    if (prospects.length === 0) {
      html += '<p class="empty">No upcoming follow-ups scheduled</p>';
    } else {
      html += '<div class="calendar-list">';
      prospects.forEach(function(p) {
        var companyName = p.companyName || p.companyname || 'Unknown';
        var dueDate = p.nextStepsDueDate || p.nextstepsduedate || p['next steps due date'] || 'Not scheduled';
        var status = p.contactStatus || p.contactstatus || p['contact status'] || 'Unknown';
        var urgency = p.urgencyBand || p.urgencyband || 'Unknown';
        
        html += '<div class="calendar-item">';
        html += '<h4>' + companyName + '</h4>';
        html += '<p>Due: ' + dueDate + '</p>';
        html += '<p>Status: ' + status + '</p>';
        html += '<p>Urgency: ' + urgency + '</p>';
        html += '</div>';
      });
      html += '</div>';
    }
    
    html += '</div>';
    return {
      success: true,
      html: html
    };
    
  } catch (e) {
    console.error('Error in showCalendarModal:', e);
    return {
      success: false,
      error: e.message,
      html: '<div class="error">Error loading calendar modal: ' + e.message + '</div>'
    };
  }
}

/**
 * getCalendarEvents - Fetches calendar events for a given date range
 * Returns follow-ups, visits, and overdue items grouped by date
 * @param {string} startDate - Start date in ISO format (YYYY-MM-DD)
 * @param {string} endDate - End date in ISO format (YYYY-MM-DD)
 * @returns {Object} Object with success flag and events data
 */
function getCalendarEvents(startDate, endDate) {
  try {
    var serviceCheck = checkRequiredServices();
    if (!serviceCheck.success) {
      return {
        success: false,
        error: serviceCheck.error,
        data: { events: [], overdue: [], stats: { total: 0, overdue: 0, today: 0, upcoming: 0 } }
      };
    }

    // Parse dates safely using SharedUtils if available
    var startObj = null;
    var endObj = null;
    var today = new Date();
    today.setHours(0, 0, 0, 0);

    if (typeof SharedUtils !== 'undefined' && typeof SharedUtils.parseDate === 'function') {
      startObj = startDate ? SharedUtils.parseDate(startDate) : new Date(today);
      endObj = endDate ? SharedUtils.parseDate(endDate) : new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    } else {
      startObj = startDate ? new Date(startDate) : new Date(today);
      endObj = endDate ? new Date(endDate) : new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    }

    // Validate dates
    if (!startObj || isNaN(startObj.getTime())) {
      startObj = new Date(today);
    }
    if (!endObj || isNaN(endObj.getTime())) {
      endObj = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    }

    // Get prospects with follow-up dates
    var prospects = [];
    if (typeof PipelineService !== 'undefined' && PipelineService !== null) {
      try {
        prospects = PipelineService.getAllProspects() || [];
      } catch (e) {
        console.warn('Could not fetch prospects for calendar:', e);
      }
    }

    // Get outreach history for past visits
    var outreachData = [];
    try {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      if (ss) {
        var outreachSheet = ss.getSheetByName(CONFIG.SHEETS.OUTREACH);
        if (outreachSheet) {
          var lastRow = outreachSheet.getLastRow();
          if (lastRow > 1) {
            var headers = outreachSheet.getRange(1, 1, 1, outreachSheet.getLastColumn()).getValues()[0].map(function(h) { return String(h).trim(); });
            var dataRows = outreachSheet.getRange(2, 1, Math.min(lastRow - 1, 500), headers.length).getValues();
            
            var companyIdx = SharedUtils.findColumnIndex(headers, 'Company', 'OUTREACH');
            var dateIdx = SharedUtils.findColumnIndex(headers, 'Visit Date', 'OUTREACH');
            var outcomeIdx = SharedUtils.findColumnIndex(headers, 'Outcome', 'OUTREACH');
            var nextVisitIdx = SharedUtils.findColumnIndex(headers, 'Next Visit Date', 'OUTREACH');
            var typeIdx = SharedUtils.findColumnIndex(headers, 'Contact Type', 'OUTREACH');

            for (var i = 0; i < dataRows.length; i++) {
              var row = dataRows[i];
              outreachData.push({
                company: companyIdx >= 0 ? row[companyIdx] : '',
                visitDate: dateIdx >= 0 ? row[dateIdx] : '',
                outcome: outcomeIdx >= 0 ? row[outcomeIdx] : '',
                nextVisitDate: nextVisitIdx >= 0 ? row[nextVisitIdx] : '',
                contactType: typeIdx >= 0 ? row[typeIdx] : 'Visit'
              });
            }
          }
        }
      }
    } catch (e) {
      console.warn('Could not fetch outreach data for calendar:', e);
    }

    // Process events
    var events = [];
    var overdueItems = [];
    var stats = { total: 0, overdue: 0, today: 0, upcoming: 0 };

    // Process prospects for follow-ups
    prospects.forEach(function(p) {
      var dueDateRaw = p.nextStepsDueDate || p.nextstepsduedate || p['Next Steps Due Date'] || '';
      var companyName = p.companyName || p.companyname || p['Company Name'] || 'Unknown';
      var companyId = p.companyId || p.companyid || p['Company ID'] || '';
      var status = p.contactStatus || p.contactstatus || p['Contact Status'] || '';
      var urgency = p.urgencyBand || p.urgencyband || p['UrgencyBand'] || '';
      var urgencyScore = p.urgencyScore || p.urgencyscore || p['Urgency Score'] || 0;
      var lastOutcome = p.lastOutcome || p.lastoutcome || p['Last Outcome'] || '';

      if (!dueDateRaw) return;

      var dueDate = null;
      if (typeof SharedUtils !== 'undefined' && typeof SharedUtils.parseDate === 'function') {
        dueDate = SharedUtils.parseDate(dueDateRaw);
      } else {
        dueDate = new Date(dueDateRaw);
      }

      if (!dueDate || isNaN(dueDate.getTime())) return;

      dueDate.setHours(0, 0, 0, 0);

      var event = {
        id: 'prospect-' + companyId,
        type: 'followup',
        title: companyName,
        date: dueDate.toISOString().split('T')[0],
        dateFormatted: typeof formatDate === 'function' ? formatDate(dueDate) : dueDate.toLocaleDateString(),
        status: status,
        urgency: urgency,
        urgencyScore: urgencyScore,
        lastOutcome: lastOutcome,
        companyId: companyId,
        isOverdue: dueDate < today
      };

      // Determine priority class
      if (event.isOverdue) {
        event.priorityClass = 'overdue';
        overdueItems.push(event);
        stats.overdue++;
      } else if (dueDate.getTime() === today.getTime()) {
        event.priorityClass = 'today';
        stats.today++;
      } else if (dueDate >= startObj && dueDate <= endObj) {
        event.priorityClass = urgencyScore >= 115 ? 'high' : (urgencyScore >= 75 ? 'medium' : 'low');
        stats.upcoming++;
      }

      if (dueDate >= startObj && dueDate <= endObj) {
        events.push(event);
        stats.total++;
      }
    });

    // Process outreach for scheduled next visits
    outreachData.forEach(function(o, idx) {
      var nextDateRaw = o.nextVisitDate || '';
      if (!nextDateRaw) return;

      var nextDate = null;
      if (typeof SharedUtils !== 'undefined' && typeof SharedUtils.parseDate === 'function') {
        nextDate = SharedUtils.parseDate(nextDateRaw);
      } else {
        nextDate = new Date(nextDateRaw);
      }

      if (!nextDate || isNaN(nextDate.getTime())) return;

      nextDate.setHours(0, 0, 0, 0);

      if (nextDate >= startObj && nextDate <= endObj) {
        var event = {
          id: 'outreach-' + idx,
          type: 'scheduled',
          title: o.company || 'Unknown',
          date: nextDate.toISOString().split('T')[0],
          dateFormatted: typeof formatDate === 'function' ? formatDate(nextDate) : nextDate.toLocaleDateString(),
          outcome: o.outcome || '',
          contactType: o.contactType || 'Visit',
          priorityClass: 'scheduled',
          isOverdue: nextDate < today
        };

        events.push(event);
        stats.total++;
      }
    });

    // Sort events by date
    events.sort(function(a, b) {
      return new Date(a.date) - new Date(b.date);
    });

    // Sort overdue by urgency
    overdueItems.sort(function(a, b) {
      return (b.urgencyScore || 0) - (a.urgencyScore || 0);
    });

    return {
      success: true,
      data: {
        events: events,
        overdue: overdueItems,
        stats: stats,
        dateRange: {
          start: startObj.toISOString().split('T')[0],
          end: endObj.toISOString().split('T')[0]
        }
      }
    };

  } catch (e) {
    console.error('Error in getCalendarEvents:', e);
    return {
      success: false,
      error: e.message,
      data: {
        events: [],
        overdue: [],
        stats: { total: 0, overdue: 0, today: 0, upcoming: 0 }
      }
    };
  }
}

/**
 * getCalendarMonthData - Returns calendar grid data for a specific month
 * @param {number} year - Year (e.g., 2024)
 * @param {number} month - Month (1-12)
 * @returns {Object} Calendar grid data with events
 */
function getCalendarMonthData(year, month) {
  try {
    // Validate inputs
    if (!year || !month || month < 1 || month > 12) {
      var now = new Date();
      year = now.getFullYear();
      month = now.getMonth() + 1;
    }

    // Calculate date range for the month
    var startDate = new Date(year, month - 1, 1);
    var endDate = new Date(year, month, 0); // Last day of month

    // Pad to include partial weeks
    var firstDayOfWeek = startDate.getDay(); // 0 = Sunday
    var padStart = new Date(startDate);
    padStart.setDate(padStart.getDate() - firstDayOfWeek);

    var lastDayOfWeek = endDate.getDay();
    var padEnd = new Date(endDate);
    padEnd.setDate(padEnd.getDate() + (6 - lastDayOfWeek));

    // Get events for the extended range
    var eventsResult = getCalendarEvents(
      padStart.toISOString().split('T')[0],
      padEnd.toISOString().split('T')[0]
    );

    if (!eventsResult.success) {
      return {
        success: false,
        error: eventsResult.error,
        data: null
      };
    }

    // Build calendar grid
    var grid = [];
    var currentDate = new Date(padStart);
    var events = eventsResult.data.events || [];
    var overdue = eventsResult.data.overdue || [];

    while (currentDate <= padEnd) {
      var dateStr = currentDate.toISOString().split('T')[0];
      var dayEvents = events.filter(function(e) {
        return e.date === dateStr;
      });

      var isToday = currentDate.toDateString() === new Date().toDateString();
      var isCurrentMonth = currentDate.getMonth() === month - 1;

      grid.push({
        date: dateStr,
        day: currentDate.getDate(),
        dayOfWeek: currentDate.getDay(),
        isToday: isToday,
        isCurrentMonth: isCurrentMonth,
        events: dayEvents,
        eventCount: dayEvents.length
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return {
      success: true,
      data: {
        year: year,
        month: month,
        monthName: Utilities.formatDate(new Date(year, month - 1, 1), CONFIG.TIMEZONE, 'MMMM'),
        grid: grid,
        stats: eventsResult.data.stats,
        overdue: overdue.slice(0, 10) // Top 10 overdue items
      }
    };

  } catch (e) {
    console.error('Error in getCalendarMonthData:', e);
    return {
      success: false,
      error: e.message,
      data: null
    };
  }
}
