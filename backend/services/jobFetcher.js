// services/jobFetcher.js — Fetch live jobs from RapidAPI (JSearch)
const axios = require('axios');
const Job = require('../models/Job');
const logger = require('../utils/logger');

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST || 'jsearch.p.rapidapi.com';

// ---- Fetch from JSearch API (RapidAPI) ----
const fetchFromRapidAPI = async (query = 'software engineer', location = 'india', pages = 1) => {
  if (!RAPIDAPI_KEY || RAPIDAPI_KEY === 'your_rapidapi_key') {
    logger.warn('RapidAPI key not configured — seeding mock jobs instead');
    return await seedMockJobs();
  }

  try {
    const response = await axios.get('https://jsearch.p.rapidapi.com/search', {
      params: { query: `${query} in ${location}`, page: 1, num_pages: pages, date_posted: 'week' },
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': RAPIDAPI_HOST,
      },
      timeout: 10000,
    });

    const jobs = response.data?.data || [];
    const saved = [];

    for (const j of jobs) {
      try {
        const existing = await Job.findOne({ externalId: j.job_id });
        if (existing) continue;

        // Better salary formatting (Handle LPA for India)
        let formattedSalary = 'Not disclosed';
        if (j.job_min_salary && j.job_max_salary) {
          const isLPA = j.job_max_salary < 1000000 && j.job_country === 'IN';
          formattedSalary = isLPA 
            ? `₹${(j.job_min_salary/1000).toFixed(1)}–${(j.job_max_salary/1000).toFixed(1)} LPA`
            : `$${j.job_min_salary.toLocaleString()} – $${j.job_max_salary.toLocaleString()}`;
        }

        const newJob = await Job.create({
          title: j.job_title || 'Software Engineer',
          company: j.employer_name || 'Unknown Company',
          // Use Clearbit as backup for professional logos
          companyLogo: j.employer_logo || `https://logo.clearbit.com/${j.employer_name.split(' ')[0].toLowerCase()}.com`,
          companyColor: `hsl(${Math.floor(Math.random() * 360)}, 65%, 45%)`,
          companyEmoji: (j.employer_name || 'C')[0].toUpperCase(),
          description: j.job_description?.slice(0, 2000) || '',
          location: j.job_city || j.job_country || 'Remote',
          mode: j.job_is_remote ? 'remote' : 'onsite',
          applyUrl: j.job_apply_link || '#',
          platform: j.job_publisher?.toLowerCase().includes('linkedin') ? 'linkedin' :
            j.job_publisher?.toLowerCase().includes('indeed') ? 'indeed' : 'company',
          postedAt: j.job_posted_at_datetime_utc ? new Date(j.job_posted_at_datetime_utc) : new Date(),
          skills: extractSkillsFromDesc(j.job_description || ''),
          salary: formattedSalary,
          externalId: j.job_id,
          source: 'rapidapi',
          expLevel: guessExpLevel(j.job_description || '', j.job_title || ''),
          type: guessJobType(j.job_title || ''),
        });
        saved.push(newJob);
      } catch (saveErr) {
        // Skip duplicates
      }
    }

    logger.info(`Saved ${saved.length} new jobs from RapidAPI`);
    return saved;
  } catch (err) {
    logger.error(`RapidAPI fetch failed: ${err.message}`);
    return await seedMockJobs();
  }
};

const extractSkillsFromDesc = (desc) => {
  const keywords = [
    'React', 'Node.js', 'Python', 'JavaScript', 'TypeScript', 'Java', 'AWS', 'Docker',
    'Kubernetes', 'MongoDB', 'PostgreSQL', 'GraphQL', 'REST', 'Git', 'CI/CD',
    'Vue', 'Angular', 'Next.js', 'Django', 'Flask', 'Spring', 'Redis', 'Kafka',
  ];
  const upper = desc.toUpperCase();
  return keywords.filter(k => upper.includes(k.toUpperCase())).slice(0, 10);
};

const guessExpLevel = (desc, title) => {
  const combined = `${desc} ${title}`.toLowerCase();
  if (combined.includes('senior') || combined.includes('lead') || combined.includes('5+')) return 'senior';
  if (combined.includes('junior') || combined.includes('entry') || combined.includes('fresher') || combined.includes('graduate')) return 'junior';
  if (combined.includes('mid') || combined.includes('3+') || combined.includes('experienced')) return 'mid';
  return 'mid';
};

const guessJobType = (title) => {
  const t = title.toLowerCase();
  if (t.includes('front')) return 'frontend';
  if (t.includes('back')) return 'backend';
  if (t.includes('full')) return 'fullstack';
  if (t.includes('data')) return 'data';
  if (t.includes('ml') || t.includes('machine')) return 'ml';
  if (t.includes('devops') || t.includes('sre')) return 'devops';
  if (t.includes('design') || t.includes('ux') || t.includes('ui')) return 'designer';
  if (t.includes('product') || t.includes('pm')) return 'product';
  return 'fullstack';
};

// ---- Seed mock jobs when API is unavailable ----
const seedMockJobs = async () => {
  const count = await Job.countDocuments();
  if (count >= 20) return []; // Already seeded

  const mockJobs = [
    { title: 'Senior Frontend Developer', company: 'Google', companyColor: '#4285F4', companyEmoji: 'G', location: 'Bangalore, India', mode: 'hybrid', platform: 'linkedin', salary: '₹35–55 LPA', skills: ['React', 'TypeScript', 'GraphQL', 'Next.js', 'CSS'], expLevel: 'senior', type: 'frontend', applyUrl: 'https://careers.google.com', description: 'Build next-gen web experiences at scale for billions of users worldwide.', postedAt: new Date(Date.now() - 2 * 3600000) },
    { title: 'Full Stack Engineer', company: 'Razorpay', companyColor: '#2D81FF', companyEmoji: 'R', location: 'Bangalore, India', mode: 'hybrid', platform: 'wellfound', salary: '₹25–40 LPA', skills: ['Node.js', 'React', 'PostgreSQL', 'Redis', 'AWS'], expLevel: 'mid', type: 'fullstack', applyUrl: 'https://razorpay.com/jobs', description: 'Power India\'s fintech revolution with high-scale payment systems.', postedAt: new Date(Date.now() - 5 * 3600000) },
    { title: 'ML Engineer', company: 'Flipkart', companyColor: '#F74E00', companyEmoji: 'F', location: 'Bangalore, India', mode: 'onsite', platform: 'naukri', salary: '₹30–50 LPA', skills: ['Python', 'TensorFlow', 'PyTorch', 'Spark', 'AWS', 'Kubernetes'], expLevel: 'senior', type: 'ml', applyUrl: 'https://www.flipkartcareers.com', description: 'Build recommendation systems and search algorithms for 500M+ SKUs.', postedAt: new Date(Date.now() - 8 * 3600000) },
    { title: 'Backend Developer', company: 'CRED', companyColor: '#1C1C1C', companyEmoji: 'C', location: 'Bangalore, India', mode: 'hybrid', platform: 'linkedin', salary: '₹20–35 LPA', skills: ['Java', 'Spring Boot', 'Kafka', 'MongoDB', 'Docker'], expLevel: 'mid', type: 'backend', applyUrl: 'https://careers.cred.club', description: 'Scale our credit management platform to 10 million+ premium members.', postedAt: new Date(Date.now() - 12 * 3600000) },
    { title: 'DevOps Engineer', company: 'Zerodha', companyColor: '#387ED1', companyEmoji: 'Z', location: 'Bangalore, India', mode: 'onsite', platform: 'company', salary: '₹18–28 LPA', skills: ['Kubernetes', 'Docker', 'Terraform', 'AWS', 'CI/CD', 'Linux'], expLevel: 'mid', type: 'devops', applyUrl: 'https://zerodha.com/careers', description: 'Maintain infrastructure for India\'s largest stock broker serving 10M+ traders.', postedAt: new Date(Date.now() - 1 * 3600000) },
    { title: 'Frontend Developer', company: 'Swiggy', companyColor: '#FC8019', companyEmoji: 'S', location: 'Bangalore, India', mode: 'hybrid', platform: 'linkedin', salary: '₹15–25 LPA', skills: ['React', 'JavaScript', 'CSS', 'Redux', 'Webpack'], expLevel: 'junior', type: 'frontend', applyUrl: 'https://careers.swiggy.com', description: 'Build delightful food ordering experiences used by millions daily.', postedAt: new Date(Date.now() - 24 * 3600000) },
    { title: 'Data Scientist', company: 'PhonePe', companyColor: '#5F259F', companyEmoji: 'P', location: 'Bangalore, India', mode: 'remote', platform: 'wellfound', salary: '₹22–38 LPA', skills: ['Python', 'Machine Learning', 'SQL', 'Pandas', 'Scikit-learn'], expLevel: 'mid', type: 'data', applyUrl: 'https://phonepe.com/careers', description: 'Drive data-driven decisions for India\'s leading UPI payment platform.', postedAt: new Date(Date.now() - 3 * 3600000) },
    { title: 'Software Engineer II', company: 'Microsoft', companyColor: '#00A4EF', companyEmoji: 'M', location: 'Hyderabad, India', mode: 'hybrid', platform: 'linkedin', salary: '₹40–65 LPA', skills: ['C#', 'Azure', 'TypeScript', 'React', 'Kubernetes', 'SQL'], expLevel: 'mid', type: 'fullstack', applyUrl: 'https://careers.microsoft.com', description: 'Build cloud-scale products used by over 1 billion people worldwide.', postedAt: new Date(Date.now() - 6 * 3600000) },
    { title: 'Software Engineer (Remote)', company: 'GitLab', companyColor: '#FC6D26', companyEmoji: 'G', location: 'Remote', mode: 'remote', platform: 'company', salary: '$90K–$130K', skills: ['Ruby', 'Rails', 'PostgreSQL', 'Go', 'Vue.js', 'Kubernetes'], expLevel: 'mid', type: 'fullstack', applyUrl: 'https://about.gitlab.com/jobs', description: 'Work fully remote at an all-remote company powering DevOps for millions.', postedAt: new Date(Date.now() - 4 * 3600000) },
    { title: 'React Native Developer', company: 'Meesho', companyColor: '#9C27B0', companyEmoji: 'M', location: 'Bangalore, India', mode: 'hybrid', platform: 'naukri', salary: '₹15–28 LPA', skills: ['React Native', 'JavaScript', 'TypeScript', 'Redux', 'iOS', 'Android'], expLevel: 'junior', type: 'frontend', applyUrl: 'https://careers.meesho.com', description: 'Build mobile apps empowering 140 million SMBs across India.', postedAt: new Date(Date.now() - 18 * 3600000) },
    { title: 'Senior Backend Engineer', company: 'Stripe', companyColor: '#635BFF', companyEmoji: 'S', location: 'Remote', mode: 'remote', platform: 'company', salary: '$150K–$220K', skills: ['Ruby', 'Java', 'Go', 'Kafka', 'AWS', 'PostgreSQL', 'Kubernetes'], expLevel: 'senior', type: 'backend', applyUrl: 'https://stripe.com/jobs', description: 'Build the economic infrastructure of the internet at global scale.', postedAt: new Date(Date.now() - 10 * 3600000) },
    { title: 'Product Manager', company: 'Ola', companyColor: '#25D366', companyEmoji: 'O', location: 'Bangalore, India', mode: 'onsite', platform: 'linkedin', salary: '₹25–45 LPA', skills: ['Product Strategy', 'Analytics', 'Agile', 'SQL', 'User Research'], expLevel: 'mid', type: 'product', applyUrl: 'https://ola.careers', description: 'Lead product development for mobility solutions across 250+ cities.', postedAt: new Date(Date.now() - 15 * 3600000) },
    { title: 'UI/UX Designer', company: 'Zomato', companyColor: '#E23744', companyEmoji: 'Z', location: 'Gurugram, India', mode: 'hybrid', platform: 'wellfound', salary: '₹12–22 LPA', skills: ['Figma', 'Sketch', 'User Research', 'Prototyping', 'Design Systems'], expLevel: 'mid', type: 'designer', applyUrl: 'https://www.zomato.com/careers', description: 'Design beautiful food discovery experiences for 80M+ monthly active users.', postedAt: new Date(Date.now() - 20 * 3600000) },
    { title: 'Cloud Architect', company: 'Infosys', companyColor: '#007CC3', companyEmoji: 'I', location: 'Mumbai, India', mode: 'hybrid', platform: 'naukri', salary: '₹28–50 LPA', skills: ['AWS', 'Azure', 'GCP', 'Kubernetes', 'Terraform', 'Python'], expLevel: 'senior', type: 'devops', applyUrl: 'https://www.infosys.com/careers', description: 'Architect cloud solutions for Fortune 500 clients across industries.', postedAt: new Date(Date.now() - 48 * 3600000) },
    { title: 'Fresher Software Developer', company: 'TCS', companyColor: '#1B3A82', companyEmoji: 'T', location: 'Pan India', mode: 'onsite', platform: 'naukri', salary: '₹3.5–7 LPA', skills: ['Java', 'Python', 'SQL', 'Git', 'OOP'], expLevel: 'fresher', type: 'fullstack', applyUrl: 'https://www.tcs.com/careers', description: 'Graduate hiring program for exceptional engineering freshers across India.', postedAt: new Date(Date.now() - 72 * 3600000) },
  ];

  const inserted = [];
  for (const j of mockJobs) {
    const exists = await Job.findOne({ title: j.title, company: j.company });
    if (!exists) {
      const job = await Job.create({ ...j, source: 'internal', isActive: true });
      inserted.push(job);
    }
  }

  logger.info(`Seeded ${inserted.length} mock jobs`);
  return inserted;
};

module.exports = { fetchFromRapidAPI, seedMockJobs };
