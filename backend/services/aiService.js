// services/aiService.js — OpenAI integration
const OpenAI = require('openai');
const logger = require('../utils/logger');

let openai = null;

const getClient = () => {
  if (!openai) {
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'sk-your-openai-api-key') {
      return null; // Fall back to mock responses
    }
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openai;
};

// ---- Helper: call GPT or return mock ----
const callGPT = async (systemPrompt, userPrompt, mockResponse) => {
  const client = getClient();
  if (!client) {
    logger.warn('OpenAI not configured — returning mock response');
    return mockResponse;
  }
  try {
    const response = await client.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 1500,
      temperature: 0.7,
    });
    return response.choices[0].message.content.trim();
  } catch (err) {
    logger.error(`OpenAI error: ${err.message}`);
    return mockResponse;
  }
};

// ---- Optimize Resume ----
const optimizeResume = async (resumeText, jobDescription) => {
  const systemPrompt = `You are an expert resume coach and ATS optimization specialist. 
Analyze the resume against the job description and provide specific, actionable improvements.`;

  const userPrompt = `Resume:\n${resumeText.slice(0, 2000)}\n\nJob Description:\n${jobDescription.slice(0, 1000)}\n\n
Provide:
1. ATS Score (0-100)
2. Top 5 missing keywords to add
3. 3 specific bullet point rewrites
4. Summary optimization tip
Format as JSON with keys: atsScore, missingKeywords, bulletRewrites, summaryTip`;

  const mockResponse = JSON.stringify({
    atsScore: 72,
    missingKeywords: ['TypeScript', 'CI/CD', 'Docker', 'Agile', 'REST APIs'],
    bulletRewrites: [
      'Before: "Worked on web apps" → After: "Built 3 production React applications serving 10K+ users, reducing load time by 40%"',
      'Before: "Used Node.js" → After: "Architected RESTful APIs with Node.js/Express handling 50K daily requests"',
      'Before: "Fixed bugs" → After: "Resolved 120+ critical bugs, improving system stability by 35% and reducing downtime"',
    ],
    summaryTip: 'Add quantifiable achievements in your summary. Mention specific technologies from the job posting.',
  });

  return await callGPT(systemPrompt, userPrompt, mockResponse);
};

// ---- Generate Cover Letter ----
const generateCoverLetter = async ({ name, company, role, jobDescription, tone, skillsSummary, experience }) => {
  const systemPrompt = `You are an expert career coach who writes compelling, personalized cover letters that get interviews.
Write in a ${tone} tone. Be specific, concise, and impactful. No generic filler.`;

  const userPrompt = `Write a cover letter for:
Applicant: ${name}
Applying to: ${role} at ${company}
Experience: ${experience}
Key Skills: ${skillsSummary}
Job Requirements: ${jobDescription.slice(0, 800)}

Format: 3 paragraphs. Opening hook, skills match, closing with enthusiasm.`;

  const mockResponse = `Dear Hiring Manager,

I'm excited to apply for the ${role} position at ${company}. With ${experience} of hands-on experience in ${skillsSummary.split(',')[0]} and a proven track record of delivering scalable solutions, I'm confident I can make an immediate impact on your team.

My background aligns closely with your requirements. I've built production-grade applications that have served thousands of users, optimized systems for performance and reliability, and collaborated effectively in cross-functional teams. My expertise in ${skillsSummary.split(',').slice(0, 3).join(', ')} directly addresses the core needs of this role.

I'm particularly drawn to ${company}'s innovative approach and would love the opportunity to discuss how my skills can contribute to your mission. Thank you for considering my application — I look forward to the conversation.

Best regards,
${name}`;

  return await callGPT(systemPrompt, userPrompt, mockResponse);
};

// ---- Generate Interview Prep (Real-Time AI) ----
const generateInterviewPrep = async ({ role, company, jobDescription, skills, difficulty }) => {
  const systemPrompt = `You are an expert technical recruiter and researcher. 
Generate a comprehensive 5-round interview preparation guide for the role of ${role} at ${company}. 
Be specific to ${company}'s known interview style and tech stack.`;

  const userPrompt = `Generate a prep guide for:
Role: ${role} at ${company}
Candidate Skills: ${skills}
Difficulty Level: ${difficulty}
Job Context: ${jobDescription?.slice(0, 1000) || 'N/A'}

Format the output as a clean JSON object with these keys:
- aboutCompany: A snapshot of ${company}'s business, culture, and tech stack.
- rolePrep: Specific technical domains or system designs to master for this role.
- technical: 5 advanced technical questions with expert model answers.
- coding: 3 coding/algo challenges (LeetCode style) relevant to ${company}'s stack.
- hrRound: 4 behavioral questions (STAR method) focused on their core values.
- insiderTips: 3 Pro-tips for succeeding in their specific interview process.`;

  const mockResponse = JSON.stringify({
    aboutCompany: `${company} is a leader in its space, prioritizing scalability and user experience. They utilize a modern stack including ${skills?.split(',')[0] || 'Cloud'} and are known for a rigorous engineering culture.`,
    rolePrep: `Brush up on system design, microservices architecture, and deep-dives into ${role} patterns.`,
    technical: [
      { q: "How would you handle a sudden 10x spike in traffic?", a: "Implement horizontal scaling, caching layers (Redis), and leverage CDN caching for static assets." },
      { q: "What are the trade-offs of using NoSQL vs SQL for this application?", a: "SQL provides ACID compliance for payments; NoSQL provides schema flexibility for rapid iteration on user profiles." }
    ],
    coding: [
      { q: "Implement a rate limiter for our API.", a: "Use a Token Bucket or Leaky Bucket algorithm with Redis for distributed state." },
      { q: "Find the shortest path in a dynamic grid.", a: "Use BFS or Dijkstra's depending on edge weights." }
    ],
    hrRound: [
      { q: "Tell me about a time you had a conflict with a lead.", a: "Focus on professional communication, de-escalation, and finding a data-driven middle ground." },
      { q: "Why this company?", a: "Research their latest product launch and align it with your career growth." }
    ],
    insiderTips: ["They love candidates who ask technical questions about their architecture.", "Expect a 'culture-fit' round with a senior director.", "Write clean, modular code during the technical screen."]
  });

  const resultStr = await callGPT(systemPrompt, userPrompt, mockResponse);
  try {
    return JSON.parse(resultStr);
  } catch (e) {
    logger.error('Failed to parse AI Prep JSON, returning mock data');
    return JSON.parse(mockResponse);
  }
};

// ---- AI Chat ----
const chat = async (message, history, userContext) => {
  const systemPrompt = `You are an expert AI career assistant for job.bar platform. 
You help ${userContext.name} (a ${userContext.jobTitle} with ${userContext.yearsOfExperience} years experience, skilled in ${userContext.skills}) with their job search.
Be concise, specific, and actionable. Format responses clearly.`;

  const mockReplies = [
    `Great question! Based on your skills in ${userContext.skills.split(',')[0]}, I'd recommend focusing on roles at companies like Google, Meta, or startups in the fintech/edtech space. Your profile is strong — make sure your resume highlights quantifiable impact.`,
    `For your next step, I'd suggest: 1) Add a strong project to your portfolio that showcases ${userContext.skills.split(',')[0]} 2) Reach out to 5 recruiters on LinkedIn today 3) Apply to at least 3 "stretch" roles. Quality applications beat quantity.`,
    `That's a common challenge. Here's my advice: tailor your resume for each application using keywords from the job description, follow up after 7 days with a brief personalized note, and leverage your network — referred candidates have 5x higher interview rates.`,
  ];

  const client = getClient();
  if (!client) {
    return mockReplies[Math.floor(Math.random() * mockReplies.length)];
  }

  try {
    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-10).map(h => ({ role: h.role, content: h.content })),
      { role: 'user', content: message },
    ];

    const response = await client.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages,
      max_tokens: 600,
      temperature: 0.8,
    });

    return response.choices[0].message.content.trim();
  } catch (err) {
    logger.error(`AI Chat error: ${err.message}`);
    return mockReplies[0];
  }
};

// ---- Analyze Job Fit ----
const analyzeJobFit = async ({ jobTitle, company, jobDescription, requiredSkills, userSkills, matchingSkills, missingSkills, matchScore }) => {
  const mockAnalysis = {
    verdict: matchScore >= 80 ? 'Strong Match' : matchScore >= 60 ? 'Good Match' : 'Partial Match',
    summary: `Your profile is a ${matchScore}% match for ${jobTitle} at ${company}. You match ${matchingSkills.length} of ${requiredSkills.length} required skills.`,
    strengths: matchingSkills.slice(0, 3).map(s => `✅ Your ${s} experience is directly applicable`),
    gaps: missingSkills.slice(0, 3).map(s => `⚡ Learn ${s} — 1-2 weeks to get started via free resources`),
    recommendation: matchScore >= 70 ? 'Apply immediately and tailor your resume to highlight matching skills.' : 'Apply anyway — candidates rarely meet 100% of requirements. Focus your cover letter on transferable skills.',
  };

  return mockAnalysis;
};

module.exports = {
  optimizeResume,
  generateCoverLetter,
  generateInterviewPrep,
  chat,
  analyzeJobFit,
};
