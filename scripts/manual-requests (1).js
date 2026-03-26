// Manual Requests Page JavaScript - Frontend Logic

// Global variables
let requestsData = [];
let filteredRequests = [];
let currentPage = 1;
let itemsPerPage = 10;
let apiBaseUrl = '';

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
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
            console.log('No backend detected, running in static mode');
            loadMockRequests();
        }
    });
}

// Setup event listeners
function setupEventListeners() {
    // Form validation
    const form = document.getElementById('newRequestForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
        });
    }
}

// Load requests data
function loadRequests() {
    if (!apiBaseUrl) {
        // Already loaded in detectBackend
        return;
    }

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
            loadMockRequests();
        });
}

// Load mock requests for static mode
function loadMockRequests() {
    requestsData = [
        {
            id: "REQ-2024-001",
            type: "case-transfer",
            subject: "Transfer of Civil Suit #CS-2024-089",
            description: "Request to transfer case to High Court due to complexity",
            status: "approved",
            priority: "high",
            submittedDate: "2024-03-20",
            caseId: "CS-2024-089",
            justification: "Case involves complex legal issues requiring higher court expertise"
        },
        {
            id: "REQ-2024-002",
            type: "hearing-postpone",
            subject: "Postpone hearing for Family Dispute #FD-2024-045",
            description: "Medical emergency requires postponement",
            status: "pending",
            priority: "urgent",
            submittedDate: "2024-03-19",
            caseId: "FD-2024-045",
            justification: "Defendant hospitalized, medical certificate attached"
        },
        {
            id: "REQ-2024-003",
            type: "document-request",
            subject: "Additional documents required for Property Case",
            description: "Request for missing property documents",
            status: "processing",
            priority: "medium",
            submittedDate: "2024-03-18",
            caseId: "PC-2024-067",
            justification: "Documents essential for fair trial proceedings"
        },
        {
            id: "REQ-2024-004",
            type: "witness-summon",
            subject: "Summon additional witness for Criminal Case",
            description: "Key witness not present during initial hearing",
            status: "approved",
            priority: "high",
            submittedDate: "2024-03-17",
            caseId: "CR-2024-023",
            justification: "Witness testimony crucial for case resolution"
        },
        {
            id: "REQ-2024-005",
            type: "court-order",
            subject: "Amendment to court order #CO-2024-012",
            description: "Correct clerical error in order date",
            status: "rejected",
            priority: "low",
            submittedDate: "2024-03-16",
            caseId: "CO-2024-012",
            justification: "Typographical error in original order"
        },
        {
            id: "REQ-2024-006",
            type: "administrative",
            subject: "Request for additional court staff",
            description: "Need extra clerical support for backlog",
            status: "pending",
            priority: "medium",
            submittedDate: "2024-03-15",
            justification: "Current workload exceeds capacity"
        },
        {
            id: "REQ-2024-007",
            type: "case-transfer",
            subject: "Transfer Commercial Dispute to Specialized Court",
            description: "Case involves complex commercial law",
            status: "processing",
            priority: "medium",
            submittedDate: "2024-03-14",
            caseId: "CD-2024-034",
            justification: "Specialized court better equipped to handle technical aspects"
        },
        {
            id: "REQ-2024-008",
            type: "hearing-postpone",
            subject: "Postpone hearing due to lawyer unavailability",
            description: "Counsel has medical emergency",
            status: "approved",
            priority: "high",
            submittedDate: "2024-03-13",
            caseId: "CS-2024-078",
            justification: "Legal representation essential for fair trial"
        }
    ];

    filteredRequests = [...requestsData];
    updateRequestsUI();
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
            <button class="btn btn-sm btn-primary" onclick="viewRequestDetails('${request.id}')">
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
    const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');

    document.getElementById('currentPage').textContent = currentPage;
    document.getElementById('totalPages').textContent = totalPages;

    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages;
}

function changePage(direction) {
    const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
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

    if (!apiBaseUrl) {
        // Static mode - simulate submission
        const newRequest = {
            id: `REQ-2024-${String(requestsData.length + 1).padStart(3, '0')}`,
            type: formData.get('type'),
            subject: formData.get('subject'),
            description: formData.get('description'),
            status: 'pending',
            priority: formData.get('priority'),
            submittedDate: new Date().toISOString().split('T')[0],
            caseId: formData.get('caseId') || null,
            justification: formData.get('justification')
        };

        requestsData.unshift(newRequest);
        filteredRequests = [...requestsData];
        updateRequestsUI();
        closeNewRequestModal();
        showToast('Request submitted successfully');
        return;
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
window.viewRequestDetails = viewRequestDetails;
window.editRequest = editRequest;
window.filterRequests = filterRequests;
window.changePage = changePage;