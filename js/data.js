/* =============================================
   job.bar — Data Store
   Mock job listings, applications, and user data
   ============================================= */

const JOB_COMPANIES = [
  { name: 'Google', color: '#4285F4', emoji: 'G', platform: 'linkedin' },
  { name: 'Microsoft', color: '#00A4EF', emoji: 'M', platform: 'linkedin' },
  { name: 'Amazon', color: '#FF9900', emoji: 'A', platform: 'indeed' },
  { name: 'Meta', color: '#1877F2', emoji: 'f', platform: 'linkedin' },
  { name: 'Apple', color: '#555', emoji: '', platform: 'company' },
  { name: 'Netflix', color: '#E50914', emoji: 'N', platform: 'wellfound' },
  { name: 'Stripe', color: '#635BFF', emoji: 'S', platform: 'wellfound' },
  { name: 'Salesforce', color: '#00A1E0', emoji: 'SF', platform: 'naukri' },
  { name: 'Adobe', color: '#FF0000', emoji: 'Ai', platform: 'linkedin' },
  { name: 'Spotify', color: '#1DB954', emoji: '♪', platform: 'wellfound' },
  { name: 'Uber', color: '#000', emoji: 'U', platform: 'indeed' },
  { name: 'Airbnb', color: '#FF5A5F', emoji: '⌂', platform: 'linkedin' },
  { name: 'Twitter/X', color: '#1DA1F2', emoji: 'X', platform: 'linkedin' },
  { name: 'LinkedIn', color: '#0A66C2', emoji: 'in', platform: 'linkedin' },
  { name: 'Flipkart', color: '#2874F0', emoji: 'F', platform: 'naukri' },
  { name: 'Zomato', color: '#CB202D', emoji: 'Z', platform: 'naukri' },
  { name: 'PhonePe', color: '#5f259f', emoji: 'P', platform: 'naukri' },
  { name: 'CRED', color: '#1B1B2F', emoji: 'C', platform: 'wellfound' },
  { name: 'Razorpay', color: '#3395FF', emoji: 'R', platform: 'wellfound' },
  { name: 'Swiggy', color: '#FC8019', emoji: 'S', platform: 'naukri' },
  { name: 'Notion', color: '#000', emoji: 'N', platform: 'wellfound' },
  { name: 'Figma', color: '#F24E1E', emoji: 'F', platform: 'wellfound' },
  { name: 'Atlassian', color: '#0052CC', emoji: 'A', platform: 'linkedin' },
  { name: 'Shopify', color: '#96BF48', emoji: 'S', platform: 'linkedin' },
  { name: 'Infosys', color: '#007CC2', emoji: 'I', platform: 'naukri' },
  { name: 'TCS', color: '#003087', emoji: 'T', platform: 'naukri' },
  { name: 'Wipro', color: '#342D6E', emoji: 'W', platform: 'naukri' },
  { name: 'HCL Tech', color: '#0076CE', emoji: 'H', platform: 'naukri' },
  { name: 'Paytm', color: '#00BCD4', emoji: 'P', platform: 'naukri' },
  { name: 'Byju\'s', color: '#7B3FBE', emoji: 'B', platform: 'company' },
];

const ROLES = [
  { title: 'Software Engineer', type: 'fullstack', exp: ['fresher','junior','mid'] },
  { title: 'Frontend Developer', type: 'frontend', exp: ['fresher','junior','mid','senior'] },
  { title: 'Backend Developer', type: 'backend', exp: ['junior','mid','senior'] },
  { title: 'Full Stack Developer', type: 'fullstack', exp: ['junior','mid','senior'] },
  { title: 'React Developer', type: 'frontend', exp: ['fresher','junior','mid'] },
  { title: 'Node.js Developer', type: 'backend', exp: ['junior','mid'] },
  { title: 'Data Scientist', type: 'data', exp: ['junior','mid','senior'] },
  { title: 'ML Engineer', type: 'ml', exp: ['junior','mid','senior'] },
  { title: 'DevOps Engineer', type: 'devops', exp: ['junior','mid','senior'] },
  { title: 'UI/UX Designer', type: 'designer', exp: ['fresher','junior','mid'] },
  { title: 'Product Manager', type: 'product', exp: ['junior','mid','senior'] },
  { title: 'Android Developer', type: 'frontend', exp: ['junior','mid'] },
  { title: 'iOS Developer', type: 'frontend', exp: ['junior','mid'] },
  { title: 'Python Developer', type: 'backend', exp: ['fresher','junior','mid'] },
  { title: 'Java Developer', type: 'backend', exp: ['junior','mid','senior'] },
  { title: 'Cloud Engineer', type: 'devops', exp: ['junior','mid','senior'] },
  { title: 'Security Engineer', type: 'devops', exp: ['mid','senior'] },
  { title: 'AI Research Intern', type: 'ml', exp: ['fresher'] },
  { title: 'SDE-1', type: 'fullstack', exp: ['fresher','junior'] },
  { title: 'SDE-2', type: 'fullstack', exp: ['mid'] },
  { title: 'Senior Software Engineer', type: 'fullstack', exp: ['senior'] },
  { title: 'Technical Lead', type: 'fullstack', exp: ['senior'] },
];

const LOCATIONS = [
  { city: 'Bangalore', mode: 'hybrid' },
  { city: 'Bangalore', mode: 'remote' },
  { city: 'Mumbai', mode: 'onsite' },
  { city: 'Hyderabad', mode: 'hybrid' },
  { city: 'Pune', mode: 'hybrid' },
  { city: 'Delhi NCR', mode: 'hybrid' },
  { city: 'Chennai', mode: 'onsite' },
  { city: 'Remote, India', mode: 'remote' },
  { city: 'San Francisco, USA', mode: 'hybrid' },
  { city: 'New York, USA', mode: 'hybrid' },
  { city: 'London, UK', mode: 'hybrid' },
  { city: 'Remote, Worldwide', mode: 'remote' },
];

const SKILL_SETS = {
  frontend: ['React', 'Vue.js', 'Angular', 'TypeScript', 'Next.js', 'CSS', 'Tailwind', 'GraphQL', 'Redux', 'HTML5'],
  backend: ['Node.js', 'Python', 'Java', 'Go', 'Express', 'FastAPI', 'Spring Boot', 'PostgreSQL', 'MongoDB', 'Redis'],
  fullstack: ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'AWS', 'Docker', 'GraphQL', 'MongoDB', 'Python', 'Redis'],
  data: ['Python', 'TensorFlow', 'PyTorch', 'SQL', 'Spark', 'Pandas', 'Scikit-learn', 'Tableau', 'R', 'Jupyter'],
  ml: ['Python', 'TensorFlow', 'PyTorch', 'MLflow', 'Kubernetes', 'CUDA', 'Transformers', 'LangChain', 'OpenAI API', 'HuggingFace'],
  devops: ['Docker', 'Kubernetes', 'AWS', 'GCP', 'Terraform', 'Jenkins', 'GitHub Actions', 'Linux', 'Prometheus', 'Ansible'],
  designer: ['Figma', 'Adobe XD', 'Sketch', 'Prototyping', 'User Research', 'Wireframing', 'Design Systems', 'Framer', 'Principle', 'Zeplin'],
  product: ['Product Strategy', 'Roadmapping', 'Agile', 'User Research', 'Data Analysis', 'SQL', 'Figma', 'JIRA', 'OKRs', 'A/B Testing'],
};

const SALARY_RANGES = {
  fresher: ['3-6 LPA', '4-7 LPA', '5-8 LPA', '6-10 LPA', '$80K-$110K', '£40K-£60K'],
  junior: ['6-12 LPA', '8-15 LPA', '10-18 LPA', '12-20 LPA', '$90K-$130K', '£50K-£75K'],
  mid: ['12-20 LPA', '15-25 LPA', '18-30 LPA', '20-35 LPA', '$120K-$170K', '£70K-£100K'],
  senior: ['25-40 LPA', '30-50 LPA', '35-60 LPA', '40-80 LPA', '$150K-$250K', '£90K-£150K'],
};

const JOB_DESCRIPTIONS = [
  `We are looking for a passionate engineer to join our growing team. You will work on scalable systems, collaborate across teams, and ship products used by millions.

Key Responsibilities:
• Design and implement scalable backend services and APIs
• Collaborate with cross-functional teams including product, design, and data
• Write clean, maintainable, and well-tested code
• Participate in code reviews and contribute to technical decisions
• Mentor junior engineers and help grow the team culture

Requirements:
• Strong proficiency in the primary tech stack
• Experience with distributed systems and microservices
• Problem-solving mindset with attention to detail
• Good communication skills and team player attitude`,

  `Join our world-class engineering team to build the next generation of our platform. We value autonomy, ownership, and building things that matter.

What you'll do:
• Build and maintain high-performance, reliable software systems
• Own meaningful parts of our technical roadmap
• Work directly with customers and stakeholders to understand requirements
• Drive technical excellence through code reviews, architecture discussions
• Contribute to our open-source projects

What we're looking for:
• Deep expertise in relevant technologies
• Track record of shipping products end-to-end
• Experience with cloud infrastructure (AWS/GCP/Azure)
• Startup mentality - move fast, iterate, improve`,

  `We're building AI-powered products that transform how people work. Come solve hard problems with a great team.

Responsibilities:
• Develop and optimize ML models for production use
• Build data pipelines and infrastructure at scale
• Research and implement state-of-the-art algorithms
• Collaborate with product and engineering teams
• Monitor model performance and drive improvements

Requirements:
• Strong background in machine learning and statistics
• Experience training and deploying models in production
• Proficiency with Python and ML frameworks
• Excellent problem-solving abilities`,
];

// Generate 80 realistic jobs
function generateJobs() {
  const jobs = [];
  const today = new Date();

  for (let i = 0; i < 80; i++) {
    const company = JOB_COMPANIES[i % JOB_COMPANIES.length];
    const role = ROLES[Math.floor(Math.random() * ROLES.length)];
    const location = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
    const expLevel = role.exp[Math.floor(Math.random() * role.exp.length)];
    const skills = SKILL_SETS[role.type] || SKILL_SETS.fullstack;
    const selectedSkills = skills.sort(() => 0.5 - Math.random()).slice(0, Math.floor(3 + Math.random() * 5));

    const daysAgo = Math.floor(Math.random() * 7);
    const postedDate = new Date(today);
    postedDate.setDate(postedDate.getDate() - daysAgo);

    const matchScore = Math.floor(65 + Math.random() * 35);
    const company2Alt = JOB_COMPANIES[(i + 15) % JOB_COMPANIES.length];

    jobs.push({
      id: `job_${i + 1}`,
      company: company.name,
      companyColor: company.color,
      companyEmoji: company.emoji,
      platform: company.platform,
      role: role.title,
      type: role.type,
      expLevel: expLevel,
      location: location.city,
      mode: location.mode,
      salary: SALARY_RANGES[expLevel][Math.floor(Math.random() * SALARY_RANGES[expLevel].length)],
      skills: selectedSkills,
      matchScore: matchScore,
      postedDate: postedDate.toISOString().split('T')[0],
      postedLabel: daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : `${daysAgo} days ago`,
      description: JOB_DESCRIPTIONS[Math.floor(Math.random() * JOB_DESCRIPTIONS.length)],
      applyUrl: `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(role.title + ' ' + company.name)}`,
      saved: false,
      applied: false,
    });
  }
  return jobs;
}

// Applications data
const INITIAL_APPLICATIONS = [
  {
    id: 'app_1', company: 'Google', companyColor: '#4285F4', companyEmoji: 'G',
    role: 'Software Engineer L4', status: 'interview',
    appliedDate: '2026-02-15', url: 'https://careers.google.com',
    notes: 'Technical round scheduled for next week',
  },
  {
    id: 'app_2', company: 'Microsoft', companyColor: '#00A4EF', companyEmoji: 'M',
    role: 'Senior Frontend Developer', status: 'shortlisted',
    appliedDate: '2026-02-12', url: 'https://careers.microsoft.com',
    notes: 'Received shortlist email, awaiting next steps',
  },
  {
    id: 'app_3', company: 'Flipkart', companyColor: '#2874F0', companyEmoji: 'F',
    role: 'Full Stack Developer', status: 'applied',
    appliedDate: '2026-02-10', url: 'https://www.flipkartcareers.com',
    notes: '',
  },
  {
    id: 'app_4', company: 'Stripe', companyColor: '#635BFF', companyEmoji: 'S',
    role: 'Backend Engineer', status: 'viewed',
    appliedDate: '2026-02-08', url: 'https://stripe.com/jobs',
    notes: 'Profile viewed by recruiter',
  },
  {
    id: 'app_5', company: 'Meta', companyColor: '#1877F2', companyEmoji: 'f',
    role: 'React Developer', status: 'applied',
    appliedDate: '2026-02-17', url: 'https://www.metacareers.com',
    notes: 'Applied through LinkedIn Easy Apply',
  },
  {
    id: 'app_6', company: 'Razorpay', companyColor: '#3395FF', companyEmoji: 'R',
    role: 'Node.js Developer', status: 'viewed',
    appliedDate: '2026-02-14', url: 'https://razorpay.com/jobs',
    notes: '',
  },
  {
    id: 'app_7', company: 'Amazon', companyColor: '#FF9900', companyEmoji: 'A',
    role: 'SDE-1', status: 'applied',
    appliedDate: '2026-02-16', url: 'https://www.amazon.jobs',
    notes: '',
  },
  {
    id: 'app_8', company: 'CRED', companyColor: '#1B1B2F', companyEmoji: 'C',
    role: 'Frontend Engineer', status: 'interview',
    appliedDate: '2026-02-11', url: 'https://jobs.cred.club',
    notes: 'Assignment submitted, waiting for interview call',
  },
  {
    id: 'app_9', company: 'Uber', companyColor: '#000', companyEmoji: 'U',
    role: 'Software Engineer', status: 'applied',
    appliedDate: '2026-02-18', url: 'https://www.uber.com/careers',
    notes: '',
  },
  {
    id: 'app_10', company: 'Swiggy', companyColor: '#FC8019', companyEmoji: 'S',
    role: 'Python Developer', status: 'viewed',
    appliedDate: '2026-02-13', url: 'https://bytes.swiggy.com/careers',
    notes: '',
  },
  {
    id: 'app_11', company: 'Spotify', companyColor: '#1DB954', companyEmoji: '♪',
    role: 'Data Engineer', status: 'applied',
    appliedDate: '2026-02-17', url: 'https://www.lifeatspotify.com/jobs',
    notes: '',
  },
  {
    id: 'app_12', company: 'Adobe', companyColor: '#FF0000', companyEmoji: 'Ai',
    role: 'UI/UX Designer', status: 'shortlisted',
    appliedDate: '2026-02-09', url: 'https://www.adobe.com/careers.html',
    notes: 'Portfolio reviewed, design challenge pending',
  },
];

// Cover letters data
const INITIAL_COVER_LETTERS = [
  {
    id: 'cl_1', company: 'Google', companyColor: '#4285F4', companyEmoji: 'G',
    role: 'Software Engineer L4',
    preview: 'Dear Hiring Manager at Google,\n\nI am thrilled to apply for the Software Engineer position at Google. With 3 years of experience in building scalable web applications using React, Node.js, and cloud technologies, I believe I can make a meaningful impact on your team...',
    date: '2026-02-15',
  },
  {
    id: 'cl_2', company: 'Stripe', companyColor: '#635BFF', companyEmoji: 'S',
    role: 'Backend Engineer',
    preview: 'Dear Stripe Recruiting Team,\n\nStripe\'s mission to increase the GDP of the internet resonates deeply with me. I am applying for the Backend Engineer role with enthusiasm, bringing 4 years of experience in building high-throughput payment systems and APIs...',
    date: '2026-02-08',
  },
  {
    id: 'cl_3', company: 'Meta', companyColor: '#1877F2', companyEmoji: 'f',
    role: 'React Developer',
    preview: 'Dear Meta Engineering Team,\n\nAs a passionate frontend developer who has been building with React for 3+ years, I am excited about the opportunity to work at Meta. I\'ve shipped features used by thousands of users and I\'m eager to scale to billions...',
    date: '2026-02-17',
  },
];

// Notifications
const INITIAL_NOTIFICATIONS = [
  {
    id: 'n1', icon: '🚀', title: '247 new jobs matched!',
    desc: 'Based on your React & Node.js skills', time: '2 min ago',
  },
  {
    id: 'n2', icon: '👀', title: 'Your profile was viewed',
    desc: 'A recruiter from Stripe viewed your profile', time: '1 hour ago',
  },
  {
    id: 'n3', icon: '📅', title: 'Interview tomorrow!',
    desc: 'Google Software Engineer - Technical Round', time: '3 hours ago',
  },
  {
    id: 'n4', icon: '✅', title: 'Application shortlisted',
    desc: 'Microsoft - Senior Frontend Developer', time: '1 day ago',
  },
  {
    id: 'n5', icon: '💡', title: 'Improve your match score',
    desc: 'Add Docker and Kubernetes to your skills', time: '2 days ago',
  },
];

// User profile
const DEFAULT_USER = {
  name: 'John Doe',
  email: 'john@example.com',
  avatar: 'JD',
  role: 'Full Stack Developer',
  skills: ['React', 'Node.js', 'TypeScript', 'Python', 'MongoDB', 'AWS'],
  experience: 'mid',
  location: 'Bangalore',
  mode: 'Hybrid',
  salary: '20-30 LPA',
  linkedin: '',
  portfolio: '',
  phone: '',
};

// Interview prep data by company
const PREP_DATA = {
  company: {
    title: 'Company Research',
    content: (company) => `
## About ${company}

${company} is a leading technology company that has revolutionized its industry through innovation and technical excellence. Understanding the company deeply is crucial for your interview success.

### Founded & History
${company} has grown from a startup to a global leader, with a focus on building products that scale to millions of users.

### Mission & Values
- Engineering excellence and innovation
- Customer obsession
- Long-term thinking
- Diversity and inclusion

### Culture
The engineering culture at ${company} is known for:
- Strong emphasis on code quality and best practices
- Flat hierarchy with high ownership
- Fast-paced innovation cycles
- Collaborative problem-solving

### Recent News & Products
Research the latest product launches, acquisitions, and engineering blog posts before your interview.

### Interview Process Typically:
1. Recruiter screening call (30 min)
2. Technical phone screen (60 min)
3. On-site / virtual interviews (3-5 rounds)
4. System design round
5. Behavioral / values interview
    `,
  },
  role: {
    title: 'Role Preparation',
    content: (role) => `
## Preparing for ${role}

### Key Technical Domains

**Core Skills Required:**
- Deep understanding of relevant data structures and algorithms
- System design and scalability principles
- Clean code and software engineering best practices
- Problem decomposition and communication

### What Interviewers Look For
1. **Problem Solving** — Clear thought process, edge case handling
2. **Communication** — Explain your thinking out loud
3. **Technical Depth** — Go beyond surface-level answers
4. **Culture Fit** — Demonstrate alignment with company values

### Study Plan (2 weeks)
**Week 1:** Arrays, Strings, Linked Lists, Trees, Graphs
**Week 2:** DP, System Design, Behavioral Questions

### Resources
- LeetCode (at least 50 problems)
- System Design Primer (GitHub)
- Cracking the Coding Interview
- Company engineering blog
    `,
  },
  questions: `Technical Questions`,
  coding: `Coding Challenges`,
  hr: `HR Questions`,
};

const INTERVIEW_QUESTIONS = {
  technical: [
    { q: 'Explain the difference between REST and GraphQL APIs. When would you use each?', diff: 'medium' },
    { q: 'How does React\'s Virtual DOM work? What problems does it solve?', diff: 'medium' },
    { q: 'Design a URL shortener system like bit.ly. Discuss scalability.', diff: 'hard' },
    { q: 'What is the difference between SQL and NoSQL databases? Provide use cases.', diff: 'easy' },
    { q: 'Explain microservices architecture. What are the trade-offs vs monolithic?', diff: 'hard' },
    { q: 'What is the event loop in Node.js? How does async/await work?', diff: 'medium' },
    { q: 'How would you optimize a slow database query?', diff: 'medium' },
    { q: 'Explain the CAP theorem and how it applies to distributed systems.', diff: 'hard' },
  ],
  coding: [
    { q: 'Two Sum — Find two numbers in an array that add up to a target', diff: 'easy' },
    { q: 'LRU Cache — Implement using HashMap and Doubly Linked List', diff: 'medium' },
    { q: 'Merge K Sorted Lists — Using a min-heap', diff: 'hard' },
    { q: 'Valid Parentheses — Check bracket matching using a stack', diff: 'easy' },
    { q: 'Binary Tree Maximum Path Sum — DFS with global max tracking', diff: 'hard' },
    { q: 'Word Search II — Trie + DFS backtracking', diff: 'hard' },
    { q: 'Coin Change — Dynamic programming bottom-up approach', diff: 'medium' },
    { q: 'Sliding Window Maximum — Monotonic deque technique', diff: 'hard' },
  ],
  hr: [
    { q: 'Tell me about yourself. Walk me through your background.', diff: 'easy' },
    { q: 'Tell me about a time you disagreed with your manager. How did you handle it?', diff: 'medium' },
    { q: 'Describe a project you\'re most proud of. What was your specific contribution?', diff: 'easy' },
    { q: 'Where do you see yourself in 5 years?', diff: 'easy' },
    { q: 'Tell me about a time you failed. What did you learn?', diff: 'medium' },
    { q: 'Why do you want to leave your current job?', diff: 'medium' },
    { q: 'Tell me about a time you had to learn something quickly under pressure.', diff: 'medium' },
    { q: 'How do you handle competing priorities and tight deadlines?', diff: 'medium' },
  ],
};

// Initialize all data stores
window.AppData = {
  jobs: generateJobs(),
  applications: JSON.parse(localStorage.getItem('jb_applications')) || INITIAL_APPLICATIONS,
  coverLetters: JSON.parse(localStorage.getItem('jb_coverletters')) || INITIAL_COVER_LETTERS,
  notifications: INITIAL_NOTIFICATIONS,
  generatedResumes: JSON.parse(localStorage.getItem('jb_resumes')) || [],
  user: JSON.parse(localStorage.getItem('jb_user')) || DEFAULT_USER,
  isLoggedIn: localStorage.getItem('jb_loggedin') === 'true',
  resumeUploaded: localStorage.getItem('jb_resume_uploaded') === 'true',
  currentUser: null,
};
