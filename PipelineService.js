/**
 * Pipeline and Metrics Service
 * Specialized calculations for the K&L SuiteCRM View.
 * CLEAN-ROOM VERSION: No Unicode/Non-Breaking Spaces.
 */
var PipelineService = {
  
  calculateFunnel: function() {
    try {
      var prospects = SharedUtils.getSafeSheetData(CONFIG.SHEETS.PROSPECTS, ['Contact Status']);
      var outreach = SharedUtils.getSafeSheetData(CONFIG.SHEETS.OUTREACH, ['Outcome']);

      // DEFENSIVE: Ensure arrays are never null
      if (!prospects) { prospects = []; }
      if (!outreach) { outreach = []; }

      var hotCount = prospects.filter(function(p) {
        return (p['contact status'] || '').toString().toLowerCase().includes('interested (hot)');
      }).length;

      var warmCount = prospects.filter(function(p) {
        return (p['contact status'] || '').toString().toLowerCase().includes('interested (warm)');
      }).length;

      var wonCount = outreach.filter(function(o) {
        return (o['outcome'] || '').toString().toLowerCase().includes('account won') ||
               (o['outcome'] || '').toString().toLowerCase().includes('won');
      }).length;

      return {
        total: prospects.length || 0,
        hot: hotCount || 0,
        warm: warmCount || 0,
        won: wonCount || 0
      };
    } catch (e) {
      console.error('Error in calculateFunnel:', e);
      return {
        total: 0,
        hot: 0,
        warm: 0,
        won: 0
      };
    }
  },

  getUrgentProspects: function() {
    var cols = ['Company Name', 'Urgency Score', 'UrgencyBand', 'Priority Score'];
    var data = SharedUtils.getSafeSheetData(CONFIG.SHEETS.PROSPECTS, cols);
    
    if (!data || data.length === 0) { return []; }
    
    return data
      .filter(function(p) { 
        var band = p['urgencyband'] ? p['urgencyband'].toString().toLowerCase() : '';
        return band === 'high' || band === 'overdue'; 
      })
      .sort(function(a, b) { 
        var scoreA = parseFloat(a['urgency score']) || 0;
        var scoreB = parseFloat(b['urgency score']) || 0;
        return scoreB - scoreA; 
      })
      .slice(0, 10);
  },

  getRecentWins: function() {
    try {
      var cols = ['Company Name', 'Timestamp', 'Roll Off Container Size'];
      var wins = SharedUtils.getSafeSheetData(CONFIG.SHEETS.ACCOUNTS, cols);

      if (!wins || wins.length === 0) { return []; }

      return wins.sort(function(a, b) {
        return new Date(b['timestamp']) - new Date(a['timestamp']);
      }).slice(0, 5);
    } catch (e) {
      console.error('Error in getRecentWins:', e);
      return [];
    }
  },

  getProspectsByStatus: function(status) {
    try {
      var cols = ['Company Name', 'Contact Status', 'UrgencyBand', 'Urgency Score'];
      var data = SharedUtils.getSafeSheetData(CONFIG.SHEETS.PROSPECTS, cols);

      if (!data || data.length === 0) { return []; }

      var statusLower = status.toLowerCase();
      return data.filter(function(p) {
        var contactStatus = (p['contact status'] || '').toString().toLowerCase();
        return contactStatus === statusLower || 
               (statusLower === 'hot' && contactStatus.includes('interested (hot)')) ||
               (statusLower === 'warm' && contactStatus.includes('interested (warm)'));
      });
    } catch (e) {
      console.error('Error in getProspectsByStatus:', e);
      return [];
    }
  },

  getWonProspects: function() {
    try {
      var cols = ['Company Name', 'Visit Date', 'Outcome'];
      var outreach = SharedUtils.getSafeSheetData(CONFIG.SHEETS.OUTREACH, cols);

      if (!outreach || outreach.length === 0) { return []; }

      return outreach.filter(function(o) {
        var outcome = (o['outcome'] || '').toString().toLowerCase();
        return outcome.includes('account won') || outcome.includes('won');
      });
    } catch (e) {
      console.error('Error in getWonProspects:', e);
      return [];
    }
  },

  getAllProspects: function() {
    try {
      var cols = ['Company Name', 'Contact Status', 'UrgencyBand', 'Priority Score', 'Last Outreach Date'];
      var data = SharedUtils.getSafeSheetData(CONFIG.SHEETS.PROSPECTS, cols);

      if (!data || data.length === 0) { return []; }

      return data;
    } catch (e) {
      console.error('Error in getAllProspects:', e);
      return [];
    }
  },

  /**
   * Alias for getRecentWins - maintains API compatibility
   * @returns {Array} Recently won accounts
   */
  getWonAccounts: function() {
    return this.getRecentWins();
  }
};