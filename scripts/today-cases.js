// Today Cases JavaScript
let todayCases = [];
let filteredCases = [];
let currentCaseId = null;

// Initialize page
document.addEventListener('DOMContentLoaded', function () {
    initializePage();
});

async function initializePage() {
    setCurrentDate();
    await loadTodayCases();
    setupEventListeners();
}

function setCurrentDate() {
    const today = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('current-date').textContent = today.toLocaleDateString('en-IN', options);
}

async function loadTodayCases() {
    showLoading();

    try {
        const response = await fetch('/api/today-cases');
        if (response.ok) {
            const data = await response.json();
            todayCases = data.cases || [];
        } else {
            todayCases = [];
        }
    } catch (error) {
        console.error('Unable to load today cases from backend:', error.message);
        todayCases = [];
    }

    filteredCases = [...todayCases];
    renderCases();
    updateSummaryCards();
    hideLoading();
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

    filteredCases.forEach(caseItem => {
        const row = createCaseRow(caseItem);
        tbody.appendChild(row);
    });
}

function createCaseRow(caseItem) {
    const row = document.createElement('tr');

    const statusClass = getStatusClass(caseItem.status);
    const priorityClass = getPriorityClass(caseItem.priority);
    const typeLabel = getTypeLabel(caseItem.type);

    row.innerHTML = `
        <td class="case-id">${caseItem.id}</td>
        <td><span class="type-badge ${caseItem.type}">${typeLabel}</span></td>
        <td class="case-title">${caseItem.title}</td>
        <td class="parties">
            <div class="party-info">
                <strong>${caseItem.plaintiff}</strong>
                <span class="vs">vs</span>
                <strong>${caseItem.defendant}</strong>
            </div>
        </td>
        <td class="time">${caseItem.time}</td>
        <td><span class="priority-badge ${priorityClass}">${caseItem.priority.toUpperCase()}</span></td>
        <td><span class="status-badge ${statusClass}">${getStatusLabel(caseItem.status)}</span></td>
        <td class="actions">
            <button class="btn-icon" onclick="viewCaseDetails('${caseItem.id}')" title="View Details">
                <i class="fas fa-eye"></i>
            </button>
            <button class="btn-icon" onclick="updateCaseStatus('${caseItem.id}')" title="Update Status">
                <i class="fas fa-edit"></i>
            </button>
        </td>
    `;

    return row;
}

function updateSummaryCards() {
    const total = todayCases.length;
    const pending = todayCases.filter(c => c.status === 'pending').length;
    const completed = todayCases.filter(c => c.status === 'completed').length;
    const urgent = todayCases.filter(c => c.priority === 'urgent').length;

    document.getElementById('total-cases').textContent = total;
    document.getElementById('pending-cases').textContent = pending;
    document.getElementById('completed-cases').textContent = completed;
    document.getElementById('urgent-cases').textContent = urgent;
}

function filterCases() {
    const statusFilter = document.getElementById('status-filter').value;
    const typeFilter = document.getElementById('type-filter').value;
    const priorityFilter = document.getElementById('priority-filter').value;
    const searchTerm = document.getElementById('search-input').value.toLowerCase();

    filteredCases = todayCases.filter(caseItem => {
        const matchesStatus = statusFilter === 'all' || caseItem.status === statusFilter;
        const matchesType = typeFilter === 'all' || caseItem.type === typeFilter;
        const matchesPriority = priorityFilter === 'all' || caseItem.priority === priorityFilter;
        const matchesSearch = !searchTerm ||
            caseItem.title.toLowerCase().includes(searchTerm) ||
            caseItem.id.toLowerCase().includes(searchTerm) ||
            caseItem.plaintiff.toLowerCase().includes(searchTerm) ||
            caseItem.defendant.toLowerCase().includes(searchTerm);

        return matchesStatus && matchesType && matchesPriority && matchesSearch;
    });

    renderCases();
}

function viewCaseDetails(caseId) {
    const caseItem = todayCases.find(c => c.id === caseId);
    if (!caseItem) return;

    const detailsDiv = document.getElementById('case-details');
    const statusClass = getStatusClass(caseItem.status);
    const priorityClass = getPriorityClass(caseItem.priority);
    const typeLabel = getTypeLabel(caseItem.type);

    detailsDiv.innerHTML = `
        <div class="case-details-grid">
            <div class="detail-section">
                <h3>Case Information</h3>
                <div class="detail-grid">
                    <div class="detail-item">
                        <label>Case ID:</label>
                        <span>${caseItem.id}</span>
                    </div>
                    <div class="detail-item">
                        <label>Type:</label>
                        <span class="type-badge ${caseItem.type}">${typeLabel}</span>
                    </div>
                    <div class="detail-item">
                        <label>Priority:</label>
                        <span class="priority-badge ${priorityClass}">${caseItem.priority.toUpperCase()}</span>
                    </div>
                    <div class="detail-item">
                        <label>Status:</label>
                        <span class="status-badge ${statusClass}">${getStatusLabel(caseItem.status)}</span>
                    </div>
                    <div class="detail-item">
                        <label>Time:</label>
                        <span>${caseItem.time}</span>
                    </div>
                    <div class="detail-item">
                        <label>Court Room:</label>
                        <span>${caseItem.courtRoom}</span>
                    </div>
                </div>
            </div>

            <div class="detail-section">
                <h3>Parties Involved</h3>
                <div class="parties-detailed">
                    <div class="party">
                        <h4>Plaintiff/Petitioner</h4>
                        <p>${caseItem.plaintiff}</p>
                    </div>
                    <div class="party">
                        <h4>Defendant/Respondent</h4>
                        <p>${caseItem.defendant}</p>
                    </div>
                </div>
            </div>

            <div class="detail-section">
                <h3>Case Description</h3>
                <p>${caseItem.description}</p>
            </div>

            <div class="detail-section">
                <h3>Hearing Information</h3>
                <div class="detail-grid">
                    <div class="detail-item">
                        <label>Last Hearing:</label>
                        <span>${formatDate(caseItem.lastHearing)}</span>
                    </div>
                    <div class="detail-item">
                        <label>Next Hearing:</label>
                        <span>${caseItem.nextHearing === 'Disposed' ? 'Case Disposed' : formatDate(caseItem.nextHearing)}</span>
                    </div>
                </div>
            </div>

            <div class="detail-section">
                <h3>Documents</h3>
                <ul class="documents-list">
                    ${caseItem.documents.map(doc => `<li><i class="fas fa-file-alt"></i> ${doc}</li>`).join('')}
                </ul>
            </div>

            <div class="detail-section">
                <h3>Notes</h3>
                <p>${caseItem.notes}</p>
            </div>
        </div>
    `;

    document.getElementById('case-modal').style.display = 'block';
    currentCaseId = caseId;
}

function updateCaseStatus(caseId) {
    currentCaseId = caseId;
    document.getElementById('status-modal').style.display = 'block';
}

async function submitStatusUpdate() {
    const newStatus = document.getElementById('new-status').value;
    const notes = document.getElementById('status-notes').value;

    if (!newStatus) {
        alert('Please select a status');
        return;
    }

    try {
        const response = await fetch(`/api/cases/${currentCaseId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                status: newStatus,
                notes: notes
            })
        });

        if (response.ok) {
            // Update local data
            const caseItem = todayCases.find(c => c.id === currentCaseId);
            if (caseItem) {
                caseItem.status = newStatus;
            }

            closeStatusModal();
            renderCases();
            updateSummaryCards();
            showNotification('Case status updated successfully', 'success');
        } else {
            throw new Error('Failed to update status');
        }
    } catch (error) {
        console.log('Backend not available, updating locally:', error.message);
        // Update locally
        const caseItem = todayCases.find(c => c.id === currentCaseId);
        if (caseItem) {
            caseItem.status = newStatus;
        }

        closeStatusModal();
        renderCases();
        updateSummaryCards();
        showNotification('Case status updated locally', 'info');
    }
}

function closeModal() {
    document.getElementById('case-modal').style.display = 'none';
    currentCaseId = null;
}

function closeStatusModal() {
    document.getElementById('status-modal').style.display = 'none';
    document.getElementById('status-form').reset();
    currentCaseId = null;
}

function refreshCases() {
    loadTodayCases();
    showNotification('Cases refreshed', 'info');
}

function setupEventListeners() {
    // Close modals when clicking outside
    window.onclick = function (event) {
        const caseModal = document.getElementById('case-modal');
        const statusModal = document.getElementById('status-modal');

        if (event.target === caseModal) {
            closeModal();
        }
        if (event.target === statusModal) {
            closeStatusModal();
        }
    };
}

// Utility functions
function getStatusClass(status) {
    const classes = {
        'pending': 'pending',
        'in-progress': 'in-progress',
        'completed': 'completed',
        'postponed': 'postponed'
    };
    return classes[status] || 'pending';
}

function getStatusLabel(status) {
    const labels = {
        'pending': 'Pending',
        'in-progress': 'In Progress',
        'completed': 'Completed',
        'postponed': 'Postponed'
    };
    return labels[status] || 'Pending';
}

function getPriorityClass(priority) {
    const classes = {
        'urgent': 'urgent',
        'high': 'high',
        'medium': 'medium',
        'low': 'low'
    };
    return classes[priority] || 'medium';
}

function getTypeLabel(type) {
    const labels = {
        'civil': 'Civil',
        'criminal': 'Criminal',
        'family': 'Family',
        'property': 'Property',
        'commercial': 'Commercial'
    };
    return labels[type] || 'Civil';
}

function formatDate(dateStr) {
    if (!dateStr || dateStr === 'Disposed') return dateStr;
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
}

function showLoading() {
    document.getElementById('loading-spinner').style.display = 'block';
    document.getElementById('cases-table').style.display = 'none';
}

function hideLoading() {
    document.getElementById('loading-spinner').style.display = 'none';
    document.getElementById('cases-table').style.display = 'table';
}

function showNotification(message, type = 'info') {
    // Simple notification - you can enhance this
    alert(message);
}