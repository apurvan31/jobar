/* =============================================
   job.bar — Salary Insights
   Market data, compensation calculators
   ============================================= */

// Mock Salary Data
const SALARY_DATA = {
    fullstack: {
        baseRates: {
            fresher: 600000,
            junior: 1000000,
            mid: 1800000,
            senior: 3200000
        },
        locations: {
            bangalore: 1.2,
            mumbai: 1.15,
            delhi: 1.0,
            hyderabad: 1.05,
            usa: 7.0,   // USD rough multiplier for comparison
            uk: 5.5,    // GBP rough multiplier
            remote: 1.1
        },
        growth: 22,
        companies: [
            { name: 'Google', range: '₹24L - ₹45L', emoji: 'G', color: '#4285F4' },
            { name: 'Microsoft', range: '₹22L - ₹40L', emoji: 'M', color: '#00A4EF' },
            { name: 'Uber', range: '₹26L - ₹50L', emoji: 'U', color: '#000' },
            { name: 'Stripe', range: '₹30L - ₹60L', emoji: 'S', color: '#635BFF' }
        ]
    },
    frontend: {
        baseRates: { fresher: 500000, junior: 900000, mid: 1600000, senior: 2800000 },
        locations: { bangalore: 1.2, mumbai: 1.1, delhi: 1.0, hyderabad: 1.05, usa: 6.5, uk: 5.0, remote: 1.1 },
        growth: 18,
        companies: [
            { name: 'Meta', range: '₹25L - ₹45L', emoji: 'f', color: '#1877F2' },
            { name: 'Airbnb', range: '₹22L - ₹42L', emoji: '⌂', color: '#FF5A5F' },
            { name: 'Swiggy', range: '₹18L - ₹35L', emoji: 'S', color: '#FC8019' },
            { name: 'Razorpay', range: '₹20L - ₹38L', emoji: 'R', color: '#3395FF' }
        ]
    },
    backend: {
        baseRates: { fresher: 600000, junior: 1100000, mid: 1900000, senior: 3500000 },
        locations: { bangalore: 1.3, mumbai: 1.15, delhi: 1.0, hyderabad: 1.1, usa: 7.5, uk: 5.8, remote: 1.15 },
        growth: 24,
        companies: [
            { name: 'Netflix', range: '₹35L - ₹70L', emoji: 'N', color: '#E50914' },
            { name: 'Stripe', range: '₹30L - ₹60L', emoji: 'S', color: '#635BFF' },
            { name: 'Amazon', range: '₹22L - ₹45L', emoji: 'A', color: '#FF9900' },
            { name: 'PhonePe', range: '₹20L - ₹40L', emoji: 'P', color: '#5f259f' }
        ]
    },
    data: {
        baseRates: { fresher: 700000, junior: 1200000, mid: 2200000, senior: 4000000 },
        locations: { bangalore: 1.3, mumbai: 1.2, delhi: 1.1, hyderabad: 1.15, usa: 8.0, uk: 6.0, remote: 1.1 },
        growth: 28,
        companies: [
            { name: 'Meta', range: '₹28L - ₹50L', emoji: 'f', color: '#1877F2' },
            { name: 'Google', range: '₹25L - ₹48L', emoji: 'G', color: '#4285F4' },
            { name: 'Uber', range: '₹28L - ₹55L', emoji: 'U', color: '#000' },
            { name: 'Flipkart', range: '₹20L - ₹40L', emoji: 'F', color: '#2874F0' }
        ]
    },
    ml: {
        baseRates: { fresher: 800000, junior: 1400000, mid: 2500000, senior: 5000000 },
        locations: { bangalore: 1.4, mumbai: 1.2, delhi: 1.1, hyderabad: 1.2, usa: 9.0, uk: 7.0, remote: 1.2 },
        growth: 45,
        companies: [
            { name: 'OpenAI', range: '$300K - $800K', emoji: 'O', color: '#10a37f' },
            { name: 'Google', range: '₹30L - ₹80L', emoji: 'G', color: '#4285F4' },
            { name: 'Meta', range: '₹28L - ₹75L', emoji: 'f', color: '#1877F2' },
            { name: 'Microsoft', range: '₹25L - ₹65L', emoji: 'M', color: '#00A4EF' }
        ]
    },
    default: {
        baseRates: { fresher: 400000, junior: 700000, mid: 1200000, senior: 2000000 },
        locations: { bangalore: 1.1, mumbai: 1.1, delhi: 1.0, hyderabad: 1.0, usa: 5.0, uk: 4.0, remote: 1.0 },
        growth: 12,
        companies: [
            { name: 'TCS', range: '₹4L - ₹12L', emoji: 'T', color: '#003087' },
            { name: 'Infosys', range: '₹3.5L - ₹10L', emoji: 'I', color: '#007CC2' },
            { name: 'Wipro', range: '₹3.5L - ₹10L', emoji: 'W', color: '#342D6E' },
            { name: 'Accenture', range: '₹4.5L - ₹15L', emoji: 'A', color: '#a100ff' }
        ]
    }
};

function formatCurrency(value, currency = 'INR') {
    if (currency === 'USD') {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumSignificantDigits: 3 }).format(value);
    }
    if (currency === 'GBP') {
        return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumSignificantDigits: 3 }).format(value);
    }
    // Indian Rupees formatted as Lakhs
    return `₹${(value / 100000).toFixed(1)}L`;
}

function updateSalaryInsights() {
    const roleId = document.getElementById('sc-role')?.value || 'fullstack';
    const expId = document.getElementById('sc-exp')?.value || 'mid';
    const locId = document.getElementById('sc-location')?.value || 'bangalore';
    
    const roleData = SALARY_DATA[roleId] || SALARY_DATA.default;
    const baseVal = roleData.baseRates[expId];
    const locMulti = roleData.locations[locId] || 1.0;
    
    let currency = 'INR';
    if (locId === 'usa') currency = 'USD';
    if (locId === 'uk') currency = 'GBP';
    
    // Calculate values
    const median = baseVal * locMulti;
    const min = median * 0.75;
    const max = median * 1.4;
    
    // Add some random noise for realism
    const noise = () => 1 + (Math.random() * 0.05 - 0.025);
    
    const resultsGrid = document.getElementById('salary-results');
    if (resultsGrid) {
        resultsGrid.innerHTML = `
            <div class="stat-card glassmorphism animate-in" style="--delay: 0.1s;background: rgba(16,185,129,0.05);border-color: rgba(16,185,129,0.2);">
                <div class="stat-icon" style="background: linear-gradient(135deg, #10b981, #059669)">💰</div>
                <div class="stat-content">
                    <span class="stat-number" style="font-size:1.8rem;color:#10b981">${formatCurrency(median * noise(), currency)}</span>
                    <span class="stat-label">Median Salary (Yearly)</span>
                </div>
                <div class="stat-trend up">Market Average</div>
            </div>
            
            <div class="stat-card glassmorphism animate-in" style="--delay: 0.2s">
                <div class="stat-icon" style="background: linear-gradient(135deg, #6366f1, #8b5cf6)">📉</div>
                <div class="stat-content">
                    <span class="stat-number" style="font-size:1.4rem">${formatCurrency(min * noise(), currency)}</span>
                    <span class="stat-label">25th Percentile</span>
                </div>
            </div>
            
            <div class="stat-card glassmorphism animate-in" style="--delay: 0.3s">
                <div class="stat-icon" style="background: linear-gradient(135deg, #f59e0b, #d97706)">📈</div>
                <div class="stat-content">
                    <span class="stat-number" style="font-size:1.4rem">${formatCurrency(max * noise(), currency)}</span>
                    <span class="stat-label">90th Percentile</span>
                </div>
                <div class="stat-trend up">Top Companies</div>
            </div>
            
            <div class="stat-card glassmorphism animate-in" style="--delay: 0.4s">
                <div class="stat-icon" style="background: linear-gradient(135deg, #06b6d4, #0891b2)">🚀</div>
                <div class="stat-content">
                    <span class="stat-number" style="font-size:1.4rem">+${roleData.growth}%</span>
                    <span class="stat-label">Demand Growth</span>
                </div>
                <div class="stat-trend up">YoY Increase</div>
            </div>
        `;
    }
    
    const topCompGrid = document.getElementById('top-paying-companies');
    if (topCompGrid) {
        topCompGrid.innerHTML = roleData.companies.map((c, i) => `
            <div class="company-salary-card animate-in" style="--delay:${0.1 * (i+5)}s">
                <div class="company-sz-logo" style="background:${c.color}">${c.emoji}</div>
                <div class="company-sz-info">
                    <div class="company-sz-name">${c.name}</div>
                    <div class="company-sz-range">${c.range}</div>
                </div>
            </div>
        `).join('');
    }
}

// Hook into navigateTo
const _salaryOrigNav = navigateTo;
navigateTo = function(page) {
    if (typeof _origNavigateTo === 'function' && _salaryOrigNav === _origNavigateTo) {
        _origNavigateTo(page); // Prevent double calling if already hooked
    } else {
        _salaryOrigNav.apply(this, arguments);
    }
    
    if (page === 'salary') {
        setTimeout(updateSalaryInsights, 100);
    }
};

// Add CSS dynamically for salary specific elements
const salaryStyles = document.createElement('style');
salaryStyles.innerHTML = `
    .salary-calc-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
    .salary-results-grid { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 1rem; }
    .top-companies-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 1rem; }
    
    .company-salary-card {
        display: flex; align-items: center; gap: 12px;
        background: var(--surface); border: 1px solid var(--border);
        padding: 1rem; border-radius: var(--radius);
        transition: transform 0.2s, background 0.2s;
        cursor: default;
    }
    .company-salary-card:hover { transform: translateY(-3px); background: var(--surface-hover); }
    
    .company-sz-logo {
        width: 40px; height: 40px; border-radius: 8px;
        display: flex; align-items: center; justify-content: center;
        font-size: 1.2rem; font-weight: bold; color: white;
    }
    .company-sz-info { flex: 1; }
    .company-sz-name { font-weight: 600; font-size: 0.95rem; }
    .company-sz-range { font-size: 0.85rem; color: var(--success); font-weight: 500; font-family: monospace; }
    
    @media (max-width: 900px) {
        .salary-calc-grid { grid-template-columns: 1fr; }
        .salary-results-grid { grid-template-columns: 1fr 1fr; }
    }
    @media (max-width: 600px) {
        .salary-results-grid { grid-template-columns: 1fr; }
    }
`;
document.head.appendChild(salaryStyles);
