const Lead = require('../models/Lead');

/**
 * Normalizes LinkedIn URL to standard format
 */
const normalizeLinkedInUrl = (url) => {
  if (!url) return '';
  let cleaned = url.trim().toLowerCase();
  cleaned = cleaned.replace(/^https?:\/\/(www\.)?/, '');
  cleaned = cleaned.replace(/\/$/, '');
  return cleaned;
};

/**
 * Checks if a lead is duplicate based on LinkedIn URL, Email, or Normalized (FirstName + Company)
 */
const checkDuplicateLead = async (leadData, existingLeadsList = null) => {
  const normUrl = normalizeLinkedInUrl(leadData.linkedinUrl);
  const email = (leadData.email || '').trim().toLowerCase();
  const firstName = (leadData.firstName || '').trim().toLowerCase();
  const company = (leadData.company || '').trim().toLowerCase();

  // If in-memory array passed (for import preview)
  if (existingLeadsList) {
    const found = existingLeadsList.find(l => {
      const lUrl = normalizeLinkedInUrl(l.linkedinUrl);
      const lEmail = (l.email || '').trim().toLowerCase();
      const lFirstName = (l.firstName || '').trim().toLowerCase();
      const lCompany = (l.company || '').trim().toLowerCase();

      if (normUrl && lUrl && normUrl === lUrl) return true;
      if (email && lEmail && email === lEmail) return true;
      if (firstName && company && lFirstName === firstName && lCompany === company) return true;
      return false;
    });

    if (found) {
      let matchReason = 'normalized_name_company';
      if (normUrl && normalizeLinkedInUrl(found.linkedinUrl) === normUrl) matchReason = 'linkedin_url';
      else if (email && found.email?.toLowerCase() === email) matchReason = 'email';
      return { isDuplicate: true, existingLead: found, matchReason };
    }
    return { isDuplicate: false };
  }

  // Database check
  const query = [];
  if (normUrl) {
    query.push({ linkedinUrl: new RegExp(normUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') });
  }
  if (email) {
    query.push({ email: email });
  }
  if (firstName && company) {
    query.push({ 
      firstName: new RegExp(`^${firstName}$`, 'i'), 
      company: new RegExp(`^${company}$`, 'i') 
    });
  }

  if (query.length === 0) return { isDuplicate: false };

  try {
    const existing = await Lead.findOne({ $or: query });
    if (existing) {
      let matchReason = 'normalized_name_company';
      if (normUrl && normalizeLinkedInUrl(existing.linkedinUrl) === normUrl) matchReason = 'linkedin_url';
      else if (email && existing.email?.toLowerCase() === email) matchReason = 'email';
      return { isDuplicate: true, existingLead: existing, matchReason };
    }
  } catch (err) {
    console.error('[Duplicate Detection DB Error]', err.message);
  }

  return { isDuplicate: false };
};

module.exports = {
  normalizeLinkedInUrl,
  checkDuplicateLead
};
