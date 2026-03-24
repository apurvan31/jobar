/* =============================================
   job.bar — Frontend API Bridge
   Connects all frontend actions to the backend
   =============================================
   
   HOW IT WORKS:
   - API_BASE points to your backend URL
   - All auth tokens stored in localStorage
   - Socket.io for real-time updates
   - Gracefully falls back to local data if API fails
   ============================================= */

// ---- CONFIGURATION ----
const API_BASE = window.JB_API_BASE || 'http://localhost:5000/api';
const SOCKET_URL = window.JB_SOCKET_URL || 'http://localhost:5000';

// ---- TOKEN MANAGEMENT ----
const Auth = {
  getToken: () => localStorage.getItem('jb_token'),
  setToken: (token) => localStorage.setItem('jb_token', token),
  getRefreshToken: () => localStorage.getItem('jb_refresh'),
  setRefreshToken: (t) => localStorage.setItem('jb_refresh', t),
  clear: () => {
    localStorage.removeItem('jb_token');
    localStorage.removeItem('jb_refresh');
    localStorage.removeItem('jb_loggedin');
    localStorage.removeItem('jb_user');
  },
  isLoggedIn: () => !!localStorage.getItem('jb_token'),
};

// ---- HTTP CLIENT ----
const api = {
  _headers: () => {
    const h = { 'Content-Type': 'application/json' };
    const token = Auth.getToken();
    if (token) h['Authorization'] = `Bearer ${token}`;
    return h;
  },

  _handleResponse: async (res) => {
    if (res.status === 401) {
      // Try to refresh
      const refreshed = await api._refreshToken();
      if (!refreshed) {
        Auth.clear();
        if (typeof handleLogout === 'function') handleLogout(true);
        throw new Error('Session expired. Please log in again.');
      }
      throw new Error('TOKEN_REFRESHED'); // Signal caller to retry
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Request failed: ${res.status}`);
    return data;
  },

  _refreshToken: async () => {
    const refreshToken = Auth.getRefreshToken();
    if (!refreshToken) return false;
    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) return false;
      const { token, refreshToken: newRefresh } = await res.json();
      Auth.setToken(token);
      Auth.setRefreshToken(newRefresh);
      return true;
    } catch {
      return false;
    }
  },

  get: async (path) => {
    const res = await fetch(`${API_BASE}${path}`, { headers: api._headers() });
    return api._handleResponse(res);
  },

  post: async (path, body) => {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: api._headers(),
      body: JSON.stringify(body),
    });
    return api._handleResponse(res);
  },

  put: async (path, body) => {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'PUT',
      headers: api._headers(),
      body: JSON.stringify(body),
    });
    return api._handleResponse(res);
  },

  delete: async (path) => {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'DELETE',
      headers: api._headers(),
    });
    return api._handleResponse(res);
  },

  upload: async (path, formData) => {
    const token = Auth.getToken();
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers,
      body: formData,
    });
    return api._handleResponse(res);
  },
};

// ---- SOCKET.IO REAL-TIME ----
let socket = null;

const initSocket = (userId) => {
  if (socket) return;
  
  // Load Socket.io script dynamically
  if (typeof io === 'undefined') {
    const script = document.createElement('script');
    script.src = `${SOCKET_URL}/socket.io/socket.io.js`;
    script.onload = () => connectSocket(userId);
    document.head.appendChild(script);
  } else {
    connectSocket(userId);
  }
};

const connectSocket = (userId) => {
  socket = io(SOCKET_URL, { auth: { token: Auth.getToken() }, transports: ['websocket'] });

  socket.on('connect', () => {
    console.log('[Socket] Connected');
    if (userId) socket.emit('join-user-room', userId);
  });

  // ---- Real-time events ----
  socket.on('application-added', (data) => {
    showToast(data.message || 'New application tracked!', 'success');
    if (typeof loadApplicationsFromAPI === 'function') loadApplicationsFromAPI();
  });

  socket.on('application-status-updated', (data) => {
    showToast(`${data.company}: Status → ${data.status}`, 'info');
    if (typeof loadApplicationsFromAPI === 'function') loadApplicationsFromAPI();
  });

  socket.on('resume-parsed', (data) => {
    showToast('✅ Resume fully parsed!', 'success');
    if (typeof displayParsedData === 'function') displayParsedData(data.parsedData);
  });

  socket.on('autoapply-progress', (data) => {
    const icon = data.status === 'success' ? '✅' : data.status === 'failed' ? '❌' : '⏳';
    const el = document.getElementById(`aa-item-${data.jobId}`);
    if (el) el.querySelector('.aa-status')?.setAttribute('data-status', data.status);
    if (data.status !== 'processing') {
      showToast(`${icon} ${data.company} — ${data.status}`, data.status === 'success' ? 'success' : 'error', 2000);
    }
  });

  socket.on('autoapply-complete', (data) => {
    showToast(data.message, 'success', 5000);
    if (typeof updateAutoApplyStats === 'function') updateAutoApplyStats(data);
    if (typeof loadApplicationsFromAPI === 'function') loadApplicationsFromAPI();
  });

  socket.on('auto-apply-complete', (data) => {
    showToast(data.message, 'success', 4000);
  });

  socket.on('disconnect', () => console.log('[Socket] Disconnected'));
  socket.on('error', (err) => console.error('[Socket] Error:', err));
};

// ============================================
// ---- OVERRIDE AUTH FUNCTIONS ----
// ============================================

// Override handleLogin to use API
const _handleLoginOriginal = typeof handleLogin !== 'undefined' ? handleLogin : null;
window.handleLogin = async function () {
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value.trim();
  if (!email || !password) { showToast('Please enter email and password', 'error'); return; }

  const btn = document.querySelector('#login-form .btn-primary');
  btn.innerHTML = '<div class="loading-spinner" style="width:18px;height:18px;border-width:2px;margin:0 auto"></div>';
  btn.disabled = true;

  try {
    const data = await api.post('/auth/login', { email, password });
    Auth.setToken(data.token);
    Auth.setRefreshToken(data.refreshToken);
    localStorage.setItem('jb_user', JSON.stringify(data.user));
    localStorage.setItem('jb_loggedin', 'true');

    loginUser(data.user.name, data.user.email, data.user.id);
    showToast('Welcome back! 👋', 'success');
  } catch (err) {
    showToast(err.message, 'error');
    btn.innerHTML = '<span>Sign In</span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>';
    btn.disabled = false;
  }
};

// Override handleSignup
window.handleSignup = async function () {
  const name = document.getElementById('signup-name').value.trim();
  const email = document.getElementById('signup-email').value.trim();
  const password = document.getElementById('signup-password').value.trim();
  if (!name || !email || !password) { showToast('Please fill all fields', 'error'); return; }

  const btn = document.querySelector('#signup-form .btn-primary');
  btn.innerHTML = '<div class="loading-spinner" style="width:18px;height:18px;border-width:2px;margin:0 auto"></div>';
  btn.disabled = true;

  try {
    const data = await api.post('/auth/signup', { name, email, password });
    Auth.setToken(data.token);
    Auth.setRefreshToken(data.refreshToken);
    localStorage.setItem('jb_user', JSON.stringify(data.user));
    localStorage.setItem('jb_loggedin', 'true');

    loginUser(data.user.name, data.user.email, data.user.id);
    showToast('Account created! Welcome to job.bar 🎉', 'success');
  } catch (err) {
    showToast(err.message, 'error');
    btn.innerHTML = '<span>Create Account</span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>';
    btn.disabled = false;
  }
};

// Override handleGoogleAuth to redirect to Google OAuth
window.handleGoogleAuth = function () {
  showToast('Redirecting to Google...', 'info');
  window.location.href = `${API_BASE}/auth/google`;
};

// Override handleLogout
window.handleLogout = async function (forced = false) {
  try {
    if (Auth.getToken() && !forced) await api.post('/auth/logout', {});
  } catch (_) {}
  Auth.clear();
  if (socket) { socket.disconnect(); socket = null; }
  document.getElementById('app').classList.add('hidden');
  document.getElementById('auth-screen').classList.remove('hidden');
  document.getElementById('login-email').value = '';
  document.getElementById('login-password').value = '';
  const btn = document.querySelector('#login-form .btn-primary');
  if (btn) {
    btn.innerHTML = '<span>Sign In</span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>';
    btn.disabled = false;
  }
  showToast(forced ? 'Session expired. Please log in.' : 'Signed out successfully', forced ? 'warning' : 'info');
};

// Extend loginUser to init socket and load real data
const _loginUserOriginal = window.loginUser;
window.loginUser = function (name, email, userId) {
  // Call original loginUser (defined in app.js)
  if (_loginUserOriginal) _loginUserOriginal(name, email);
  
  // Init socket
  if (userId) initSocket(userId);
  
  // Load real data after login
  setTimeout(() => {
    loadDashboardStats();
    loadJobsFromAPI();
    loadApplicationsFromAPI();
    loadSavedJobsFromAPI();
  }, 500);
};

// ============================================
// ---- API DATA LOADERS ----
// ============================================

// Load dashboard stats
async function loadDashboardStats() {
  try {
    const { stats } = await api.get('/users/dashboard-stats');
    // Update stat numbers
    updateCountEl('ps-all', stats.totalApplications);
    updateCountEl('ps-applied', stats.applied);
    updateCountEl('ps-viewed', stats.viewed);
    updateCountEl('ps-shortlisted', stats.shortlisted);
    updateCountEl('ps-interview', stats.interview);
    updateCountEl('ps-offer', stats.offer);
    updateCountEl('saved-badge', stats.savedJobs);
  } catch (err) {
    console.warn('[API] Could not load dashboard stats:', err.message);
  }
}

function updateCountEl(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val || 0;
}

// ---- Load Jobs from API ----
async function loadJobsFromAPI(params = {}) {
  const grid = document.getElementById('jobs-grid');
  const loadingEl = document.getElementById('jobs-loading');
  if (!grid) return;

  if (loadingEl) loadingEl.classList.remove('hidden');
  
  try {
    const query = new URLSearchParams({
      limit: 30,
      sort: 'recent',
      ...params,
    }).toString();

    const data = await api.get(`/jobs?${query}`);
    const jobs = (data.jobs || []).map(j => ({
      id: j._id,
      role: j.title,
      company: j.company,
      companyColor: j.companyColor || '#6366f1',
      companyEmoji: j.companyEmoji || j.company[0],
      location: j.location,
      salary: j.salary,
      mode: j.mode,
      expLevel: j.expLevel,
      platform: j.platform,
      skills: j.skills || [],
      applyUrl: j.applyUrl,
      postedLabel: getPostedLabel(j.postedAt),
      matchScore: j.matchScore || Math.floor(Math.random() * 35) + 60,
      description: j.description || '',
      saved: j.isSaved || false,
      type: j.type,
    }));

    // Sync with AppData so existing JS still works
    AppData.jobs = jobs;
    if (typeof renderJobs === 'function') renderJobs(jobs);
    if (typeof renderHomeFeed === 'function') renderHomeFeed();

    document.getElementById('jobs-count').textContent = `${data.pagination?.total || jobs.length} jobs found`;
  } catch (err) {
    console.warn('[API] Could not load jobs:', err.message);
    // Fall back to mock jobs from AppData
    if (typeof renderJobs === 'function') renderJobs(AppData.jobs);
  } finally {
    if (loadingEl) loadingEl.classList.add('hidden');
  }
}

// ---- Load Applications from API ----
async function loadApplicationsFromAPI() {
  try {
    const data = await api.get('/applications');
    const apps = (data.applications || []).map(a => ({
      id: a._id,
      company: a.company,
      role: a.role,
      companyColor: a.companyColor || '#6366f1',
      companyEmoji: a.companyEmoji || a.company[0],
      status: a.status,
      appliedDate: a.appliedDate ? new Date(a.appliedDate).toISOString().split('T')[0] : '',
      url: a.applyUrl,
      notes: a.notes,
    }));

    AppData.applications = apps;
    if (typeof renderApplicationsTable === 'function') renderApplicationsTable(apps);
    if (typeof updatePipelineStats === 'function') updatePipelineStats();
    if (data.stats) {
      updateCountEl('ps-all', data.total);
      updateCountEl('ps-applied', data.stats.applied || 0);
      updateCountEl('ps-viewed', data.stats.viewed || 0);
      updateCountEl('ps-shortlisted', data.stats.shortlisted || 0);
      updateCountEl('ps-interview', data.stats.interview || 0);
      updateCountEl('ps-offer', data.stats.offer || 0);
    }
  } catch (err) {
    console.warn('[API] Could not load applications:', err.message);
  }
}

// ---- Load Saved Jobs from API ----
async function loadSavedJobsFromAPI() {
  try {
    const data = await api.get('/saved-jobs');
    const savedIds = new Set((data.savedJobs || []).map(s => s.job?._id || s.job));
    AppData.jobs.forEach(j => { j.saved = savedIds.has(j.id); });
    updateCountEl('saved-badge', data.total);
    if (typeof renderSavedJobs === 'function') renderSavedJobs(data.savedJobs);
  } catch (err) {
    console.warn('[API] Could not load saved jobs:', err.message);
  }
}

// ============================================
// ---- OVERRIDE INTERACTIVE FUNCTIONS ----
// ============================================

// Override trackApply to persist to API
const _trackApplyOriginal = window.trackApply;
window.trackApply = async function (jobId) {
  // Local state update (original logic)
  if (_trackApplyOriginal) _trackApplyOriginal(jobId);

  const job = AppData.jobs.find(j => j.id === jobId);
  if (!job || !Auth.getToken()) return;

  try {
    await api.post('/applications', {
      company: job.company,
      role: job.role,
      applyUrl: job.applyUrl,
      platform: job.platform,
      status: 'applied',
      jobId: jobId,
    });
  } catch (err) {
    if (!err.message.includes('already tracked')) {
      console.warn('[API] Could not track application:', err.message);
    }
  }
};

// Override toggleSaveJob to persist to API
const _toggleSaveJobOriginal = window.toggleSaveJob;
window.toggleSaveJob = async function (jobId, btn) {
  if (_toggleSaveJobOriginal) _toggleSaveJobOriginal(jobId, btn);
  const job = AppData.jobs.find(j => j.id === jobId);
  if (!job || !Auth.getToken()) return;

  try {
    if (job.saved) {
      await api.post(`/saved-jobs/${jobId}`, {});
    } else {
      await api.delete(`/saved-jobs/${jobId}`);
    }
    const savedCount = AppData.jobs.filter(j => j.saved).length;
    updateCountEl('saved-badge', savedCount);
  } catch (err) {
    console.warn('[API] Could not toggle save job:', err.message);
  }
};

// Override addApplication to persist to API
const _addApplicationOriginal = window.addApplication;
window.addApplication = async function () {
  const company = document.getElementById('new-app-company').value.trim();
  const role = document.getElementById('new-app-role').value.trim();
  if (!company || !role) { showToast('Company and role are required', 'error'); return; }

  try {
    if (Auth.getToken()) {
      await api.post('/applications', {
        company,
        role,
        status: document.getElementById('new-app-status')?.value || 'applied',
        applyUrl: document.getElementById('new-app-url')?.value || '',
        notes: document.getElementById('new-app-notes')?.value || '',
      });
    }
    // Also run original for local state
    if (_addApplicationOriginal) _addApplicationOriginal();
    else {
      document.getElementById('add-app-modal')?.classList.add('hidden');
      showToast(`Application added: ${role} at ${company}`, 'success');
    }
    await loadApplicationsFromAPI();
  } catch (err) {
    showToast(err.message, 'error');
  }
};

// Override saveProfile to persist to API
const _saveProfileOriginal = window.saveProfile;
window.saveProfile = async function () {
  if (_saveProfileOriginal) _saveProfileOriginal();
  if (!Auth.getToken()) return;

  try {
    const profileData = {
      name: document.getElementById('prof-name')?.value,
      phone: document.getElementById('prof-phone')?.value,
      location: document.getElementById('prof-location')?.value,
      linkedin: document.getElementById('prof-linkedin')?.value,
      portfolio: document.getElementById('prof-portfolio')?.value,
      jobTitle: document.getElementById('prof-role')?.value,
      skills: document.getElementById('prof-skills')?.value?.split(',').map(s => s.trim()).filter(Boolean),
      expectedSalary: document.getElementById('prof-salary')?.value,
      about: document.getElementById('prof-about')?.value,
    };
    await api.put('/users/profile', profileData);
  } catch (err) {
    console.warn('[API] Could not save profile:', err.message);
  }
};

// Override handleResumeUpload to upload to API
const _handleResumeUploadOriginal = window.handleResumeUpload;
window.handleResumeUpload = async function (input) {
  const file = input.files[0];
  if (!file) return;

  if (!Auth.getToken()) {
    showToast('Please log in to upload resumes', 'error');
    return;
  }

  // Show progress UI
  document.getElementById('upload-progress')?.classList.remove('hidden');
  document.getElementById('upload-filename').textContent = file.name;
  const fill = document.getElementById('upload-progress-fill');
  const status = document.getElementById('upload-status');

  try {
    // Animate progress
    let progress = 0;
    const progressInterval = setInterval(() => {
      progress = Math.min(progress + 10, 85);
      if (fill) fill.style.width = progress + '%';
    }, 200);

    const formData = new FormData();
    formData.append('resume', file);
    
    const data = await api.upload('/resumes/upload', formData);

    clearInterval(progressInterval);
    if (fill) fill.style.width = '100%';
    if (status) status.textContent = '✅ Resume uploaded & parsed!';

    // Display parsed data
    if (data.resume?.parsedData && typeof displayParsedData === 'function') {
      displayParsedData(data.resume.parsedData);
    }

    // Update AppData
    AppData.resumeUploaded = true;
    document.getElementById('resume-cta')?.classList.add('hidden');

    showToast(`Resume "${file.name}" uploaded! ATS Score: ${data.resume?.atsScore || 0}%`, 'success');

    // Show suggestions
    if (data.resume?.suggestions?.length > 0) {
      setTimeout(() => {
        showToast(`💡 AI Tip: ${data.resume.suggestions[0]}`, 'info', 5000);
      }, 2000);
    }
  } catch (err) {
    if (status) status.textContent = '❌ Upload failed';
    showToast('Upload failed: ' + err.message, 'error');
    // Fall back to local parse simulation
    if (_handleResumeUploadOriginal) _handleResumeUploadOriginal(input);
  }
};

// Override refreshJobs to fetch from API
const _refreshJobsOriginal = window.refreshJobs;
window.refreshJobs = async function () {
  const icon = document.getElementById('refresh-icon');
  if (icon) icon.style.animation = 'spin 0.8s linear infinite';
  const loadingEl = document.getElementById('jobs-loading');
  if (loadingEl) loadingEl.classList.remove('hidden');
  document.getElementById('jobs-grid').innerHTML = '';

  showToast('Scanning LinkedIn, Indeed, Naukri, Wellfound...', 'info');

  try {
    await loadJobsFromAPI();
    showToast(`Found ${AppData.jobs.length} fresh jobs!`, 'success');
  } catch {
    if (_refreshJobsOriginal) _refreshJobsOriginal();
  } finally {
    if (icon) icon.style.animation = '';
    if (loadingEl) loadingEl.classList.add('hidden');
  }
};

// Override filterJobs to use API params
const _filterJobsOriginal = window.filterJobs;
window.filterJobs = async function () {
  if (_filterJobsOriginal) _filterJobsOriginal(); // for instant local filter

  if (!Auth.getToken()) return;
  const role = document.getElementById('filter-role')?.value;
  const exp = document.getElementById('filter-exp')?.value;
  const mode = document.getElementById('filter-mode')?.value;
  const location = document.getElementById('filter-location')?.value;
  const platform = document.getElementById('filter-platform')?.value;

  try {
    await loadJobsFromAPI({ role, expLevel: exp, mode, location, platform });
  } catch (_) {}
};

// Override autoApplySaved
window.autoApplySaved = async function () {
  if (!Auth.getToken()) { showToast('Please log in first', 'error'); return; }
  showToast('Auto-applying to all saved jobs...', 'info');
  try {
    const data = await api.post('/saved-jobs/actions/auto-apply-all', {});
    showToast(data.message, 'success');
    await loadApplicationsFromAPI();
  } catch (err) {
    showToast(err.message, 'error');
  }
};

// Override startAutoApplySession
const _startAutoApplyOriginal = window.startAutoApplySession;
window.startAutoApplySession = async function () {
  if (!Auth.getToken()) { showToast('Please log in first', 'error'); return; }

  const queueItems = document.querySelectorAll('#apply-queue-list .queue-item[data-job-id]');
  const jobIds = [...queueItems].map(el => el.dataset.jobId).filter(Boolean);

  if (jobIds.length === 0) {
    // Use top jobs from AppData
    const topJobs = AppData.jobs.slice(0, 10).map(j => j.id).filter(Boolean);
    if (topJobs.length === 0) {
      showToast('No jobs in queue. Add jobs first.', 'warning');
      if (_startAutoApplyOriginal) _startAutoApplyOriginal();
      return;
    }
    try {
      await api.post('/autoapply/start', { jobIds: topJobs });
      showToast(`Auto-apply started for ${topJobs.length} jobs! Watch for real-time updates.`, 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
    return;
  }

  try {
    await api.post('/autoapply/start', { jobIds });
    showToast(`Auto-apply engine started for ${jobIds.length} jobs!`, 'success');
  } catch (err) {
    showToast(err.message, 'error');
    if (_startAutoApplyOriginal) _startAutoApplyOriginal();
  }
};

// Override AI features to use API
const _generateCoverLetterOriginal = window.generateCoverLetter;
window.generateCoverLetter = async function () {
  const company = document.getElementById('cl-company')?.value?.trim();
  const role = document.getElementById('cl-role')?.value?.trim();
  const jd = document.getElementById('cl-jd')?.value || '';
  const tone = document.getElementById('cl-tone')?.value || 'Professional';

  if (!company || !role) { showToast('Company and role are required', 'error'); return; }

  const btn = document.querySelector('#cover-modal-body .btn-primary');
  if (btn) { btn.textContent = '⏳ Generating...'; btn.disabled = true; }

  try {
    if (Auth.getToken()) {
      const data = await api.post('/ai/cover-letter', { company, role, jobDescription: jd, tone });
      if (typeof storeCoverLetter === 'function') storeCoverLetter(company, role, data.coverLetter, tone);
      else showToast('Cover letter generated! Check Cover Letters tab.', 'success');
    } else {
      if (_generateCoverLetterOriginal) _generateCoverLetterOriginal();
    }
  } catch (err) {
    showToast('AI generation failed: ' + err.message, 'error');
    if (_generateCoverLetterOriginal) _generateCoverLetterOriginal();
  } finally {
    if (btn) { btn.textContent = '✨ Generate with AI'; btn.disabled = false; }
  }
};

// Override exportApplicationsCSV to use API endpoint
window.exportApplicationsCSV = async function () {
  if (!Auth.getToken()) {
    // Use local export
    const apps = AppData.applications;
    const rows = [['Company', 'Role', 'Status', 'Applied', 'URL', 'Notes'],
      ...apps.map(a => [a.company, a.role, a.status, a.appliedDate, a.url || '', a.notes || ''])];
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = 'data:text/csv,' + encodeURIComponent(csv);
    a.download = 'applications.csv';
    a.click();
    return;
  }
  window.location.href = `${API_BASE}/applications/export/csv`;
};

// ---- Utility: compute posted label ----
function getPostedLabel(dateStr) {
  if (!dateStr) return 'Recently';
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000 / 60);
  if (diff < 60) return `${diff}m ago`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
  if (diff < 10080) return `${Math.floor(diff / 1440)}d ago`;
  return 'Older';
}

// ---- Handle Google OAuth redirect ----
(function handleOAuthRedirect() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');
  const refreshToken = params.get('refreshToken');
  const userId = params.get('userId');

  if (token) {
    Auth.setToken(token);
    if (refreshToken) Auth.setRefreshToken(refreshToken);
    localStorage.setItem('jb_loggedin', 'true');

    // Clean URL
    window.history.replaceState({}, document.title, window.location.pathname);

    // Fetch user profile
    api.get('/users/profile').then(({ user }) => {
      localStorage.setItem('jb_user', JSON.stringify(user));
      loginUser(user.name, user.email, user.id || userId);
      showToast('Signed in with Google! 🎉', 'success');
    }).catch(() => {
      showToast('Signed in successfully!', 'success');
    });
  }
})();

// ---- Auto-restore session ----
window.addEventListener('DOMContentLoaded', () => {
  if (Auth.isLoggedIn()) {
    // The original app.js boots if jb_loggedin is set,
    // but we also init the socket and load real data
    const user = JSON.parse(localStorage.getItem('jb_user') || '{}');
    if (user.id) {
      setTimeout(() => {
        initSocket(user.id);
        loadJobsFromAPI();
        loadApplicationsFromAPI();
        loadSavedJobsFromAPI();
        loadDashboardStats();
      }, 600);
    }
  }
});

console.log('[job.bar] API bridge loaded. Backend:', API_BASE);
