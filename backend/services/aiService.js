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

// ---- Generate Interview Prep ----
const generateInterviewPrep = async ({ role, company, jobDescription, skills, difficulty }) => {
  const systemPrompt = `You are an expert technical interviewer at a top tech company. 
Generate realistic, role-specific interview questions with detailed model answers.`;

  const userPrompt = `Generate interview prep for:
Role: ${role} at ${company}
Skills: ${skills}
Difficulty: ${difficulty}
Job context: ${jobDescription.slice(0, 500)}

Provide:
1. 5 technical questions with answers
2. 3 behavioral questions (STAR format answers)
3. 2 questions to ask the interviewer
Format as JSON: { technical: [...], behavioral: [...], toAsk: [...] }`;

  const mockResponse = JSON.stringify({
    technical: [
      {
        q: `Explain the difference between REST and GraphQL. When would you use each?`,
        a: `REST uses fixed endpoints and HTTP methods for CRUD operations — simple and cacheable. GraphQL uses a single endpoint where clients specify exactly what data they need, eliminating over/under-fetching. Use REST for simple public APIs; use GraphQL for complex, data-heavy apps with multiple client types.`,
      },
      {
        q: `How do you handle state management in large React applications?`,
        a: `For local UI state: useState/useReducer. For server state: React Query or SWR (caching, sync). For global client state: Zustand or Redux Toolkit. The key is keeping state as close to its usage as possible and avoiding over-centralization.`,
      },
      {
        q: `Describe your approach to optimizing a slow database query.`,
        a: `First, use EXPLAIN to identify bottlenecks. Add indexes on filtered/sorted columns. Review N+1 query patterns — use JOINs or eager loading. Consider pagination, query caching, and denormalization for read-heavy data. Monitor with slow query logs.`,
      },
      {
        q: `What's your approach to writing maintainable code?`,
        a: `Follow SOLID principles, write self-documenting code with clear naming, keep functions small and single-purpose, write tests first (TDD), use consistent patterns, document the "why" not the "what," and review code with the next developer in mind.`,
      },
      {
        q: `How would you design a URL shortener like bit.ly?`,
        a: `Use base62 encoding for short codes. Store {shortCode → longURL} in Redis (cache) + PostgreSQL (persistence). Use a counter or UUID for uniqueness. CDN for high-traffic reads. Rate limiting per IP. Track click analytics asynchronously via a queue.`,
      },
    ],
    behavioral: [
      {
        q: `Tell me about a time you dealt with a difficult technical challenge under tight deadlines.`,
        a: `STAR: In my last role, our payment integration broke 2 days before launch. I systematically isolated the issue to an API rate limit conflict. I implemented exponential backoff, added retry logic, and deployed a hotfix within 4 hours. The launch succeeded on time with zero payment failures.`,
      },
      {
        q: `Describe a situation where you had to learn something completely new quickly.`,
        a: `When we migrated to Kubernetes, I had no prior experience. I dedicated evenings to the official docs and built a test cluster. Within 2 weeks I containerized our 3 main services and wrote the deployment manifests, cutting deployment time by 60%.`,
      },
      {
        q: `How do you handle disagreements with your team about technical decisions?`,
        a: `I believe in data over opinions. I prepare a structured comparison of approaches with trade-offs, share it async for team review, then discuss synchronously. If we're still split, I defer to the most affected team member's judgment while documenting the decision rationale.`,
      },
    ],
    toAsk: [
      `What does success look like for this role in the first 90 days?`,
      `What are the biggest technical challenges the team is currently facing?`,
    ],
  });

  return await callGPT(systemPrompt, userPrompt, mockResponse);
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
