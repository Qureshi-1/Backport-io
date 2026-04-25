/* ═══════════════════════════════════════════════════════════════════════════════
   Backport.io Admin Panel — Application Logic
   Pure Vanilla JS + Chart.js
   ═══════════════════════════════════════════════════════════════════════════════ */

// ─── State Management ──────────────────────────────────────────────────────────

const state = {
  apiKey: localStorage.getItem('backport_admin_key') || '',
  currentPage: 'dashboard',
  logs: [],
  endpoints: [],
  wafRules: [],
  customRules: [],
  stats: null,
  autoRefresh: true,
  refreshInterval: null,
  refreshSeconds: 3,
  chartInstance: null,
  sidebarOpen: false,
  loading: {},
};

const API_BASE = window.location.origin;

// ─── API Helper ────────────────────────────────────────────────────────────────

async function api(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(state.apiKey ? { 'Authorization': `Bearer ${state.apiKey}` } : {}),
    ...(options.headers || {}),
  };

  try {
    const resp = await fetch(url, {
      ...options,
      headers,
    });

    if (resp.status === 401 || resp.status === 403) {
      throw new Error('Unauthorized. Please check your API key.');
    }

    if (!resp.ok) {
      const body = await resp.json().catch(() => ({}));
      throw new Error(body.detail || `HTTP ${resp.status}`);
    }

    if (resp.status === 204) return null;
    return resp.json();
  } catch (err) {
    if (err.name === 'TypeError' && err.message === 'Failed to fetch') {
      throw new Error('Network error. Is the backend running?');
    }
    throw err;
  }
}

// ─── Toast Notifications ──────────────────────────────────────────────────────

function showToast(message, type = 'info', duration = 4000) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
  };

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || 'ℹ'}</span>
    <span class="toast-message">${escapeHtml(message)}</span>
    <button class="toast-close" onclick="this.parentElement.classList.add('leaving');setTimeout(()=>this.parentElement.remove(),300)">&times;</button>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('leaving');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ─── Utility ──────────────────────────────────────────────────────────────────

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = String(str);
  return div.innerHTML;
}

function formatNumber(n) {
  if (n == null) return '0';
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return String(n);
}

function formatLatency(ms) {
  if (ms == null) return '—';
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function timeAgo(isoString) {
  if (!isoString) return '—';
  const diff = Date.now() - new Date(isoString).getTime();
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatTime(isoString) {
  if (!isoString) return '—';
  const d = new Date(isoString);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function maskKey(key) {
  if (!key || key.length < 8) return '••••••••';
  return key.substring(0, 4) + '••••••••' + key.substring(key.length - 4);
}

function statusBadge(code) {
  if (!code) return '<span class="badge">—</span>';
  let cls = 'info';
  if (code < 300) cls = 'success';
  else if (code < 400) cls = 'info';
  else if (code < 500) cls = 'warning';
  else cls = 'danger';
  return `<span class="badge ${cls}">${code}</span>`;
}

function methodBadge(method) {
  if (!method) return '';
  return `<span class="badge method ${method.toLowerCase()}">${escapeHtml(method)}</span>`;
}

function setLoading(key, loading) {
  state.loading[key] = loading;
  const el = document.getElementById(`loading-${key}`);
  if (el) el.style.display = loading ? 'flex' : 'none';
}

function setLoadingForPage(page, loading) {
  const el = document.getElementById(`page-loading-${page}`);
  if (el) el.style.display = loading ? 'flex' : 'none';
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

async function login(apiKey) {
  const errorEl = document.getElementById('login-error');
  const btn = document.getElementById('login-btn');

  if (!apiKey.trim()) {
    errorEl.textContent = 'Please enter an API key.';
    errorEl.classList.add('visible');
    return false;
  }

  errorEl.classList.remove('visible');
  btn.disabled = true;
  btn.innerHTML = '<div class="spinner spinner-sm"></div> Connecting...';

  try {
    const data = await api('/api/admin/stats');
    state.apiKey = apiKey.trim();
    state.stats = data;
    localStorage.setItem('backport_admin_key', state.apiKey);
    showApp();
    showToast('Connected successfully!', 'success');
    return true;
  } catch (err) {
    errorEl.textContent = err.message;
    errorEl.classList.add('visible');
    btn.disabled = false;
    btn.textContent = 'Connect';
    return false;
  }
}

function logout() {
  state.apiKey = '';
  state.stats = null;
  state.logs = [];
  state.endpoints = [];
  state.wafRules = [];
  state.customRules = [];
  localStorage.removeItem('backport_admin_key');
  stopLogPolling();
  if (state.chartInstance) {
    state.chartInstance.destroy();
    state.chartInstance = null;
  }
  showLogin();
  showToast('Logged out.', 'info');
}

// ─── Show/Hide ────────────────────────────────────────────────────────────────

function showLogin() {
  document.getElementById('login-page').style.display = 'flex';
  document.getElementById('app').classList.remove('visible');
  document.getElementById('app').style.display = 'none';
}

function showApp() {
  document.getElementById('login-page').style.display = 'none';
  document.getElementById('app').style.display = 'grid';
  document.getElementById('app').classList.add('visible');
  navigate('dashboard');
}

// ─── Navigation ───────────────────────────────────────────────────────────────

function navigate(page) {
  // Stop log polling if leaving logs page
  if (state.currentPage === 'logs' && page !== 'logs') {
    stopLogPolling();
  }

  state.currentPage = page;

  // Update sidebar active state
  document.querySelectorAll('.sidebar-nav a').forEach(a => {
    a.classList.toggle('active', a.dataset.page === page);
  });

  // Update page visibility
  document.querySelectorAll('.page').forEach(p => {
    p.classList.remove('active');
  });

  const pageEl = document.getElementById(`page-${page}`);
  if (pageEl) {
    pageEl.classList.add('active');
  }

  // Update header title
  const titles = {
    dashboard: '📊 Dashboard',
    endpoints: '🔗 Endpoints',
    waf: '🛡️ WAF Rules',
    logs: '📋 Analytics & Logs',
    settings: '⚙️ Settings',
  };
  const headerTitle = document.getElementById('header-title-text');
  if (headerTitle) headerTitle.textContent = titles[page] || 'Dashboard';

  // Load page data
  switch (page) {
    case 'dashboard': loadDashboard(); break;
    case 'endpoints': loadEndpoints(); break;
    case 'waf': loadWAFForm(); break;
    case 'logs': loadLogs(); startLogPolling(); break;
    case 'settings': loadSettings(); break;
  }

  // Close mobile sidebar
  closeSidebar();
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function toggleSidebar() {
  state.sidebarOpen = !state.sidebarOpen;
  document.querySelector('.sidebar').classList.toggle('open', state.sidebarOpen);
  document.querySelector('.sidebar-overlay').classList.toggle('visible', state.sidebarOpen);
}

function closeSidebar() {
  state.sidebarOpen = false;
  document.querySelector('.sidebar').classList.remove('open');
  document.querySelector('.sidebar-overlay').classList.remove('visible');
}

// ═══════════════════════════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════

async function loadDashboard() {
  setLoadingForPage('dashboard', true);

  try {
    const data = await api('/api/admin/stats');
    state.stats = data;
    renderDashboard(data);
  } catch (err) {
    document.getElementById('dashboard-content').innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⚠️</div>
        <p>Failed to load dashboard</p>
        <p class="empty-sub">${escapeHtml(err.message)}</p>
        <button class="btn btn-primary mt-6" onclick="loadDashboard()">Retry</button>
      </div>
    `;
  } finally {
    setLoadingForPage('dashboard', false);
  }
}

function renderDashboard(data) {
  if (!data) return;

  // Stat cards
  const statsHtml = `
    <div class="stats-grid">
      <div class="stat-card purple">
        <div class="stat-icon">📡</div>
        <div class="stat-value">${formatNumber(data.total_requests_today || 0)}</div>
        <div class="stat-label">Total Requests (Today)</div>
      </div>
      <div class="stat-card red">
        <div class="stat-icon">🚫</div>
        <div class="stat-value">${formatNumber(data.waf_blocks_today || 0)}</div>
        <div class="stat-label">Blocked Attacks</div>
      </div>
      <div class="stat-card blue">
        <div class="stat-icon">🔑</div>
        <div class="stat-value">${formatNumber(data.total_api_keys || 0)}</div>
        <div class="stat-label">API Keys</div>
      </div>
      <div class="stat-card green">
        <div class="stat-icon">⚡</div>
        <div class="stat-value">${formatLatency(data.avg_latency_ms || 0)}</div>
        <div class="stat-label">Avg Latency</div>
      </div>
    </div>

    <div class="stats-grid" style="grid-template-columns: repeat(4,1fr); margin-bottom: 24px;">
      <div class="stat-card blue">
        <div class="stat-icon">👥</div>
        <div class="stat-value">${formatNumber(data.total_users || 0)}</div>
        <div class="stat-label">Total Users</div>
      </div>
      <div class="stat-card green">
        <div class="stat-icon">🟢</div>
        <div class="stat-value">${formatNumber(data.active_users_today || 0)}</div>
        <div class="stat-label">Active Today</div>
      </div>
      <div class="stat-card yellow">
        <div class="stat-icon">💰</div>
        <div class="stat-value">₹${formatNumber(data.mrr || 0)}</div>
        <div class="stat-label">MRR</div>
      </div>
      <div class="stat-card red">
        <div class="stat-icon">📈</div>
        <div class="stat-value">${data.error_rate_24h || 0}%</div>
        <div class="stat-label">Error Rate (24h)</div>
      </div>
    </div>
  `;

  // Chart
  const chartHtml = `
    <div class="card">
      <div class="card-header">
        <h3>📈 Requests Timeline</h3>
        <span class="text-muted" style="font-size:0.8rem;">Last 15 minutes (simulated)</span>
      </div>
      <div class="chart-container">
        <canvas id="requests-chart"></canvas>
      </div>
    </div>
  `;

  // Plan distribution + alerts
  const planDist = data.plan_distribution || {};
  const planBars = Object.entries(planDist).map(([plan, count]) => `
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
      <span style="width:80px;font-size:0.82rem;color:var(--text-secondary);text-transform:capitalize;">${escapeHtml(plan)}</span>
      <div style="flex:1;height:6px;background:var(--bg-primary);border-radius:3px;overflow:hidden;">
        <div style="height:100%;width:${Math.min(100, (count / Math.max(...Object.values(planDist), 1)) * 100)}%;background:var(--accent);border-radius:3px;transition:width 0.5s ease;"></div>
      </div>
      <span style="font-size:0.82rem;color:var(--text-muted);width:30px;text-align:right;">${count}</span>
    </div>
  `).join('');

  const bottomHtml = `
    <div class="grid-2">
      <div class="card">
        <div class="card-header">
          <h3>📊 Plan Distribution</h3>
        </div>
        ${planBars || '<div class="empty-state"><p>No data</p></div>'}
      </div>
      <div class="card">
        <div class="card-header">
          <h3>🔔 Recent Alerts</h3>
        </div>
        <div class="alert-list" id="dashboard-alerts">
          <div class="empty-state">
            <p class="text-muted">No recent alerts</p>
          </div>
        </div>
      </div>
    </div>

    <div class="card mt-6">
      <div class="card-header">
        <h3>🗓️ User Signups (Last 7 Days)</h3>
      </div>
      <div class="chart-container" style="height:200px;">
        <canvas id="signups-chart"></canvas>
      </div>
    </div>
  `;

  const container = document.getElementById('dashboard-content');
  container.innerHTML = statsHtml + chartHtml + bottomHtml;

  // Render charts
  renderRequestsChart(data);
  renderSignupsChart(data);

  // Try to load alerts
  loadDashboardAlerts();
}

function renderRequestsChart(data) {
  const canvas = document.getElementById('requests-chart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  if (state.chartInstance) {
    state.chartInstance.destroy();
  }

  // Generate simulated timeline data since we don't have a real endpoint
  const labels = [];
  const requests = [];
  const errors = [];
  const now = new Date();

  for (let i = 14; i >= 0; i--) {
    const t = new Date(now - i * 60000);
    labels.push(t.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
    const base = data.total_requests_today ? Math.round(data.total_requests_today / 480) : 5;
    requests.push(base + Math.round(Math.random() * base * 2));
    errors.push(Math.round(Math.random() * 3));
  }

  state.chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Requests',
          data: requests,
          borderColor: '#6c5ce7',
          backgroundColor: 'rgba(108, 92, 231, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 5,
          pointHoverBackgroundColor: '#6c5ce7',
        },
        {
          label: 'Errors',
          data: errors,
          borderColor: '#ff6b6b',
          backgroundColor: 'rgba(255, 107, 107, 0.05)',
          borderWidth: 1.5,
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 4,
          pointHoverBackgroundColor: '#ff6b6b',
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        intersect: false,
        mode: 'index',
      },
      plugins: {
        legend: {
          display: true,
          position: 'top',
          align: 'end',
          labels: {
            color: '#9898b0',
            font: { size: 11, family: 'Inter, system-ui' },
            boxWidth: 12,
            boxHeight: 2,
            padding: 16,
            usePointStyle: false,
          },
        },
        tooltip: {
          backgroundColor: '#1a1a2e',
          titleColor: '#e8e8f0',
          bodyColor: '#9898b0',
          borderColor: '#2a2a4a',
          borderWidth: 1,
          padding: 12,
          cornerRadius: 8,
          titleFont: { size: 12, weight: 600 },
          bodyFont: { size: 11 },
        },
      },
      scales: {
        x: {
          grid: { color: 'rgba(255,255,255,0.03)', drawBorder: false },
          ticks: { color: '#666680', font: { size: 10 }, maxTicksLimit: 8 },
        },
        y: {
          grid: { color: 'rgba(255,255,255,0.03)', drawBorder: false },
          ticks: { color: '#666680', font: { size: 10 } },
          beginAtZero: true,
        },
      },
    },
  });
}

function renderSignupsChart(data) {
  const canvas = document.getElementById('signups-chart');
  if (!canvas) return;

  const days = data.users_by_day_last_7_days || [];
  const labels = days.map(d => {
    const dt = new Date(d.date + 'T00:00:00');
    return dt.toLocaleDateString('en-US', { weekday: 'short' });
  });
  const counts = days.map(d => d.count);

  new Chart(canvas.getContext('2d'), {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Signups',
        data: counts,
        backgroundColor: 'rgba(108, 92, 231, 0.6)',
        borderColor: '#6c5ce7',
        borderWidth: 1,
        borderRadius: 6,
        borderSkipped: false,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#1a1a2e',
          titleColor: '#e8e8f0',
          bodyColor: '#9898b0',
          borderColor: '#2a2a4a',
          borderWidth: 1,
          padding: 10,
          cornerRadius: 6,
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: '#666680', font: { size: 11 } },
        },
        y: {
          grid: { color: 'rgba(255,255,255,0.03)', drawBorder: false },
          ticks: { color: '#666680', font: { size: 10 }, stepSize: 1 },
          beginAtZero: true,
        },
      },
    },
  });
}

async function loadDashboardAlerts() {
  try {
    const data = await api('/api/admin/audit-logs?limit=5');
    const container = document.getElementById('dashboard-alerts');
    if (!container || !data.logs || data.logs.length === 0) return;

    container.innerHTML = data.logs.map(log => {
      const severityMap = {
        admin_action: 'high',
        plan_purchase: 'warning',
        login: 'low',
        signup: 'low',
      };
      const sev = severityMap[log.event_type] || 'low';
      return `
        <div class="alert-item">
          <div class="alert-dot ${sev}"></div>
          <div class="alert-content">
            <div class="alert-msg">${escapeHtml(log.event_type)} — ${escapeHtml(log.email || '')}</div>
            <div class="alert-time">${timeAgo(log.created_at)}</div>
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    // Silently fail for alerts
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════════

async function loadEndpoints() {
  setLoadingForPage('endpoints', true);
  const container = document.getElementById('endpoints-content');

  try {
    // Try the endpoints endpoint; if it doesn't exist, try audit logs as fallback
    let data;
    try {
      data = await api('/api/admin/endpoints');
    } catch (e) {
      // Fallback: use audit logs to show some endpoint data
      data = await api('/api/admin/audit-logs?limit=50');
      // Transform audit logs into endpoint-like data
      const endpointMap = {};
      if (data.logs) {
        data.logs.forEach(log => {
          // Try to extract endpoint info from log details
          const details = log.details || {};
          if (details.method && details.path) {
            const key = `${details.method}:${details.path}`;
            if (!endpointMap[key]) {
              endpointMap[key] = {
                method: details.method,
                path: details.path,
                requests: 0,
                avgLatency: 0,
                successRate: 100,
                lastSeen: log.created_at,
                totalLatency: 0,
                successCount: 0,
              };
            }
            endpointMap[key].requests++;
            if (details.latency) {
              endpointMap[key].totalLatency += details.latency;
            }
            if (details.status_code && details.status_code < 400) {
              endpointMap[key].successCount++;
            }
          }
        });
      }
      data = { endpoints: Object.values(endpointMap).map(ep => ({
        ...ep,
        avgLatency: ep.requests > 0 ? Math.round(ep.totalLatency / ep.requests) : 0,
        successRate: ep.requests > 0 ? Math.round((ep.successCount / ep.requests) * 100) : 100,
      })) };
    }

    state.endpoints = data.endpoints || [];
    renderEndpoints(state.endpoints);
  } catch (err) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⚠️</div>
        <p>Failed to load endpoints</p>
        <p class="empty-sub">${escapeHtml(err.message)}</p>
        <button class="btn btn-primary mt-6" onclick="loadEndpoints()">Retry</button>
      </div>
    `;
  } finally {
    setLoadingForPage('endpoints', false);
  }
}

function renderEndpoints(endpoints) {
  const container = document.getElementById('endpoints-content');
  const searchInput = document.getElementById('endpoint-search');

  // Summary stats
  const totalReqs = endpoints.reduce((sum, e) => sum + (e.requests || 0), 0);
  const avgLat = endpoints.length > 0
    ? Math.round(endpoints.reduce((sum, e) => sum + (e.avgLatency || 0), 0) / endpoints.length)
    : 0;

  const summaryHtml = `
    <div class="stats-grid" style="grid-template-columns: repeat(3,1fr);">
      <div class="stat-card purple">
        <div class="stat-icon">🔗</div>
        <div class="stat-value">${endpoints.length}</div>
        <div class="stat-label">Active Endpoints</div>
      </div>
      <div class="stat-card green">
        <div class="stat-icon">📡</div>
        <div class="stat-value">${formatNumber(totalReqs)}</div>
        <div class="stat-label">Total Requests</div>
      </div>
      <div class="stat-card yellow">
        <div class="stat-icon">⚡</div>
        <div class="stat-value">${formatLatency(avgLat)}</div>
        <div class="stat-label">Avg Latency</div>
      </div>
    </div>
  `;

  const tableHtml = `
    <div class="table-container mt-6">
      <div class="table-toolbar">
        <h3>Endpoints</h3>
        <div class="toolbar-actions">
          <input type="text" id="endpoint-search" class="form-control" placeholder="Search endpoints..." style="width:240px;" oninput="filterEndpoints(this.value)">
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th>Method</th>
            <th>Path</th>
            <th>Requests</th>
            <th>Avg Latency</th>
            <th>Success Rate</th>
            <th>Last Seen</th>
          </tr>
        </thead>
        <tbody id="endpoints-table-body">
          ${endpoints.length === 0 ? `
            <tr><td colspan="6" class="table-empty">No endpoints found</td></tr>
          ` : endpoints.map(ep => `
            <tr>
              <td>${methodBadge(ep.method)}</td>
              <td class="mono">${escapeHtml(ep.path || '—')}</td>
              <td>${formatNumber(ep.requests || 0)}</td>
              <td>${formatLatency(ep.avgLatency)}</td>
              <td>
                <span class="badge ${(ep.successRate || 0) >= 95 ? 'success' : (ep.successRate || 0) >= 80 ? 'warning' : 'danger'}">
                  ${ep.successRate || 0}%
                </span>
              </td>
              <td class="text-muted" style="font-size:0.82rem;">${timeAgo(ep.lastSeen || ep.last_seen)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      ${endpoints.length > 0 ? `
        <div class="table-footer">
          <span>Showing ${endpoints.length} endpoint${endpoints.length !== 1 ? 's' : ''}</span>
        </div>
      ` : ''}
    </div>
  `;

  container.innerHTML = summaryHtml + tableHtml;
}

function filterEndpoints(query) {
  const q = query.toLowerCase().trim();
  const rows = document.querySelectorAll('#endpoints-table-body tr');
  rows.forEach(row => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(q) ? '' : 'none';
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// WAF RULES
// ═══════════════════════════════════════════════════════════════════════════════

const BUILT_IN_RULES = [
  { id: 'sql_injection', name: 'SQL Injection Protection', desc: 'Blocks SQL injection patterns in query parameters and body', enabled: true },
  { id: 'xss', name: 'XSS Protection', desc: 'Detects and blocks cross-site scripting attempts', enabled: true },
  { id: 'path_traversal', name: 'Path Traversal Protection', desc: 'Prevents directory traversal attacks (../)', enabled: true },
  { id: 'command_injection', name: 'Command Injection Protection', desc: 'Blocks OS command injection patterns', enabled: true },
  { id: 'ldap_injection', name: 'LDAP Injection Protection', desc: 'Detects LDAP injection attempts', enabled: true },
  { id: 'xxe', name: 'XXE Protection', desc: 'Blocks XML External Entity attacks', enabled: false },
];

function getWAFState() {
  try {
    const saved = localStorage.getItem('backport_waf_builtins');
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

function saveWAFState(wafState) {
  localStorage.setItem('backport_waf_builtins', JSON.stringify(wafState));
}

async function loadWAFForm() {
  setLoadingForPage('waf', true);
  const container = document.getElementById('waf-content');

  try {
    // Load custom rules from API
    try {
      const data = await api('/api/custom-waf');
      state.customRules = data.rules || [];
    } catch (err) {
      state.customRules = [];
    }

    const wafState = getWAFState();

    const builtInHtml = BUILT_IN_RULES.map(rule => {
      const isEnabled = wafState[rule.id] !== undefined ? wafState[rule.id] : rule.enabled;
      return `
        <div class="toggle-wrapper">
          <div class="toggle-info">
            <div class="toggle-name">${escapeHtml(rule.name)}</div>
            <div class="toggle-desc">${escapeHtml(rule.desc)}</div>
          </div>
          <label class="toggle-switch">
            <input type="checkbox" ${isEnabled ? 'checked' : ''} onchange="toggleBuiltInRule('${rule.id}', this.checked)">
            <span class="toggle-slider"></span>
          </label>
        </div>
      `;
    }).join('');

    const customRulesHtml = state.customRules.map(rule => `
      <div class="rule-item" id="rule-${rule.id}">
        <div class="rule-info">
          <div class="rule-name">${escapeHtml(rule.name)}</div>
          <div class="rule-pattern">/${escapeHtml(rule.pattern)}/ → <span class="badge ${rule.action === 'block' ? 'danger' : 'info'}" style="font-size:0.7rem;">${escapeHtml(rule.action)}</span> <span class="badge purple" style="font-size:0.7rem;">${rule.severity || 'medium'}</span> ${rule.hit_count ? `<span class="text-muted" style="font-size:0.72rem;">(${rule.hit_count} hits)</span>` : ''}</div>
        </div>
        <div class="rule-meta">
          <button class="btn-icon" title="Delete rule" onclick="deleteCustomRule(${rule.id})">🗑️</button>
        </div>
      </div>
    `).join('');

    container.innerHTML = `
      <div class="grid-2">
        <div class="card">
          <div class="card-header">
            <h3>🔧 Built-in Protection</h3>
          </div>
          ${builtInHtml}
        </div>

        <div>
          <div class="card">
            <div class="card-header">
              <h3>➕ Custom Rule Creator</h3>
            </div>
            <form id="add-rule-form" onsubmit="addCustomRule(event)">
              <div class="form-group">
                <label>Rule Name</label>
                <input type="text" class="form-control" id="rule-name" placeholder="e.g., Block user-agent X" required>
              </div>
              <div class="form-group">
                <label>Pattern (Regex)</label>
                <input type="text" class="form-control text-mono" id="rule-pattern" placeholder="e.g., malicious-bot" required>
                <div class="form-help">Regular expression pattern to match against requests</div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>Action</label>
                  <select class="form-control" id="rule-action">
                    <option value="block">Block</option>
                    <option value="log">Log Only</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Severity</label>
                  <select class="form-control" id="rule-severity">
                    <option value="low">Low</option>
                    <option value="medium" selected>Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>
              <button type="submit" class="btn btn-primary w-full">
                <span>➕</span> Add Custom Rule
              </button>
            </form>
          </div>
        </div>
      </div>

      <div class="card mt-6">
        <div class="card-header">
          <h3>📜 Custom WAF Rules <span class="badge purple" style="font-size:0.72rem;">${state.customRules.length}</span></h3>
        </div>
        ${state.customRules.length === 0 ? `
          <div class="empty-state">
            <div class="empty-icon">🛡️</div>
            <p>No custom rules yet</p>
            <p class="empty-sub">Create a rule using the form above</p>
          </div>
        ` : customRulesHtml}
      </div>
    `;
  } catch (err) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⚠️</div>
        <p>Failed to load WAF rules</p>
        <p class="empty-sub">${escapeHtml(err.message)}</p>
        <button class="btn btn-primary mt-6" onclick="loadWAFForm()">Retry</button>
      </div>
    `;
  } finally {
    setLoadingForPage('waf', false);
  }
}

async function toggleBuiltInRule(category, enabled) {
  const wafState = getWAFState();
  wafState[category] = enabled;
  saveWAFState(wafState);
  showToast(`${category.replace(/_/g, ' ')} ${enabled ? 'enabled' : 'disabled'}`, enabled ? 'success' : 'warning');
}

async function addCustomRule(event) {
  event.preventDefault();

  const name = document.getElementById('rule-name').value.trim();
  const pattern = document.getElementById('rule-pattern').value.trim();
  const action = document.getElementById('rule-action').value;
  const severity = document.getElementById('rule-severity').value;

  if (!name || !pattern) {
    showToast('Please fill in all fields', 'warning');
    return;
  }

  // Validate regex
  try {
    new RegExp(pattern);
  } catch (e) {
    showToast('Invalid regex pattern: ' + e.message, 'error');
    return;
  }

  try {
    const data = await api('/api/custom-waf', {
      method: 'POST',
      body: JSON.stringify({ name, pattern, action, severity }),
    });
    showToast('Custom rule added!', 'success');
    loadWAFForm();
  } catch (err) {
    showToast('Failed to add rule: ' + err.message, 'error');
  }
}

async function deleteCustomRule(id) {
  const ruleEl = document.getElementById(`rule-${id}`);
  if (ruleEl && !confirm('Delete this custom rule?')) return;

  try {
    await api(`/api/custom-waf/${id}`, { method: 'DELETE' });
    showToast('Rule deleted', 'success');
    loadWAFForm();
  } catch (err) {
    showToast('Failed to delete rule: ' + err.message, 'error');
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// LOGS & ANALYTICS
// ═══════════════════════════════════════════════════════════════════════════════

async function loadLogs() {
  try {
    let data;
    try {
      data = await api('/api/admin/logs/live?seconds=60');
    } catch (e) {
      // Fallback to audit logs
      try {
        const fallback = await api('/api/admin/audit-logs?limit=50');
        data = {
          logs: (fallback.logs || []).map(log => ({
            id: log.id,
            timestamp: log.created_at,
            method: (log.details && typeof log.details === 'object') ? (log.details.method || '—') : '—',
            path: (log.details && typeof log.details === 'object') ? (log.details.path || '—') : '—',
            status_code: (log.details && typeof log.details === 'object') ? (log.details.status_code || 200) : 200,
            latency_ms: (log.details && typeof log.details === 'object') ? (log.details.latency || 0) : 0,
            ip_address: log.ip_address || '—',
            user_email: log.email || '—',
            event_type: log.event_type,
            details: log.details,
          })),
        };
      } catch (e2) {
        data = { logs: [] };
      }
    }

    state.logs = data.logs || [];
    renderLogs();
  } catch (err) {
    renderLogsError(err.message);
  }
}

function renderLogs() {
  const container = document.getElementById('logs-content');
  const logs = state.logs;

  // Calculate breakdown
  const count4xx = logs.filter(l => l.status_code >= 400 && l.status_code < 500).length;
  const count5xx = logs.filter(l => l.status_code >= 500).length;
  const totalBlocked = logs.filter(l => l.status_code === 403 || l.status_code === 429).length;

  const statsHtml = `
    <div class="stats-grid" style="grid-template-columns: repeat(4,1fr);">
      <div class="stat-card blue">
        <div class="stat-icon">📋</div>
        <div class="stat-value">${logs.length}</div>
        <div class="stat-label">Total Logs</div>
      </div>
      <div class="stat-card yellow">
        <div class="stat-icon">⚠️</div>
        <div class="stat-value">${count4xx}</div>
        <div class="stat-label">4xx Errors</div>
      </div>
      <div class="stat-card red">
        <div class="stat-icon">🔴</div>
        <div class="stat-value">${count5xx}</div>
        <div class="stat-label">5xx Errors</div>
      </div>
      <div class="stat-card purple">
        <div class="stat-icon">🚫</div>
        <div class="stat-value">${totalBlocked}</div>
        <div class="stat-label">Blocked</div>
      </div>
    </div>
  `;

  const toolbarHtml = `
    <div class="table-container">
      <div class="table-toolbar">
        <h3>
          Live Logs
          ${state.autoRefresh ? '<span class="status-dot green"></span> <span class="text-muted" style="font-size:0.78rem;">Auto-refreshing</span>' : '<span class="status-dot yellow"></span> <span class="text-muted" style="font-size:0.78rem;">Paused</span>'}
        </h3>
        <div class="toolbar-actions">
          <button class="btn btn-sm ${state.autoRefresh ? 'btn-danger' : 'btn-success'}" onclick="toggleLogRefresh()">
            ${state.autoRefresh ? '⏸ Pause' : '▶ Resume'}
          </button>
          <button class="btn btn-sm btn-secondary" onclick="loadLogs()">↻ Refresh</button>
        </div>
      </div>
  `;

  const tableHtml = `
      <table>
        <thead>
          <tr>
            <th>Time</th>
            <th>Method</th>
            <th>Path / Event</th>
            <th>Status</th>
            <th>Latency</th>
            <th>IP / User</th>
          </tr>
        </thead>
        <tbody id="logs-table-body">
          ${logs.length === 0 ? `
            <tr><td colspan="6" class="table-empty">No logs yet — waiting for requests...</td></tr>
          ` : logs.map(log => `
            <tr onclick="showLogDetail(${escapeHtml(String(log.id || 0))})">
              <td style="font-size:0.82rem;color:var(--text-muted);">${formatTime(log.timestamp || log.created_at)}</td>
              <td>${methodBadge(log.method)}</td>
              <td class="mono" style="max-width:300px;overflow:hidden;text-overflow:ellipsis;">
                ${escapeHtml(log.path || log.event_type || '—')}
              </td>
              <td>${statusBadge(log.status_code)}</td>
              <td style="font-size:0.82rem;">${formatLatency(log.latency_ms)}</td>
              <td style="font-size:0.82rem;color:var(--text-muted);">${escapeHtml(log.ip_address || log.user_email || '—')}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <div class="table-footer">
        <span>Showing ${logs.length} log${logs.length !== 1 ? 's' : ''}</span>
        <span class="text-muted">Auto-refresh: ${state.refreshSeconds}s</span>
      </div>
    </div>
  `;

  container.innerHTML = statsHtml + toolbarHtml + tableHtml;
}

function renderLogsError(message) {
  const container = document.getElementById('logs-content');
  container.innerHTML = `
    <div class="empty-state">
      <div class="empty-icon">⚠️</div>
      <p>Failed to load logs</p>
      <p class="empty-sub">${escapeHtml(message)}</p>
      <button class="btn btn-primary mt-6" onclick="loadLogs()">Retry</button>
    </div>
  `;
}

function showLogDetail(id) {
  const log = state.logs.find(l => String(l.id) === String(id));
  if (!log) return;

  const modal = document.getElementById('log-detail-modal');
  const body = document.getElementById('log-detail-body');

  const detailsHtml = typeof log.details === 'object'
    ? JSON.stringify(log.details, null, 2)
    : String(log.details || '{}');

  body.innerHTML = `
    <dl class="detail-grid">
      <dt>ID</dt><dd>${log.id}</dd>
      <dt>Time</dt><dd>${formatTime(log.timestamp || log.created_at)}</dd>
      <dt>Method</dt><dd>${log.method || '—'}</dd>
      <dt>Path</dt><dd>${escapeHtml(log.path || '—')}</dd>
      <dt>Status</dt><dd>${statusBadge(log.status_code)}</dd>
      <dt>Latency</dt><dd>${formatLatency(log.latency_ms)}</dd>
      <dt>IP Address</dt><dd>${escapeHtml(log.ip_address || '—')}</dd>
      <dt>User</dt><dd>${escapeHtml(log.user_email || '—')}</dd>
      <dt>Event Type</dt><dd>${escapeHtml(log.event_type || '—')}</dd>
    </dl>
    <h4 style="margin:20px 0 10px;font-size:0.88rem;color:var(--text-heading);">Request Details</h4>
    <div class="code-block">${escapeHtml(detailsHtml)}</div>
  `;

  modal.classList.add('visible');
}

function closeLogDetail() {
  document.getElementById('log-detail-modal').classList.remove('visible');
}

function toggleLogRefresh() {
  state.autoRefresh = !state.autoRefresh;
  if (state.autoRefresh) {
    startLogPolling();
    showToast('Auto-refresh enabled', 'success');
  } else {
    stopLogPolling();
    showToast('Auto-refresh paused', 'warning');
  }
  // Re-render to update button state
  renderLogs();
}

function startLogPolling() {
  stopLogPolling();
  if (!state.autoRefresh) return;
  state.refreshInterval = setInterval(() => {
    if (state.currentPage === 'logs' && state.autoRefresh) {
      loadLogs();
    }
  }, state.refreshSeconds * 1000);
}

function stopLogPolling() {
  if (state.refreshInterval) {
    clearInterval(state.refreshInterval);
    state.refreshInterval = null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SETTINGS
// ═══════════════════════════════════════════════════════════════════════════════

async function loadSettings() {
  const container = document.getElementById('settings-content');

  const webhookUrl = localStorage.getItem('backport_webhook_url') || '';

  container.innerHTML = `
    <div class="settings-section">
      <h3>🔐 API Key</h3>
      <p>Your admin API key used to authenticate with the backend.</p>
      <div class="settings-row">
        <div class="settings-label">
          <span>Current Key</span>
          <small>Used for all API requests</small>
        </div>
        <div style="display:flex;align-items:center;gap:10px;">
          <div class="settings-value" id="key-display">${maskKey(state.apiKey)}</div>
          <button class="btn btn-sm btn-secondary" onclick="toggleKeyVisibility()">👁</button>
        </div>
      </div>
    </div>

    <div class="settings-section">
      <h3>🌐 Webhook URL</h3>
      <p>Configure a webhook URL for event notifications (saved locally).</p>
      <div class="form-group">
        <input type="url" class="form-control" id="webhook-url-input" placeholder="https://hooks.slack.com/services/..." value="${escapeHtml(webhookUrl)}">
      </div>
      <button class="btn btn-primary" onclick="saveWebhookUrl()">Save Webhook</button>
    </div>

    <div class="settings-section">
      <h3>🛠️ Actions</h3>
      <p>Admin maintenance operations.</p>
      <div style="display:flex;gap:12px;flex-wrap:wrap;">
        <button class="btn btn-secondary" onclick="exportLogs()">📥 Export Logs (JSON)</button>
        <button class="btn btn-danger" onclick="clearAllSettings()">🗑️ Clear Local Data</button>
      </div>
    </div>

    <div class="settings-section">
      <h3>ℹ️ System Info</h3>
      <p>Information about this admin panel.</p>
      <div class="settings-row">
        <div class="settings-label">
          <span>API Base URL</span>
          <small>Backend server origin</small>
        </div>
        <div class="settings-value">${escapeHtml(API_BASE)}</div>
      </div>
      <div class="settings-row">
        <div class="settings-label">
          <span>Version</span>
        </div>
        <div class="settings-value">1.0.0</div>
      </div>
    </div>
  `;
}

function toggleKeyVisibility() {
  const el = document.getElementById('key-display');
  if (!el) return;
  if (el.dataset.visible === 'true') {
    el.textContent = maskKey(state.apiKey);
    el.dataset.visible = 'false';
  } else {
    el.textContent = state.apiKey;
    el.dataset.visible = 'true';
  }
}

function saveWebhookUrl() {
  const input = document.getElementById('webhook-url-input');
  if (!input) return;
  const url = input.value.trim();
  localStorage.setItem('backport_webhook_url', url);
  showToast('Webhook URL saved', 'success');
}

async function exportLogs() {
  try {
    let data;
    try {
      data = await api('/api/admin/audit-logs?limit=200');
    } catch (err) {
      data = { logs: state.logs };
    }

    const json = JSON.stringify(data.logs || [], null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backport-logs-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Logs exported!', 'success');
  } catch (err) {
    showToast('Export failed: ' + err.message, 'error');
  }
}

function clearAllSettings() {
  if (!confirm('This will clear all locally stored data (API key, WAF state, webhooks). Continue?')) return;
  localStorage.removeItem('backport_admin_key');
  localStorage.removeItem('backport_waf_builtins');
  localStorage.removeItem('backport_webhook_url');
  logout();
  showToast('Local data cleared', 'warning');
}

// ═══════════════════════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════════════

function init() {
  // Login form
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const apiKey = document.getElementById('api-key-input').value;
      await login(apiKey);
    });
  }

  // Sidebar navigation
  document.querySelectorAll('.sidebar-nav a[data-page]').forEach(a => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      navigate(a.dataset.page);
    });
  });

  // Logout button
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', logout);
  }

  // Mobile sidebar toggle
  const menuBtn = document.getElementById('mobile-menu-btn');
  if (menuBtn) {
    menuBtn.addEventListener('click', toggleSidebar);
  }

  const overlay = document.querySelector('.sidebar-overlay');
  if (overlay) {
    overlay.addEventListener('click', closeSidebar);
  }

  // Modal close
  const modalClose = document.getElementById('modal-close-btn');
  if (modalClose) {
    modalClose.addEventListener('click', closeLogDetail);
  }

  const modalOverlay = document.getElementById('log-detail-modal');
  if (modalOverlay) {
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) closeLogDetail();
    });
  }

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeLogDetail();
      closeSidebar();
    }
  });

  // Auto-login if key exists
  if (state.apiKey) {
    showApp();
  } else {
    showLogin();
  }
}

document.addEventListener('DOMContentLoaded', init);
