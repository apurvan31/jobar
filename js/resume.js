/* =============================================
   job.bar — Resume Lab
   Upload, parse, generate AI resumes & cover letters
   ============================================= */

// ---- RESUME UPLOAD ----
function triggerFileUpload() {
    document.getElementById('resume-file-input').click();
}

function handleDragOver(e) {
    e.preventDefault();
    document.getElementById('upload-zone').classList.add('drag-over');
}

function handleFileDrop(e) {
    e.preventDefault();
    document.getElementById('upload-zone').classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) processResumeFile(file);
}

function handleResumeUpload(input) {
    const file = input.files[0];
    if (file) processResumeFile(file);
}

function processResumeFile(file) {
    if (file.size > 10 * 1024 * 1024) {
        showToast('File too large. Max 10MB', 'error');
        return;
    }

    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'];
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(pdf|docx|doc)$/i)) {
        showToast('Please upload a PDF or DOCX file', 'error');
        return;
    }

    // Show upload progress
    document.getElementById('upload-zone').classList.add('hidden');
    document.getElementById('upload-progress').classList.remove('hidden');
    document.getElementById('upload-filename').textContent = file.name;
    document.getElementById('upload-status').textContent = '🔍 Reading resume...';

    const progressFill = document.getElementById('upload-progress-fill');
    let progress = 0;

    const steps = [
        { pct: 20, msg: '🔍 Extracting text...' },
        { pct: 40, msg: '🤖 AI parsing skills...' },
        { pct: 60, msg: '📊 Analyzing experience...' },
        { pct: 80, msg: '🎯 Matching job profiles...' },
        { pct: 100, msg: '✅ Resume parsed successfully!' },
    ];

    let stepIndex = 0;
    const interval = setInterval(() => {
        if (stepIndex < steps.length) {
            progress = steps[stepIndex].pct;
            progressFill.style.width = `${progress}%`;
            document.getElementById('upload-status').textContent = steps[stepIndex].msg;
            stepIndex++;
        } else {
            clearInterval(interval);
            AppData.resumeUploaded = true;
            localStorage.setItem('jb_resume_uploaded', 'true');
            document.getElementById('resume-cta').classList.add('hidden');

            setTimeout(() => {
                renderParsedData(file.name);
                showToast('Resume parsed! 47 jobs matched.', 'success');
            }, 500);
        }
    }, 600);
}

// ---- RENDER PARSED DATA ----
function renderParsedData(filename) {
    const user = AppData.user;
    const content = document.getElementById('parsed-content');

    content.innerHTML = `
    <div class="ai-scan-container" style="margin-bottom:1rem;">
      <div style="padding:10px 14px;background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.2);border-radius:8px;display:flex;align-items:center;gap:8px;font-size:0.82rem;color:#10b981;">
        ✅ <strong>${filename}</strong> — AI parsed successfully
      </div>
    </div>
    
    <div class="parsed-section">
      <div class="parsed-section-title">👤 Personal Info</div>
      <div class="parsed-section-content">
        <strong>${user.name}</strong><br>
        <span style="color:var(--text-secondary)">📧 ${user.email} | 📍 Bangalore, India</span>
      </div>
    </div>
    
    <div class="parsed-section">
      <div class="parsed-section-title">💼 Experience</div>
      <div class="parsed-section-content" style="display:flex;flex-direction:column;gap:6px;">
        <div style="font-size:0.82rem">
          <strong>Senior Frontend Developer</strong> · TechCorp Inc.<br>
          <span style="color:var(--text-secondary)">Jan 2023 – Present (2 years)</span>
        </div>
        <div style="font-size:0.82rem">
          <strong>Full Stack Developer</strong> · StartupXYZ<br>
          <span style="color:var(--text-secondary)">Jun 2021 – Dec 2022 (1.5 years)</span>
        </div>
      </div>
    </div>
    
    <div class="parsed-section">
      <div class="parsed-section-title">🛠️ Skills Detected</div>
      <div class="parsed-skills">
        ${user.skills.map(s => `<span class="skill-chip">${s}</span>`).join('')}
        <span class="skill-chip">Git</span>
        <span class="skill-chip">REST APIs</span>
        <span class="skill-chip">Docker</span>
        <span class="skill-chip">Jest</span>
      </div>
    </div>
    
    <div class="parsed-section">
      <div class="parsed-section-title">🎓 Education</div>
      <div class="parsed-section-content" style="font-size:0.82rem;">
        <strong>B.Tech in Computer Science</strong><br>
        <span style="color:var(--text-secondary)">VIT University · 2017–2021 · CGPA: 8.4</span>
      </div>
    </div>
    
    <div class="parsed-section">
      <div class="parsed-section-title">🏆 Projects</div>
      <div class="parsed-section-content" style="font-size:0.82rem;display:flex;flex-direction:column;gap:6px;">
        <div><strong>E-commerce Platform</strong> — React, Node.js, MongoDB<br><span style="color:var(--text-secondary)">Served 10K+ users monthly</span></div>
        <div><strong>AI Resume Parser</strong> — Python, FastAPI, OpenAI<br><span style="color:var(--text-secondary)">96% accuracy on resume extraction</span></div>
      </div>
    </div>
    
    <div style="display:flex;align-items:center;gap:12px;margin-top:0.75rem;padding:12px;background:rgba(99,102,241,0.05);border:1px solid rgba(99,102,241,0.2);border-radius:8px;">
      <div style="text-align:center;">
        <div style="font-family:var(--font-main);font-size:1.5rem;font-weight:800;color:var(--accent)">78</div>
        <div style="font-size:0.72rem;color:var(--text-muted)">ATS Score</div>
      </div>
      <div style="flex:1;font-size:0.82rem;color:var(--text-secondary)">
        Good ATS score! Add more keywords from job descriptions and quantify your achievements to get above 90.
      </div>
    </div>
    
    <button class="btn-primary btn-full" onclick="navigateTo('jobs')" style="margin-top:1rem;">
      🔍 Find Matching Jobs (247 found)
    </button>
  `;
}

// ---- RESUME GENERATOR MODAL ----
function showResumeGeneratorModal(jobId, jobOverride) {
    const job = jobOverride || AppData.jobs.find(j => j.id === jobId);
    if (!job) { showToast('Job not found', 'error'); return; }

    // Close job modal first
    document.getElementById('job-modal')?.classList.add('hidden');

    const modal = document.getElementById('resume-modal');
    const body = document.getElementById('resume-modal-body');

    body.innerHTML = `
    <div class="ai-generating">
      <div class="ai-generating-icon">📄</div>
      <h3>Generating AI Resume for ${job.company}</h3>
      <p>Tailoring your resume to match the ${job.role} position</p>
      
      <div class="progress-bar" style="width:100%;margin:0.5rem 0">
        <div class="progress-fill" id="resume-gen-progress" style="width:0%"></div>
      </div>
      
      <div class="ai-progress-steps" id="resume-gen-steps">
        <div class="ai-step active" id="rs-1"><span class="ai-step-icon">🔍</span> Analyzing job description</div>
        <div class="ai-step" id="rs-2"><span class="ai-step-icon">📊</span> Extracting key requirements</div>
        <div class="ai-step" id="rs-3"><span class="ai-step-icon">✨</span> Tailoring your experience</div>
        <div class="ai-step" id="rs-4"><span class="ai-step-icon">📝</span> Optimizing for ATS</div>
        <div class="ai-step" id="rs-5"><span class="ai-step-icon">✅</span> Finalizing resume</div>
      </div>
    </div>
  `;

    modal.classList.remove('hidden');

    // Animate steps
    const steps = ['rs-1', 'rs-2', 'rs-3', 'rs-4', 'rs-5'];
    const progress = document.getElementById('resume-gen-progress');
    let i = 0;

    const stepInterval = setInterval(() => {
        if (i < steps.length) {
            document.getElementById(steps[i]).className = 'ai-step done';
            if (i + 1 < steps.length) document.getElementById(steps[i + 1]).className = 'ai-step active';
            progress.style.width = `${(i + 1) * 20}%`;
            i++;
        } else {
            clearInterval(stepInterval);
            showGeneratedResume(job);
        }
    }, 800);
}

function showGeneratedResume(job) {
    const user = AppData.user;
    const body = document.getElementById('resume-modal-body');

    const resumeData = {
        id: `res_${Date.now()}`,
        jobId: job.id,
        company: job.company,
        companyColor: job.companyColor || '#6366f1',
        companyEmoji: job.companyEmoji || job.company[0],
        role: job.role,
        date: new Date().toISOString().split('T')[0],
    };

    AppData.generatedResumes.push(resumeData);
    localStorage.setItem('jb_resumes', JSON.stringify(AppData.generatedResumes));
    updateGeneratedResumesList();

    body.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem;">
      <div style="display:flex;align-items:center;gap:8px;color:var(--success)">
        <span>✅</span>
        <strong>Resume generated for ${job.company} — ${job.role}</strong>
      </div>
      <div style="display:flex;gap:8px;">
        <button class="btn-secondary" onclick="downloadResume('${resumeData.id}')">
          ⬇️ Download PDF
        </button>
        <button class="btn-primary" onclick="copyResumeText()">📋 Copy Text</button>
      </div>
    </div>
    
    <div class="doc-preview" id="resume-doc-preview">
      <h1>${user.name}</h1>
      <div class="doc-contact">${user.email} | ${user.phone || '+91 9876543210'} | ${user.linkedin || 'linkedin.com/in/johndoe'} | ${user.portfolio || 'johndoe.dev'}</div>
      
      <h2>PROFESSIONAL SUMMARY</h2>
      <p>Results-driven ${job.role} with 3+ years of experience building scalable applications. Proven track record of delivering high-impact products. Passionate about clean code, system design, and user experience. Seeking to bring expertise in ${job.skills?.slice(0, 3).join(', ') || 'React, Node.js, TypeScript'} to ${job.company}.</p>
      
      <h2>TECHNICAL SKILLS</h2>
      <p><strong>Languages:</strong> JavaScript, TypeScript, Python, Java</p>
      <p><strong>Frameworks:</strong> ${job.skills?.slice(0, 4).join(', ') || 'React, Node.js, Express, Next.js'}</p>
      <p><strong>Tools:</strong> Docker, Git, AWS, PostgreSQL, MongoDB, Redis</p>
      
      <h2>EXPERIENCE</h2>
      <p><strong>Senior Frontend Developer</strong> — TechCorp Inc. | Jan 2023 – Present</p>
      <p>• Built and shipped 5 major features using ${job.skills?.[0] || 'React'} and ${job.skills?.[1] || 'TypeScript'}, improving user engagement by 42%</p>
      <p>• Reduced page load time by 60% through code splitting and lazy loading</p>
      <p>• Led team of 4 engineers, conducted code reviews, mentored junior developers</p>
      <p>• Collaborated with ${job.company}-style cross-functional teams to deliver product requirements</p>
      
      <p style="margin-top:0.5rem"><strong>Full Stack Developer</strong> — StartupXYZ | Jun 2021 – Dec 2022</p>
      <p>• Developed RESTful APIs serving 50K+ daily requests with 99.9% uptime</p>
      <p>• Implemented real-time features using WebSockets, reducing support tickets by 30%</p>
      <p>• Migrated monolith to microservices, improving deployment frequency by 5x</p>
      
      <h2>PROJECTS</h2>
      <p><strong>E-commerce Platform</strong> | React, Node.js, MongoDB, AWS</p>
      <p>• Served 10K+ monthly active users · 99.5% uptime · $50K monthly GMV</p>
      
      <p style="margin-top:0.5rem"><strong>AI Resume Parser</strong> | Python, FastAPI, OpenAI API</p>
      <p>• 96% accuracy · Processed 5K+ resumes · Featured in ProductHunt</p>
      
      <h2>EDUCATION</h2>
      <p><strong>B.Tech in Computer Science</strong> — VIT University | 2017–2021 | CGPA: 8.4/10</p>
    </div>
    
    <div class="modal-actions">
      <span style="font-size:0.8rem;color:var(--success)">⚡ ATS Score: 94/100 — Excellent!</span>
      <button class="btn-secondary" onclick="showResumeGeneratorModal('${job.id}', ${JSON.stringify(job).replace(/'/g, "\\'")})">Regenerate</button>
      <button class="btn-primary" onclick="downloadResume('${resumeData.id}')">⬇️ Download PDF</button>
    </div>
  `;
}

function downloadResume(resumeId) {
    showToast('Preparing PDF download...', 'info');
    setTimeout(() => {
        // Create a simple downloadable text version
        const previewEl = document.getElementById('resume-doc-preview');
        if (previewEl) {
            const text = previewEl.innerText;
            const blob = new Blob([text], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `resume_${AppData.user.name.replace(' ', '_')}_${Date.now()}.txt`;
            a.click();
            URL.revokeObjectURL(url);
        }
        showToast('Resume downloaded!', 'success');
    }, 800);
}

function copyResumeText() {
    const previewEl = document.getElementById('resume-doc-preview');
    if (previewEl) {
        navigator.clipboard.writeText(previewEl.innerText).then(() => {
            showToast('Resume text copied to clipboard!', 'success');
        });
    }
}

function updateGeneratedResumesList() {
    const list = document.getElementById('generated-resumes-list');
    const count = document.getElementById('generated-resumes-count');

    if (!list) return;

    count.textContent = `${AppData.generatedResumes.length} resume${AppData.generatedResumes.length !== 1 ? 's' : ''}`;

    if (AppData.generatedResumes.length === 0) {
        list.innerHTML = '<div class="empty-state-inline"><p>Apply to jobs and generate tailored resumes for each position</p></div>';
        return;
    }

    list.innerHTML = AppData.generatedResumes.slice().reverse().map(r => `
    <div class="generated-item">
      <div class="generated-item-icon">📄</div>
      <div class="generated-item-info">
        <div class="generated-item-title">${r.role} — ${r.company}</div>
        <div class="generated-item-meta">Generated ${formatDate(r.date)} · ATS Optimized</div>
      </div>
      <div class="generated-item-actions">
        <button class="btn-secondary" onclick="showResumeGeneratorModal('${r.jobId}')">View</button>
        <button class="btn-secondary" onclick="downloadResume('${r.id}')">⬇️</button>
      </div>
    </div>
  `).join('');
}

// ---- COVER LETTER ----
function initCoverLettersPage() {
    renderCoverLettersList();
}

function renderCoverLettersList() {
    const grid = document.getElementById('cover-letters-grid');
    if (!grid) return;

    if (AppData.coverLetters.length === 0) {
        grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <div class="empty-icon">✉️</div>
        <h3>No cover letters yet</h3>
        <p>Generate personalized cover letters for every job you apply to</p>
        <button class="btn-primary" onclick="showCoverLetterModal()" style="margin-top:1rem">+ Generate Cover Letter</button>
      </div>`;
        return;
    }

    grid.innerHTML = AppData.coverLetters.map(cl => `
    <div class="cover-letter-card" onclick="viewCoverLetter('${cl.id}')">
      <div class="cl-card-header">
        <div class="cl-company-logo" style="background: ${cl.companyColor}">${cl.companyEmoji}</div>
        <div class="cl-info">
          <div class="cl-role">${cl.role}</div>
          <div class="cl-company">${cl.company}</div>
        </div>
        <div class="match-score high" style="flex-shrink:0">✨ AI</div>
      </div>
      <div class="cl-preview">${cl.preview.replace(/\n/g, ' ')}</div>
      <div class="cl-footer">
        <span class="cl-date">${formatDate(cl.date)}</span>
        <div class="cl-actions">
          <button class="btn-icon" onclick="event.stopPropagation(); downloadCoverLetter('${cl.id}')" title="Download">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7,10 12,15 17,10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          </button>
          <button class="btn-icon" onclick="event.stopPropagation(); copyCoverLetter('${cl.id}')" title="Copy">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
          </button>
          <button class="btn-icon danger" onclick="event.stopPropagation(); deleteCoverLetter('${cl.id}')" title="Delete">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3,6 5,6 21,6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

function generateCoverLetter() {
    const company = document.getElementById('cl-company').value.trim();
    const role = document.getElementById('cl-role').value.trim();
    if (!company || !role) { showToast('Please enter company and role', 'error'); return; }

    const body = document.getElementById('cover-modal-body');
    body.innerHTML = `
    <div class="ai-generating">
      <div class="ai-generating-icon">✉️</div>
      <h3>Writing your cover letter...</h3>
      <p>AI is crafting a personalized letter for ${role} at ${company}</p>
      <div class="ai-typing" style="margin-top:1rem">
        <div class="ai-typing-dot"></div>
        <div class="ai-typing-dot"></div>
        <div class="ai-typing-dot"></div>
      </div>
    </div>
  `;

    setTimeout(() => {
        const newCL = {
            id: `cl_${Date.now()}`,
            company, role,
            companyColor: `hsl(${Math.random() * 360}, 65%, 45%)`,
            companyEmoji: company[0].toUpperCase(),
            date: new Date().toISOString().split('T')[0],
            preview: `Dear Hiring Manager at ${company},\n\nI am excited to apply for the ${role} position at ${company}. With my proven track record in building scalable applications and a passion for innovation, I am confident I can make a significant impact on your team.\n\nDuring my career, I have successfully delivered multiple projects using modern technologies and best practices. I am particularly drawn to ${company}'s mission and the opportunity to work on products that make a real difference.\n\nI would love to discuss how my skills and experience align with ${company}'s goals. Thank you for considering my application.\n\nBest regards,\n${AppData.user.name}`,
        };

        AppData.coverLetters.unshift(newCL);
        localStorage.setItem('jb_coverletters', JSON.stringify(AppData.coverLetters));

        closeModal('cover-modal');
        renderCoverLettersList();
        showToast(`Cover letter generated for ${role} at ${company}!`, 'success');
    }, 2500);
}

function generateCoverLetterForJob(jobId) {
    const job = AppData.jobs.find(j => j.id === jobId);
    if (!job) return;

    document.getElementById('job-modal')?.classList.add('hidden');

    showCoverLetterModal();
    setTimeout(() => {
        document.getElementById('cl-company').value = job.company;
        document.getElementById('cl-role').value = job.role;
    }, 100);
}

function viewCoverLetter(id) {
    const cl = AppData.coverLetters.find(c => c.id === id);
    if (!cl) return;

    document.getElementById('cover-modal').classList.remove('hidden');
    document.getElementById('cover-modal-body').innerHTML = `
    <div class="doc-preview" style="font-size:0.88rem;line-height:1.8">
      ${cl.preview.replace(/\n/g, '<br>')}
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="copyCoverLetter('${cl.id}')">📋 Copy</button>
      <button class="btn-primary" onclick="downloadCoverLetter('${cl.id}')">⬇️ Download</button>
    </div>
  `;
}

function downloadCoverLetter(id) {
    const cl = AppData.coverLetters.find(c => c.id === id);
    if (!cl) return;
    const blob = new Blob([cl.preview], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cover_letter_${cl.company}_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Cover letter downloaded!', 'success');
}

function copyCoverLetter(id) {
    const cl = AppData.coverLetters.find(c => c.id === id);
    if (!cl) return;
    navigator.clipboard.writeText(cl.preview).then(() => showToast('Copied to clipboard!', 'success'));
}

function deleteCoverLetter(id) {
    AppData.coverLetters = AppData.coverLetters.filter(c => c.id !== id);
    localStorage.setItem('jb_coverletters', JSON.stringify(AppData.coverLetters));
    renderCoverLettersList();
    showToast('Cover letter deleted', 'info');
}
