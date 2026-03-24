/* =============================================
   job.bar — Auto Apply Engine
   Smart automation system for job applications
   ============================================= */

let autoApplyQueue = [];
let pendingInfoQueue = [];
let autoApplyStats = { total: 0, pending: 0, success: 0, timeSaved: 0 };
let isAutoApplying = false;

// ATS detection patterns
const ATS_SYSTEMS = {
  workday: ['workday.com', 'myworkdayjobs.com'],
  greenhouse: ['greenhouse.io', 'boards.greenhouse.io'],
  lever: ['jobs.lever.co', 'lever.co'],
  taleo: ['taleo.net', 'tbe.taleo.net'],
  icims: ['icims.com', 'jobs.icims.com'],
  successfactors: ['successfactors.com', 'sapsf.com'],
  linkedin: ['linkedin.com/jobs'],
  smartrecruiters: ['smartrecruiters.com'],
  bamboohr: ['bamboohr.com'],
};

// Fields that different ATS systems typically require
const ATS_REQUIRED_FIELDS = {
  workday: ['salary', 'workAuth', 'relocate', 'visa'],
  greenhouse: ['github', 'linkedin', 'portfolio'],
  lever: ['linkedin', 'portfolio'],
  taleo: ['salary', 'notice', 'workAuth'],
  icims: ['salary', 'workAuth', 'gender', 'disability'],
  successfactors: ['salary', 'notice', 'workAuth', 'relocate'],
  linkedin: ['linkedin'],
  default: ['salary', 'notice'],
};

function detectATS(url) {
  for (const [ats, patterns] of Object.entries(ATS_SYSTEMS)) {
    if (patterns.some(p => url.toLowerCase().includes(p))) return ats;
  }
  return 'default';
}

function checkMissingFields(ats) {
  const univProfile = JSON.parse(localStorage.getItem('jb_univ_profile')) || {};
  const required = ATS_REQUIRED_FIELDS[ats] || ATS_REQUIRED_FIELDS.default;
  
  const fieldMap = {
    salary: univProfile.salary,
    workAuth: univProfile.workAuth,
    relocate: univProfile.relocate,
    visa: univProfile.visa,
    notice: univProfile.notice,
    github: AppData.user.github || document.getElementById('univ-github')?.value,
    linkedin: AppData.user.linkedin,
    portfolio: AppData.user.portfolio,
    gender: univProfile.gender,
    disability: univProfile.disability,
  };

  return required.filter(field => !fieldMap[field]);
}

function initAutoApplyPage() {
  renderApplyQueue();
  renderPendingQueue();
  updateAutoApplyStats();
}

function addTopJobsToQueue() {
  const topJobs = AppData.jobs
    .filter(j => j.matchScore >= 80 && !j.applied && !autoApplyQueue.find(q => q.id === j.id))
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 10);
    
  topJobs.forEach(job => {
    const ats = detectATS(job.applyUrl);
    const missingFields = checkMissingFields(ats);
    
    if (missingFields.length === 0) {
      autoApplyQueue.push({ ...job, ats, status: 'ready' });
    } else {
      pendingInfoQueue.push({ ...job, ats, missingFields, status: 'pending' });
      autoApplyStats.pending++;
    }
  });

  renderApplyQueue();
  renderPendingQueue();
  updateAutoApplyStats();
  showToast(`Added ${topJobs.length} top jobs to apply queue!`, 'success');
}

function addToApplyQueue(jobId) {
  const job = AppData.jobs.find(j => j.id === jobId);
  if (!job) return;
  
  if (autoApplyQueue.find(q => q.id === jobId) || pendingInfoQueue.find(q => q.id === jobId)) {
    showToast('Job already in queue', 'info');
    return;
  }

  const ats = detectATS(job.applyUrl);
  const missingFields = checkMissingFields(ats);
  
  if (missingFields.length === 0) {
    autoApplyQueue.push({ ...job, ats, status: 'ready' });
    renderApplyQueue();
    showToast(`${job.role} at ${job.company} added to apply queue!`, 'success');
  } else {
    pendingInfoQueue.push({ ...job, ats, missingFields, status: 'pending' });
    autoApplyStats.pending++;
    renderPendingQueue();
    updateAutoApplyStats();
    showToast(`Need more info for ${job.company} (${missingFields.join(', ')})`, 'warning');
  }
}

function renderApplyQueue() {
  const list = document.getElementById('apply-queue-list');
  if (!list) return;
  
  if (autoApplyQueue.length === 0) {
    list.innerHTML = `
    <div class="queue-empty">
      <div style="font-size:2rem;margin-bottom:0.5rem;">⚡</div>
      <p>Queue is empty. Add top job matches or save jobs to auto-apply.</p>
      <button class="btn-secondary" onclick="addTopJobsToQueue()" style="margin-top:0.75rem">Add Top 10 Matches</button>
    </div>`;
    return;
  }
  
  list.innerHTML = autoApplyQueue.map(job => `
    <div class="queue-item ${job.status === 'applying' ? 'applying' : ''} ${job.status === 'done' ? 'done' : ''}" id="qi_${job.id}">
      <div class="queue-item-logo" style="background:${job.companyColor}">${job.companyEmoji}</div>
      <div class="queue-item-info">
        <div class="queue-item-role">${job.role}</div>
        <div class="queue-item-company">${job.company} · <span class="ats-label">${(job.ats || 'direct').toUpperCase()}</span></div>
      </div>
      <div class="queue-item-score match-score ${job.matchScore >= 85 ? 'high' : 'medium'}">${job.matchScore}%</div>
      <div class="queue-item-status">
        ${job.status === 'done' ? '<span style="color:var(--success);font-size:0.8rem">✅ Applied</span>' :
          job.status === 'applying' ? '<span style="color:var(--accent);font-size:0.8rem">⚡ Applying...</span>' :
          `<button class="btn-secondary" style="font-size:0.78rem;padding:5px 10px" onclick="applySingleJob('${job.id}')">Apply Now</button>`}
      </div>
      <button class="btn-icon danger" onclick="removeFromQueue('${job.id}')" title="Remove">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
      </button>
    </div>
  `).join('');
}

function renderPendingQueue() {
  const list = document.getElementById('pending-queue-list');
  if (!list) return;
  
  if (pendingInfoQueue.length === 0) {
    list.innerHTML = `
    <div class="queue-empty" style="border-color:rgba(245,158,11,0.2)">
      <div style="font-size:2rem;margin-bottom:0.5rem;">✅</div>
      <p style="color:var(--success)">No pending information needed! All jobs in queue are ready.</p>
    </div>`;
    return;
  }
  
  list.innerHTML = pendingInfoQueue.map(job => `
    <div class="queue-item pending-item" id="pq_${job.id}">
      <div class="queue-item-logo" style="background:${job.companyColor}">${job.companyEmoji}</div>
      <div class="queue-item-info">
        <div class="queue-item-role">${job.role}</div>
        <div class="queue-item-company">${job.company}</div>
        <div class="missing-fields">
          Missing: ${job.missingFields.map(f => `<span class="missing-tag">${f}</span>`).join(' ')}
        </div>
      </div>
      <button class="btn-secondary" style="font-size:0.78rem;padding:5px 10px;border-color:var(--warning);color:var(--warning)" onclick="fillMissingInfo('${job.id}')">Fill Info</button>
    </div>
  `).join('');
}

function removeFromQueue(jobId) {
  autoApplyQueue = autoApplyQueue.filter(j => j.id !== jobId);
  renderApplyQueue();
  updateAutoApplyStats();
}

function applySingleJob(jobId) {
  const job = autoApplyQueue.find(j => j.id === jobId);
  if (!job) return;
  
  job.status = 'applying';
  renderApplyQueue();
  
  const steps = [
    `🌐 Opening ${job.company} career portal...`,
    `📋 Filling application form (${(job.ats || 'direct').toUpperCase()} detected)...`,
    `📄 Uploading AI-tailored resume...`,
    `✉️ Attaching personalized cover letter...`,
    `✅ Submitting application...`,
  ];
  
  let i = 0;
  const logEntry = addActivityLog(`⚡ Starting application: ${job.role} at ${job.company}`);
  
  const interval = setInterval(() => {
    if (i < steps.length) {
      updateActivityLog(logEntry, steps[i]);
      i++;
    } else {
      clearInterval(interval);
      job.status = 'done';
      job.applied = true;
      autoApplyStats.total++;
      autoApplyStats.timeSaved += 8;
      
      // Track in applications
      if (!AppData.applications.find(a => a.company === job.company && a.role === job.role)) {
        AppData.applications.unshift({
          id: `app_${Date.now()}`,
          company: job.company,
          companyColor: job.companyColor,
          companyEmoji: job.companyEmoji,
          role: job.role,
          status: 'applied',
          appliedDate: new Date().toISOString().split('T')[0],
          url: job.applyUrl,
          notes: `Auto-applied via job.bar AI Engine (${(job.ats || 'direct').toUpperCase()})`,
        });
        localStorage.setItem('jb_applications', JSON.stringify(AppData.applications));
        renderApplicationsTable?.(AppData.applications);
        updatePipelineStats?.();
      }
      
      updateActivityLog(logEntry, `✅ Successfully applied to ${job.role} at ${job.company}!`, true);
      renderApplyQueue();
      updateAutoApplyStats();
      showToast(`✅ Applied to ${job.role} at ${job.company}!`, 'success');
    }
  }, 1200);
}

function startAutoApplySession() {
  if (isAutoApplying) {
    showToast('Auto apply is already running!', 'warning');
    return;
  }
  
  if (autoApplyQueue.filter(j => j.status === 'ready').length === 0) {
    addTopJobsToQueue();
    showToast('Added top matching jobs. Starting auto apply...', 'info');
    setTimeout(() => processAutoApplyQueue(), 2000);
    return;
  }
  
  processAutoApplyQueue();
}

function processAutoApplyQueue() {
  isAutoApplying = true;
  const readyJobs = autoApplyQueue.filter(j => j.status === 'ready');
  
  if (readyJobs.length === 0) {
    isAutoApplying = false;
    showToast('All jobs processed!', 'success');
    return;
  }
  
  showToast(`🤖 Auto applying to ${readyJobs.length} jobs...`, 'info');
  
  let idx = 0;
  const applyNext = () => {
    if (idx >= readyJobs.length) {
      isAutoApplying = false;
      showToast(`✅ Auto apply complete! Applied to ${readyJobs.length} jobs.`, 'success');
      return;
    }
    
    applySingleJob(readyJobs[idx].id);
    idx++;
    setTimeout(applyNext, readyJobs.length > 3 ? 8000 : 6000);
  };
  
  applyNext();
}

function addActivityLog(message) {
  const log = document.getElementById('aa-activity-log');
  if (!log) return null;
  
  const entry = document.createElement('div');
  entry.className = 'log-entry';
  entry.id = `log_${Date.now()}`;
  entry.innerHTML = `
    <div class="log-time">${new Date().toLocaleTimeString()}</div>
    <div class="log-msg">${message}</div>
    <div class="log-progress"><div class="log-progress-fill" style="width:0%"></div></div>
  `;
  
  // Remove empty state
  log.querySelector('div:only-child')?.remove();
  log.insertBefore(entry, log.firstChild);
  return entry.id;
}

function updateActivityLog(entryId, message, done = false) {
  const entry = document.getElementById(entryId);
  if (!entry) return;
  
  const steps = ['Opening portal', 'Filling form', 'Uploading resume', 'Adding cover letter', 'Submitting'];
  const matchedStep = steps.findIndex(s => message.toLowerCase().includes(s.toLowerCase().split(' ')[0]));
  const pct = done ? 100 : Math.min((matchedStep + 1) * 20, 95);
  
  entry.querySelector('.log-msg').textContent = message;
  entry.querySelector('.log-progress-fill').style.width = `${pct}%`;
  if (done) entry.querySelector('.log-progress-fill').style.background = 'var(--success)';
}

function updateAutoApplyStats() {
  const aaTotal = document.getElementById('aa-total');
  const aaPending = document.getElementById('aa-pending');
  const aaSuccess = document.getElementById('aa-success');
  const aaTime = document.getElementById('aa-time');
  
  if (aaTotal) aaTotal.textContent = autoApplyStats.total;
  if (aaPending) aaPending.textContent = pendingInfoQueue.length;
  if (aaSuccess) {
    const total = autoApplyStats.total + pendingInfoQueue.length;
    aaSuccess.textContent = total > 0 ? Math.round((autoApplyStats.total / Math.max(total, 1)) * 100) + '%' : '0%';
  }
  if (aaTime) aaTime.textContent = autoApplyStats.timeSaved > 0 ? `${autoApplyStats.timeSaved}m` : '0m';
  
  // Update page title badge
  const savedBadge = document.getElementById('saved-badge');
  const savedCount = AppData.jobs.filter(j => j.saved).length;
  if (savedBadge) savedBadge.textContent = savedCount;
}

function autoApplySaved() {
  const savedJobs = AppData.jobs.filter(j => j.saved && !j.applied);
  if (savedJobs.length === 0) {
    showToast('No saved jobs to apply to. Save some jobs first!', 'warning');
    return;
  }
  
  savedJobs.forEach(job => {
    if (!autoApplyQueue.find(q => q.id === job.id)) {
      const ats = detectATS(job.applyUrl);
      const missingFields = checkMissingFields(ats);
      if (missingFields.length === 0) {
        autoApplyQueue.push({ ...job, ats, status: 'ready' });
      } else {
        pendingInfoQueue.push({ ...job, ats, missingFields, status: 'pending' });
      }
    }
  });
  
  navigateTo('autoapply');
  renderApplyQueue();
  renderPendingQueue();
  updateAutoApplyStats();
  showToast(`Added ${savedJobs.length} saved jobs to apply queue!`, 'success');
}

function fillMissingInfo(jobId) {
  const job = pendingInfoQueue.find(j => j.id === jobId);
  if (!job) return;
  
  showToast(`Please fill the Universal Application Profile to apply to ${job.company}`, 'info');
  navigateTo('resume');
  
  // Scroll to universal profile section
  setTimeout(() => {
    const univCard = document.getElementById('universal-profile-card');
    if (univCard) univCard.scrollIntoView({ behavior: 'smooth' });
  }, 400);
}

function saveUniversalProfile() {
  const univProfile = {
    salary: document.getElementById('univ-salary')?.value,
    notice: document.getElementById('univ-notice')?.value,
    github: document.getElementById('univ-github')?.value,
    workAuth: document.getElementById('univ-work-auth')?.value,
    relocate: document.getElementById('univ-relocate')?.value,
    visa: document.getElementById('univ-visa')?.value,
    gender: document.getElementById('univ-gender')?.value,
    disability: document.getElementById('univ-disability')?.value,
    yoe: document.getElementById('univ-yoe')?.value,
    gradYear: document.getElementById('univ-grad-year')?.value,
    coverTemplate: document.getElementById('univ-cover-template')?.value,
  };
  
  localStorage.setItem('jb_univ_profile', JSON.stringify(univProfile));
  
  // Move pending items to ready if they now have the info
  const newPending = [];
  pendingInfoQueue.forEach(job => {
    const missingFields = checkMissingFields(job.ats);
    if (missingFields.length === 0) {
      autoApplyQueue.push({ ...job, status: 'ready' });
    } else {
      job.missingFields = missingFields;
      newPending.push(job);
    }
  });
  pendingInfoQueue.length = 0;
  pendingInfoQueue.push(...newPending);
  
  showToast('Universal Application Profile saved! Pending jobs moved to ready queue.', 'success');
  renderApplyQueue();
  renderPendingQueue();
  updateAutoApplyStats();
}

function renderSavedJobsPage() {
  const grid = document.getElementById('saved-jobs-grid');
  if (!grid) return;
  
  const savedJobs = AppData.jobs.filter(j => j.saved);
  const savedBadge = document.getElementById('saved-badge');
  if (savedBadge) savedBadge.textContent = savedJobs.length;
  
  if (savedJobs.length === 0) {
    grid.innerHTML = `
    <div class="empty-state" style="grid-column:1/-1">
      <div class="empty-icon">🔖</div>
      <h3>No saved jobs yet</h3>
      <p>Save jobs from the Job Feed by clicking the bookmark icon</p>
      <button class="btn-primary" onclick="navigateTo('jobs')" style="margin-top:1rem">Browse Jobs →</button>
    </div>`;
    return;
  }
  
  grid.innerHTML = savedJobs.map((job, i) => createJobCard(job, i)).join('');
}

// Update saved badge on save/unsave
const _originalToggleSaveJob = typeof toggleSaveJob === 'function' ? toggleSaveJob : null;

// Auto-load universal profile on page load
window.addEventListener('DOMContentLoaded', () => {
  const saved = JSON.parse(localStorage.getItem('jb_univ_profile'));
  if (saved) {
    setTimeout(() => {
      if (document.getElementById('univ-salary')) document.getElementById('univ-salary').value = saved.salary || '';
      if (document.getElementById('univ-notice')) document.getElementById('univ-notice').value = saved.notice || 'immediate';
      if (document.getElementById('univ-github')) document.getElementById('univ-github').value = saved.github || '';
      if (document.getElementById('univ-work-auth')) document.getElementById('univ-work-auth').value = saved.workAuth || 'citizen';
      if (document.getElementById('univ-relocate')) document.getElementById('univ-relocate').value = saved.relocate || 'yes';
      if (document.getElementById('univ-visa')) document.getElementById('univ-visa').value = saved.visa || 'no';
      if (document.getElementById('univ-gender')) document.getElementById('univ-gender').value = saved.gender || 'prefer_not';
      if (document.getElementById('univ-disability')) document.getElementById('univ-disability').value = saved.disability || 'prefer_not';
      if (document.getElementById('univ-yoe')) document.getElementById('univ-yoe').value = saved.yoe || '';
      if (document.getElementById('univ-grad-year')) document.getElementById('univ-grad-year').value = saved.gradYear || '';
      if (document.getElementById('univ-cover-template')) document.getElementById('univ-cover-template').value = saved.coverTemplate || '';
    }, 500);
  }
});

// Hook into navigateTo for saved/autoapply pages
const _origNavigateTo = navigateTo;
navigateTo = function(page) {
  _origNavigateTo(page);
  if (page === 'saved') renderSavedJobsPage();
  if (page === 'autoapply') initAutoApplyPage();
};
