/**
 * Pipeline and Metrics Service
 * Specialized calculations for the K&L SuiteCRM View.
 * CLEAN-ROOM VERSION: No Unicode/Non-Breaking Spaces.
 * Updated: Aligned with System_Schema.csv and CONFIG.SCHEMA
 */
var PipelineService = {
  
  /**
   * Helper to get canonical field name from CONFIG.SCHEMA
   * @param {string} sheetType - PROSPECTS, OUTREACH, or ACCOUNTS
   * @param {string} canonicalName - The canonical field name
   * @returns {string} The actual header name from the sheet
   */
  _getHeaderName: function(sheetType, canonicalName) {
    if (CONFIG.SCHEMA && CONFIG.SCHEMA[sheetType] && CONFIG.SCHEMA[sheetType][canonicalName]) {
      return CONFIG.SCHEMA[sheetType][canonicalName].header;
    }
    // Fallback: convert camelCase to Title Case
    return canonicalName.replace(/([A-Z])/g, ' $1').replace(/^./, function(str) { return str.toUpperCase(); });
  },

  /**
   * Helper to normalize column names for getSafeSheetData
   * @param {string} sheetType - PROSPECTS, OUTREACH, or ACCOUNTS  
   * @param {Array} canonicalNames - Array of canonical field names
   * @returns {Array} Array of header names
   */
  _getHeaders: function(sheetType, canonicalNames) {
    var self = this;
    return canonicalNames.map(function(name) {
      return self._getHeaderName(sheetType, name);
    });
  },
  
  calculateFunnel: function() {
    try {
      console.log('PipelineService.calculateFunnel: Starting...');
      
      // Use canonical field names - SharedUtils will map them
      var prospectHeaders = this._getHeaders('PROSPECTS', ['contactStatus']);
      var outreachHeaders = this._getHeaders('OUTREACH', ['outcome']);
      
      console.log('PipelineService.calculateFunnel: Fetching prospects with headers:', prospectHeaders);
      var prospects = SharedUtils.getSafeSheetData(CONFIG.SHEETS.PROSPECTS, prospectHeaders);
      
      console.log('PipelineService.calculateFunnel: Fetching outreach with headers:', outreachHeaders);
      var outreach = SharedUtils.getSafeSheetData(CONFIG.SHEETS.OUTREACH, outreachHeaders);

      // DEFENSIVE: Ensure arrays are never null
      if (!prospects) { 
        console.warn('PipelineService.calculateFunnel: No prospects data returned');
        prospects = []; 
      }
      if (!outreach) { 
        console.warn('PipelineService.calculateFunnel: No outreach data returned');
        outreach = []; 
      }

      console.log('PipelineService.calculateFunnel: Processing', prospects.length, 'prospects and', outreach.length, 'outreach records');

      var hotCount = prospects.filter(function(p) {
        var status = (p['contact status'] || p.contactstatus || p.contactStatus || '').toString().toLowerCase();
        return status.includes('interested (hot)') || status.includes('hot');
      }).length;

      var warmCount = prospects.filter(function(p) {
        var status = (p['contact status'] || p.contactstatus || p.contactStatus || '').toString().toLowerCase();
        return status.includes('interested (warm)') || status.includes('warm');
      }).length;

      var wonCount = outreach.filter(function(o) {
        var outcome = (o.outcome || '').toString().toLowerCase();
        return outcome.includes('account won') || outcome.includes('won');
      }).length;

      var result = {
        total: prospects.length || 0,
        hot: hotCount || 0,
        warm: warmCount || 0,
        won: wonCount || 0
      };
      
      console.log('PipelineService.calculateFunnel: Result:', result);
      return result;
    } catch (e) {
      console.error('PipelineService.calculateFunnel ERROR:', e);
      return {
        total: 0,
        hot: 0,
        warm: 0,
        won: 0
      };
    }
  },

  getUrgentProspects: function() {
    try {
      console.log('PipelineService.getUrgentProspects: Starting...');
      
      var cols = this._getHeaders('PROSPECTS', ['companyName', 'urgencyScore', 'urgencyBand', 'priorityScore']);
      console.log('PipelineService.getUrgentProspects: Using headers:', cols);
      
      var data = SharedUtils.getSafeSheetData(CONFIG.SHEETS.PROSPECTS, cols);
      
      if (!data || data.length === 0) { 
        console.warn('PipelineService.getUrgentProspects: No data returned');
        return []; 
      }
      
      console.log('PipelineService.getUrgentProspects: Processing', data.length, 'records');
      
      var urgent = data
        .filter(function(p) { 
          var band = (p['urgency band'] || p.urgencyband || p.urgencyBand || '').toString().toLowerCase();
          var isUrgent = band === 'high' || band === 'overdue';
          if (isUrgent) {
            console.log('PipelineService.getUrgentProspects: Found urgent prospect:', p['company name'] || p.companyname || p.companyName, 'with band:', band);
          }
          return isUrgent; 
        })
        .sort(function(a, b) { 
          var scoreA = parseFloat(a['urgency score'] || a.urgencyscore || a.urgencyScore) || 0;
          var scoreB = parseFloat(b['urgency score'] || b.urgencyscore || b.urgencyScore) || 0;
          return scoreB - scoreA; 
        })
        .slice(0, 10);
      
      console.log('PipelineService.getUrgentProspects: Returning', urgent.length, 'urgent prospects');
      return urgent;
    } catch (e) {
      console.error('PipelineService.getUrgentProspects ERROR:', e);
      return [];
    }
  },

  getRecentWins: function() {
    try {
      console.log('PipelineService.getRecentWins: Starting...');
      
      var cols = this._getHeaders('ACCOUNTS', ['companyName', 'timestamp', 'rolloffContainerSize']);
      console.log('PipelineService.getRecentWins: Using headers:', cols);
      
      var wins = SharedUtils.getSafeSheetData(CONFIG.SHEETS.ACCOUNTS, cols);

      if (!wins || wins.length === 0) { 
        console.warn('PipelineService.getRecentWins: No data returned');
        return []; 
      }

      console.log('PipelineService.getRecentWins: Processing', wins.length, 'accounts');

      var sorted = wins.sort(function(a, b) {
        var dateA = new Date(a['timestamp'] || a.timestamp || 0);
        var dateB = new Date(b['timestamp'] || b.timestamp || 0);
        return dateB - dateA;
      }).slice(0, 5);
      
      console.log('PipelineService.getRecentWins: Returning', sorted.length, 'recent wins');
      return sorted;
    } catch (e) {
      console.error('PipelineService.getRecentWins ERROR:', e);
      return [];
    }
  },

  getProspectsByStatus: function(status) {
    try {
      console.log('PipelineService.getProspectsByStatus: Starting with status:', status);
      
      var cols = this._getHeaders('PROSPECTS', ['companyName', 'contactStatus', 'urgencyBand', 'urgencyScore']);
      var data = SharedUtils.getSafeSheetData(CONFIG.SHEETS.PROSPECTS, cols);

      if (!data || data.length === 0) { 
        console.warn('PipelineService.getProspectsByStatus: No data returned');
        return []; 
      }

      var statusLower = status.toString().toLowerCase();
      var filtered = data.filter(function(p) {
        var contactStatus = (p['contact status'] || p.contactstatus || p.contactStatus || '').toString().toLowerCase();
        return contactStatus === statusLower || 
               (statusLower === 'hot' && contactStatus.includes('interested (hot)')) ||
               (statusLower === 'warm' && contactStatus.includes('interested (warm)'));
      });
      
      console.log('PipelineService.getProspectsByStatus: Found', filtered.length, 'prospects with status', status);
      return filtered;
    } catch (e) {
      console.error('PipelineService.getProspectsByStatus ERROR:', e);
      return [];
    }
  },

  getWonProspects: function() {
    try {
      console.log('PipelineService.getWonProspects: Starting...');
      
      var cols = this._getHeaders('OUTREACH', ['company', 'visitDate', 'outcome']);
      var outreach = SharedUtils.getSafeSheetData(CONFIG.SHEETS.OUTREACH, cols);

      if (!outreach || outreach.length === 0) { 
        console.warn('PipelineService.getWonProspects: No data returned');
        return []; 
      }

      var won = outreach.filter(function(o) {
        var outcome = (o.outcome || '').toString().toLowerCase();
        return outcome.includes('account won') || outcome.includes('won');
      });
      
      console.log('PipelineService.getWonProspects: Found', won.length, 'won prospects');
      return won;
    } catch (e) {
      console.error('PipelineService.getWonProspects ERROR:', e);
      return [];
    }
  },

  getAllProspects: function() {
    try {
      console.log('PipelineService.getAllProspects: Starting...');
      
      var cols = this._getHeaders('PROSPECTS', ['companyName', 'contactStatus', 'urgencyBand', 'priorityScore', 'lastOutreachDate']);
      var data = SharedUtils.getSafeSheetData(CONFIG.SHEETS.PROSPECTS, cols);

      if (!data || data.length === 0) { 
        console.warn('PipelineService.getAllProspects: No data returned');
        return []; 
      }

      console.log('PipelineService.getAllProspects: Returning', data.length, 'prospects');
      return data;
    } catch (e) {
      console.error('PipelineService.getAllProspects ERROR:', e);
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
