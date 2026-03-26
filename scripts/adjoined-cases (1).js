let adjoinedCases = [];
let filteredCases = [];
let currentCaseId = null;

document.addEventListener('DOMContentLoaded', () => {
    loadAdjoinedCases();
    setupEventListeners();
});

async function loadAdjoinedCases() {
    showLoading();

    try {
        const response = await fetch('/api/cases');
        if (response.ok) {
            const data = await response.json();
            adjoinedCases = getAdjoinedCasesFromData(data);
        } else {
            throw new Error('API unavailable');
        }
    } catch (error) {
        adjoinedCases = getStaticAdjoinedCases();
    }

    filteredCases = [...adjoinedCases];
    renderCases();
    hideLoading();
}

function getAdjoinedCasesFromData(data) {
    const allCases = [];
    if (Array.isArray(data.cases)) allCases.push(...data.cases);
    if (Array.isArray(data.backlog)) allCases.push(...data.backlog);
    if (Array.isArray(data.fresh)) allCases.push(...data.fresh);

    const adjoined = allCases.filter(c => c.adjoined === true || (c.tags || []).includes('adjoined'));
    if (adjoined.length > 0) return adjoined;

    return getStaticAdjoinedCases();
}

function getStaticAdjoinedCases() {
    return [
        {
            id: 'ADJ-2024-001',
            leadCase: 'CS-2024-089',
            joinedCases: ['CS-2024-090', 'CS-2024-091'],
            type: 'civil',
            priority: 'high',
            status: 'pending',
            courtRoom: 'Courtroom 04',
            nextHearing: '2024-03-29',
            description: 'Property transfer and ownership dispute cases joined due to common questions of law.',
            judge: 'Honorable Judge Harshita Sharma'
        },
        {
            id: 'ADJ-2024-002',
            leadCase: 'FD-2024-045',
            joinedCases: ['FD-2024-046', 'FD-2024-047'],
            type: 'family',
            priority: 'urgent',
            status: 'in-progress',
            courtRoom: 'Courtroom 04',
            nextHearing: '2024-03-26',
            description: 'Child custody and support cases joined for simultaneous hearing.',
            judge: 'Honorable Judge Harshita Sharma'
        }
    ];
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
            <td>${c.leadCase}</td>
            <td>${(c.joinedCases || []).join(', ')}</td>
            <td><span class="type-badge ${c.type}">${getTypeLabel(c.type)}</span></td>
            <td><span class="priority-badge ${getPriorityClass(c.priority)}">${c.priority.toUpperCase()}</span></td>
            <td><span class="status-badge ${getStatusClass(c.status)}">${getStatusLabel(c.status)}</span></td>
            <td>${c.courtRoom}</td>
            <td>${formatDate(c.nextHearing)}</td>
            <td class="actions"><button class="btn-icon" onclick="viewCaseDetails('${c.id}')" title="View"><i class="fas fa-eye"></i></button><button class="btn-icon" onclick="prepareStatusModal('${c.id}')" title="Update"><i class="fas fa-edit"></i></button></td>
        `;
        tbody.appendChild(row);
    });
}

function filterCases() {
    const typeFilter = document.getElementById('type-filter').value;
    const priorityFilter = document.getElementById('priority-filter').value;
    const searchTerm = document.getElementById('search-input').value.toLowerCase();

    filteredCases = adjoinedCases.filter(c => {
        const typeMatch = typeFilter === 'all' || (c.type || '').toLowerCase() === typeFilter;
        const priorityMatch = priorityFilter === 'all' || (c.priority || '').toLowerCase() === priorityFilter;
        const searchMatch = !searchTerm || (c.id || '').toLowerCase().includes(searchTerm) || (c.leadCase || '').toLowerCase().includes(searchTerm) || c.joinedCases?.some(j => j.toLowerCase().includes(searchTerm)) || (c.description || '').toLowerCase().includes(searchTerm);
        return typeMatch && priorityMatch && searchMatch;
    });

    renderCases();
}

function viewCaseDetails(caseId) {
    currentCaseId = caseId;
    const c = adjoinedCases.find(item => item.id === caseId);
    if (!c) return;

    const details = document.getElementById('case-details');
    details.innerHTML = `
        <div class="case-details-grid">
            <div class="detail-section"><h3>${c.id}</h3><p><strong>Lead Case:</strong> ${c.leadCase}</p><p><strong>Joined Cases:</strong> ${(c.joinedCases || []).join(', ')}</p><p><strong>Judge:</strong> ${c.judge}</p><p><strong>Courtroom:</strong> ${c.courtRoom}</p></div>
            <div class="detail-section"><h3>Status</h3><p><span class="status-badge ${getStatusClass(c.status)}">${getStatusLabel(c.status)}</span></p><p><span class="priority-badge ${getPriorityClass(c.priority)}">${c.priority.toUpperCase()}</span></p></div>
            <div class="detail-section"><h3>Next Hearing</h3><p>${formatDate(c.nextHearing)}</p></div>
            <div class="detail-section"><h3>Description</h3><p>${c.description}</p></div>
        </div>
    `;

    document.getElementById('case-modal').style.display = 'block';
}

function prepareStatusModal(caseId) {
    currentCaseId = caseId;
    document.getElementById('status-modal').style.display = 'block';
}

async function submitStatusUpdate() {
    const newStatus = document.getElementById('new-status').value;
    const notes = document.getElementById('status-notes').value;

    if (!newStatus) return;

    try {
        const response = await fetch(`/api/cases/${currentCaseId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus, notes })
        });

        if (response.ok) {
            const caseItem = adjoinedCases.find(c => c.id === currentCaseId);
            if (caseItem) { caseItem.status = newStatus; if (notes) caseItem.notes = notes; }
            closeStatusModal();
            filterCases();
            return;
        }
        throw new Error('Update failed');
    } catch (error) {
        const caseItem = adjoinedCases.find(c => c.id === currentCaseId);
        if (caseItem) { caseItem.status = newStatus; if (notes) caseItem.notes = notes; }
        closeStatusModal();
        filterCases();
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

function refreshCases() { loadAdjoinedCases(); }

function setupEventListeners() {
    window.onclick = (event) => {
        if (event.target === document.getElementById('case-modal')) closeModal();
        if (event.target === document.getElementById('status-modal')) closeStatusModal();
    };
}

function getStatusClass(status) { return { pending: 'pending', 'in-progress': 'in-progress', completed: 'completed', postponed: 'postponed' }[status] || 'pending'; }
function getStatusLabel(status) { return { pending: 'Pending', 'in-progress': 'In Progress', completed: 'Completed', postponed: 'Postponed' }[status] || 'Pending'; }
function getPriorityClass(priority) { return { urgent: 'urgent', high: 'high', medium: 'medium', low: 'low' }[priority] || 'medium'; }
function getTypeLabel(type) { return { civil: 'Civil', criminal: 'Criminal', family: 'Family', property: 'Property', commercial: 'Commercial' }[type] || 'Civil'; }
function formatDate(dateStr) { if (!dateStr || dateStr === 'Disposed') return dateStr || 'N/A'; const date = new Date(dateStr); return date.toLocaleDateString('en-IN',{ day:'numeric', month:'short', year:'numeric' }); }
function showLoading() { document.getElementById('loading-spinner').style.display = 'block'; document.getElementById('cases-table').style.display = 'none'; }
function hideLoading() { document.getElementById('loading-spinner').style.display = 'none'; document.getElementById('cases-table').style.display = 'table'; }