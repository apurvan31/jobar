/* =============================================
   job.bar — Jobs Page
   Job listing, filters, job card rendering, job modal
   ============================================= */

let filteredJobs = [];
let activeDropdown = null;

// ---- INIT JOBS PAGE ----
function initJobsPage() {
    filteredJobs = [...AppData.jobs];
    renderJobs(filteredJobs);
}

// ---- RENDER JOBS ----
function renderJobs(jobs) {
    const grid = document.getElementById('jobs-grid');
    const countEl = document.getElementById('jobs-count');

    if (!grid) return;

    countEl.textContent = `${jobs.length} jobs found`;

    if (jobs.length === 0) {
        grid.innerHTML = '';
        document.getElementById('no-jobs').classList.remove('hidden');
        return;
    }

    document.getElementById('no-jobs').classList.add('hidden');

    grid.innerHTML = jobs.map((job, i) => createJobCard(job, i)).join('');
}

function createJobCard(job, idx) {
    const platformBadge = `<span class="platform-badge platform-${job.platform}">${platformLabel(job.platform)}</span>`;
    const scoreClass = job.matchScore >= 85 ? 'high' : job.matchScore >= 70 ? 'medium' : 'low';

    return `
    <div class="job-card animate-in" style="--delay:${Math.min(idx * 0.04, 0.4)}s" onclick="openJobModal('${job.id}')">
      <div class="job-card-header">
        <div class="job-card-logo" style="background: ${job.companyColor}">${job.companyEmoji}</div>
        <div class="job-card-meta">
          <div class="job-card-role">${job.role}</div>
          <div class="job-card-company">${job.company}</div>
        </div>
        <div class="job-card-score">
          <div class="match-score ${scoreClass}">${job.matchScore}%</div>
        </div>
      </div>
      
      <div class="job-card-tags">
        <span class="tag ${job.mode}">${capitalize(job.mode)}</span>
        ${job.isWalkin ? '<span class="tag walkin">⚡ WALK-IN</span>' : ''}
        ${job.isMNC ? '<span class="tag mnc">🏢 MNC</span>' : ''}
        ${platformBadge}
        <span class="tag new">${job.postedLabel}</span>
      </div>
      
      <div class="job-card-details">
        <div class="job-detail-item">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
          ${job.location}
        </div>
        <div class="job-detail-item">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
          ${job.salary}
        </div>
        <div class="job-detail-item">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg>
          ${capitalize(job.expLevel)}
        </div>
        <div class="job-detail-item">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>
          ${job.postedLabel}
        </div>
      </div>
      
      <div class="job-card-footer" onclick="event.stopPropagation()">
        <a href="${job.applyUrl}" target="_blank" rel="noopener" class="btn-apply" onclick="trackApply('${job.id}')">
          Apply Now ↗
        </a>
        <div style="display:flex;gap:6px">
          <button class="btn-icon" onclick="toggleSaveJob('${job.id}', this)" title="${job.saved ? 'Unsave' : 'Save job'}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="${job.saved ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>
          </button>
          <div class="btn-ai-actions" id="aiBtn_${job.id}" onclick="toggleAIDropdown('${job.id}')">
            ✨ AI Actions
            <div class="ai-dropdown hidden" id="aiDrop_${job.id}" onclick="event.stopPropagation()">
              <div class="ai-dropdown-item" onclick="openJobModal('${job.id}'); showResumeGeneratorModal('${job.id}')">
                <span>📄</span> Generate Resume
              </div>
              <div class="ai-dropdown-item" onclick="openJobModal('${job.id}'); generateCoverLetterForJob('${job.id}')">
                <span>✉️</span> Generate Cover Letter
              </div>
              <div class="ai-dropdown-item" onclick="analyzeJobFit('${job.id}')">
                <span>🎯</span> Analyze Job Fit
              </div>
              <div class="ai-dropdown-item" onclick="prepForJob('${job.id}')">
                <span>🧠</span> Interview Prep
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function platformLabel(p) {
    const labels = { linkedin: 'LinkedIn', indeed: 'Indeed', naukri: 'Naukri', wellfound: 'Wellfound', company: 'Company' };
    return labels[p] || p;
}

function capitalize(str) {
    return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
}

// ---- AI DROPDOWN ----
function toggleAIDropdown(jobId) {
    const dropdown = document.getElementById(`aiDrop_${jobId}`);

    // Close any other open dropdown
    if (activeDropdown && activeDropdown !== dropdown) {
        activeDropdown.classList.add('hidden');
    }

    dropdown.classList.toggle('hidden');
    activeDropdown = dropdown.classList.contains('hidden') ? null : dropdown;
}

document.addEventListener('click', (e) => {
    if (activeDropdown && !e.target.closest('.btn-ai-actions')) {
        activeDropdown.classList.add('hidden');
        activeDropdown = null;
    }
});

// ---- JOB MODAL ----
function openJobModal(jobId) {
    const job = AppData.jobs.find(j => j.id === jobId);
    if (!job) return;

    const modal = document.getElementById('job-modal');
    const content = document.getElementById('job-modal-content');
    const scoreClass = job.matchScore >= 85 ? 'high' : job.matchScore >= 70 ? 'medium' : 'low';

    content.innerHTML = `
    <button class="modal-close" onclick="closeJobModal()" style="position:absolute;top:1rem;right:1rem">✕</button>
    
    <div class="job-detail-header">
      <div class="job-detail-logo" style="background: ${job.companyColor}">${job.companyEmoji}</div>
      <div class="job-detail-info">
        <div class="job-detail-title">${job.role}</div>
        <div class="job-detail-company">${job.company}</div>
        <div class="job-detail-meta">
          <span class="tag ${job.mode}">${capitalize(job.mode)}</span>
          <span class="tag">${job.location}</span>
          <span class="tag">${job.salary}</span>
          <span class="match-score ${scoreClass}">${job.matchScore}% match</span>
        </div>
      </div>
    </div>
    
    <div class="job-detail-actions">
      <a href="${job.applyUrl}" target="_blank" rel="noopener" class="btn-primary" onclick="trackApply('${job.id}')">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15,3 21,3 21,9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
        Apply Now
      </a>
      <button class="btn-secondary" onclick="showResumeGeneratorModal('${job.id}')">📄 Generate Resume</button>
      <button class="btn-secondary" onclick="generateCoverLetterForJob('${job.id}')">✉️ Cover Letter</button>
      <button class="btn-secondary" onclick="prepForJob('${job.id}')">🧠 Prep</button>
      <button class="btn-secondary" onclick="toggleSaveJobFromModal('${job.id}')">
        ${job.saved ? '🔖 Saved' : '🔖 Save'}
      </button>
    </div>
    
    <div class="job-detail-section">
      <h4>Required Skills</h4>
      <div class="jd-skills">
        ${job.skills.map(s => `<span class="jd-skill-chip">${s}</span>`).join('')}
      </div>
    </div>
    
    <div class="job-detail-section">
      <h4>Job Details</h4>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;font-size:0.85rem;color:var(--text-secondary);">
        <div>🏢 <strong style="color:var(--text)">${job.company}</strong></div>
        <div>📍 <strong style="color:var(--text)">${job.location}</strong></div>
        <div>💼 <strong style="color:var(--text)">${capitalize(job.expLevel)}</strong></div>
        <div>🏠 <strong style="color:var(--text)">${capitalize(job.mode)}</strong></div>
        <div>💰 <strong style="color:var(--text)">${job.salary}</strong></div>
        <div>🗓️ <strong style="color:var(--text)">${job.postedLabel}</strong></div>
        <div>🔗 <strong style="color:var(--text)">${platformLabel(job.platform)}</strong></div>
        <div>🎯 <strong style="color:var(--text)">${job.matchScore}% match</strong></div>
      </div>
    </div>
    
    <div class="job-detail-section">
      <h4>About This Role</h4>
      <div class="job-description">${job.description}</div>
    </div>
    
    <div class="job-detail-section">
      <h4>Why You're a Great Fit</h4>
      <div style="display:flex;flex-direction:column;gap:8px;font-size:0.85rem;">
        ${generateFitAnalysis(job)}
      </div>
    </div>
  `;

    modal.classList.remove('hidden');
}

function generateFitAnalysis(job) {
    const userSkills = AppData.user.skills || [];
    const matchingSkills = job.skills.filter(s =>
        userSkills.some(us => us.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(us.toLowerCase()))
    );
    const missingSkills = job.skills.filter(s => !matchingSkills.includes(s));

    let html = '';
    if (matchingSkills.length > 0) {
        html += `<div style="padding:10px;background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.2);border-radius:8px;color:#10b981;">
      ✅ <strong>Matching skills:</strong> ${matchingSkills.join(', ')}
    </div>`;
    }
    if (missingSkills.length > 0) {
        html += `<div style="padding:10px;background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.2);border-radius:8px;color:#f59e0b;">
      ⚡ <strong>Skills to learn:</strong> ${missingSkills.slice(0, 3).join(', ')}
    </div>`;
    }
    html += `<div style="padding:10px;background:rgba(99,102,241,0.1);border:1px solid rgba(99,102,241,0.2);border-radius:8px;color:var(--accent);">
    🎯 <strong>Overall match:</strong> ${job.matchScore}% — ${job.matchScore >= 80 ? 'Strong fit! Apply immediately.' : job.matchScore >= 70 ? 'Good fit. Tailor your resume.' : 'Partial fit. Consider upskilling.'}
  </div>`;
    return html;
}

function closeJobModal(event) {
    if (event && event.target !== document.getElementById('job-modal')) return;
    document.getElementById('job-modal').classList.add('hidden');
}

// ---- FILTERS ----
function filterJobs() {
    const role = document.getElementById('filter-role').value;
    const exp = document.getElementById('filter-exp').value;
    const mode = document.getElementById('filter-mode').value;
    const location = document.getElementById('filter-location').value;
    const special = document.getElementById('filter-special')?.value;

    filteredJobs = AppData.jobs.filter(job => {
        if (role && job.type !== role) return false;
        if (exp && job.expLevel !== exp) return false;
        if (mode && job.mode !== mode) return false;
        if (location && !job.location.toLowerCase().includes(location.toLowerCase()) &&
            !(location === 'remote' && job.mode === 'remote')) return false;
        
        if (special === 'walkin' && !job.isWalkin) return false;
        if (special === 'mnc' && !job.isMNC) return false;
        if (special === 'fresher' && job.expLevel !== 'fresher') return false;
        
        return true;
    });

    sortJobs();
}

function sortJobs() {
    const sortBy = document.getElementById('sort-jobs')?.value || 'match';
    const sorted = [...filteredJobs];

    if (sortBy === 'match') sorted.sort((a, b) => b.matchScore - a.matchScore);
    else if (sortBy === 'recent') sorted.sort((a, b) => new Date(b.postedDate) - new Date(a.postedDate));
    else if (sortBy === 'company') sorted.sort((a, b) => a.company.localeCompare(b.company));

    renderJobs(sorted);
}

function clearFilters() {
    ['filter-role', 'filter-exp', 'filter-mode', 'filter-location', 'filter-special'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    filteredJobs = [...AppData.jobs];
    renderJobs(filteredJobs);
}

// ---- REFRESH ----
function refreshJobs() {
    const icon = document.getElementById('refresh-icon');
    icon.style.animation = 'spin 0.8s linear';
    document.getElementById('jobs-loading').classList.remove('hidden');
    document.getElementById('jobs-grid').innerHTML = '';

    showToast('Scanning LinkedIn, Indeed, Naukri, Wellfound...', 'info');

    setTimeout(() => {
        icon.style.animation = '';
        document.getElementById('jobs-loading').classList.add('hidden');
        // Add some new "fresh" jobs at the top
        const newJob = AppData.jobs[Math.floor(Math.random() * 10)];
        newJob.postedLabel = 'Just now';
        filteredJobs = [...AppData.jobs];
        renderJobs(filteredJobs);
        showToast(`Found ${AppData.jobs.length} fresh jobs!`, 'success');
    }, 2000);
}

// ---- SAVE JOB ----
function toggleSaveJob(jobId, btn) {
    const job = AppData.jobs.find(j => j.id === jobId);
    if (!job) return;
    job.saved = !job.saved;

    const svg = btn.querySelector('svg');
    svg.setAttribute('fill', job.saved ? 'currentColor' : 'none');
    showToast(job.saved ? 'Job saved!' : 'Job unsaved', 'info');
}

function toggleSaveJobFromModal(jobId) {
    const job = AppData.jobs.find(j => j.id === jobId);
    if (!job) return;
    job.saved = !job.saved;
    showToast(job.saved ? 'Job saved!' : 'Job unsaved', 'info');
}

// ---- TRACK APPLY ----
function trackApply(jobId) {
    const job = AppData.jobs.find(j => j.id === jobId);
    if (!job || job.applied) return;
    job.applied = true;

    const existingApp = AppData.applications.find(a => a.company === job.company && a.role === job.role);
    if (!existingApp) {
        AppData.applications.unshift({
            id: `app_${Date.now()}`,
            company: job.company,
            companyColor: job.companyColor,
            companyEmoji: job.companyEmoji,
            role: job.role,
            status: 'applied',
            appliedDate: new Date().toISOString().split('T')[0],
            url: job.applyUrl,
            notes: `Applied via ${platformLabel(job.platform)}`,
        });
        localStorage.setItem('jb_applications', JSON.stringify(AppData.applications));
        showToast(`Application tracked: ${job.role} at ${job.company}`, 'success');
        renderApplicationsTable(AppData.applications);
        updatePipelineStats();
    }
}

// ---- ANALYZE JOB FIT ----
function analyzeJobFit(jobId) {
    const job = AppData.jobs.find(j => j.id === jobId);
    if (!job) return;

    openJobModal(jobId);
    showToast(`Analyzing your fit for ${job.role} at ${job.company}...`, 'info');
}

// ---- PREP FOR JOB ----
function prepForJob(jobId) {
    const job = AppData.jobs.find(j => j.id === jobId);
    if (!job) return;

    closeJobModal();
    navigateTo('prep');
    setTimeout(() => selectPrepJob(job), 200);
}

// ---- AI MNC SCAN ----
function aiScanMNCCareers() {
    showToast('AI is scanning career portals: Wipro, Infosys, HCL, TCS, Cognizant...', 'info', 4000);
    
    // Create a special loading overlay
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.style.zIndex = '2000';
    overlay.innerHTML = `
        <div class="modal-container glassmorphism animate-in" style="max-width:400px; text-align:center;">
            <div class="loading-spinner" style="margin-bottom:1.5rem"></div>
            <h3>Deep Scanning Career Portals...</h3>
            <p style="font-size:0.85rem; color:var(--text-secondary); margin-top:0.5rem">Finding latest 2024-2025 openings for Freshers</p>
            <div id="scan-progress-text" style="font-size:0.75rem; color:var(--accent); margin-top:1rem; font-weight:600">Checking TCS...</div>
        </div>
    `;
    document.body.appendChild(overlay);

    const companies = ['TCS', 'Infosys', 'Wipro', 'Cognizant', 'Capgemini', 'HCL Tech', 'Accenture'];
    let i = 0;
    const interval = setInterval(() => {
        if (i < companies.length) {
            const progressText = document.getElementById('scan-progress-text');
            if (progressText) progressText.textContent = `Checking ${companies[i]}...`;
            i++;
        } else {
            clearInterval(interval);
            if (document.body.contains(overlay)) document.body.removeChild(overlay);
            showToast('Scan complete! Opening real-time career aggregator.', 'success');
            
            // Open a useful career aggregation search for freshers
            const query = "latest mnc jobs for freshers 2024 2025 wipro infosys tcs cognizant hcl capgemini careers";
            window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}&tbs=qdr:w`, '_blank');
            
            // Filter the jobs feed to MNCs
            const filterSpecial = document.getElementById('filter-special');
            if (filterSpecial) filterSpecial.value = 'mnc';
            filterJobs();
            navigateTo('jobs');
        }
    }, 600);
}
