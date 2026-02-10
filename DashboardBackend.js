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
