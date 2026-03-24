// services/resumeParser.js — Parse PDF/DOCX and extract data
const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const logger = require('../utils/logger');

// ---- Extract raw text from file ----
const extractText = async (filePath, mimeType) => {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === '.pdf' || mimeType === 'application/pdf') {
    const buffer = fs.readFileSync(filePath);
    const data = await pdfParse(buffer);
    return data.text;
  }

  if (ext === '.docx' || ext === '.doc' ||
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  }

  throw new Error('Unsupported file type');
};

// ---- Extract email ----
const extractEmail = (text) => {
  const match = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  return match ? match[1] : '';
};

// ---- Extract phone ----
const extractPhone = (text) => {
  const match = text.match(/(\+?\d[\d\s\-().]{7,15}\d)/);
  return match ? match[1].trim() : '';
};

// ---- Extract LinkedIn ----
const extractLinkedIn = (text) => {
  const match = text.match(/linkedin\.com\/in\/([a-zA-Z0-9\-_]+)/i);
  return match ? `https://linkedin.com/in/${match[1]}` : '';
};

// ---- Extract skills from text ----
const SKILL_KEYWORDS = [
  // Languages
  'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'Go', 'Rust', 'Ruby', 'PHP', 'Swift', 'Kotlin',
  // Frontend
  'React', 'Vue', 'Angular', 'Next.js', 'Nuxt', 'Svelte', 'HTML', 'CSS', 'SASS', 'Tailwind', 'Bootstrap',
  // Backend
  'Node.js', 'Express', 'Django', 'FastAPI', 'Flask', 'Spring Boot', 'Laravel', 'Rails', 'NestJS',
  // Database
  'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Firebase', 'DynamoDB', 'SQLite', 'Elasticsearch',
  // Cloud & DevOps
  'AWS', 'GCP', 'Azure', 'Docker', 'Kubernetes', 'CI/CD', 'GitHub Actions', 'Jenkins', 'Terraform', 'Linux',
  // Data & AI
  'TensorFlow', 'PyTorch', 'Pandas', 'NumPy', 'Scikit-learn', 'OpenAI', 'LangChain', 'Spark', 'Hadoop',
  // Tools
  'Git', 'REST API', 'GraphQL', 'Socket.io', 'RabbitMQ', 'Kafka', 'Nginx', 'Webpack', 'Vite',
  // Soft concepts
  'Agile', 'Scrum', 'Microservices', 'System Design', 'OOP', 'TDD', 'Clean Code',
];

const extractSkills = (text) => {
  const upper = text.toUpperCase();
  return SKILL_KEYWORDS.filter(skill => upper.includes(skill.toUpperCase()));
};

// ---- Extract years of experience ----
const extractYearsOfExperience = (text) => {
  const matches = [
    ...text.matchAll(/(\d+)\+?\s*years?\s*(?:of\s*)?(?:experience|exp)/gi),
    ...text.matchAll(/experience[:\s]+(\d+)\+?\s*years?/gi),
  ];

  if (matches.length > 0) {
    const years = matches.map(m => parseInt(m[1]));
    return Math.max(...years);
  }
  return 0;
};

// ---- Extract sections (experience, education) ----
const extractSections = (text) => {
  const experience = [];
  const education = [];
  const projects = [];

  // Basic heuristic: look for patterns
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  let currentSection = '';
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();

    if (line.match(/^(work\s+)?experience|employment|professional\s+background/i)) {
      currentSection = 'experience';
    } else if (line.match(/^education|academic|qualification/i)) {
      currentSection = 'education';
    } else if (line.match(/^projects?|portfolio/i)) {
      currentSection = 'projects';
    }

    if (currentSection === 'experience' && lines[i].length > 20) {
      // Try to detect company/role pattern
      const yearMatch = lines[i].match(/\b(20\d\d)\b/);
      if (yearMatch && experience.length < 5) {
        experience.push({
          company: lines[i - 1] || 'Company',
          role: lines[i] || 'Role',
          duration: lines[i].match(/\d{4}/g)?.join(' – ') || '',
          description: lines[i + 1] || '',
        });
      }
    }

    if (currentSection === 'education' && lines[i].length > 15) {
      const yearMatch = lines[i].match(/\b(20\d\d|19\d\d)\b/);
      if (yearMatch && education.length < 3) {
        education.push({
          institution: lines[i - 1] || '',
          degree: lines[i] || '',
          year: yearMatch[0],
          gpa: '',
        });
      }
    }
  }

  return { experience, education, projects };
};

// ---- ATS Score ----
const computeATSScore = (parsedData) => {
  let score = 0;
  if (parsedData.email) score += 10;
  if (parsedData.phone) score += 10;
  if (parsedData.skills?.length >= 5) score += 20;
  if (parsedData.skills?.length >= 10) score += 10;
  if (parsedData.experience?.length >= 1) score += 20;
  if (parsedData.education?.length >= 1) score += 10;
  if (parsedData.summary) score += 10;
  if (parsedData.totalYearsExperience > 0) score += 10;
  return Math.min(score, 100);
};

// ---- Main parse function ----
const parse = async (filePath, mimeType) => {
  try {
    const rawText = await extractText(filePath, mimeType);
    const skills = extractSkills(rawText);
    const email = extractEmail(rawText);
    const phone = extractPhone(rawText);
    const yearsExp = extractYearsOfExperience(rawText);
    const { experience, education, projects } = extractSections(rawText);

    // Extract name (first non-empty line heuristic)
    const lines = rawText.split('\n').map(l => l.trim()).filter(l => l);
    const name = lines[0]?.length < 60 ? lines[0] : '';

    const parsedData = {
      name,
      email,
      phone,
      linkedin: extractLinkedIn(rawText),
      summary: lines.slice(1, 4).join(' ').slice(0, 300),
      skills,
      experience,
      education,
      projects,
      certifications: [],
      languages: [],
      totalYearsExperience: yearsExp,
      rawText: rawText.slice(0, 5000),
    };

    const atsScore = computeATSScore(parsedData);

    const suggestions = [];
    if (skills.length < 5) suggestions.push('Add more technical skills to improve ATS matching');
    if (!email) suggestions.push('Ensure your email is clearly visible');
    if (!phone) suggestions.push('Add your phone number');
    if (experience.length === 0) suggestions.push('Add work experience sections with dates');
    if (!parsedData.summary) suggestions.push('Add a professional summary at the top');

    return {
      ...parsedData,
      atsScore,
      completenessScore: Math.min(100, (Object.values(parsedData).filter(v => v && (Array.isArray(v) ? v.length > 0 : true)).length / 10) * 100),
      suggestions,
    };
  } catch (err) {
    logger.error(`Resume parse error: ${err.message}`);
    return {
      name: '', email: '', phone: '', skills: [], experience: [], education: [],
      atsScore: 0, completenessScore: 0,
      suggestions: ['Resume parsing failed. Please ensure the file is not password-protected.'],
    };
  }
};

module.exports = { parse };
