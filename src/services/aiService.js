const OpenAI = require('openai');
const AIUsage = require('../models/AIUsage');

const getOpenAIClient = () => {
  if (process.env.OPENAI_API_KEY) {
    return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return null;
};

/**
 * Calculates deterministic AI Lead Score from 0 to 100 based on prospect profile data
 */
const calculateLeadScore = (lead) => {
  let score = 0;
  const title = (lead.jobTitle || '').toLowerCase();
  const industry = (lead.industry || '').toLowerCase();

  // 1. Founder/CEO/Owner (+20)
  if (/\b(founder|co-founder|ceo|owner|managing director|president|director)\b/i.test(title)) {
    score += 20;
  }

  // 2. Customer-facing profession (+15)
  if (/\b(sales|business development|bde|consultant|doctor|lawyer|realtor|agency|speaker|coach|freelancer|architect|agent)\b/i.test(title)) {
    score += 15;
  }

  // 3. Active professional presence (+15)
  if (lead.linkedinUrl && lead.linkedinUrl.includes('linkedin.com')) {
    score += 15;
  }

  // 4. Business website (+10)
  if (lead.website && lead.website.trim().length > 3) {
    score += 10;
  }

  // 5. Sales / Networking role (+10)
  if (/\b(sales|growth|partnerships|networking|client|account)\b/i.test(title)) {
    score += 10;
  }

  // 6. Company size provided (+10)
  if (lead.companySize && lead.companySize.trim().length > 0) {
    score += 10;
  }

  // 7. Relevant industry (+10)
  if (industry && industry.length > 2) {
    score += 10;
  }

  // 8. Potential Tapzy use case (+10)
  if (lead.potentialUseCase || score >= 40) {
    score += 10;
  }

  // Cap score at 100
  score = Math.min(100, Math.max(0, score));

  // Determine category
  let icpCategory = 'NORMAL';
  if (score >= 80) icpCategory = 'HIGH PRIORITY';
  else if (score >= 60) icpCategory = 'QUALIFIED';
  else if (score >= 40) icpCategory = 'NORMAL';
  else icpCategory = 'LOW PRIORITY';

  return { leadScore: score, icpCategory };
};

/**
 * Generates personalized B2B outreach messages using OpenAI structured JSON output or smart template engine fallback
 */
const generatePersonalizedOutreach = async ({ lead, customPromptNotes, userId }) => {
  const firstName = lead.firstName || lead.fullName?.split(' ')[0] || 'there';
  const jobTitle = lead.jobTitle || 'Professional';
  const company = lead.company || 'your organization';
  const industry = lead.industry || 'your industry';
  const location = lead.location || 'your area';

  const systemPrompt = `You are a B2B sales personalization assistant for Tapzy.

Tapzy is a smart NFC digital business card that lets professionals share contact details, WhatsApp, website, social profiles, services, products, Google Reviews and location through one NFC tap or QR scan.

Analyze the provided prospect information.

Rules:
- Do not invent facts.
- Do not make unsupported claims.
- Do not use generic compliments.
- Keep the message natural and professional.
- Do not mention pricing in the first message.
- Do not use emojis unless specifically requested.

Generate a JSON object with exactly these keys:
1. personalization: A concise 1-sentence personalization note based on their role/company.
2. connectionMessage: Concise LinkedIn connection request (under 280 chars).
3. introductionMessage: Post-connection message introducing Tapzy.
4. followUp1: First polite follow-up after 3 days.
5. followUp2: Second final follow-up after 5 days closing the loop.
6. suggestedCta: Recommended call to action for this prospect.`;

  const userPrompt = `Prospect Information:
- Name: ${lead.fullName || `${firstName} ${lead.lastName || ''}`}
- Job Title: ${jobTitle}
- Company: ${company}
- Industry: ${industry}
- Location: ${location}
- Website: ${lead.website || 'N/A'}
- CRM Notes: ${lead.notes || customPromptNotes || 'N/A'}`;

  const openai = getOpenAIClient();

  if (openai) {
    try {
      const response = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7
      });

      const content = response.choices[0].message.content;
      const parsed = JSON.parse(content);

      // Track usage
      if (userId && response.usage) {
        await AIUsage.create({
          userId,
          promptType: 'PERSONALIZATION',
          tokensUsed: response.usage.total_tokens || 0,
          model: process.env.OPENAI_MODEL || 'gpt-4o-mini'
        }).catch(() => {});
      }

      return {
        success: true,
        personalization: parsed.personalization || `Noticed your work as ${jobTitle} at ${company}.`,
        connectionMessage: parsed.connectionMessage || `Hi ${firstName}, came across your profile and your work at ${company}. I'd be glad to connect and stay in touch.`,
        introductionMessage: parsed.introductionMessage || `Thanks for connecting, ${firstName}.\n\nI'm working on Tapzy — a smart NFC digital business card that lets professionals share their contact details, WhatsApp, website, social profiles, services and more with a single tap or QR scan.\n\nI thought it could be relevant for your professional networking at ${company}.`,
        followUp1: parsed.followUp1 || `Hi ${firstName}, just following up.\n\nIf you're interested, I can share a quick Tapzy demo so you can see how the NFC card works in practice.`,
        followUp2: parsed.followUp2 || `Hi ${firstName}, closing the loop here.\n\nIf a smart NFC business card is useful for your networking or business development at ${company}, I'd be happy to show you Tapzy.\n\nOtherwise, no worries at all — happy to stay connected.`,
        suggestedCta: parsed.suggestedCta || 'Offer a 2-minute interactive Tapzy NFC card preview.'
      };
    } catch (err) {
      console.warn('[AI Service Warning] OpenAI call failed, using high-quality template fallback:', err.message);
    }
  }

  // Fallback high-quality template generation
  return {
    success: true,
    personalization: `As a ${jobTitle} at ${company}, efficient networking and client contact sharing directly impacts business conversion.`,
    connectionMessage: `Hi ${firstName}, came across your profile and your work at ${company}. I'd be glad to connect and stay in touch.`,
    introductionMessage: `Thanks for connecting, ${firstName}.\n\nI'm working on Tapzy — a smart NFC digital business card that lets professionals share their contact details, WhatsApp, website, social profiles, services and more with a single tap or QR scan.\n\nI thought it could be relevant for your professional networking.`,
    followUp1: `Hi ${firstName}, just following up.\n\nIf you're interested, I can share a quick Tapzy demo so you can see how the NFC card works in practice.`,
    followUp2: `Hi ${firstName}, closing the loop here.\n\nIf a smart NFC business card is useful for your networking or business development, I'd be happy to show you Tapzy.\n\nOtherwise, no worries at all — happy to stay connected.`,
    suggestedCta: 'Share a quick 2-minute digital profile link or request a demo call.'
  };
};

/**
 * Classifies prospect replies into CRM intent categories and generates suggested response
 */
const classifyReply = async (replyText, lead, userId) => {
  const text = replyText.toLowerCase();

  let category = 'QUESTION';
  let intent = 'The prospect has asked for additional details.';
  let recommendedReply = `Hi ${lead?.firstName || 'there'}, thanks for reaching out! You can view how Tapzy works at https://tapzy.in or I can arrange a quick demo card preview for you.`;
  let nextAction = 'SCHEDULE_DEMO';

  if (/\b(yes|interested|sure|send details|tell me more|sounds good|demo)\b/i.test(text)) {
    category = 'INTERESTED';
    intent = 'High purchase intent for Tapzy NFC Card.';
    recommendedReply = `Awesome, ${lead?.firstName || 'there'}! I'd be happy to show you a quick live demo of the Tapzy NFC card. What time works best for you tomorrow?`;
    nextAction = 'SCHEDULE_DEMO';
  } else if (/\b(price|cost|pricing|how much|rate|quote)\b/i.test(text)) {
    category = 'ASKED_FOR_PRICE';
    intent = 'Prospect requested pricing details.';
    recommendedReply = `Hi ${lead?.firstName || 'there'}, Tapzy digital cards start with standard and custom branded finishes with zero recurring monthly fees. I'd be happy to share our product sheet for ${lead?.company || 'your team'}.`;
    nextAction = 'SEND_PROPOSAL';
  } else if (/\b(not interested|no thanks|stop|remove|no)\b/i.test(text)) {
    category = 'NOT_INTERESTED';
    intent = 'Low intent / declined outreach.';
    recommendedReply = `Thanks for letting me know, ${lead?.firstName || 'there'}. Wishing you continued success at ${lead?.company || 'your company'}!`;
    nextAction = 'MARK_LOST';
  } else if (/\b(later|next month|busy|after|next week)\b/i.test(text)) {
    category = 'LATER';
    intent = 'Timing issue, follow up later.';
    recommendedReply = `Understood, ${lead?.firstName || 'there'}! I'll re-connect with you in a couple of weeks. Have a great week ahead!`;
    nextAction = 'SCHEDULE_FOLLOW_UP';
  }

  return {
    category,
    intent,
    recommendedReply,
    nextAction
  };
};

module.exports = {
  calculateLeadScore,
  generatePersonalizedOutreach,
  classifyReply
};
