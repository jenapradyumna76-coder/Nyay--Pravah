const MANUAL_REVIEW_REQUESTS_KEY = 'nyay_pravah_manual_review_requests_v1';

function loadManualReviewRequests() {
    try {
        const raw = localStorage.getItem(MANUAL_REVIEW_REQUESTS_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (error) {
        console.warn('Unable to parse manual review requests.', error);
        return [];
    }
}

function saveManualReviewRequests(requests) {
    localStorage.setItem(MANUAL_REVIEW_REQUESTS_KEY, JSON.stringify(requests));
}

function getActiveUserProfile() {
    try {
        const raw = sessionStorage.getItem('nyay_pravah_active_user');
        return raw ? JSON.parse(raw) : null;
    } catch (error) {
        console.warn('Unable to parse active user profile.', error);
        return null;
    }
}

function toDateTimeLabel(value) {
    if (!value) return '-';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleString();
}

function escapeHtml(value) {
    const str = String(value || '');
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function buildLawyerRequestCard(request) {
    let statusText = 'Pending';
    let statusClass = 'status-pending';
    if (request.status === 'accepted') {
        statusText = 'Accepted';
        statusClass = 'status-ok';
    } else if (request.status === 'rejected') {
        statusText = 'Rejected';
        statusClass = 'status-rejected';
    }
    const fileText = request.fileNames && request.fileNames.length ? request.fileNames.join(', ') : 'No file list available';
    const rejectedReasonText = request.rejectedReason ? `<div class="report-card-meta">Rejection Reason: ${escapeHtml(request.rejectedReason)}</div>` : '';

    return `
    <article class="report-card">
        <div class="report-card-title">${escapeHtml(request.caseId)} - ${escapeHtml(request.caseTitle)}</div>
        <div class="report-card-meta">Status: <span class="${statusClass}">${statusText}</span></div>
        <div class="report-card-meta">Submitted: ${toDateTimeLabel(request.submittedAt)}</div>
        <div class="report-card-meta">Scheduled Time: ${toDateTimeLabel(request.scheduledAt)}</div>
        <div class="report-card-meta">Summary: ${escapeHtml(request.caseSummary)}</div>
        <div class="report-card-meta">Description: ${escapeHtml(request.caseDescription)}</div>
        <div class="report-card-meta">Files: ${escapeHtml(fileText)}</div>
        ${rejectedReasonText}
    </article>`;
}

function renderLawyerManualRequestHistory() {
    const historyNode = document.getElementById('lawyerManualRequestHistory');
    if (!historyNode) return;

    const activeUser = getActiveUserProfile();
    const userEmail = activeUser && activeUser.email ? activeUser.email : '';
    const requests = loadManualReviewRequests().filter((item) => !userEmail || item.lawyerEmail === userEmail);

    if (!requests.length) {
        historyNode.innerHTML = '<div class="empty-cases">No manual review request submitted yet.</div>';
        return;
    }

    historyNode.innerHTML = requests
        .slice()
        .reverse()
        .map((item) => buildLawyerRequestCard(item))
        .join('');
}

function renderLawyerManualUpdates() {
    const updatesNode = document.getElementById('lawyerManualUpdatesList');
    if (!updatesNode) return;

    const activeUser = getActiveUserProfile();
    const userEmail = activeUser && activeUser.email ? activeUser.email : '';
    const updates = loadManualReviewRequests().filter((item) => (
        (item.status === 'accepted' || item.status === 'rejected')
        && (!userEmail || item.lawyerEmail === userEmail)
    ));

    if (!updates.length) {
        updatesNode.innerHTML = '<div class="empty-cases">No accepted or rejected manual review request yet.</div>';
        return;
    }

    updatesNode.innerHTML = updates
        .slice()
        .reverse()
        .map((item) => `
            <article class="report-card">
                <div class="report-card-title">${escapeHtml(item.caseId)} ${item.status === 'accepted' ? 'accepted' : 'rejected'} by Judge</div>
                <div class="report-card-meta">Status: <span class="${item.status === 'accepted' ? 'status-ok' : 'status-rejected'}">${item.status === 'accepted' ? 'Accepted' : 'Rejected'}</span></div>
                <div class="report-card-meta">Case: ${escapeHtml(item.caseTitle)}</div>
                <div class="report-card-meta">Scheduled Time: ${toDateTimeLabel(item.scheduledAt)}</div>
                ${item.rejectedReason ? `<div class="report-card-meta">Rejection Reason: ${escapeHtml(item.rejectedReason)}</div>` : ''}
            </article>
        `).join('');
}

function bindLawyerManualReviewForm() {
    const form = document.getElementById('manualReviewForm');
    if (!form) return;

    form.addEventListener('submit', (event) => {
        event.preventDefault();

        const activeUser = getActiveUserProfile() || {};
        const caseId = document.getElementById('manual-case-id').value.trim();
        const caseTitle = document.getElementById('manual-case-title').value.trim();
        const caseSummary = document.getElementById('manual-case-summary').value.trim();
        const caseDescription = document.getElementById('manual-case-description').value.trim();
        const fileInput = document.getElementById('manual-case-files');
        const fileNames = fileInput && fileInput.files ? Array.from(fileInput.files).map((file) => file.name) : [];

        if (!caseId || !caseTitle || !caseSummary || !caseDescription || !fileNames.length) {
            alert('Please fill all fields and upload at least one file.');
            return;
        }

        const requests = loadManualReviewRequests();
        requests.push({
            requestId: `MRQ-${Date.now()}`,
            caseId,
            caseTitle,
            caseSummary,
            caseDescription,
            fileNames,
            status: 'pending',
            scheduledAt: '',
            submittedAt: new Date().toISOString(),
            lawyerEmail: activeUser.email || '',
            lawyerName: activeUser.fullName || 'Lawyer'
        });

        saveManualReviewRequests(requests);
        form.reset();
        alert('Manual review request submitted to Judge successfully.');
        renderLawyerManualRequestHistory();
        renderLawyerManualUpdates();
    });
}

function buildJudgePendingCard(request) {
    const fileText = request.fileNames && request.fileNames.length ? request.fileNames.join(', ') : 'No files uploaded';

    return `
    <article class="report-card" data-request-id="${escapeHtml(request.requestId)}">
        <div class="report-card-title">${escapeHtml(request.caseId)} - ${escapeHtml(request.caseTitle)}</div>
        <div class="report-card-meta">Status: <span class="status-pending">Pending</span></div>
        <div class="report-card-meta">Lawyer: ${escapeHtml(request.lawyerName || 'Lawyer')} ${request.lawyerEmail ? `(${escapeHtml(request.lawyerEmail)})` : ''}</div>
        <div class="report-card-meta">Submitted: ${toDateTimeLabel(request.submittedAt)}</div>
        <div class="report-card-meta">Summary: ${escapeHtml(request.caseSummary)}</div>
        <div class="report-card-meta">Description: ${escapeHtml(request.caseDescription)}</div>
        <div class="report-card-meta">Files: ${escapeHtml(fileText)}</div>
        <div class="manual-schedule-row">
            <label for="schedule-${escapeHtml(request.requestId)}">Schedule Time</label>
            <input id="schedule-${escapeHtml(request.requestId)}" class="manual-schedule-input" type="datetime-local" value="${request.scheduledAt || ''}">
            <label for="reject-reason-${escapeHtml(request.requestId)}">Rejection Reason (if rejecting)</label>
            <input id="reject-reason-${escapeHtml(request.requestId)}" class="manual-schedule-input" type="text" placeholder="Optional rejection reason">
            <button type="button" class="main-btn manual-accept-btn" data-request-id="${escapeHtml(request.requestId)}">Accept Request</button>
            <button type="button" class="main-btn manual-reject-btn" data-request-id="${escapeHtml(request.requestId)}">Reject Request</button>
        </div>
    </article>`;
}

function renderJudgeManualRequests() {
    const pendingNode = document.getElementById('judgeManualPendingList');
    const acceptedNode = document.getElementById('judgeManualAcceptedList');
    const rejectedNode = document.getElementById('judgeManualRejectedList');
    if (!pendingNode && !acceptedNode && !rejectedNode) return;

    const requests = loadManualReviewRequests();
    const pending = requests.filter((item) => item.status === 'pending');
    const accepted = requests.filter((item) => item.status === 'accepted');
    const rejected = requests.filter((item) => item.status === 'rejected');

    if (pendingNode) {
        pendingNode.innerHTML = pending.length
            ? pending.map((item) => buildJudgePendingCard(item)).join('')
            : '<div class="empty-cases">No pending manual verification requests.</div>';
    }

    if (acceptedNode) {
        acceptedNode.innerHTML = accepted.length
            ? accepted.slice().reverse().map((item) => `
                <article class="report-card">
                    <div class="report-card-title">${escapeHtml(item.caseId)} - ${escapeHtml(item.caseTitle)}</div>
                    <div class="report-card-meta">Status: <span class="status-ok">Accepted</span></div>
                    <div class="report-card-meta">Accepted and scheduled at ${toDateTimeLabel(item.scheduledAt)}</div>
                    <div class="report-card-meta">Lawyer: ${escapeHtml(item.lawyerName || 'Lawyer')}</div>
                </article>
            `).join('')
            : '<div class="empty-cases">No accepted manual requests yet.</div>';
    }

    if (rejectedNode) {
        rejectedNode.innerHTML = rejected.length
            ? rejected.slice().reverse().map((item) => `
                <article class="report-card">
                    <div class="report-card-title">${escapeHtml(item.caseId)} - ${escapeHtml(item.caseTitle)}</div>
                    <div class="report-card-meta">Status: <span class="status-rejected">Rejected</span></div>
                    <div class="report-card-meta">Lawyer: ${escapeHtml(item.lawyerName || 'Lawyer')}</div>
                    <div class="report-card-meta">Rejection Reason: ${escapeHtml(item.rejectedReason || 'Not provided')}</div>
                </article>
            `).join('')
            : '<div class="empty-cases">No rejected manual requests yet.</div>';
    }
}

function bindJudgeManualAccept() {
    const pendingNode = document.getElementById('judgeManualPendingList');
    if (!pendingNode) return;

    pendingNode.addEventListener('click', (event) => {
        const target = event.target.closest('.manual-accept-btn');
        if (!target) return;

        const requestId = target.getAttribute('data-request-id');
        const isAccept = target.classList.contains('manual-accept-btn');
        const isReject = target.classList.contains('manual-reject-btn');
        if (!isAccept && !isReject) return;

        const scheduleInput = document.getElementById(`schedule-${requestId}`);
        const rejectReasonInput = document.getElementById(`reject-reason-${requestId}`);
        const scheduledAt = scheduleInput ? scheduleInput.value : '';

        if (isAccept && !scheduledAt) {
            alert('Please select schedule date and time before accepting the request.');
            return;
        }

        if (isReject && !rejectReasonInput?.value.trim()) {
            alert('Please add rejection reason before rejecting the request.');
            return;
        }

        const requests = loadManualReviewRequests();
        const request = requests.find((item) => item.requestId === requestId);
        if (!request) {
            alert('Manual request was not found.');
            return;
        }

        if (isAccept) {
            request.status = 'accepted';
            request.scheduledAt = scheduledAt;
            request.rejectedReason = '';
        } else {
            request.status = 'rejected';
            request.rejectedReason = rejectReasonInput.value.trim();
            request.scheduledAt = '';
        }
        saveManualReviewRequests(requests);

        if (isAccept && window.JudgeCaseStore && typeof window.JudgeCaseStore.addManualCase === 'function') {
            window.JudgeCaseStore.addManualCase({
                caseId: request.caseId,
                caseTitle: request.caseTitle,
                caseSummary: request.caseSummary,
                caseDescription: request.caseDescription
            });
        }

        alert(isAccept
            ? 'Manual request accepted. Case has been added to current dashboard queue.'
            : 'Manual request rejected. Status updated for lawyer.');
        renderJudgeManualRequests();
    });
}

document.addEventListener('DOMContentLoaded', () => {
    bindLawyerManualReviewForm();
    renderLawyerManualRequestHistory();
    renderLawyerManualUpdates();

    bindJudgeManualAccept();
    renderJudgeManualRequests();
});
