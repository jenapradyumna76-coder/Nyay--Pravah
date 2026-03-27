// Manual Requests Page JavaScript - Frontend Logic

// Global variables
let requestsData = [];
let filteredRequests = [];
let currentPage = 1;
let itemsPerPage = 10;
let apiBaseUrl = '';
let requestHoverTooltip = null;

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function () {
    detectBackend().then(() => {
        loadRequests();
        setupEventListeners();
    });
});

// Detect available backend
function detectBackend() {
    const ports = [3000, 5000];
    let portIndex = 0;

    function tryPort(port) {
        return fetch(`http://localhost:${port}/api/requests`, { method: 'HEAD' })
            .then(() => {
                apiBaseUrl = `http://localhost:${port}`;
                console.log(`Backend detected at ${apiBaseUrl}`);
                return true;
            })
            .catch(() => {
                if (portIndex < ports.length - 1) {
                    portIndex++;
                    return tryPort(ports[portIndex]);
                }
                return false;
            });
    }

    return tryPort(ports[0]).then(hasBackend => {
        if (!hasBackend) {
            apiBaseUrl = '';
            console.warn('No backend detected on localhost probe. Falling back to relative API path.');
        }
    });
}

// Setup event listeners
function setupEventListeners() {
    // Form validation
    const form = document.getElementById('newRequestForm');
    if (form) {
        form.addEventListener('submit', function (e) {
            e.preventDefault();
        });
    }

    setupRequestDescriptionTooltip();
}

function setupRequestDescriptionTooltip() {
    const tableBody = document.getElementById('requestsTableBody');
    if (!tableBody) return;

    requestHoverTooltip = document.createElement('div');
    requestHoverTooltip.className = 'manual-request-hover-tooltip';
    requestHoverTooltip.setAttribute('role', 'tooltip');
    document.body.appendChild(requestHoverTooltip);

    const showTooltip = (target, text, x, y) => {
        if (!requestHoverTooltip || !text) return;
        requestHoverTooltip.textContent = text;
        requestHoverTooltip.classList.add('show');

        const offset = 14;
        const maxLeft = window.innerWidth - requestHoverTooltip.offsetWidth - 12;
        const left = Math.min(Math.max(12, x + offset), maxLeft);

        const topCandidate = y + offset;
        const fitsBelow = topCandidate + requestHoverTooltip.offsetHeight <= window.innerHeight - 12;
        const top = fitsBelow
            ? topCandidate
            : Math.max(12, y - requestHoverTooltip.offsetHeight - offset);

        requestHoverTooltip.style.left = `${left}px`;
        requestHoverTooltip.style.top = `${top}px`;
    };

    const hideTooltip = () => {
        if (!requestHoverTooltip) return;
        requestHoverTooltip.classList.remove('show');
    };

    tableBody.addEventListener('mouseover', (event) => {
        const button = event.target.closest('.btn[data-description]');
        if (!button || !tableBody.contains(button)) return;
        showTooltip(button, button.getAttribute('data-description'), event.clientX, event.clientY);
    });

    tableBody.addEventListener('mousemove', (event) => {
        const button = event.target.closest('.btn[data-description]');
        if (!button || !tableBody.contains(button)) return;
        showTooltip(button, button.getAttribute('data-description'), event.clientX, event.clientY);
    });

    tableBody.addEventListener('mouseout', (event) => {
        const button = event.target.closest('.btn[data-description]');
        if (!button || !tableBody.contains(button)) return;

        const related = event.relatedTarget;
        if (related && button.contains(related)) return;
        hideTooltip();
    });

    tableBody.addEventListener('focusin', (event) => {
        const button = event.target.closest('.btn[data-description]');
        if (!button || !tableBody.contains(button)) return;
        const rect = button.getBoundingClientRect();
        showTooltip(button, button.getAttribute('data-description'), rect.left + rect.width / 2, rect.bottom);
    });

    tableBody.addEventListener('focusout', hideTooltip);
}

// Load requests data
function loadRequests() {
    fetch(`${apiBaseUrl}/api/requests`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch requests');
            }
            return response.json();
        })
        .then(data => {
            requestsData = data.requests || [];
            filteredRequests = [...requestsData];
            updateRequestsUI();
        })
        .catch(error => {
            console.error('Error fetching requests:', error);
            requestsData = [];
            filteredRequests = [];
            updateRequestsUI();
        });
}

// Update requests UI
function updateRequestsUI() {
    updateStats();
    updateRequestsTable();
    updatePagination();
}

// Update statistics
function updateStats() {
    const stats = {
        pending: requestsData.filter(r => r.status === 'pending').length,
        approved: requestsData.filter(r => r.status === 'approved').length,
        rejected: requestsData.filter(r => r.status === 'rejected').length,
        processing: requestsData.filter(r => r.status === 'processing').length
    };

    document.getElementById('pendingRequests').textContent = stats.pending;
    document.getElementById('approvedRequests').textContent = stats.approved;
    document.getElementById('rejectedRequests').textContent = stats.rejected;
    document.getElementById('processingRequests').textContent = stats.processing;
    document.getElementById('totalRequests').textContent = `${requestsData.length} total requests`;
}

// Update requests table
function updateRequestsTable() {
    const tbody = document.getElementById('requestsTableBody');
    tbody.innerHTML = '';

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageRequests = filteredRequests.slice(startIndex, endIndex);

    pageRequests.forEach(request => {
        const row = createRequestRow(request);
        tbody.appendChild(row);
    });
}

// Create request table row
function createRequestRow(request) {
    const row = document.createElement('tr');

    const statusClass = `status-${request.status}`;
    const priorityClass = `priority-${request.priority}`;
    const hoverDescription = escapeHtmlAttribute(request.description || 'No description available');

    row.innerHTML = `
        <td class="request-id">${request.id}</td>
        <td>
            <span class="request-type">${formatRequestType(request.type)}</span>
        </td>
        <td class="request-subject">${request.subject}</td>
        <td>
            <span class="status-badge ${statusClass}">${formatStatus(request.status)}</span>
        </td>
        <td>
            <span class="priority-badge ${priorityClass}">${formatPriority(request.priority)}</span>
        </td>
        <td>${formatDate(request.submittedDate)}</td>
        <td class="actions">
            <button class="btn btn-sm btn-primary" onclick="openRequestPreview('${request.id}')" data-description="${hoverDescription}">
                <i class="fas fa-eye"></i> View
            </button>
            ${request.status === 'pending' ? `
                <button class="btn btn-sm btn-secondary" onclick="editRequest('${request.id}')">
                    <i class="fas fa-edit"></i> Edit
                </button>
            ` : ''}
        </td>
    `;

    return row;
}

function openRequestPreview(requestId) {
    const request = requestsData.find(r => r.id === requestId);
    if (request && request.description) {
        showToast(request.description);
    }
    viewRequestDetails(requestId);
}

function escapeHtmlAttribute(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

// Format functions
function formatRequestType(type) {
    const types = {
        'case-transfer': 'Case Transfer',
        'hearing-postpone': 'Hearing Postpone',
        'document-request': 'Document Request',
        'witness-summon': 'Witness Summon',
        'court-order': 'Court Order',
        'administrative': 'Administrative'
    };
    return types[type] || type;
}

function formatStatus(status) {
    const statuses = {
        'pending': 'Pending',
        'processing': 'Processing',
        'approved': 'Approved',
        'rejected': 'Rejected'
    };
    return statuses[status] || status;
}

function formatPriority(priority) {
    const priorities = {
        'low': 'Low',
        'medium': 'Medium',
        'high': 'High',
        'urgent': 'Urgent'
    };
    return priorities[priority] || priority;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Filter requests
function filterRequests() {
    const statusFilter = document.getElementById('statusFilter').value;
    const typeFilter = document.getElementById('typeFilter').value;
    const dateFilter = document.getElementById('dateFilter').value;

    filteredRequests = requestsData.filter(request => {
        // Status filter
        if (statusFilter !== 'all' && request.status !== statusFilter) {
            return false;
        }

        // Type filter
        if (typeFilter !== 'all' && request.type !== typeFilter) {
            return false;
        }

        // Date filter
        if (dateFilter !== 'all') {
            const requestDate = new Date(request.submittedDate);
            const now = new Date();
            let daysDiff;

            switch (dateFilter) {
                case 'today':
                    daysDiff = 0;
                    break;
                case 'week':
                    daysDiff = 7;
                    break;
                case 'month':
                    daysDiff = 30;
                    break;
            }

            const cutoffDate = new Date(now.getTime() - (daysDiff * 24 * 60 * 60 * 1000));
            if (requestDate < cutoffDate) {
                return false;
            }
        }

        return true;
    });

    currentPage = 1;
    updateRequestsUI();
}

// Pagination
function updatePagination() {
    const totalPages = Math.max(1, Math.ceil(filteredRequests.length / itemsPerPage));
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');

    document.getElementById('currentPage').textContent = currentPage;
    document.getElementById('totalPages').textContent = totalPages;

    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages;
}

function changePage(direction) {
    const totalPages = Math.max(1, Math.ceil(filteredRequests.length / itemsPerPage));
    currentPage += direction;

    if (currentPage < 1) currentPage = 1;
    if (currentPage > totalPages) currentPage = totalPages;

    updateRequestsTable();
    updatePagination();
}

// Modal functions
function openNewRequestModal() {
    document.getElementById('newRequestModal').classList.add('show');
}

function closeNewRequestModal() {
    document.getElementById('newRequestModal').classList.remove('show');
    document.getElementById('newRequestForm').reset();
}

function closeRequestDetailsModal() {
    document.getElementById('requestDetailsModal').classList.remove('show');
}

// Submit new request
function submitNewRequest() {
    const form = document.getElementById('newRequestForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const formData = new FormData();
    formData.append('type', document.getElementById('requestType').value);
    formData.append('priority', document.getElementById('requestPriority').value);
    formData.append('caseId', document.getElementById('caseId').value);
    formData.append('subject', document.getElementById('requestSubject').value);
    formData.append('description', document.getElementById('requestDescription').value);
    formData.append('justification', document.getElementById('justification').value);

    // Handle file attachments
    const attachments = document.getElementById('attachments').files;
    for (let i = 0; i < attachments.length; i++) {
        formData.append('attachments', attachments[i]);
    }

    // Submit to backend
    fetch(`${apiBaseUrl}/api/requests`, {
        method: 'POST',
        body: formData
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to submit request');
            }
            return response.json();
        })
        .then(data => {
            loadRequests(); // Refresh data
            closeNewRequestModal();
            showToast('Request submitted successfully');
        })
        .catch(error => {
            console.error('Error submitting request:', error);
            showToast('Error submitting request', 'error');
        });
}

// View request details
function viewRequestDetails(requestId) {
    const request = requestsData.find(r => r.id === requestId);
    if (!request) return;

    const modal = document.getElementById('requestDetailsModal');
    const content = document.getElementById('requestDetailsContent');

    content.innerHTML = `
        <div class="request-details">
            <div class="detail-row">
                <strong>Request ID:</strong> ${request.id}
            </div>
            <div class="detail-row">
                <strong>Type:</strong> ${formatRequestType(request.type)}
            </div>
            <div class="detail-row">
                <strong>Subject:</strong> ${request.subject}
            </div>
            <div class="detail-row">
                <strong>Status:</strong>
                <span class="status-badge status-${request.status}">${formatStatus(request.status)}</span>
            </div>
            <div class="detail-row">
                <strong>Priority:</strong>
                <span class="priority-badge priority-${request.priority}">${formatPriority(request.priority)}</span>
            </div>
            <div class="detail-row">
                <strong>Submitted Date:</strong> ${formatDate(request.submittedDate)}
            </div>
            ${request.caseId ? `<div class="detail-row"><strong>Related Case:</strong> ${request.caseId}</div>` : ''}
            <div class="detail-row">
                <strong>Description:</strong>
                <p>${request.description}</p>
            </div>
            <div class="detail-row">
                <strong>Justification:</strong>
                <p>${request.justification}</p>
            </div>
        </div>
    `;

    modal.classList.add('show');
}

// Edit request (placeholder)
function editRequest(requestId) {
    showToast('Edit functionality coming soon');
}

// Toast notification
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    if (!toast) return;

    const icon = toast.querySelector('i');
    const span = toast.querySelector('span');

    if (type === 'error') {
        icon.className = 'fas fa-exclamation-triangle';
        toast.style.backgroundColor = '#dc3545';
    } else {
        icon.className = 'fas fa-check-circle';
        toast.style.backgroundColor = '#28a745';
    }

    span.textContent = message;
    toast.classList.remove('hidden');

    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}

// Make functions globally available
window.loadRequests = loadRequests;
window.openNewRequestModal = openNewRequestModal;
window.closeNewRequestModal = closeNewRequestModal;
window.closeRequestDetailsModal = closeRequestDetailsModal;
window.submitNewRequest = submitNewRequest;
window.openRequestPreview = openRequestPreview;
window.viewRequestDetails = viewRequestDetails;
window.editRequest = editRequest;
window.filterRequests = filterRequests;
window.changePage = changePage;