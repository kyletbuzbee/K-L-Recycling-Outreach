/**
 * Dashboard Backend Functions
 * Exposes PipelineService methods for the dashboard sidebar
 */

/**
 * Gets urgent prospects for the dashboard follow-up table
 * @returns {Object} Object with success flag and array of urgent prospects
 */
function getUrgentProspectsForDashboard() {
  try {
    var prospects = PipelineService.getUrgentProspects();
    return {
      success: true,
      data: prospects
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
    var funnelData = PipelineService.calculateFunnel();
    
    // DEFENSIVE: Ensure funnelData is always an object with expected properties
    if (!funnelData || typeof funnelData !== 'object') {
      funnelData = { total: 0, hot: 0, warm: 0, won: 0 };
    }
    
    // Get additional stage counts for more detailed tiles
    var allProspects = PipelineService.getAllProspects();
    if (!Array.isArray(allProspects)) { allProspects = []; }
    
    var nurtureCount = allProspects.filter(function(p) {
      var status = (p['contact status'] || '').toString().toLowerCase();
      return status.includes('warm') || status.includes('follow');
    }).length;
    
    var outreachCount = allProspects.filter(function(p) {
      var status = (p['contact status'] || '').toString().toLowerCase();
      return status.includes('cold') || status.includes('initial');
    }).length;
    
    var lostCount = allProspects.filter(function(p) {
      var status = (p['contact status'] || '').toString().toLowerCase();
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
    if (!payload || !payload.action) {
      return { success: false, error: 'Missing action parameter' };
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
      default:
        console.warn('Unknown CRM Gateway action:', action);
        return { success: false, error: 'Unknown action: ' + action };
    }
  } catch (e) {
    console.error('Error in crmGateway:', e);
    return { success: false, error: e.message };
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
      }
    };
  } catch (e) {
    console.error('Error in getDashboardStats:', e);
    return { success: false, error: e.message };
  }
}

/**
 * GET_PIPELINE - Returns categorized pipeline data
 * Groups prospects by stage (hot, warm, cold, won)
 * @returns {Object} Pipeline data object
 */
function getPipelineData() {
  try {
    var allProspects = PipelineService.getAllProspects();
    var funnel = PipelineService.calculateFunnel();

    var hot = [];
    var warm = [];
    var cold = [];
    var won = [];

    // Categorize prospects
    allProspects.forEach(function(p) {
      var status = (p['contact status'] || '').toString().toLowerCase();
      var urgency = (p['urgencyband'] || '').toString().toLowerCase();

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
    return { success: false, error: e.message };
  }
}

/**
 * GET_PROSPECTS - Returns all prospects data
 * @returns {Object} Prospects data object
 */
function getProspectsData() {
  try {
    var allProspects = PipelineService.getAllProspects();

    return {
      success: true,
      data: {
        all: allProspects,
        total: allProspects.length
      }
    };
  } catch (e) {
    console.error('Error in getProspectsData:', e);
    return { success: false, error: e.message };
  }
}

/**
 * GET_RECENT_WINS - Returns recently won accounts
 * @returns {Object} Recent wins data
 */
function getRecentWins() {
  try {
    var accounts = PipelineService.getWonAccounts();

    return {
      success: true,
      data: accounts
    };
  } catch (e) {
    console.error('Error in getRecentWins:', e);
    return { success: false, error: e.message };
  }
}

/**
 * showPipelineModal - Returns HTML for pipeline modal display
 * Called by dashboard.html to show pipeline view
 * @returns {string} HTML content for pipeline modal
 */
function showPipelineModal() {
  try {
    var pipelineData = getPipelineData();
    
    if (!pipelineData.success) {
      return '<div class="error">Error loading pipeline: ' + (pipelineData.error || 'Unknown error') + '</div>';
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
          html += '<li>' + (p['company name'] || 'Unknown') + '</li>';
        });
        if (prospects.length > 10) {
          html += '<li class="more">... and ' + (prospects.length - 10) + ' more</li>';
        }
        html += '</ul>';
      }
      
      html += '</div>';
    });
    
    html += '</div>';
    return html;
    
  } catch (e) {
    console.error('Error in showPipelineModal:', e);
    return '<div class="error">Error loading pipeline modal: ' + e.message + '</div>';
  }
}

/**
 * showAccountsModal - Returns HTML for accounts modal display
 * Called by dashboard.html to show accounts view
 * @returns {string} HTML content for accounts modal
 */
function showAccountsModal() {
  try {
    var accountsData = getRecentWins();
    
    if (!accountsData.success) {
      return '<div class="error">Error loading accounts: ' + (accountsData.error || 'Unknown error') + '</div>';
    }
    
    var accounts = accountsData.data || [];
    
    var html = '<div class="accounts-modal">';
    html += '<h2>Active Accounts</h2>';
    
    if (accounts.length === 0) {
      html += '<p class="empty">No active accounts found</p>';
    } else {
      html += '<div class="accounts-list">';
      accounts.forEach(function(account) {
        html += '<div class="account-card">';
        html += '<h4>' + (account['company name'] || 'Unknown') + '</h4>';
        html += '<p>Status: ' + (account['contact status'] || 'Active') + '</p>';
        if (account['last outreach date']) {
          html += '<p>Last Contact: ' + account['last outreach date'] + '</p>';
        }
        html += '</div>';
      });
      html += '</div>';
    }
    
    html += '</div>';
    return html;
    
  } catch (e) {
    console.error('Error in showAccountsModal:', e);
    return '<div class="error">Error loading accounts modal: ' + e.message + '</div>';
  }
}

/**
 * showCalendarModal - Returns HTML for calendar modal display
 * Called by dashboard.html to show calendar view
 * @returns {string} HTML content for calendar modal
 */
function showCalendarModal() {
  try {
    var prospectsData = getUrgentProspectsForDashboard();
    
    if (!prospectsData.success) {
      return '<div class="error">Error loading calendar data: ' + (prospectsData.error || 'Unknown error') + '</div>';
    }
    
    var prospects = prospectsData.data || [];
    
    var html = '<div class="calendar-modal">';
    html += '<h2>Upcoming Follow-ups</h2>';
    
    if (prospects.length === 0) {
      html += '<p class="empty">No upcoming follow-ups scheduled</p>';
    } else {
      html += '<div class="calendar-list">';
      prospects.forEach(function(p) {
        html += '<div class="calendar-item">';
        html += '<h4>' + (p['company name'] || 'Unknown') + '</h4>';
        html += '<p>Due: ' + (p['next steps due date'] || 'Not scheduled') + '</p>';
        html += '<p>Status: ' + (p['contact status'] || 'Unknown') + '</p>';
        html += '<p>Urgency: ' + (p['urgencyband'] || 'Unknown') + '</p>';
        html += '</div>';
      });
      html += '</div>';
    }
    
    html += '</div>';
    return html;
    
  } catch (e) {
    console.error('Error in showCalendarModal:', e);
    return '<div class="error">Error loading calendar modal: ' + e.message + '</div>';
  }
}
