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
    var funnel = PipelineService.calculateFunnel();
    
    // Get additional stage counts for more detailed tiles
    var allProspects = PipelineService.getAllProspects();
    
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
        total: funnel.total || 0,
        hot: funnel.hot || 0,
        warm: funnel.warm || 0,
        won: funnel.won || 0,
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
