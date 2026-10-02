const request = require('supertest');
const app = require('../server');
const { calculateLeadScore } = require('../services/aiService');
const { checkDuplicateLead } = require('../services/duplicateDetectionService');
const { getUserCapabilities, checkActionCapability } = require('../services/linkedinCapabilityService');

describe('Tapzy Outreach CRM Backend Integration & Unit Tests', () => {

  describe('1. AI Lead Scoring Engine (0-100)', () => {
    test('Calculates high priority score for CEO with LinkedIn & Website', () => {
      const lead = {
        firstName: 'Ananya',
        fullName: 'Ananya Roy',
        jobTitle: 'Founder & CEO (Sales Head)',
        linkedinUrl: 'https://linkedin.com/in/test-ceo',
        website: 'https://testcompany.com',
        companySize: '50-100',
        industry: 'Software',
        potentialUseCase: 'Corporate sales team digital business cards'
      };
      const result = calculateLeadScore(lead);
      expect(result.leadScore).toBeGreaterThanOrEqual(80);
      expect(result.icpCategory).toBe('HIGH PRIORITY');
    });

    test('Calculates low priority score for minimal profile details', () => {
      const lead = {
        jobTitle: 'Student Intern',
        linkedinUrl: 'https://linkedin.com/in/test-intern'
      };
      const result = calculateLeadScore(lead);
      expect(result.leadScore).toBeLessThan(40);
      expect(result.icpCategory).toBe('LOW PRIORITY');
    });
  });

  describe('2. Duplicate Lead Detection Rules', () => {
    const existingLeads = [
      {
        _id: '1',
        fullName: 'Keval Patel',
        firstName: 'Keval',
        lastName: 'Patel',
        company: 'Kevalon Tech',
        email: 'keval@kevalon.in',
        linkedinUrl: 'https://linkedin.com/in/kevalpatel'
      }
    ];

    test('Detects duplicate by LinkedIn URL match', async () => {
      const dup = await checkDuplicateLead({
        linkedinUrl: 'https://www.linkedin.com/in/kevalpatel/'
      }, existingLeads);

      expect(dup.isDuplicate).toBe(true);
      expect(dup.matchReason).toBe('linkedin_url');
    });

    test('Detects duplicate by Email match', async () => {
      const dup = await checkDuplicateLead({
        email: 'KEVAL@KEVALON.IN',
        linkedinUrl: 'https://linkedin.com/in/other-profile'
      }, existingLeads);

      expect(dup.isDuplicate).toBe(true);
      expect(dup.matchReason).toBe('email');
    });

    test('Detects duplicate by Normalized First Name + Company match', async () => {
      const dup = await checkDuplicateLead({
        firstName: 'keval',
        company: 'kevalon tech',
        linkedinUrl: 'https://linkedin.com/in/another'
      }, existingLeads);

      expect(dup.isDuplicate).toBe(true);
      expect(dup.matchReason).toBe('normalized_name_company');
    });
  });

  describe('3. LinkedIn Compliance & Dynamic Capability Matrix', () => {
    test('Default capability engine returns disconnected / manual fallback status', async () => {
      const status = await getUserCapabilities('non_existent_user_id');
      expect(status.connected).toBe(false);
      expect(status.capabilities.messaging).toBe(false);
      expect(status.capabilities.connectionActions).toBe(false);
    });

    test('Returns manual action fallback when messaging API permission is unavailable', async () => {
      const capCheck = await checkActionCapability('user123', 'messaging', 'https://linkedin.com/in/prospect');
      expect(capCheck.supported).toBe(false);
      expect(capCheck.manualActionRequired).toBe(true);
      expect(capCheck.manualReason).toContain('Manual action required');
      expect(capCheck.actionUrl).toBe('https://linkedin.com/in/prospect');
    });
  });

  describe('4. REST API Endpoint Health Check', () => {
    test('GET /health returns 200 OK', async () => {
      const res = await request(app).get('/health');
      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
    });
  });
});
