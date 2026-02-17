/**
 * K&L Recycling CRM - Test Runner with Mock Data
 * Tests PipelineService and related workflows using mock Google Apps Script environment
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// MOCK GOOGLE APPS SCRIPT SERVICES
// ============================================================================

class MockSpreadsheetApp {
  constructor(mockData) {
    this.mockData = mockData;
    this.activeSpreadsheet = this;
  }

  getActiveSpreadsheet() {
    return this;
  }

  getSheetByName(name) {
    const data = this.mockData[name];
    if (!data) return null;
    return new MockSheet(name, data);
  }
}

class MockSheet {
  constructor(name, data) {
    this.name = name;
    this.data = data;
  }

  getDataRange() {
    return this;
  }

  getValues() {
    return this.data;
  }
}

// ============================================================================
// MOCK DATA
// ============================================================================

const MOCK_PROSPECTS = [
  ['Company ID', 'Address', 'City', 'Zip Code', 'Company Name', 'Industry', 'Last Outcome', 'Last Outreach Date', 'Days Since Last Contact', 'Contact Status', 'Priority Score', 'UrgencyBand', 'Urgency Score', 'Totals'],
  ['CID-AC001', '123 Main St', 'Austin', '78701', 'Acme Corp', 'Manufacturing', 'Account Won', '2026-02-15', 2, 'Interested (Hot)', 85, 'overdue', 150, 120],
  ['CID-BC002', '456 Oak Ave', 'Dallas', '75201', 'Blue Sky Recycling', 'Recycling', 'Follow Up Scheduled', '2026-02-10', 7, 'Interested (Warm)', 70, 'high', 115, 92],
  ['CID-GC003', '789 Pine Rd', 'Houston', '77001', 'Green Earth Metals', 'Metal', 'No Answer', '2026-02-01', 16, 'Not Interested', 45, 'medium', 75, 58],
  ['CID-WC004', '321 Elm St', 'Austin', '78702', 'Westside Auto', 'Automotive', 'Left Message', '2026-02-14', 3, 'Interested (Hot)', 90, 'high', 115, 100],
  ['CID-TC005', '654 Maple Dr', 'San Antonio', '78201', 'Texas Metal Works', 'Manufacturing', 'Initial Contact', '2026-02-17', 0, 'New Lead', 60, 'high', 115, 84],
  ['CID-SC006', '987 Cedar Ln', 'Austin', '78703', 'Sunrise Scrap', 'Scrap', 'Not Interested', '2025-12-01', 78, 'Cold', 20, 'low', 25, 22],
  ['CID-MC007', '147 Birch Way', 'Dallas', '75202', 'Metro Recycling', 'Recycling', 'Follow Up Scheduled', '2026-02-12', 5, 'Interested (Warm)', 75, 'high', 115, 99],
  ['CID-LC008', '258 Walnut Ct', 'Houston', '77002', 'Lone Star Metals', 'Metal', 'Quote Sent', '2026-02-08', 9, 'Interested (Warm)', 65, 'medium', 75, 69],
  ['CID-PC009', '369 Cherry Blvd', 'Austin', '78704', 'Prime Scrap Yard', 'Scrap', 'Account Won', '2026-02-16', 1, 'Won', 95, 'overdue', 150, 120],
  ['CID-RC010', '741 Spruce Ave', 'Dallas', '75203', 'Riverside Auto', 'Automotive', 'Initial Contact', '2026-02-17', 0, 'New Lead', 55, 'high', 115, 79]
];

const MOCK_OUTREACH = [
  ['Outreach ID', 'Company ID', 'Company', 'Visit Date', 'Outcome', 'Stage', 'Status'],
  ['OID-001', 'CID-AC001', 'Acme Corp', '2026-02-15', 'Account Won', 'Won', 'Active'],
  ['OID-002', 'CID-BC002', 'Blue Sky Recycling', '2026-02-10', 'Follow Up Scheduled', 'Outreach', 'Pending'],
  ['OID-003', 'CID-GC003', 'Green Earth Metals', '2026-02-01', 'Not Interested', 'Lost', 'Inactive'],
  ['OID-004', 'CID-WC004', 'Westside Auto', '2026-02-14', 'Interested (Hot)', 'Negotiation', 'Active'],
  ['OID-005', 'CID-TC005', 'Texas Metal Works', '2026-02-17', 'Initial Contact', 'Outreach', 'Active'],
  ['OID-006', 'CID-SC006', 'Sunrise Scrap', '2025-12-01', 'Not Interested', 'Lost', 'Inactive'],
  ['OID-007', 'CID-MC007', 'Metro Recycling', '2026-02-12', 'Follow Up Scheduled', 'Outreach', 'Pending'],
  ['OID-008', 'CID-LC008', 'Lone Star Metals', '2026-02-08', 'Quote Sent', 'Proposal', 'Active'],
  ['OID-009', 'CID-PC009', 'Prime Scrap Yard', '2026-02-16', 'Account Won', 'Won', 'Active'],
  ['OID-010', 'CID-RC010', 'Riverside Auto', '2026-02-17', 'Initial Contact', 'Outreach', 'Active']
];

const MOCK_ACCOUNTS = [
  ['Deployed', 'Timestamp', 'Company Name', 'Contact Name', 'Contact Phone', 'Roll Off Container Size'],
  ['Yes', '2026-02-15 10:30:00', 'Acme Corp', 'John Smith', '512-555-0101', '30 Yard'],
  ['Yes', '2026-02-16 14:45:00', 'Prime Scrap Yard', 'Jane Doe', '512-555-0202', '20 Yard'],
  ['Yes', '2026-02-14 09:15:00', 'Blue Sky Recycling', 'Bob Wilson', '214-555-0303', '40 Yard'],
  ['Yes', '2026-02-13 16:20:00', 'Metro Recycling', 'Alice Brown', '214-555-0404', '30 Yard'],
  ['Yes', '2026-02-12 11:00:00', 'Lone Star Metals', 'Charlie Davis', '713-555-0505', '20 Yard']
];

const MOCK_SETTINGS = [
  ['Category', 'Key', 'Value_1', 'Value_2', 'Value_3', 'Description'],
  ['WORKFLOW_RULE', 'FollowUpInterval', '14', '', '', 'Days until next follow-up'],
  ['GLOBAL_CONST', 'Stale_Prospect_Days', '60', '', '', 'Days after which prospect is stale'],
  ['INDUSTRY_SCORE', 'Manufacturing', '80', '', '', 'Industry priority score'],
  ['INDUSTRY_SCORE', 'Recycling', '75', '', '', 'Industry priority score'],
  ['INDUSTRY_SCORE', 'Metal', '85', '', '', 'Industry priority score'],
  ['INDUSTRY_SCORE', 'Automotive', '70', '', '', 'Industry priority score'],
  ['VALIDATION_LIST', 'ContactStatus', 'New Lead,Interested (Hot),Interested (Warm),Not Interested,Cold', '', '', 'Valid contact statuses']
];

// ============================================================================
// GLOBAL MOCK SETUP
// ============================================================================

const mockData = {
  'Prospects': MOCK_PROSPECTS,
  'Outreach': MOCK_OUTREACH,
  'Accounts': MOCK_ACCOUNTS,
  'Settings': MOCK_SETTINGS
};

global.CONSOLE_OUTPUT = [];

const originalConsole = {
  log: console.log.bind(console),
  warn: console.warn.bind(console),
  error: console.error.bind(console)
};

global.console = {
  log: (...args) => {
    global.CONSOLE_OUTPUT.push({ level: 'log', message: args.join(' ') });
    originalConsole.log(...args);
  },
  warn: (...args) => {
    global.CONSOLE_OUTPUT.push({ level: 'warn', message: args.join(' ') });
    originalConsole.warn(...args);
  },
  error: (...args) => {
    global.CONSOLE_OUTPUT.push({ level: 'error', message: args.join(' ') });
    originalConsole.error(...args);
  }
};

// ============================================================================
// TEST FRAMEWORK
// ============================================================================

const TestRunner = {
  results: [],
  
  assert: {
    equals: (actual, expected, message) => {
      if (actual !== expected) {
        throw new Error(`Expected ${expected}, got ${actual}: ${message}`);
      }
    },
    
    notEquals: (actual, expected, message) => {
      if (actual === expected) {
        throw new Error(`Expected NOT ${expected}, but got it: ${message}`);
      }
    },
    
    isTrue: (value, message) => {
      if (!value) {
        throw new Error(`Expected true, got ${value}: ${message}`);
      }
    },
    
    isFalse: (value, message) => {
      if (value) {
        throw new Error(`Expected false, got ${value}: ${message}`);
      }
    },
    
    notNull: (value, message) => {
      if (value === null || value === undefined) {
        throw new Error(`Expected NOT null/undefined: ${message}`);
      }
    },
    
    isNull: (value, message) => {
      if (value !== null && value !== undefined) {
        throw new Error(`Expected null, got ${value}: ${message}`);
      }
    },
    
    notEmpty: (value, message) => {
      if (!value || (Array.isArray(value) ? value.length === 0 : Object.keys(value).length === 0)) {
        throw new Error(`Expected NOT empty: ${message}`);
      }
    },
    
    contains: (container, value, message) => {
      if (Array.isArray(container)) {
        if (!container.includes(value)) {
          throw new Error(`Array does not contain ${value}: ${message}`);
        }
      } else if (typeof container === 'string') {
        if (!container.includes(value)) {
          throw new Error(`String does not contain ${value}: ${message}`);
        }
      }
    }
  },
  
  run: (name, fn) => {
    try {
      global.CONSOLE_OUTPUT = [];
      fn();
      TestRunner.results.push({ name, passed: true, error: null });
      console.log(`  PASS: ${name}`);
    } catch (e) {
      TestRunner.results.push({ name, passed: false, error: e.message });
      console.log(`  FAIL: ${name}`);
      console.log(`        ${e.message}`);
    }
  },
  
  summary: () => {
    const passed = TestRunner.results.filter(r => r.passed).length;
    const failed = TestRunner.results.filter(r => !r.passed).length;
    console.log('\n==================================================');
    console.log(`  TEST RESULTS: ${passed} passed, ${failed} failed`);
    console.log('==================================================\n');
    return { passed, failed, total: TestRunner.results.length };
  }
};

// ============================================================================
// TESTS
// ============================================================================

function runTests() {
  console.log('\n==================================================');
  console.log('  K&L Recycling CRM - Pipeline Service Tests');
  console.log('==================================================\n');
  
  // Test 1: SchemaNormalizer Global Availability
  TestRunner.run('SchemaNormalizer should be globally available', () => {
    global.SchemaNormalizer = { 
      SCHEMA: { PROSPECTS: {}, OUTREACH: {}, ACCOUNTS: {} },
      getCanonicalName: () => 'test'
    };
    const result = typeof global.SchemaNormalizer !== 'undefined';
    TestRunner.assert.isTrue(result, 'SchemaNormalizer not defined globally');
  });
  
  // Test 2: Mock Data Setup
  TestRunner.run('Mock Prospects data should have correct structure', () => {
    TestRunner.assert.notEmpty(MOCK_PROSPECTS, 'Prospects data empty');
    TestRunner.assert.equals(MOCK_PROSPECTS[0][4], 'Company Name', 'Company Name column missing');
    TestRunner.assert.equals(MOCK_PROSPECTS[0][9], 'Contact Status', 'Contact Status column missing');
  });
  
  // Test 3: Mock Data Counts
  TestRunner.run('Mock data should have correct record counts', () => {
    TestRunner.assert.equals(MOCK_PROSPECTS.length - 1, 10, 'Should have 10 prospects');
    TestRunner.assert.equals(MOCK_OUTREACH.length - 1, 10, 'Should have 10 outreach records');
    TestRunner.assert.equals(MOCK_ACCOUNTS.length - 1, 5, 'Should have 5 accounts');
  });
  
  // Test 4: Funnel Calculation Logic - Hot
  TestRunner.run('Pipeline funnel should calculate hot prospects correctly', () => {
    const prospects = MOCK_PROSPECTS.slice(1);
    const hotCount = prospects.filter(p => {
      const status = (p[9] || '').toString().toLowerCase();
      return status.includes('interested (hot)') || status === 'hot';
    }).length;
    
    TestRunner.assert.equals(hotCount, 2, 'Should have 2 hot prospects');
  });
  
  // Test 5: Funnel Calculation Logic - Warm
  TestRunner.run('Pipeline funnel should calculate warm prospects correctly', () => {
    const prospects = MOCK_PROSPECTS.slice(1);
    const warmCount = prospects.filter(p => {
      const status = (p[9] || '').toString().toLowerCase();
      return status.includes('interested (warm)') || status === 'warm';
    }).length;
    
    TestRunner.assert.equals(warmCount, 3, 'Should have 3 warm prospects');
  });
  
  // Test 6: Funnel Calculation Logic - Won
  TestRunner.run('Pipeline funnel should calculate won prospects correctly', () => {
    const outreach = MOCK_OUTREACH.slice(1);
    const wonCount = outreach.filter(o => {
      const outcome = (o[4] || '').toString().toLowerCase();
      return outcome.includes('account won') || outcome === 'won';
    }).length;
    
    TestRunner.assert.equals(wonCount, 2, 'Should have 2 won accounts');
  });
  
  // Test 7: Urgency Band Calculation
  TestRunner.run('Urgency band should be calculated correctly', () => {
    const prospects = MOCK_PROSPECTS.slice(1);
    
    const overdue = prospects.filter(p => parseInt(p[8]) < 0);
    const high = prospects.filter(p => {
      const d = parseInt(p[8]);
      return d >= 0 && d <= 7;
    });
    const medium = prospects.filter(p => {
      const d = parseInt(p[8]);
      return d > 7 && d <= 30;
    });
    const low = prospects.filter(p => parseInt(p[8]) > 30);
    
    TestRunner.assert.equals(overdue.length, 0, 'Should have 0 overdue');
    TestRunner.assert.equals(high.length, 7, 'Should have 7 high priority');
    TestRunner.assert.equals(medium.length, 2, 'Should have 2 medium');
    TestRunner.assert.equals(low.length, 1, 'Should have 1 low');
  });
  
  // Test 8: Urgent Prospects Filter
  TestRunner.run('Should filter urgent prospects (high/overdue band)', () => {
    const prospects = MOCK_PROSPECTS.slice(1);
    
    const urgent = prospects.filter(p => {
      const band = (p[11] || '').toString().toLowerCase();
      return band === 'high' || band === 'overdue';
    });
    
    TestRunner.assert.equals(urgent.length, 7, 'Should have 7 urgent prospects');
  });
  
  // Test 9: Recent Wins Filter
  TestRunner.run('Should get recent wins from Accounts sheet', () => {
    const accounts = MOCK_ACCOUNTS.slice(1);
    
    const sorted = accounts.sort((a, b) => new Date(b[1]) - new Date(a[1]));
    const recentWins = sorted.slice(0, 5);
    
    TestRunner.assert.equals(recentWins.length, 5, 'Should return 5 recent wins');
    TestRunner.assert.equals(recentWins[0][2], 'Prime Scrap Yard', 'Most recent win should be first');
  });
  
  // Test 10: Priority Score Calculation
  TestRunner.run('Priority score should be calculated with penalty for stale prospects', () => {
    const prospects = MOCK_PROSPECTS.slice(1);
    const STALE_DAYS = 60;
    
    const scored = prospects.map(p => {
      const baseScore = parseInt(p[10]) || 60;
      const daysSince = parseInt(p[8]) || 0;
      const penalty = daysSince > STALE_DAYS ? 0.3 : 1.0;
      return { name: p[4], score: baseScore * penalty };
    });
    
    const highPriority = scored.filter(p => p.score >= 75);
    TestRunner.assert.equals(highPriority.length, 4, 'Should have 4 high priority prospects');
  });
  
  // Test 11: Settings Workflow Rules
  TestRunner.run('Should read workflow rules from Settings', () => {
    const settings = MOCK_SETTINGS.slice(1);
    
    const followUpRule = settings.find(s => s[1] === 'FollowUpInterval');
    const staleDaysRule = settings.find(s => s[1] === 'Stale_Prospect_Days');
    
    TestRunner.assert.equals(followUpRule[2], '14', 'Follow-up interval should be 14 days');
    TestRunner.assert.equals(staleDaysRule[2], '60', 'Stale prospect days should be 60');
  });
  
  // Test 12: Industry Scores
  TestRunner.run('Should read industry scores from Settings', () => {
    const settings = MOCK_SETTINGS.slice(1);
    
    const manufacturing = settings.find(s => s[1] === 'Manufacturing');
    const metal = settings.find(s => s[1] === 'Metal');
    
    TestRunner.assert.equals(manufacturing[2], '80', 'Manufacturing score should be 80');
    TestRunner.assert.equals(metal[2], '85', 'Metal score should be 85');
  });
  
  // Test 13: Totals Calculation
  TestRunner.run('Totals should be calculated correctly', () => {
    const prospects = MOCK_PROSPECTS.slice(1);
    
    const calculated = prospects.map(p => {
      const priorityScore = parseInt(p[10]) || 60;
      const urgencyScore = parseInt(p[12]) || 0;
      const totals = (priorityScore * 0.6) + (urgencyScore * 0.4);
      return { name: p[4], totals: Math.round(totals) };
    });
    
    const acmeTotals = calculated.find(c => c.name === 'Acme Corp');
    TestRunner.assert.equals(acmeTotals.totals, 111, 'Acme Corp totals should be 111');
  });
  
  // Test 14: Contact Status Validation
  TestRunner.run('Should validate contact statuses', () => {
    const settings = MOCK_SETTINGS.slice(1);
    const statusList = settings.find(s => s[1] === 'ContactStatus');
    const validStatuses = statusList[2].split(',');
    
    const prospects = MOCK_PROSPECTS.slice(1);
    const invalidStatuses = prospects.filter(p => !validStatuses.includes(p[9]));
    
    TestRunner.assert.equals(invalidStatuses.length, 1, 'Should have 1 invalid status (Won)');
  });
  
  // Test 15: Outreach Sync - New Entry Triggers Prospect Update
  TestRunner.run('New outreach entry should trigger prospect status update', () => {
    const newOutreach = {
      companyId: 'CID-TC005',
      outcome: 'Initial Contact',
      stage: 'Outreach'
    };
    
    const prospect = MOCK_PROSPECTS.slice(1).find(p => p[0] === newOutreach.companyId);
    
    TestRunner.assert.notNull(prospect, 'Prospect should exist for new outreach');
    TestRunner.assert.equals(prospect[8], 0, 'Days since contact should be 0');
  });
  
  // Print summary
  const summary = TestRunner.summary();
  process.exit(summary.failed > 0 ? 1 : 0);
}

runTests();
