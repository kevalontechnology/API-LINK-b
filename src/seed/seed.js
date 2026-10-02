require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Campaign = require('../models/Campaign');
const Lead = require('../models/Lead');
const Task = require('../models/Task');
const Deal = require('../models/Deal');
const Product = require('../models/Product');
const Setting = require('../models/Setting');
const { calculateLeadScore } = require('../services/aiService');

const seedData = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/tapzy_outreach_crm';
    await mongoose.connect(mongoUri);
    console.log('[Seed Script] Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Campaign.deleteMany({});
    await Lead.deleteMany({});
    await Task.deleteMany({});
    await Deal.deleteMany({});
    await Product.deleteMany({});
    await Setting.deleteMany({});

    console.log('[Seed Script] Cleared existing collections');

    // 1. Create Users
    const admin = await User.create({
      name: 'Kevalon Admin',
      email: 'admin@tapzy.in',
      password: 'AdminPassword123!',
      role: 'ADMIN'
    });

    const salesBde = await User.create({
      name: 'Rajesh Sharma',
      email: 'sales@tapzy.in',
      password: 'SalesPassword123!',
      role: 'SALES_BDE'
    });

    console.log('[Seed Script] Created Users (Admin & Sales BDE)');

    // 2. Create Products (Tapzy NFC Digital Business Cards)
    const product1 = await Product.create({
      name: 'Tapzy Smart NFC Business Card (Classic)',
      code: 'TPZ-NFC-CLASSIC',
      description: 'Sleek matte finish PVC NFC business card with tap and QR capabilities.',
      price: 1499,
      gstPercentage: 18,
      features: ['NFC Instant Tap', 'Dynamic QR Code', 'Tapzy Cloud Profile', 'WhatsApp Direct', 'Google Reviews Embed']
    });

    const product2 = await Product.create({
      name: 'Tapzy Branded Custom NFC Card',
      code: 'TPZ-NFC-CUSTOM',
      description: 'Full custom design card with company logo, custom colors, matte UV print.',
      price: 2499,
      gstPercentage: 18,
      features: ['Custom Logo & Artwork', 'High Durability PVC', 'NFC & QR Code', 'Tapzy CRM Integration']
    });

    const product3 = await Product.create({
      name: 'Tapzy Executive Stainless Steel NFC Card',
      code: 'TPZ-NFC-METAL',
      description: 'Premium laser-engraved stainless steel metal NFC card for Executives & MDs.',
      price: 4999,
      gstPercentage: 18,
      features: ['Heavy Metal Finish', 'Laser Engraved Logo', 'Executive VIP Badge', 'Lifetime Profile Warranty']
    });

    console.log('[Seed Script] Created 3 Tapzy NFC Products');

    // 3. Create Campaigns
    const campaign1 = await Campaign.create({
      name: 'Tapzy CEO & Founder Outreach',
      description: 'Targeting CEOs, Founders and Managing Directors for executive digital networking.',
      targetJobTitles: ['CEO', 'Founder', 'Managing Director'],
      targetIndustries: ['Technology', 'Consulting', 'Real Estate'],
      targetLocations: ['Mumbai', 'Bengaluru', 'Delhi NCR'],
      leadScoreRequirement: 75,
      status: 'ACTIVE',
      createdBy: admin._id
    });

    const campaign2 = await Campaign.create({
      name: 'Tapzy Doctors & Medical Professionals',
      description: 'Targeting Senior Doctors, Clinic Owners & Hospital Directors across India.',
      targetJobTitles: ['Doctor', 'Surgeon', 'Clinic Owner', 'Consultant Physician'],
      targetIndustries: ['Healthcare', 'Medical Practice'],
      targetLocations: ['India'],
      leadScoreRequirement: 60,
      status: 'ACTIVE',
      createdBy: admin._id
    });

    const campaign3 = await Campaign.create({
      name: 'Tapzy Realtors & Wealth Consultants UAE',
      description: 'High-value outreach for Real Estate Brokers and Agency Owners in Dubai & Abu Dhabi.',
      targetJobTitles: ['Realtor', 'Real Estate Director', 'Brokerage Owner'],
      targetIndustries: ['Real Estate', 'Luxury Property'],
      targetLocations: ['Dubai', 'Abu Dhabi'],
      leadScoreRequirement: 70,
      status: 'ACTIVE',
      createdBy: admin._id
    });

    console.log('[Seed Script] Created 3 Campaigns');

    // 4. Create 10 Sample Leads
    const sampleLeadsData = [
      {
        firstName: 'Ananya',
        lastName: 'Roy',
        fullName: 'Ananya Roy',
        jobTitle: 'Founder & CEO',
        company: 'Vanguard Tech Solutions',
        industry: 'Information Technology',
        location: 'Bengaluru, India',
        linkedinUrl: 'https://linkedin.com/in/ananya-roy-vanguard',
        website: 'https://vanguardtech.io',
        email: 'ananya@vanguardtech.io',
        phone: '+919876543210',
        companySize: '50-200',
        potentialUseCase: 'Equipping leadership team with Tapzy NFC cards for international expos.',
        campaignId: campaign1._id,
        ownerId: salesBde._id,
        status: 'CONNECTED',
        notes: 'Met at Tech Summit. Expressed strong interest in NFC card tap demos.'
      },
      {
        firstName: 'Vikram',
        lastName: 'Singhania',
        fullName: 'Vikram Singhania',
        jobTitle: 'Managing Director',
        company: 'Singhania Capital Advisors',
        industry: 'Financial Services',
        location: 'Mumbai, India',
        linkedinUrl: 'https://linkedin.com/in/vikram-singhania-capital',
        website: 'https://singhaniacapital.com',
        email: 'vikram@singhaniacapital.com',
        phone: '+919988776655',
        companySize: '10-50',
        potentialUseCase: 'High-end metal finish NFC cards for wealth management directors.',
        campaignId: campaign1._id,
        ownerId: salesBde._id,
        status: 'QUALIFIED',
        notes: 'Wants branded metal cards for 15 senior partners.'
      },
      {
        firstName: 'Dr. Sameer',
        lastName: 'Kulkarni',
        fullName: 'Dr. Sameer Kulkarni',
        jobTitle: 'Chief Surgeon & Clinic Owner',
        company: 'Kulkarni Orthopedic Care',
        industry: 'Healthcare',
        location: 'Pune, India',
        linkedinUrl: 'https://linkedin.com/in/dr-sameer-kulkarni',
        website: 'https://kulkarniortho.com',
        email: 'dr.sameer@kulkarniortho.com',
        phone: '+919822012345',
        companySize: '1-10',
        potentialUseCase: 'Google review collection via Tapzy card QR tap at reception.',
        campaignId: campaign2._id,
        ownerId: salesBde._id,
        status: 'INTERESTED',
        notes: 'Interested in boosting clinic Google Reviews via Tapzy tap.'
      },
      {
        firstName: 'Tariq',
        lastName: 'Al-Mansoor',
        fullName: 'Tariq Al-Mansoor',
        jobTitle: 'Luxury Real Estate Director',
        company: 'Emirates Prime Properties',
        industry: 'Real Estate',
        location: 'Dubai, UAE',
        linkedinUrl: 'https://linkedin.com/in/tariq-almansoor-properties',
        website: 'https://emiratesprime.ae',
        email: 'tariq@emiratesprime.ae',
        phone: '+971501234567',
        companySize: '50-100',
        potentialUseCase: 'Distributing custom branded Tapzy cards to property agents in Dubai.',
        campaignId: campaign3._id,
        ownerId: salesBde._id,
        status: 'DEMO_SCHEDULED',
        notes: 'Demo scheduled for Friday 3 PM GST.'
      },
      {
        firstName: 'Priya',
        lastName: 'Mehta',
        fullName: 'Priya Mehta',
        jobTitle: 'Managing Partner & Consultant',
        company: 'Apex Growth Consultancy',
        industry: 'Management Consulting',
        location: 'Delhi NCR, India',
        linkedinUrl: 'https://linkedin.com/in/priya-mehta-apex',
        website: 'https://apexgrowth.in',
        email: 'priya@apexgrowth.in',
        phone: '+919811223344',
        companySize: '10-20',
        potentialUseCase: 'Direct WhatsApp and digital calendar sharing for client pitches.',
        campaignId: campaign1._id,
        ownerId: salesBde._id,
        status: 'MESSAGE_SENT',
        notes: 'Sent post-connection Tapzy introduction message.'
      },
      {
        firstName: 'Rohan',
        lastName: 'Deshmukh',
        fullName: 'Rohan Deshmukh',
        jobTitle: 'Head of Business Development',
        company: 'NextGen Robotics',
        industry: 'Industrial Automation',
        location: 'Hyderabad, India',
        linkedinUrl: 'https://linkedin.com/in/rohan-deshmukh-nextgen',
        website: 'https://nextgenrobotics.co',
        email: 'rohan@nextgenrobotics.co',
        phone: '+919700112233',
        companySize: '100-500',
        potentialUseCase: 'Exhibition sales team card upgrade.',
        campaignId: campaign1._id,
        ownerId: salesBde._id,
        status: 'READY_FOR_OUTREACH',
        notes: 'High lead score prospect.'
      },
      {
        firstName: 'Neha',
        lastName: 'Verma',
        fullName: 'Neha Verma',
        jobTitle: 'Creative Agency Owner',
        company: 'PixelCraft Digital Media',
        industry: 'Advertising & Marketing',
        location: 'Mumbai, India',
        linkedinUrl: 'https://linkedin.com/in/neha-verma-pixelcraft',
        website: 'https://pixelcraft.agency',
        email: 'neha@pixelcraft.agency',
        phone: '+919933445566',
        companySize: '10-50',
        potentialUseCase: 'Portfolio presentation via single tap.',
        campaignId: campaign1._id,
        ownerId: salesBde._id,
        status: 'NEW',
        notes: 'Imported from LinkedIn search list.'
      },
      {
        firstName: 'Adv. Rajesh',
        lastName: 'Tiwari',
        fullName: 'Adv. Rajesh Tiwari',
        jobTitle: 'Senior Partner',
        company: 'Tiwari & Associates Legal',
        industry: 'Legal Services',
        location: 'Kolkata, India',
        linkedinUrl: 'https://linkedin.com/in/adv-rajesh-tiwari',
        website: 'https://tiwarilegal.in',
        email: 'rajesh@tiwarilegal.in',
        phone: '+919833001122',
        companySize: '5-15',
        potentialUseCase: 'Professional contact card for court & bar council networking.',
        campaignId: campaign2._id,
        ownerId: salesBde._id,
        status: 'PROPOSAL_SENT',
        notes: 'Proposal sent for 10 custom metal cards.'
      },
      {
        firstName: 'Siddharth',
        lastName: 'Bhatia',
        fullName: 'Siddharth Bhatia',
        jobTitle: 'Co-Founder & CTO',
        company: 'FinStack AI',
        industry: 'Fintech',
        location: 'Bengaluru, India',
        linkedinUrl: 'https://linkedin.com/in/siddharth-bhatia-finstack',
        website: 'https://finstack.ai',
        email: 'siddharth@finstack.ai',
        phone: '+919844556677',
        companySize: '20-50',
        potentialUseCase: 'Smart NFC badge for company events.',
        campaignId: campaign1._id,
        ownerId: salesBde._id,
        status: 'WON',
        notes: 'Purchased 20 Custom Branded Tapzy NFC Cards!'
      },
      {
        firstName: 'Kavita',
        lastName: 'Nambiar',
        fullName: 'Kavita Nambiar',
        jobTitle: 'Keynote Speaker & Executive Coach',
        company: 'Leadership Excellence Hub',
        industry: 'Professional Training',
        location: 'Chennai, India',
        linkedinUrl: 'https://linkedin.com/in/kavita-nambiar-coach',
        website: 'https://kavitanambiar.com',
        email: 'kavita@kavitanambiar.com',
        phone: '+919840112233',
        companySize: '1-5',
        potentialUseCase: 'Sharing booking calendar and social links with seminar attendees.',
        campaignId: campaign1._id,
        ownerId: salesBde._id,
        status: 'FOLLOW_UP_1_DUE',
        notes: 'Awaiting reply after first follow up.'
      }
    ];

    const createdLeads = [];
    for (const leadItem of sampleLeadsData) {
      leadItem.leadId = `TPZ-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;
      const scoreRes = calculateLeadScore(leadItem);
      leadItem.leadScore = scoreRes.leadScore;
      leadItem.icpCategory = scoreRes.icpCategory;

      const created = await Lead.create(leadItem);
      createdLeads.push(created);
    }

    console.log(`[Seed Script] Created ${createdLeads.length} Sample Leads with AI scoring`);

    // 5. Create Sample Tasks
    const today = new Date();
    await Task.create([
      {
        taskId: 'TSK-100001',
        leadId: createdLeads[0]._id, // Ananya Roy
        campaignId: campaign1._id,
        taskType: 'MESSAGE',
        dueDate: today,
        priority: 'HIGH',
        assignedTo: salesBde._id,
        status: 'PENDING',
        notes: 'Send post-connection Tapzy intro message on LinkedIn.',
        isManual: true,
        manualReason: 'Manual action required – LinkedIn API does not provide messaging capability for this application.',
        manualActionUrl: createdLeads[0].linkedinUrl
      },
      {
        taskId: 'TSK-100002',
        leadId: createdLeads[2]._id, // Dr. Sameer
        campaignId: campaign2._id,
        taskType: 'DEMO',
        dueDate: today,
        priority: 'HIGH',
        assignedTo: salesBde._id,
        status: 'PENDING',
        notes: 'Present live Tapzy Google review tap demonstration.',
        isManual: false
      },
      {
        taskId: 'TSK-100003',
        leadId: createdLeads[3]._id, // Tariq Al-Mansoor
        campaignId: campaign3._id,
        taskType: 'CALL',
        dueDate: new Date(today.getTime() + 86400000),
        priority: 'HIGH',
        assignedTo: salesBde._id,
        status: 'PENDING',
        notes: 'Conduct product presentation call with Dubai brokerage team.',
        isManual: false
      },
      {
        taskId: 'TSK-100004',
        leadId: createdLeads[7]._id, // Adv Rajesh Tiwari
        campaignId: campaign2._id,
        taskType: 'PAYMENT',
        dueDate: new Date(today.getTime() + 172800000),
        priority: 'MEDIUM',
        assignedTo: salesBde._id,
        status: 'PENDING',
        notes: 'Follow up on payment link for 10 custom metal cards.',
        isManual: false
      },
      {
        taskId: 'TSK-100005',
        leadId: createdLeads[9]._id, // Kavita Nambiar
        campaignId: campaign1._id,
        taskType: 'FOLLOW_UP',
        dueDate: today,
        priority: 'MEDIUM',
        assignedTo: salesBde._id,
        status: 'PENDING',
        notes: 'Send Follow-up 1 template on LinkedIn.',
        isManual: true,
        manualReason: 'Manual action required – LinkedIn API messaging restricted.',
        manualActionUrl: createdLeads[9].linkedinUrl
      }
    ]);

    console.log('[Seed Script] Created 5 Sample Tasks');

    // 6. Create Sample Deals
    await Deal.create([
      {
        leadId: createdLeads[8]._id, // Siddharth Bhatia (Won)
        productId: product2._id,
        productName: product2.name,
        quantity: 20,
        price: 2499,
        discount: 4980, // bulk discount
        gstRate: 18,
        finalAmount: 53100,
        stage: 'WON',
        paymentStatus: 'PAID',
        salesOwnerId: salesBde._id,
        notes: 'Paid via razorpay online transfer.'
      },
      {
        leadId: createdLeads[7]._id, // Adv Rajesh Tiwari
        productId: product3._id,
        productName: product3.name,
        quantity: 10,
        price: 4999,
        discount: 4990,
        gstRate: 18,
        finalAmount: 53100,
        stage: 'PROPOSAL',
        paymentStatus: 'PENDING',
        salesOwnerId: salesBde._id,
        notes: 'Awaiting signature approval.'
      },
      {
        leadId: createdLeads[2]._id, // Dr. Sameer Kulkarni
        productId: product1._id,
        productName: product1.name,
        quantity: 3,
        price: 1499,
        discount: 0,
        gstRate: 18,
        finalAmount: 5306,
        stage: 'DEMO',
        paymentStatus: 'PENDING',
        salesOwnerId: salesBde._id,
        notes: 'Needs 3 cards for reception desk and senior doctors.'
      }
    ]);

    console.log('[Seed Script] Created 3 Sample Deals');
    console.log('[Seed Script] Database Seeding Completed Successfully! 🎉');
    process.exit(0);
  } catch (err) {
    console.error('[Seed Script Error]', err);
    process.exit(1);
  }
};

seedData();
