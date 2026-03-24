/* =============================================
   job.bar — Interview Prep
   Company research, role prep, Q&A, coding challenges
   ============================================= */

let selectedPrepJob = null;
let currentPrepTab = 'company';

// ---- INIT ----
function initPrepPage() {
    renderPrepJobList();
}

function renderPrepJobList() {
    const list = document.getElementById('prep-job-list');
    if (!list) return;

    // Use applications as prep sources (plus some from jobs)
    const prepSources = [
        ...AppData.applications.map(a => ({ id: a.id, company: a.company, role: a.role, status: a.status })),
        ...AppData.jobs.slice(0, 5).map(j => ({ id: j.id, company: j.company, role: j.role, status: 'browse' })),
    ].slice(0, 12);

    if (prepSources.length === 0) {
        list.innerHTML = '<div style="color:var(--text-muted);font-size:0.82rem;text-align:center;padding:1rem">No applications yet.<br>Browse jobs and apply first.</div>';
        return;
    }

    list.innerHTML = prepSources.map((job, i) => `
    <div class="prep-job-item ${selectedPrepJob?.id === job.id ? 'active' : ''}" 
         id="prep-job-${job.id}" onclick="selectPrepJobById('${job.id}')">
      <div class="prep-job-item-role">${job.role}</div>
      <div class="prep-job-item-company" style="display:flex;align-items:center;justify-content:space-between">
        <span>${job.company}</span>
        ${job.status !== 'browse' ? `<span class="status-badge status-${job.status}" style="font-size:0.68rem">${capitalize(job.status)}</span>` : '<span style="font-size:0.72rem;color:var(--text-muted)">Saved</span>'}
      </div>
    </div>
  `).join('');
}

function selectPrepJobById(jobId) {
    // Find from applications or jobs
    const app = AppData.applications.find(a => a.id === jobId);
    const job = AppData.jobs.find(j => j.id === jobId);

    const source = app ? { id: app.id, company: app.company, role: app.role } :
        job ? { id: job.id, company: job.company, role: job.role } : null;

    if (source) selectPrepJob(source);
}

function selectPrepJob(job) {
    selectedPrepJob = job;

    // Update active state in list
    document.querySelectorAll('.prep-job-item').forEach(el => el.classList.remove('active'));
    const el = document.getElementById(`prep-job-${job.id}`);
    if (el) el.classList.add('active');

    // Reset to company tab
    currentPrepTab = 'company';
    document.querySelectorAll('.prep-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.prep-tab')[0]?.classList.add('active');

    renderPrepTabContent(currentPrepTab, job);

    // Refresh prep job list to update active state
    renderPrepJobList();
}

function switchPrepTab(tab) {
    if (!selectedPrepJob) {
        showToast('Please select a job first', 'info');
        return;
    }

    currentPrepTab = tab;
    document.querySelectorAll('.prep-tab').forEach(t => {
        t.classList.toggle('active', t.getAttribute('onclick').includes(`'${tab}'`));
    });

    renderPrepTabContent(tab, selectedPrepJob);
}

function renderPrepTabContent(tab, job) {
    const content = document.getElementById('prep-tab-content');
    if (!content) return;

    content.innerHTML = '';

    const tabContent = {
        company: renderCompanyPrep,
        role: renderRolePrep,
        questions: renderTechnicalQuestions,
        coding: renderCodingChallenges,
        hr: renderHRQuestions,
    };

    const render = tabContent[tab];
    if (render) content.innerHTML = render(job);
}

function renderCompanyPrep(job) {
    return `
    <div class="prep-section">
      <h4>🏢 About ${job.company}</h4>
      <div class="prep-text">
        ${job.company} is one of the world's leading technology companies, known for innovation, engineering excellence, and a strong culture of ownership and impact. The company serves millions of users globally and is at the forefront of digital transformation.
      </div>
    </div>
    
    <div class="prep-section">
      <h4>🎯 Company Mission & Values</h4>
      <div style="display:flex;flex-direction:column;gap:8px;">
        ${['Engineering Excellence — Write the best code possible', 'Customer Obsession — Start with the customer, work backwards', 'Ownership — Take responsibility for outcomes, not just tasks', 'Innovation — Think big, experiment fast, learn faster', 'Diversity — Build teams that reflect the world we serve'].map(v => `
          <div style="display:flex;align-items:flex-start;gap:8px;font-size:0.84rem;color:var(--text-secondary)">
            <span style="color:var(--accent);margin-top:2px">•</span>${v}
          </div>
        `).join('')}
      </div>
    </div>
    
    <div class="prep-section">
      <h4>📋 Interview Process at ${job.company}</h4>
      <div style="display:flex;flex-direction:column;gap:10px;">
        ${[
            ['1', '📞 Recruiter Screen', '30 min · HR / background questions'],
            ['2', '💻 Technical Screen', '60 min · LeetCode-style coding (2 problems)'],
            ['3', '🏗️ System Design', '60 min · Design scalable systems'],
            ['4', '👥 Panel Interviews', '3-4 rounds · Technical + behavioral'],
            ['5', '🤝 Final Round', 'Top management / culture fit interview'],
        ].map(([n, title, sub]) => `
          <div style="display:flex;gap:12px;align-items:flex-start;">
            <div style="width:28px;height:28px;border-radius:50%;background:rgba(99,102,241,0.15);border:1px solid rgba(99,102,241,0.3);display:flex;align-items:center;justify-content:center;font-size:0.75rem;font-weight:700;color:var(--accent);flex-shrink:0">${n}</div>
            <div>
              <div style="font-size:0.85rem;font-weight:600">${title}</div>
              <div style="font-size:0.78rem;color:var(--text-muted)">${sub}</div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
    
    <div class="prep-section">
      <h4>💡 Tips to Crack ${job.company}</h4>
      <div class="prep-text">
        • Research recent product launches and engineering blog posts<br>
        • Practice STAR format answers for behavioral questions<br>
        • Solve at least 50 LeetCode problems (Easy/Medium/Hard mix)<br>
        • Prepare 2-3 stories about projects with measurable impact<br>
        • Know why you want to work at ${job.company} specifically
      </div>
    </div>
    
    <div style="display:flex;gap:0.75rem;margin-top:0.5rem;flex-wrap:wrap">
      <a href="https://glassdoor.com/Reviews/${encodeURIComponent(job.company)}-reviews" target="_blank" rel="noopener" class="btn-secondary">🔍 Glassdoor Reviews</a>
      <a href="https://leetcode.com/discuss/interview-question?companies=${encodeURIComponent(job.company)}" target="_blank" rel="noopener" class="btn-secondary">💻 LeetCode Questions</a>
    </div>
  `;
}

function renderRolePrep(job) {
    return `
    <div class="prep-section">
      <h4>💼 Role Overview: ${job.role}</h4>
      <div class="prep-text">
        As a ${job.role}, you will be expected to own significant technical challenges, collaborate with cross-functional teams, and deliver high-quality software at scale. You will work in a fast-paced environment where speed, reliability, and innovation matter equally.
      </div>
    </div>
    
    <div class="prep-section">
      <h4>🎯 Key Skills They'll Test</h4>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
        ${['Data Structures & Algorithms', 'System Design', 'Object-Oriented Design', 'Database Design', 'API Design', 'Performance Optimization', 'Clean Code Principles', 'Testing & Debugging'].map(skill => `
          <div style="padding:8px 12px;background:rgba(99,102,241,0.05);border:1px solid rgba(99,102,241,0.15);border-radius:6px;font-size:0.8rem;color:var(--text)">
            🔹 ${skill}
          </div>
        `).join('')}
      </div>
    </div>
    
    <div class="prep-section">
      <h4>📚 2-Week Study Plan</h4>
      <div style="display:flex;flex-direction:column;gap:8px;">
        ${[
            ['Week 1', 'Day 1-2: Arrays & Strings · Day 3-4: Linked Lists & Trees · Day 5-7: Graphs & DP'],
            ['Week 2', 'Day 8-9: System Design basics · Day 10-11: Mock interviews · Day 12-13: Behavioral Prep · Day 14: Review & rest'],
        ].map(([week, plan]) => `
          <div style="padding:10px 14px;background:var(--surface);border:1px solid var(--border);border-radius:8px;">
            <div style="font-weight:600;font-size:0.84rem;color:var(--accent);margin-bottom:4px">${week}</div>
            <div style="font-size:0.8rem;color:var(--text-secondary)">${plan}</div>
          </div>
        `).join('')}
      </div>
    </div>
    
    <div class="prep-section">
      <h4>📖 Recommended Resources</h4>
      <div style="display:flex;flex-direction:column;gap:6px;">
        ${[
            ['📗', 'Cracking the Coding Interview', 'By Gayle McDowell — Classic interview prep book'],
            ['🔴', 'LeetCode Top 150', 'Must-solve problems for ${job.company}-level interviews'],
            ['🎥', 'System Design Primer', 'GitHub repo with comprehensive system design guide'],
            ['📘', 'Designing Data-Intensive Applications', 'Deep dive into distributed systems'],
        ].map(([icon, title, desc]) => `
          <div style="display:flex;gap:10px;align-items:flex-start;font-size:0.82rem">
            <span style="font-size:1rem;flex-shrink:0">${icon}</span>
            <div><strong>${title}</strong><br><span style="color:var(--text-muted)">${desc}</span></div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function renderTechnicalQuestions(job) {
    return `
    <div class="prep-section">
      <h4>❓ Technical Interview Questions for ${job.company}</h4>
      <div class="question-list">
        ${INTERVIEW_QUESTIONS.technical.map(q => `
          <div class="question-item" onclick="this.classList.toggle('expanded')">
            <div class="question-text">${q.q}</div>
            <span class="question-difficulty diff-${q.diff}">${capitalize(q.diff)}</span>
          </div>
        `).join('')}
      </div>
    </div>
    
    <div class="prep-section">
      <h4>💡 How to Answer Technical Questions</h4>
      <div style="display:flex;flex-direction:column;gap:8px;font-size:0.82rem;color:var(--text-secondary)">
        <div style="padding:10px;background:rgba(99,102,241,0.05);border-radius:8px;">
          <strong style="color:var(--text)">1. Clarify</strong> — Ask clarifying questions before jumping to code
        </div>
        <div style="padding:10px;background:rgba(99,102,241,0.05);border-radius:8px;">
          <strong style="color:var(--text)">2. Plan</strong> — Discuss your approach at a high level first
        </div>
        <div style="padding:10px;background:rgba(99,102,241,0.05);border-radius:8px;">
          <strong style="color:var(--text)">3. Code</strong> — Write clean, readable code with good variable names
        </div>
        <div style="padding:10px;background:rgba(99,102,241,0.05);border-radius:8px;">
          <strong style="color:var(--text)">4. Test</strong> — Walk through edge cases and test your solution
        </div>
        <div style="padding:10px;background:rgba(99,102,241,0.05);border-radius:8px;">
          <strong style="color:var(--text)">5. Optimize</strong> — Discuss time and space complexity, propose improvements
        </div>
      </div>
    </div>
  `;
}

function renderCodingChallenges(job) {
    return `
    <div class="prep-section">
      <h4>💻 Practice Problems (${job.company} Style)</h4>
      <div class="question-list">
        ${INTERVIEW_QUESTIONS.coding.map(q => `
          <div class="question-item">
            <div class="question-text">${q.q}</div>
            <span class="question-difficulty diff-${q.diff}">${capitalize(q.diff)}</span>
          </div>
        `).join('')}
      </div>
    </div>
    
    <div class="prep-section">
      <h4>🧩 Key Data Structures to Master</h4>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
        ${['HashMap/HashSet', 'Stack & Queue', 'Binary Tree', 'Graph (BFS/DFS)', 'Heap/Priority Queue', 'Trie', 'Segment Tree', 'Union-Find'].map(ds => `
          <div style="padding:6px 12px;background:var(--surface);border:1px solid var(--border);border-radius:6px;font-size:0.8rem">
            🧱 ${ds}
          </div>
        `).join('')}
      </div>
    </div>
    
    <div style="text-align:center;margin-top:1rem">
      <a href="https://leetcode.com/problems/" target="_blank" rel="noopener" class="btn-primary">
        Practice on LeetCode ↗
      </a>
    </div>
  `;
}

function renderHRQuestions(job) {
    return `
    <div class="prep-section">
      <h4>👤 Behavioral Interview Questions</h4>
      <div class="question-list">
        ${INTERVIEW_QUESTIONS.hr.map(q => `
          <div class="question-item">
            <div class="question-text">${q.q}</div>
            <span class="question-difficulty diff-${q.diff}">${capitalize(q.diff)}</span>
          </div>
        `).join('')}
      </div>
    </div>
    
    <div class="prep-section">
      <h4>⭐ STAR Method Framework</h4>
      <div style="display:flex;flex-direction:column;gap:8px;">
        ${[
            ['S', 'Situation', 'Set the context — what was the situation or challenge?', '#6366f1'],
            ['T', 'Task', 'What was your specific responsibility or goal?', '#06b6d4'],
            ['A', 'Action', 'What actions did YOU specifically take?', '#f59e0b'],
            ['R', 'Result', 'What was the measurable outcome?', '#10b981'],
        ].map(([letter, word, desc, color]) => `
          <div style="display:flex;gap:12px;align-items:flex-start">
            <div style="width:32px;height:32px;border-radius:8px;background:${color};display:flex;align-items:center;justify-content:center;font-weight:800;color:white;font-family:var(--font-main);flex-shrink:0">${letter}</div>
            <div>
              <div style="font-weight:700;font-size:0.88rem">${word}</div>
              <div style="font-size:0.8rem;color:var(--text-secondary)">${desc}</div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
    
    <div class="prep-section">
      <h4>✅ Questions to Ask the Interviewer</h4>
      <div class="prep-text">
        • What does the typical onboarding process look like for this role?<br>
        • What are the biggest technical challenges the team is currently facing?<br>
        • How does ${job.company} measure success for this position?<br>
        • What does the growth path look like for engineers at this level?<br>
        • What is the engineering culture like — how often do you ship?
      </div>
    </div>
  `;
}
