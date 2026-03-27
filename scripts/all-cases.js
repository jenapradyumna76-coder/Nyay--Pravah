let pendingCases = [];
let filteredCases = [];
let currentCaseId = null;

document.addEventListener('DOMContentLoaded', function () {
    loadPendingCases();
    setupEventListeners();
});

async function loadPendingCases() {
    pendingCases = [];
    filteredCases = [];
    renderCases();

    // Try to fetch from API in background for updates
    try {
        const response = await fetch('/api/cases');
        if (response.ok) {
            const data = await response.json();
            const allCases = [];
            if (Array.isArray(data.cases)) allCases.push(...data.cases);
            if (Array.isArray(data.backlog)) allCases.push(...data.backlog);
            if (Array.isArray(data.fresh)) allCases.push(...data.fresh);
            // pending page defaults to pending/in-progress/postponed but can show all with filter
            const apiCases = allCases.map(c => ({
                ...c,
                time: c.time || 'N/A',
                courtRoom: c.courtRoom || 'N/A',
                judge: c.judge || 'N/A',
                lastHearing: c.lastHearing || 'N/A',
                nextHearing: c.nextHearing || 'N/A',
                description: c.description || ''
            }));
            if (apiCases.length > 0) {
                pendingCases = apiCases;
                filteredCases = [...pendingCases];
                renderCases();
            }
        }
    } catch (error) {
        console.error('Unable to load all cases from backend:', error.message);
        pendingCases = [];
        filteredCases = [];
        renderCases();
    }
}

function renderCases() {
    const tbody = document.getElementById('cases-tbody');
    tbody.innerHTML = '';

    if (filteredCases.length === 0) {
        document.getElementById('no-cases').style.display = 'block';
        document.getElementById('cases-table').style.display = 'none';
        return;
    }

    document.getElementById('no-cases').style.display = 'none';
    document.getElementById('cases-table').style.display = 'table';

    filteredCases.forEach(c => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${c.id}</td>
            <td><span class="type-badge ${c.type}">${getTypeLabel(c.type)}</span></td>
            <td>${c.title}</td>
            <td><strong>${c.plaintiff}</strong><span class="vs">vs</span><strong>${c.defendant}</strong></td>
            <td>${c.time}</td>
            <td>${c.courtRoom}</td>
            <td>${c.judge}</td>
            <td><span class="priority-badge ${getPriorityClass(c.priority)}">${(c.priority || 'n/a').toUpperCase()}</span></td>
            <td><span class="status-badge ${getStatusClass(c.status)}">${getStatusLabel(c.status)}</span></td>
            <td>${formatDate(c.lastHearing)}</td>
            <td>${formatDate(c.nextHearing)}</td>
            <td class="actions">
                <button class="btn-icon" onclick="viewCaseDetails('${c.id}')" title="View Details"><i class="fas fa-eye"></i></button>
                <button class="btn-icon" onclick="prepareStatusModal('${c.id}')" title="Update Status"><i class="fas fa-edit"></i></button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function filterCases() {
    const statusFilter = document.getElementById('status-filter').value;
    const typeFilter = document.getElementById('type-filter').value;
    const priorityFilter = document.getElementById('priority-filter').value;
    const searchTerm = document.getElementById('search-input').value.toLowerCase();

    filteredCases = pendingCases.filter(c => {
        const statusMatch = statusFilter === 'all' ? true : c.status === statusFilter;
        const typeMatch = typeFilter === 'all' ? true : c.type === typeFilter;
        const priorityMatch = priorityFilter === 'all' ? true : c.priority === priorityFilter;
        const searchMatch = !searchTerm || c.id.toLowerCase().includes(searchTerm) || c.title.toLowerCase().includes(searchTerm) || c.plaintiff.toLowerCase().includes(searchTerm) || c.defendant.toLowerCase().includes(searchTerm);
        return statusMatch && typeMatch && priorityMatch && searchMatch;
    });

    renderCases();
}

function viewCaseDetails(caseId) {
    const c = pendingCases.find(x => x.id === caseId);
    if (!c) return;

    const details = document.getElementById('case-details');
    details.innerHTML = `
        <div class="case-details-grid">
            <div class="detail-section">
                <h3>Case Summary</h3>
                <p><strong>ID:</strong> ${c.id}</p>
                <p><strong>Title:</strong> ${c.title}</p>
                <p><strong>Type:</strong> ${getTypeLabel(c.type)}</p>
                <p><strong>Status:</strong> <span class="status-badge ${getStatusClass(c.status)}">${getStatusLabel(c.status)}</span></p>
                <p><strong>Priority:</strong> <span class="priority-badge ${getPriorityClass(c.priority)}">${(c.priority || 'n/a').toUpperCase()}</span></p>
            </div>
            <div class="detail-section">
                <h3>Court Details</h3>
                <p><strong>Court Room:</strong> ${c.courtRoom}</p>
                <p><strong>Judge:</strong> ${c.judge}</p>
                <p><strong>Last Hearing:</strong> ${formatDate(c.lastHearing)}</p>
                <p><strong>Next Hearing:</strong> ${formatDate(c.nextHearing)}</p>
            </div>
            <div class="detail-section">
                <h3>Parties</h3>
                <p><strong>Plaintiff:</strong> ${c.plaintiff}</p>
                <p><strong>Defendant:</strong> ${c.defendant}</p>
            </div>
            <div class="detail-section">
                <h3>Case Details</h3>
                <p>${c.description}</p>
                <p><strong>Notes:</strong> ${c.notes}</p>
                <p><strong>Documents:</strong> ${(c.documents || []).join(', ')}</p>
            </div>
        </div>
    `;

    document.getElementById('case-modal').style.display = 'block';
}

function prepareStatusModal(caseId) {
    currentCaseId = caseId;
    document.getElementById('status-modal').style.display = 'block';
}

function openStatusModal() {
    document.getElementById('status-modal').style.display = 'block';
}

async function submitStatusUpdate() {
    const newStatus = document.getElementById('new-status').value;
    const notes = document.getElementById('status-notes').value;

    if (!newStatus) return;

    try {
        const res = await fetch(`/api/cases/${currentCaseId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: newStatus, notes }) });
        if (res.ok) {
            const caseItem = pendingCases.find(c => c.id === currentCaseId);
            if (caseItem) { caseItem.status = newStatus; if (notes) caseItem.notes = notes; }
            closeStatusModal();
            renderCases();
            return;
        }
        throw new Error('API failed');
    } catch (e) {
        const caseItem = pendingCases.find(c => c.id === currentCaseId);
        if (caseItem) { caseItem.status = newStatus; if (notes) caseItem.notes = notes; }
        closeStatusModal();
        renderCases();
    }
}

function closeModal() {
    document.getElementById('case-modal').style.display = 'none';
}

function closeStatusModal() {
    document.getElementById('status-modal').style.display = 'none';
    document.getElementById('status-form').reset();
    currentCaseId = null;
}

function refreshCases() {
    loadPendingCases();
}

function setupEventListeners() {
    window.onclick = (event) => {
        if (event.target === document.getElementById('case-modal')) closeModal();
        if (event.target === document.getElementById('status-modal')) closeStatusModal();
    };
}

function getStatusClass(status) {
    return { pending: 'pending', 'in-progress': 'in-progress', completed: 'completed', postponed: 'postponed' }[status] || 'pending';
}
function getStatusLabel(status) {
    return { pending: 'Pending', 'in-progress': 'In Progress', completed: 'Completed', postponed: 'Postponed' }[status] || 'Pending';
}
function getPriorityClass(p) { return { urgent: 'urgent', high: 'high', medium: 'medium', low: 'low' }[p] || 'medium'; }
function getTypeLabel(t) { return { civil: 'Civil', criminal: 'Criminal', family: 'Family', property: 'Property', commercial: 'Commercial' }[t] || 'Civil'; }
function formatDate(d) { if (!d || d === 'Disposed') return d; const date = new Date(d); return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); }

function showLoading() {
    document.getElementById('loading-spinner').style.display = 'block';
    document.getElementById('cases-table').style.display = 'none';
    document.getElementById('no-cases').style.display = 'none';
}

function hideLoading() {
    document.getElementById('loading-spinner').style.display = 'none';
    document.getElementById('cases-table').style.display = 'table';
}