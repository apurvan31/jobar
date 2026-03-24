/* =============================================
   job.bar — Applications
   Application tracking, Kanban, Table view
   ============================================= */

let currentView = 'table';
let currentStatusFilter = 'all';

// ---- INIT ----
function initApplicationsPage() {
    renderApplicationsTable(AppData.applications);
    renderKanbanBoard();
    updatePipelineStats();
}

// ---- STATS ----
function updatePipelineStats() {
    const apps = AppData.applications;
    document.getElementById('ps-all').textContent = apps.length;
    document.getElementById('ps-applied').textContent = apps.filter(a => a.status === 'applied').length;
    document.getElementById('ps-viewed').textContent = apps.filter(a => a.status === 'viewed').length;
    document.getElementById('ps-shortlisted').textContent = apps.filter(a => a.status === 'shortlisted').length;
    document.getElementById('ps-interview').textContent = apps.filter(a => a.status === 'interview').length;
    document.getElementById('ps-offer').textContent = apps.filter(a => a.status === 'offer').length;

    // Update home pipeline chart too
    renderPipelineChart();
}

// ---- TABLE VIEW ----
function renderApplicationsTable(apps) {
    const tbody = document.getElementById('applications-tbody');
    if (!tbody) return;

    const filtered = currentStatusFilter === 'all' ? apps : apps.filter(a => a.status === currentStatusFilter);

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:3rem;color:var(--text-muted)">No applications found. <a href="#" onclick="navigateTo('jobs')" style="color:var(--accent)">Find jobs to apply →</a></td></tr>`;
        return;
    }

    tbody.innerHTML = filtered.map(app => `
    <tr class="stagger-item fade-in">
      <td>
        <div class="app-company-cell">
          <div class="app-company-logo" style="background: ${app.companyColor}">${app.companyEmoji}</div>
          <div class="app-company-name">${app.company}</div>
        </div>
      </td>
      <td style="font-weight:500">${app.role}</td>
      <td>
        <select class="status-badge status-${app.status}" onchange="updateApplicationStatus('${app.id}', this.value)">
          <option value="applied" ${app.status === 'applied' ? 'selected' : ''}>Applied</option>
          <option value="viewed" ${app.status === 'viewed' ? 'selected' : ''}>Viewed</option>
          <option value="shortlisted" ${app.status === 'shortlisted' ? 'selected' : ''}>Shortlisted</option>
          <option value="interview" ${app.status === 'interview' ? 'selected' : ''}>Interview</option>
          <option value="rejected" ${app.status === 'rejected' ? 'selected' : ''}>Rejected</option>
          <option value="offer" ${app.status === 'offer' ? 'selected' : ''}>Offer 🎉</option>
        </select>
      </td>
      <td style="color:var(--text-secondary);font-size:0.82rem">${formatDate(app.appliedDate)}</td>
      <td>
        ${app.url ? `<a href="${app.url}" target="_blank" rel="noopener" class="app-link">
          View <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15,3 21,3 21,9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
        </a>` : '<span style="color:var(--text-muted)">—</span>'}
      </td>
      <td>
        <div class="notes-cell" title="${app.notes || ''}">${app.notes || '—'}</div>
      </td>
      <td>
        <div class="app-actions">
          <button class="btn-icon" onclick="prepForApplication('${app.id}')" title="Interview Prep">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22,4 12,14.01 9,11.01"/></svg>
          </button>
          <button class="btn-icon" onclick="generateResumeForApp('${app.id}')" title="Generate Resume">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>
          </button>
          <button class="btn-icon danger" onclick="deleteApplication('${app.id}')" title="Delete">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3,6 5,6 21,6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

// ---- KANBAN ----
function renderKanbanBoard() {
    const board = document.getElementById('kanban-board');
    if (!board) return;

    const columns = [
        { key: 'applied', label: '📋 Applied', color: '#6366f1' },
        { key: 'viewed', label: '👀 Viewed', color: '#06b6d4' },
        { key: 'shortlisted', label: '⭐ Shortlisted', color: '#f59e0b' },
        { key: 'interview', label: '🎤 Interview', color: '#10b981' },
        { key: 'offer', label: '🎉 Offer', color: '#22c55e' },
        { key: 'rejected', label: '❌ Rejected', color: '#ef4444' },
    ];

    board.innerHTML = columns.map(col => {
        const apps = AppData.applications.filter(a => a.status === col.key);
        return `
      <div class="kanban-column">
        <div class="kanban-col-header">
          <div class="kanban-col-title" style="color:${col.color}">
            <span>${col.label}</span>
          </div>
          <span class="kanban-col-count">${apps.length}</span>
        </div>
        <div class="kanban-cards" data-status="${col.key}">
          ${apps.map(app => `
            <div class="kanban-card" draggable="true" data-app-id="${app.id}">
              <div class="kanban-card-company">${app.company}</div>
              <div class="kanban-card-role">${app.role}</div>
              <div class="kanban-card-date">${formatDate(app.appliedDate)}</div>
            </div>
          `).join('')}
          ${apps.length === 0 ? '<div style="text-align:center;padding:1rem;color:var(--text-muted);font-size:0.8rem">Drop here</div>' : ''}
        </div>
      </div>
    `;
    }).join('');
}

// ---- VIEW SWITCH ----
function switchView(view) {
    currentView = view;
    document.getElementById('table-view-btn').classList.toggle('active', view === 'table');
    document.getElementById('kanban-view-btn').classList.toggle('active', view === 'kanban');
    document.getElementById('applications-table-view').classList.toggle('hidden', view !== 'table');
    document.getElementById('applications-kanban-view').classList.toggle('hidden', view !== 'kanban');

    if (view === 'kanban') renderKanbanBoard();
}

// ---- FILTER APPLICATIONS ----
function filterApplications(status) {
    currentStatusFilter = status;
    renderApplicationsTable(AppData.applications);

    // Highlight active stat
    document.querySelectorAll('.pipeline-stat').forEach(el => el.style.fontWeight = '');
}

// ---- UPDATE STATUS ----
function updateApplicationStatus(appId, newStatus) {
    const app = AppData.applications.find(a => a.id === appId);
    if (!app) return;
    app.status = newStatus;

    localStorage.setItem('jb_applications', JSON.stringify(AppData.applications));
    updatePipelineStats();
    renderKanbanBoard();

    const messages = {
        interview: `🎉 Interview scheduled at ${app.company}! Good luck!`,
        offer: `🎊 Offer received from ${app.company}! Congratulations!`,
        shortlisted: `⭐ You've been shortlisted at ${app.company}!`,
        rejected: `Application to ${app.company} marked as rejected.`,
    };

    if (messages[newStatus]) showToast(messages[newStatus], newStatus === 'rejected' ? 'info' : 'success');
}

// ---- DELETE APPLICATION ----
function deleteApplication(appId) {
    AppData.applications = AppData.applications.filter(a => a.id !== appId);
    localStorage.setItem('jb_applications', JSON.stringify(AppData.applications));
    renderApplicationsTable(AppData.applications);
    updatePipelineStats();
    showToast('Application removed', 'info');
}

// ---- GENERATE RESUME FOR APP ----
function generateResumeForApp(appId) {
    const app = AppData.applications.find(a => a.id === appId);
    if (!app) return;

    const fakeJob = {
        id: appId,
        company: app.company,
        role: app.role,
        skills: ['React', 'Node.js', 'TypeScript'],
        mode: 'hybrid',
        location: 'Bangalore',
    };

    showResumeGeneratorModal(appId, fakeJob);
}

// ---- PREP FOR APPLICATION ----
function prepForApplication(appId) {
    const app = AppData.applications.find(a => a.id === appId);
    if (!app) return;

    navigateTo('prep');
    const fakeJob = { company: app.company, role: app.role, id: appId };
    setTimeout(() => selectPrepJob(fakeJob), 200);
}

// ---- DATE FORMAT ----
function formatDate(dateStr) {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}
