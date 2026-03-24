/* =============================================
   job.bar — Core App
   Authentication, Navigation, Layout
   ============================================= */

// ---- AUTH ----
function switchAuthTab(tab) {
    document.getElementById('login-tab').classList.toggle('active', tab === 'login');
    document.getElementById('signup-tab').classList.toggle('active', tab === 'signup');
    document.getElementById('login-form').classList.toggle('hidden', tab !== 'login');
    document.getElementById('signup-form').classList.toggle('hidden', tab !== 'signup');
}

function handleLogin() {
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value.trim();
    if (!email || !password) { showToast('Please enter email and password', 'error'); return; }

    const btn = document.querySelector('#login-form .btn-primary');
    btn.innerHTML = '<div class="loading-spinner" style="width:18px;height:18px;border-width:2px;margin:0 auto"></div>';
    btn.disabled = true;

    setTimeout(() => {
        const name = email.split('@')[0].split('.').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        loginUser(name, email);
    }, 1200);
}

function handleSignup() {
    const name = document.getElementById('signup-name').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value.trim();
    if (!name || !email || !password) { showToast('Please fill all fields', 'error'); return; }

    const btn = document.querySelector('#signup-form .btn-primary');
    btn.innerHTML = '<div class="loading-spinner" style="width:18px;height:18px;border-width:2px;margin:0 auto"></div>';
    btn.disabled = true;

    setTimeout(() => {
        loginUser(name, email);
        showToast('Account created! Welcome to job.bar', 'success');
    }, 1400);
}

function handleGoogleAuth() {
    showToast('Connecting to Google...', 'info');
    setTimeout(() => {
        loginUser('Alex Johnson', 'alex@gmail.com');
        showToast('Signed in with Google!', 'success');
    }, 1000);
}

function loginUser(name, email) {
    const user = { ...AppData.user, name, email, avatar: name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) };
    AppData.user = user;
    AppData.isLoggedIn = true;
    localStorage.setItem('jb_user', JSON.stringify(user));
    localStorage.setItem('jb_loggedin', 'true');

    document.getElementById('auth-screen').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');
    initApp();
}

function handleLogout() {
    AppData.isLoggedIn = false;
    localStorage.removeItem('jb_loggedin');
    document.getElementById('app').classList.add('hidden');
    document.getElementById('auth-screen').classList.remove('hidden');
    // Reset form
    document.getElementById('login-email').value = '';
    document.getElementById('login-password').value = '';
    const btn = document.querySelector('#login-form .btn-primary');
    btn.innerHTML = '<span>Sign In</span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>';
    btn.disabled = false;
    showToast('Signed out successfully', 'info');
}

// ---- INIT ----
function initApp() {
    const user = AppData.user;
    const initials = user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

    document.getElementById('sidebar-username').textContent = user.name;
    document.getElementById('sidebar-avatar').textContent = initials;
    document.getElementById('topbar-avatar').textContent = initials;
    document.getElementById('greeting-name').textContent = user.name.split(' ')[0];
    document.getElementById('profile-avatar-big').textContent = initials;
    document.getElementById('profile-display-name').textContent = user.name;
    document.getElementById('prof-name').value = user.name;
    document.getElementById('prof-email').value = user.email;

    initHomePage();
    initJobsPage();
    initApplicationsPage();
    initCoverLettersPage();
    initPrepPage();
    initNotifications();
    animateNumbers();

    if (!AppData.resumeUploaded) {
        document.getElementById('resume-cta').classList.remove('hidden');
    }

    navigateTo('home');
}

// ---- NAVIGATION ----
function navigateTo(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

    const pageEl = document.getElementById(`page-${page}`);
    const navEl = document.getElementById(`nav-${page}`);

    if (pageEl) pageEl.classList.add('active');
    if (navEl) navEl.classList.add('active');

    // Close sidebar on mobile
    if (window.innerWidth < 768) {
        document.getElementById('sidebar').classList.remove('open');
        document.querySelector('.sidebar-overlay')?.remove();
    }

    window.scrollTo(0, 0);
}

// ---- SIDEBAR TOGGLE ----
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const isOpen = sidebar.classList.contains('open');

    if (window.innerWidth < 768) {
        if (isOpen) {
            sidebar.classList.remove('open');
            document.querySelector('.sidebar-overlay')?.remove();
        } else {
            sidebar.classList.add('open');
            const overlay = document.createElement('div');
            overlay.className = 'sidebar-overlay active';
            overlay.onclick = toggleSidebar;
            document.body.appendChild(overlay);
        }
    }
}

// ---- THEME TOGGLE ----
function toggleTheme() {
    const html = document.documentElement;
    const isDark = html.dataset.theme === 'dark';
    html.dataset.theme = isDark ? 'light' : 'dark';
    document.getElementById('theme-icon-sun').classList.toggle('hidden', !isDark);
    document.getElementById('theme-icon-moon').classList.toggle('hidden', isDark);
    localStorage.setItem('jb_theme', html.dataset.theme);
}

// ---- NOTIFICATIONS ----
function initNotifications() {
    const list = document.getElementById('notif-list');
    list.innerHTML = AppData.notifications.map(n => `
    <div class="notif-item">
      <div class="notif-item-icon">${n.icon}</div>
      <div class="notif-item-content">
        <div class="notif-item-title">${n.title}</div>
        <div class="notif-item-desc">${n.desc}</div>
        <div class="notif-item-time">${n.time}</div>
      </div>
    </div>
  `).join('');
}

function showNotifications() {
    const panel = document.getElementById('notifications-panel');
    const btn = document.getElementById('notif-btn');
    panel.classList.toggle('hidden');
    btn.querySelector('svg').classList.toggle('bell-shake', !panel.classList.contains('hidden'));
    document.querySelector('.notif-dot')?.remove();
}

function clearNotifications() {
    document.getElementById('notif-list').innerHTML = '<div class="empty-state-inline">No new notifications</div>';
    document.getElementById('notifications-panel').classList.add('hidden');
}

// Close notifications on outside click
document.addEventListener('click', (e) => {
    const panel = document.getElementById('notifications-panel');
    const btn = document.getElementById('notif-btn');
    if (panel && !panel.contains(e.target) && !btn?.contains(e.target)) {
        panel.classList.add('hidden');
    }
});

// ---- HOME PAGE ----
function initHomePage() {
    renderHomeFeed();
    renderPipelineChart();
    renderAISuggestions();
    renderUpcoming();
}

function renderHomeFeed() {
    const feed = document.getElementById('home-job-feed');
    const topJobs = AppData.jobs.slice(0, 6);

    feed.innerHTML = topJobs.map(job => `
    <a href="${job.applyUrl}" target="_blank" rel="noopener" class="job-mini-card" onclick="event.stopPropagation()">
      <div class="company-logo" style="background: ${job.companyColor}">${job.companyEmoji}</div>
      <div class="job-mini-info">
        <div class="job-mini-title">${job.role}</div>
        <div class="job-mini-company">${job.company}</div>
        <div class="job-mini-meta">
          <span class="tag ${job.mode}">${job.mode}</span>
          <span class="tag">${job.location}</span>
          <span class="tag new">${job.postedLabel}</span>
        </div>
      </div>
      <div class="match-score ${job.matchScore >= 85 ? 'high' : job.matchScore >= 70 ? 'medium' : 'low'}">${job.matchScore}%</div>
    </a>
  `).join('');
}

function renderPipelineChart() {
    const apps = AppData.applications;
    const statuses = [
        { label: 'Applied', key: 'applied', color: '#6366f1' },
        { label: 'Viewed', key: 'viewed', color: '#06b6d4' },
        { label: 'Shortlisted', key: 'shortlisted', color: '#f59e0b' },
        { label: 'Interview', key: 'interview', color: '#10b981' },
    ];
    const total = apps.length || 1;

    document.getElementById('pipeline-chart').innerHTML = statuses.map(s => {
        const count = apps.filter(a => a.status === s.key).length;
        const pct = Math.round((count / total) * 100);
        return `
      <div class="pipeline-item">
        <span class="pipeline-label">${s.label}</span>
        <div class="pipeline-bar">
          <div class="pipeline-fill" style="width: ${pct}%; background: ${s.color}"></div>
        </div>
        <span class="pipeline-count">${count}</span>
      </div>
    `;
    }).join('');
}

function renderAISuggestions() {
    const suggestions = [
        { icon: '💡', text: 'Add "Docker" and "Kubernetes" skills to boost your matches by 34%' },
        { icon: '📝', text: 'Your resume is missing a project section. Add 2-3 projects to stand out.' },
        { icon: '🎯', text: '18 new jobs at Flipkart and Razorpay match your profile today' },
        { icon: '⚡', text: 'Apply to 3 more jobs today to stay in recruiter algorithms' },
    ];

    document.getElementById('ai-suggestions-list').innerHTML = suggestions.map(s => `
    <div class="suggestion-item">
      <span class="suggestion-icon">${s.icon}</span>
      <span>${s.text}</span>
    </div>
  `).join('');
}

function renderUpcoming() {
    const events = [
        { day: '20', month: 'Feb', title: 'Technical Interview', sub: 'Google • 11:00 AM' },
        { day: '22', month: 'Feb', title: 'HR Round', sub: 'CRED • 3:00 PM' },
        { day: '25', month: 'Feb', title: 'Follow-up deadline', sub: 'Microsoft • 5:00 PM' },
    ];

    document.getElementById('upcoming-list').innerHTML = events.map(e => `
    <div class="upcoming-item">
      <div class="upcoming-date">
        <div class="upcoming-day">${e.day}</div>
        <div class="upcoming-month">${e.month}</div>
      </div>
      <div class="upcoming-info">
        <div class="upcoming-title">${e.title}</div>
        <div class="upcoming-sub">${e.sub}</div>
      </div>
    </div>
  `).join('');
}

// ---- ANIMATE NUMBERS ----
function animateNumbers() {
    document.querySelectorAll('.stat-number[data-target]').forEach(el => {
        const target = parseInt(el.dataset.target);
        let current = 0;
        const increment = target / 40;
        const timer = setInterval(() => {
            current = Math.min(current + increment, target);
            el.textContent = Math.floor(current);
            if (current >= target) clearInterval(timer);
        }, 30);
    });
}

// ---- GLOBAL SEARCH ----
function handleGlobalSearch(query) {
    if (!query.trim()) return;
    navigateTo('jobs');
    setTimeout(() => {
        // filter jobs by query
        const filtered = AppData.jobs.filter(j =>
            j.role.toLowerCase().includes(query.toLowerCase()) ||
            j.company.toLowerCase().includes(query.toLowerCase()) ||
            j.skills.some(s => s.toLowerCase().includes(query.toLowerCase()))
        );
        renderJobs(filtered);
        document.getElementById('jobs-count').textContent = `${filtered.length} results for "${query}"`;
    }, 100);
}

// ---- MODAL HELPERS ----
function closeModal(id, event) {
    if (event && event.target !== document.getElementById(id)) return;
    document.getElementById(id).classList.add('hidden');
}

function showUploadModal() { navigateTo('resume'); }

// ---- TOAST ----
function showToast(message, type = 'info', duration = 3500) {
    const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${icons[type]}</span> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'toastOut 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// ---- SAVE PROFILE ----
function saveProfile() {
    const user = {
        ...AppData.user,
        name: document.getElementById('prof-name').value,
        email: document.getElementById('prof-email').value,
        phone: document.getElementById('prof-phone').value,
        location: document.getElementById('prof-location').value,
        linkedin: document.getElementById('prof-linkedin').value,
        portfolio: document.getElementById('prof-portfolio').value,
        role: document.getElementById('prof-role').value,
        skills: document.getElementById('prof-skills').value.split(',').map(s => s.trim()),
        salary: document.getElementById('prof-salary').value,
        about: document.getElementById('prof-about').value,
    };

    AppData.user = user;
    localStorage.setItem('jb_user', JSON.stringify(user));

    const initials = user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    document.getElementById('sidebar-username').textContent = user.name;
    document.getElementById('sidebar-avatar').textContent = initials;
    document.getElementById('topbar-avatar').textContent = initials;
    document.getElementById('profile-avatar-big').textContent = initials;
    document.getElementById('profile-display-name').textContent = user.name;
    document.getElementById('profile-display-role').textContent = user.role || 'Developer';
    document.getElementById('greeting-name').textContent = user.name.split(' ')[0];

    showToast('Profile saved successfully!', 'success');
}

// ---- COVER LETTER MODAL ----
function showCoverLetterModal() {
    document.getElementById('cover-modal').classList.remove('hidden');
    document.getElementById('cover-modal-body').innerHTML = `
    <div class="form-group">
      <label>Target Company</label>
      <input type="text" id="cl-company" class="form-input" placeholder="Google, Meta, Stripe..." />
    </div>
    <div class="form-group">
      <label>Job Role</label>
      <input type="text" id="cl-role" class="form-input" placeholder="Software Engineer, Product Manager..." />
    </div>
    <div class="form-group">
      <label>Job Description Highlights (optional)</label>
      <textarea id="cl-jd" class="form-input" rows="4" placeholder="Paste key requirements from the job description..."></textarea>
    </div>
    <div class="form-group">
      <label>Tone</label>
      <select id="cl-tone" class="form-input">
        <option>Professional</option>
        <option>Enthusiastic</option>
        <option>Creative</option>
        <option>Technical</option>
      </select>
    </div>
    <button class="btn-primary btn-full" onclick="generateCoverLetter()">
      ✨ Generate with AI
    </button>
  `;
}

// ---- AUTO ADD APPLICATION MODAL ----
function showAddApplicationModal() {
    document.getElementById('add-app-modal').classList.remove('hidden');
}

function addApplication() {
    const company = document.getElementById('new-app-company').value.trim();
    const role = document.getElementById('new-app-role').value.trim();

    if (!company || !role) { showToast('Company and role are required', 'error'); return; }

    const app = {
        id: `app_${Date.now()}`,
        company, role,
        companyColor: `hsl(${Math.random() * 360}, 70%, 45%)`,
        companyEmoji: company[0].toUpperCase(),
        status: document.getElementById('new-app-status').value,
        url: document.getElementById('new-app-url').value,
        notes: document.getElementById('new-app-notes').value,
        appliedDate: new Date().toISOString().split('T')[0],
    };

    AppData.applications.unshift(app);
    localStorage.setItem('jb_applications', JSON.stringify(AppData.applications));

    closeModal('add-app-modal');
    renderApplicationsTable(AppData.applications);
    updatePipelineStats();
    showToast(`Application added: ${role} at ${company}`, 'success');

    // Clear form
    ['new-app-company', 'new-app-role', 'new-app-url', 'new-app-notes'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
}

// ---- LOAD SAVED THEME ----
const savedTheme = localStorage.getItem('jb_theme') || 'dark';
document.documentElement.dataset.theme = savedTheme;
document.getElementById('theme-icon-sun').classList.toggle('hidden', savedTheme === 'light');
document.getElementById('theme-icon-moon').classList.toggle('hidden', savedTheme === 'dark');

// ---- BOOT ----
window.addEventListener('DOMContentLoaded', () => {
    if (AppData.isLoggedIn) {
        document.getElementById('auth-screen').classList.add('hidden');
        document.getElementById('app').classList.remove('hidden');
        initApp();
    }

    // Profile stats
    document.getElementById('profile-stats').innerHTML = `
    <div class="prof-stat-item"><span class="prof-stat-label">Jobs Applied</span><span class="prof-stat-value">12</span></div>
    <div class="prof-stat-item"><span class="prof-stat-label">Profile Views</span><span class="prof-stat-value">47</span></div>
    <div class="prof-stat-item"><span class="prof-stat-label">Match Rate</span><span class="prof-stat-value">78%</span></div>
    <div class="prof-stat-item"><span class="prof-stat-label">Response Rate</span><span class="prof-stat-value">33%</span></div>
  `;
});
