let caseData = [];

const colors = {
    pending: '#f1c40f',
    'in-progress': '#3498db',
    completed: '#27ae60',
    postponed: '#95a5a6'
};

const typeColors = {
    civil: '#3498db',
    criminal: '#e74c3c',
    family: '#9b59b6',
    property: '#f39c12',
    commercial: '#1abc9c'
};

let statusChart, typeChart, dailyChart;

document.addEventListener('DOMContentLoaded', () => {
    loadAnalytics();
});

async function loadAnalytics() {
    try {
        const response = await fetch('/api/cases');
        if (!response.ok) throw new Error('No API');

        const data = await response.json();
        caseData = [];
        if (Array.isArray(data.cases)) caseData.push(...data.cases);
        if (Array.isArray(data.backlog)) caseData.push(...data.backlog);
        if (Array.isArray(data.fresh)) caseData.push(...data.fresh);

        if (caseData.length === 0) throw new Error('No cases from API');
    } catch (error) {
        caseData = getStaticAnalyticsData();
    }

    renderSummary();
    renderCharts();
    renderNotes();
}

function getStaticAnalyticsData() {
    return [
        { id: 'CS-2024-089', status: 'pending', type: 'civil', daysOpen: 20 },
        { id: 'FD-2024-045', status: 'in-progress', type: 'family', daysOpen: 15 },
        { id: 'CR-2024-112', status: 'pending', type: 'criminal', daysOpen: 18 },
        { id: 'PC-2024-067', status: 'pending', type: 'property', daysOpen: 12 },
        { id: 'CS-2024-134', status: 'completed', type: 'civil', daysOpen: 75 },
        { id: 'FD-2024-078', status: 'postponed', type: 'family', daysOpen: 25 },
        { id: 'CS-2024-090', status: 'completed', type: 'civil', daysOpen: 40 },
        { id: 'CR-2024-115', status: 'in-progress', type: 'criminal', daysOpen: 22 }
    ];
}

function renderSummary() {
    const total = caseData.length;
    const disposed = caseData.filter(c => c.status === 'completed').length;
    const pending = caseData.filter(c => c.status === 'pending').length;
    const avgDisposal = (caseData.filter(c => c.status === 'completed').reduce((sum, c) => sum + (c.daysOpen || 0), 0) / (disposed || 1)).toFixed(1);

    document.getElementById('total-cases').textContent = total;
    document.getElementById('disposed-cases').textContent = disposed;
    document.getElementById('pending-cases').textContent = pending;
    document.getElementById('avg-disposal').textContent = isNaN(avgDisposal) ? '0.0' : avgDisposal;
}

function mergeCounts(data, key) {
    return data.reduce((acc, item) => {
        const value = (item[key] || 'unknown').toLowerCase();
        acc[value] = (acc[value] || 0) + 1;
        return acc;
    }, {});
}

function renderCharts() {
    const statusCounts = mergeCounts(caseData, 'status');
    const typeCounts = mergeCounts(caseData, 'type');

    const statusLabels = ['pending', 'in-progress', 'completed', 'postponed'];
    const typeLabels = Object.keys(typeCounts);

    const statusValues = statusLabels.map(label => statusCounts[label] || 0);
    const typeValues = typeLabels.map(label => typeCounts[label]);

    const last7 = getLast7Days();
    const dailyCounts = last7.map(day => 0);
    // For static, generate random values roughly
    for (let i = 0; i < last7.length; i++) {
        dailyCounts[i] = 2 + Math.floor(Math.random() * 4);
    }

    if (statusChart) statusChart.destroy();
    if (typeChart) typeChart.destroy();
    if (dailyChart) dailyChart.destroy();

    const statusCtx = document.getElementById('statusDistributionChart').getContext('2d');
    statusChart = new Chart(statusCtx, {
        type: 'bar',
        data: {
            labels: statusLabels.map(label => label.replace('-', ' ')),
            datasets: [{
                label: 'Case Count',
                data: statusValues,
                backgroundColor: statusLabels.map(s => colors[s] || '#bdc3c7'),
                borderColor: statusLabels.map(s => colors[s] || '#bdc3c7'),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { beginAtZero: true },
                y: { beginAtZero: true, ticks: { stepSize: 1 } }
            },
            plugins: { legend: { display: false } }
        }
    });

    const typeCtx = document.getElementById('typeBreakdownChart').getContext('2d');
    typeChart = new Chart(typeCtx, {
        type: 'bar',
        data: {
            labels: typeLabels,
            datasets: [{
                label: 'Case Count',
                data: typeValues,
                backgroundColor: typeLabels.map(t => typeColors[t] || '#7f8c8d')
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });

    const dailyCtx = document.getElementById('dailyHearingsChart').getContext('2d');
    dailyChart = new Chart(dailyCtx, {
        type: 'line',
        data: {
            labels: last7,
            datasets: [{
                label: 'Hearings',
                data: dailyCounts,
                borderColor: '#1abc9c',
                backgroundColor: 'rgba(26, 188, 156, 0.3)',
                fill: true,
                tension: 0.3
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

function loadAnalyticsNotes() {
    const pending = caseData.filter(c => c.status === 'pending');
    const overdue = pending.filter(c => (c.daysOpen || 0) > 30);
    const completed = caseData.filter(c => c.status === 'completed');

    const notes = [];
    notes.push(`Total pending cases: ${pending.length}`);
    notes.push(`Cases older than 30 days: ${overdue.length}`);
    notes.push(`Avg disposal time: ${(completed.reduce((sum, c) => sum + (c.daysOpen || 0), 0) / (completed.length || 1)).toFixed(1)} days`);

    return notes;
}

function renderNotes() {
    const notes = loadAnalyticsNotes();
    const container = document.getElementById('analytics-notes');
    container.innerHTML = '';
    notes.forEach(note => { const li = document.createElement('li'); li.textContent = note; container.appendChild(li); });
}

function getLast7Days() {
    const arr = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        arr.push(d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }));
    }
    return arr;
}

function refreshAnalytics() {
    loadAnalytics();
}
