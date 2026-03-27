const STORAGE_KEY = 'nyay_pravah_dashboard_state_v6';
const AUTO_SYNC_INTERVAL_MS = 5000;
const isJudgeDashboard = document.title.includes('Judicial Command Center');
const isLawyerDashboard = document.title.includes('Lawyer Portal');
let dashboardSyncTimer = null;
let isDashboardSyncing = false;
let caseActionModal = null;
let pendingCaseActionContext = null;

function pad(num) {
    return String(num).padStart(3, '0');
}

function createInitialState() {
    return {
        cases: [],
        activeCaseIds: [],
        cursor: 0
    };
}

function getTodayIsoDate() {
    return new Date().toISOString().split('T')[0];
}

function statusLabel(status) {
    if (status === 'adjoined') return 'Completed';
    if (status === 'stay') return 'Stay';
    if (status === 'reschedule') return 'Rescheduled';
    return 'Pending';
}

function statusClass(status) {
    if (status === 'adjoined') return 'status-adjoined';
    if (status === 'stay') return 'status-stay';
    if (status === 'reschedule') return 'status-reschedule';
    return 'status-pending';
}

function clone(value) {
    return JSON.parse(JSON.stringify(value));
}

function loadState() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            const seeded = createInitialState();
            saveState(seeded);
            return seeded;
        }

        const parsed = JSON.parse(raw);
        if (!parsed || !Array.isArray(parsed.cases) || !Array.isArray(parsed.activeCaseIds) || typeof parsed.cursor !== 'number') {
            const seeded = createInitialState();
            saveState(seeded);
            return seeded;
        }

        return parsed;
    } catch (error) {
        console.warn('Invalid local dashboard data. Resetting to defaults.', error);
        const seeded = createInitialState();
        saveState(seeded);
        return seeded;
    }
}

function saveState(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function getCaseMap(state) {
    return new Map(state.cases.map((caseData) => [caseData.id, caseData]));
}

function getActiveCases(state) {
    const caseMap = getCaseMap(state);
    return state.activeCaseIds
        .map((id) => caseMap.get(id))
        .filter(Boolean)
        .filter((caseData) => caseData.status === 'pending');
}

function buildView(state, searchTerm = '') {
    const normalized = searchTerm.trim().toLowerCase();
    const activeCases = getActiveCases(state);
    const filteredActiveCases = normalized
        ? activeCases.filter((caseData) => caseData.id.toLowerCase().includes(normalized))
        : activeCases;

    const normalizedCases = filteredActiveCases.map((caseData) => ({ ...caseData }));

    const urgent = normalizedCases.filter((caseData) => caseData.priority === 'urgent');
    const high = normalizedCases.filter((caseData) => caseData.priority === 'high');
    const medium = normalizedCases.filter((caseData) => caseData.priority === 'medium' || (caseData.priority === 'none' && caseData.bucket === 'backlog'));
    const fresh = normalizedCases.filter((caseData) => caseData.priority === 'none' && caseData.bucket === 'fresh');
    const allFinished = getActiveCases(state).length === 0;

    return {
        ok: true,
        urgent,
        high,
        medium,
        fresh,
        counts: {
            urgent: urgent.length,
            high: high.length,
            medium: medium.length,
            fresh: fresh.length
        },
        allFinished
    };
}

function getPendingOutsideDashboard(state) {
    const activeIds = new Set(state.activeCaseIds);
    return state.cases.filter((caseData) => caseData.status === 'pending' && !activeIds.has(caseData.id));
}

function getCaseBuckets(state) {
    return {
        pending: state.cases.filter((caseData) => caseData.status === 'pending'),
        stay: state.cases.filter((caseData) => caseData.status === 'stay'),
        rehearing: state.cases.filter((caseData) => caseData.status === 'rehearing'),
        adjoined: state.cases.filter((caseData) => caseData.status === 'adjoined')
    };
}

function getAnalytics(state) {
    const buckets = getCaseBuckets(state);
    const activeCases = getActiveCases(state);

    return {
        totalCases: state.cases.length,
        activeOnDashboard: activeCases.length,
        pending: buckets.pending.length,
        stay: buckets.stay.length,
        rehearing: buckets.rehearing.length,
        adjoined: buckets.adjoined.length,
        availableToLoad: getPendingOutsideDashboard(state).length
    };
}

function ensurePriorityCoverage(caseBatch) {
    if (!Array.isArray(caseBatch) || caseBatch.length === 0) {
        return;
    }

    const hasUrgent = caseBatch.some((caseData) => caseData.priority === 'urgent');
    const hasHigh = caseBatch.some((caseData) => caseData.priority === 'high');

    if (!hasUrgent) {
        caseBatch[0].priority = 'urgent';
    }

    if (!hasHigh) {
        const highIndex = caseBatch.length > 1 ? 1 : 0;
        caseBatch[highIndex].priority = 'high';
    }
}

function addManualCase(manualCase) {
    const state = loadState();
    const maxSl = state.cases.reduce((maxValue, caseData) => Math.max(maxValue, Number(caseData.sl) || 0), 0);
    const nextSl = maxSl + 1;

    const requestedId = (manualCase && manualCase.caseId ? String(manualCase.caseId) : '').trim();
    let nextId = requestedId || `MR-${pad(nextSl)}`;

    if (state.cases.some((caseData) => caseData.id === nextId)) {
        let suffix = 1;
        while (state.cases.some((caseData) => caseData.id === `${nextId}-M${suffix}`)) {
            suffix += 1;
        }
        nextId = `${nextId}-M${suffix}`;
    }

    const createdCase = {
        sl: nextSl,
        id: nextId,
        name: manualCase.caseTitle || `Manual Review Case ${nextSl}`,
        description: manualCase.caseDescription || manualCase.caseSummary || 'Manual review case accepted by judge.',
        bucket: 'fresh',
        status: 'pending',
        actionDate: ''
    };

    state.cases.push(createdCase);
    if (!state.activeCaseIds.includes(createdCase.id)) {
        state.activeCaseIds.push(createdCase.id);
    }
    saveState(state);

    return createdCase;
}

function showActionMessage(message) {
    const toast = document.getElementById('toast');
    if (!toast) {
        alert(message);
        return;
    }

    const messageNode = toast.querySelector('span');
    if (messageNode) {
        messageNode.textContent = message;
    }
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 2400);
}

function updateBalanceMeter(backlogCount, freshCount) {
    const backlogSegment = document.querySelector('.backlog-seg');
    const freshSegment = document.querySelector('.fresh-seg');

    if (!backlogSegment || !freshSegment) return;

    const total = backlogCount + freshCount;
    const backlogWidth = total === 0 ? 50 : (backlogCount / total) * 100;
    const freshWidth = total === 0 ? 50 : (freshCount / total) * 100;

    backlogSegment.style.width = `${backlogWidth}%`;
    freshSegment.style.width = `${freshWidth}%`;
    backlogSegment.textContent = `${backlogCount} BACKLOG`;
    freshSegment.textContent = `${freshCount} FRESH`;
}

function updateLoadButtonVisibility(allFinished) {
    const button = document.getElementById('loadNewCasesBtn');
    if (!button) return;
    button.classList.add('hidden');
}

function renderCases(cases, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!cases || cases.length === 0) {
        container.innerHTML = '<div class="empty-cases">No unfinished cases in this section.</div>';
        return;
    }

    container.innerHTML = cases.map((caseData) => {
        const selectedDate = caseData.actionDate || getTodayIsoDate();
        return `
        <div class="case-item" data-case-id="${caseData.id}" title="${caseData.description}">
            <div class="case-header">
                <span class="case-sl">#${caseData.sl}</span>
                <span class="case-id">${caseData.id}</span>
            </div>
            <div class="case-name">${caseData.name}</div>
            <div class="case-description-tooltip">${caseData.description}</div>
            ${isJudgeDashboard ? `
            <div class="case-action-panel">
                <div class="case-action-top-row">
                    <span class="case-status-chip ${statusClass(caseData.status)}">${statusLabel(caseData.status)}</span>
                    <input type="date" class="case-date-input" value="${selectedDate}">
                </div>
                <div class="case-action-buttons">
                    <button type="button" class="case-action-btn btn-reschedule" data-action="reschedule">Reschedule</button>
                    <button type="button" class="case-action-btn btn-stay" data-action="stay">Stay</button>
                    <button type="button" class="case-action-btn btn-adjoined" data-action="adjoined">Adjoined</button>
                </div>
            </div>` : ''}
        </div>`;
    }).join('');
}

async function apiGetView() {
    const state = loadState();
    return buildView(state);
}

async function apiUpdateCase(caseId, action, actionDate) {
    const state = loadState();
    const target = state.cases.find((caseData) => caseData.id === caseId);

    if (!target) {
        throw new Error('Case not found in local data.');
    }

    target.status = action;
    target.actionDate = actionDate;

    const extraDetails = arguments[3] || {};
    if (extraDetails.reason) {
        target.actionReason = extraDetails.reason;
    }
    if (Array.isArray(extraDetails.documentNames) && extraDetails.documentNames.length > 0) {
        target.actionDocuments = extraDetails.documentNames;
    }

    state.activeCaseIds = state.activeCaseIds.filter((id) => id !== caseId);
    saveState(state);

    return buildView(state);
}

async function apiLoadNewCases() {
    const state = loadState();

    return {
        ok: true,
        reason: 'Dashboard data is managed by backend sync. No local demo cases are loaded.',
        view: buildView(state)
    };
}

function renderView(viewPayload) {
    const setTextIfExists = (id, value) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    };

    if (isJudgeDashboard) {
        renderCases(viewPayload.urgent, 'urgent-cases');
        renderCases(viewPayload.high, 'high-cases');
        renderCases(viewPayload.medium, 'medium-cases');
        renderCases(viewPayload.fresh, 'fresh-cases');

        setTextIfExists('urgent-count', viewPayload.counts.urgent);
        setTextIfExists('high-count', viewPayload.counts.high);
        setTextIfExists('medium-count', viewPayload.counts.medium);
        setTextIfExists('fresh-count', viewPayload.counts.fresh);
    }

    if (isLawyerDashboard) {
        const priorityCases = [
            ...viewPayload.urgent,
            ...viewPayload.high,
            ...viewPayload.medium
        ];

        renderCases(priorityCases, 'backlog-list');
        renderCases(viewPayload.fresh, 'fresh-list');
    }

    const backlogCount = viewPayload.counts.urgent + viewPayload.counts.high + viewPayload.counts.medium;
    const freshCount = viewPayload.counts.fresh;
    updateBalanceMeter(backlogCount, freshCount);

    updateLoadButtonVisibility(viewPayload.allFinished);
}

async function fetchDashboardData(options = {}) {
    const {
        autoLoadIfFinished = false,
        silent = false
    } = options;

    if (isDashboardSyncing) {
        return;
    }

    isDashboardSyncing = true;

    try {
        const payload = await apiGetView();

        if (autoLoadIfFinished && payload.allFinished) {
            const loadPayload = await apiLoadNewCases();
            renderView(loadPayload.view);

            if (!silent && loadPayload.reason && !loadPayload.reason.includes('No new cases remaining')) {
                showActionMessage(loadPayload.reason);
            }
            return;
        }

        renderView(payload);
    } catch (error) {
        if (!silent) {
            showActionMessage('Unable to load local dashboard data.');
        }
        console.error(error);
    } finally {
        isDashboardSyncing = false;
    }
}

function startDashboardAutoSync() {
    if (dashboardSyncTimer) {
        clearInterval(dashboardSyncTimer);
    }

    dashboardSyncTimer = setInterval(() => {
        fetchDashboardData({ autoLoadIfFinished: false, silent: true });
    }, AUTO_SYNC_INTERVAL_MS);
}

function getActionLabel(action) {
    if (action === 'reschedule') return 'Reschedule';
    if (action === 'stay') return 'Stay';
    if (action === 'adjoined') return 'Adjoined';
    return 'Update';
}

function ensureCaseActionModal() {
    if (caseActionModal) {
        return caseActionModal;
    }

    const modal = document.createElement('div');
    modal.className = 'judge-case-action-modal hidden';
    modal.innerHTML = `
        <div class="judge-case-action-modal__backdrop" data-role="close-modal"></div>
        <div class="judge-case-action-modal__card" role="dialog" aria-modal="true" aria-label="Case action details">
            <div class="judge-case-action-modal__header">
                <h3 id="caseActionModalTitle">Case Action</h3>
                <button type="button" class="judge-case-action-modal__close" data-role="close-modal">&times;</button>
            </div>
            <div class="judge-case-action-modal__body">
                <p id="caseActionModalCase" class="judge-case-action-modal__case"></p>

                <label class="judge-case-action-modal__label" for="caseActionDateInput">Action Date</label>
                <input id="caseActionDateInput" class="judge-case-action-modal__input" type="date">

                <label class="judge-case-action-modal__label" for="caseActionReasonInput">Reason</label>
                <textarea id="caseActionReasonInput" class="judge-case-action-modal__input judge-case-action-modal__textarea" rows="4" placeholder="Enter reason for this action"></textarea>

                <label class="judge-case-action-modal__label" for="caseActionDocumentInput">Upload Documents (Optional)</label>
                <input id="caseActionDocumentInput" class="judge-case-action-modal__input" type="file" multiple accept=".pdf,.doc,.docx,.jpg,.jpeg,.png">

                <div id="caseActionModalMessage" class="judge-case-action-modal__message"></div>
            </div>
            <div class="judge-case-action-modal__footer">
                <button type="button" class="judge-case-action-modal__btn judge-case-action-modal__btn--secondary" data-role="close-modal">Cancel</button>
                <button type="button" class="judge-case-action-modal__btn judge-case-action-modal__btn--primary" id="caseActionSubmitBtn">OK</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    modal.addEventListener('click', (event) => {
        const closeTarget = event.target.closest('[data-role="close-modal"]');
        if (closeTarget) {
            closeCaseActionModal();
        }
    });

    const submitBtn = modal.querySelector('#caseActionSubmitBtn');
    if (submitBtn) {
        submitBtn.addEventListener('click', submitCaseActionFromModal);
    }

    caseActionModal = modal;
    return modal;
}

function openCaseActionModal(actionContext) {
    const modal = ensureCaseActionModal();
    pendingCaseActionContext = actionContext;

    const titleNode = modal.querySelector('#caseActionModalTitle');
    const caseNode = modal.querySelector('#caseActionModalCase');
    const dateInput = modal.querySelector('#caseActionDateInput');
    const reasonInput = modal.querySelector('#caseActionReasonInput');
    const docInput = modal.querySelector('#caseActionDocumentInput');
    const messageNode = modal.querySelector('#caseActionModalMessage');

    if (titleNode) {
        titleNode.textContent = `${getActionLabel(actionContext.action)} Case`;
    }
    if (caseNode) {
        caseNode.textContent = `Case: ${actionContext.caseId}`;
    }
    if (dateInput) {
        dateInput.value = actionContext.actionDate || getTodayIsoDate();
    }
    if (reasonInput) {
        reasonInput.value = '';
    }
    if (docInput) {
        docInput.value = '';
    }
    if (messageNode) {
        messageNode.textContent = '';
    }

    modal.classList.remove('hidden');
}

function closeCaseActionModal() {
    if (!caseActionModal) return;
    caseActionModal.classList.add('hidden');
    pendingCaseActionContext = null;
}

async function submitCaseActionFromModal() {
    if (!pendingCaseActionContext || !caseActionModal) {
        return;
    }

    const actionContext = { ...pendingCaseActionContext };

    const dateInput = caseActionModal.querySelector('#caseActionDateInput');
    const reasonInput = caseActionModal.querySelector('#caseActionReasonInput');
    const docInput = caseActionModal.querySelector('#caseActionDocumentInput');
    const messageNode = caseActionModal.querySelector('#caseActionModalMessage');

    const actionDate = dateInput && dateInput.value ? dateInput.value : getTodayIsoDate();
    const reason = reasonInput ? reasonInput.value.trim() : '';

    if (!reason) {
        if (messageNode) {
            messageNode.textContent = 'Please provide a reason before continuing.';
        }
        return;
    }

    const documentNames = docInput && docInput.files
        ? Array.from(docInput.files).map((file) => file.name)
        : [];

    try {
        const payload = await apiUpdateCase(
            actionContext.caseId,
            actionContext.action,
            actionDate,
            {
                reason,
                documentNames
            }
        );

        renderView(payload);
        closeCaseActionModal();

        if (actionContext.action === 'adjoined') {
            showActionMessage(`Case ${actionContext.caseId} adjoined and removed from the list.`);
            return;
        }

        if (actionContext.action === 'reschedule') {
            showActionMessage(`Case ${actionContext.caseId} rescheduled to ${actionDate}.`);
            return;
        }

        if (actionContext.action === 'stay') {
            showActionMessage(`Case ${actionContext.caseId} marked as stay.`);
            return;
        }

        showActionMessage(`Case ${actionContext.caseId} updated successfully.`);
    } catch (error) {
        if (messageNode) {
            messageNode.textContent = error.message;
        }
    }
}

async function handleCaseAction(event) {
    if (!isJudgeDashboard) return;

    const actionButton = event.target.closest('.case-action-btn');
    if (!actionButton) return;

    const caseItem = actionButton.closest('.case-item');
    if (!caseItem) return;

    const caseId = caseItem.getAttribute('data-case-id');
    const action = actionButton.getAttribute('data-action');
    const dateInput = caseItem.querySelector('.case-date-input');
    const actionDate = dateInput ? dateInput.value : getTodayIsoDate();

    openCaseActionModal({
        caseId,
        action,
        actionDate
    });
}

async function handleLoadNewCases() {
    try {
        const payload = await apiLoadNewCases();
        renderView(payload.view);
        showActionMessage(payload.reason || 'New cases loaded.');
    } catch (error) {
        showActionMessage(error.message);
    }
}

document.addEventListener('DOMContentLoaded', function () {
    fetchDashboardData();
    startDashboardAutoSync();

    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            fetchDashboardData({ autoLoadIfFinished: false, silent: true });
        }
    });

    window.addEventListener('focus', () => {
        fetchDashboardData({ autoLoadIfFinished: false, silent: true });
    });

    window.addEventListener('storage', (event) => {
        if (event.key === STORAGE_KEY) {
            fetchDashboardData({ autoLoadIfFinished: false, silent: true });
        }
    });

    window.addEventListener('beforeunload', () => {
        if (dashboardSyncTimer) {
            clearInterval(dashboardSyncTimer);
            dashboardSyncTimer = null;
        }
    });

    const loadBtn = document.getElementById('loadNewCasesBtn');
    if (loadBtn) {
        loadBtn.addEventListener('click', handleLoadNewCases);
    }

    const caseSearchInput = document.getElementById('caseSearchInput');
    if (caseSearchInput) {
        caseSearchInput.addEventListener('input', () => {
            const state = loadState();
            const payload = buildView(state, caseSearchInput.value);
            renderView(payload);
        });
    }

    if (isJudgeDashboard) {
        document.addEventListener('click', handleCaseAction);
    }
});

window.fetchDashboardData = fetchDashboardData;
window.JudgeCaseStore = {
    loadState,
    saveState,
    createInitialState,
    getActiveCases,
    getCaseBuckets,
    getPendingOutsideDashboard,
    getAnalytics,
    addManualCase
};
