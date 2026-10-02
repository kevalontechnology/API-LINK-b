const xlsx = require('xlsx');
const csvParser = require('csv-parser');
const stream = require('stream');
const Lead = require('../models/Lead');
const { checkDuplicateLead, normalizeLinkedInUrl } = require('./duplicateDetectionService');
const { calculateLeadScore } = require('./aiService');

/**
 * Validates email format
 */
const isValidEmail = (email) => {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
};

/**
 * Normalizes phone numbers
 */
const normalizePhone = (phone) => {
  if (!phone) return '';
  return phone.replace(/[^\d+]/g, '');
};

/**
 * Parses buffer into array of JS objects (supports .csv and .xlsx)
 */
const parseBufferToRows = async (buffer, mimetype, filename) => {
  const extension = (filename || '').split('.').pop().toLowerCase();
  
  if (extension === 'xlsx' || extension === 'xls' || mimetype.includes('spreadsheet') || mimetype.includes('excel')) {
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    return xlsx.utils.sheet_to_json(worksheet, { defval: '' });
  }

  // Otherwise assume CSV
  return new Promise((resolve, reject) => {
    const results = [];
    const bufferStream = new stream.PassThrough();
    bufferStream.end(buffer);

    bufferStream
      .pipe(csvParser())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (err) => reject(err));
  });
};

/**
 * Maps raw import row to Lead schema structure
 */
const mapRowToLead = (row) => {
  const firstName = row.first_name || row['First Name'] || row.firstName || (row.full_name || row['Full Name'] || row.name || '').split(' ')[0] || 'Unknown';
  const lastName = row.last_name || row['Last Name'] || row.lastName || (row.full_name || row['Full Name'] || row.name || '').split(' ').slice(1).join(' ') || '';
  const fullName = row.full_name || row['Full Name'] || row.fullName || `${firstName} ${lastName}`.trim();
  const jobTitle = row.job_title || row['Job Title'] || row.title || row.designation || 'Professional';
  const company = row.company || row['Company'] || row.organization || 'Independent';
  const industry = row.industry || row['Industry'] || '';
  const location = row.location || row['Location'] || row.city || '';
  const linkedinUrl = row.linkedin_url || row['LinkedIn URL'] || row.linkedin || row.url || '';
  const website = row.website || row['Website'] || '';
  const email = row.email || row['Email'] || '';
  const phone = row.phone || row['Phone'] || row.mobile || '';
  const notes = row.notes || row['Notes'] || '';
  const campaignName = row.campaign || row['Campaign'] || '';

  return {
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    fullName: fullName.trim(),
    jobTitle: jobTitle.trim(),
    company: company.trim(),
    industry: industry.trim(),
    location: location.trim(),
    linkedinUrl: normalizeLinkedInUrl(linkedinUrl) ? `https://${normalizeLinkedInUrl(linkedinUrl)}` : '',
    website: website.trim(),
    email: isValidEmail(email) ? email.trim().toLowerCase() : '',
    phone: normalizePhone(phone),
    notes: notes.trim(),
    campaignName: campaignName.trim(),
    companySize: row.company_size || row['Company Size'] || '',
    customerType: row.customer_type || row['Customer Type'] || ''
  };
};

/**
 * Analyzes import data and provides preview + duplicate detection summary
 */
const previewImport = async (buffer, mimetype, filename) => {
  const rawRows = await parseBufferToRows(buffer, mimetype, filename);
  
  // Fetch existing leads for high-performance duplicate check
  const existingLeads = await Lead.find({}).lean();

  const previewList = [];
  let totalRows = rawRows.length;
  let validCount = 0;
  let duplicateCount = 0;
  let invalidCount = 0;

  for (let i = 0; i < rawRows.length; i++) {
    const leadData = mapRowToLead(rawRows[i]);

    // Basic validity check (must have full name/first name and job title or company)
    if (!leadData.firstName || !leadData.linkedinUrl) {
      invalidCount++;
      previewList.push({
        rowNumber: i + 1,
        data: leadData,
        isValid: false,
        isDuplicate: false,
        validationError: 'Missing required LinkedIn URL or First Name'
      });
      continue;
    }

    validCount++;

    // Calculate score
    const scoreResult = calculateLeadScore(leadData);
    leadData.leadScore = scoreResult.leadScore;
    leadData.icpCategory = scoreResult.icpCategory;

    // Duplicate check
    const dupCheck = await checkDuplicateLead(leadData, existingLeads);

    if (dupCheck.isDuplicate) {
      duplicateCount++;
    }

    previewList.push({
      rowNumber: i + 1,
      data: leadData,
      isValid: true,
      isDuplicate: dupCheck.isDuplicate,
      matchReason: dupCheck.matchReason,
      existingLead: dupCheck.existingLead ? {
        id: dupCheck.existingLead._id,
        fullName: dupCheck.existingLead.fullName,
        company: dupCheck.existingLead.company,
        email: dupCheck.existingLead.email,
        linkedinUrl: dupCheck.existingLead.linkedinUrl
      } : null
    });
  }

  return {
    totalRows,
    validCount,
    duplicateCount,
    invalidCount,
    previewList
  };
};

/**
 * Commits import data with duplicate action strategy ('skip', 'update', 'import_all')
 */
const executeImport = async (parsedRows, duplicateStrategy = 'skip', ownerId, campaignId) => {
  let imported = 0;
  let updated = 0;
  let skipped = 0;
  let invalid = 0;

  for (const item of parsedRows) {
    if (!item.isValid) {
      invalid++;
      continue;
    }

    const leadData = item.data;
    leadData.ownerId = ownerId;
    if (campaignId) leadData.campaignId = campaignId;

    if (item.isDuplicate) {
      if (duplicateStrategy === 'skip') {
        skipped++;
        continue;
      } else if (duplicateStrategy === 'update' && item.existingLead) {
        // Update existing lead
        await Lead.findByIdAndUpdate(item.existingLead.id, {
          jobTitle: leadData.jobTitle,
          company: leadData.company,
          industry: leadData.industry || item.existingLead.industry,
          location: leadData.location || item.existingLead.location,
          email: leadData.email || item.existingLead.email,
          phone: leadData.phone || item.existingLead.phone,
          leadScore: leadData.leadScore,
          icpCategory: leadData.icpCategory,
          notes: leadData.notes ? `${item.existingLead.notes || ''}\n[Import Note]: ${leadData.notes}` : item.existingLead.notes
        });
        updated++;
        continue;
      }
    }

    // Otherwise create new lead
    leadData.leadId = `TPZ-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;
    await Lead.create(leadData);
    imported++;
  }

  return {
    totalRows: parsedRows.length,
    imported,
    updated,
    skipped,
    invalid
  };
};

module.exports = {
  previewImport,
  executeImport
};
