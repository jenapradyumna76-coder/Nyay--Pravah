const STORAGE_KEY = 'nyay_pravah_dashboard_state_v5';
const TOTAL_CASES = 50;
const ACTIVE_BATCH_SIZE = 10;
const AUTO_SYNC_INTERVAL_MS = 5000;
const isJudgeDashboard = document.title.includes('Judicial Command Center');
const isLawyerDashboard = document.title.includes('Lawyer Portal');
let dashboardSyncTimer = null;
let isDashboardSyncing = false;

// Demo priority cases
const DEMO_PRIORITY_CASES = [
    // 1 Urgent Case
    { name: 'State of Maharashtra v. Imran Shaikh', priority: 'urgent', description: 'Serious criminal revision petition listed for urgent hearing under CrPC provisions.' },

    // 1 High Priority Case
    { name: 'Sharma Infra Projects Pvt. Ltd. v. Pune Municipal Corporation', priority: 'high', description: 'Commercial writ involving tender disqualification and interim injunction request.' },

    // 4 Medium Priority Cases
    { name: 'Rajesh Patil v. Sunita Patil', priority: 'medium', description: 'Civil suit concerning ancestral property partition and mutation records.' },
    { name: 'Priya Nair v. Meridian Tech Services', priority: 'medium', description: 'Labour appeal alleging unlawful termination and unpaid statutory dues.' },
    { name: 'Axis Components LLP v. Dev Buildcon', priority: 'medium', description: 'Commercial suit for breach of supply agreement and recovery of damages.' },
    { name: 'Aditi Kulkarni v. Estate of Late V. Kulkarni', priority: 'medium', description: 'Probate and succession dispute regarding validity of testamentary documents.' }
];

const CASE_NAME_TEMPLATES = [
    'State of Gujarat v. Arjun Mehta',
    'State of Karnataka v. Faizan Ali',
    'M/s Kaveri Developers v. Bruhat Bengaluru Mahanagara Palike',
    'Sunrise Hospitals Pvt. Ltd. v. National Insurance Co. Ltd.',
    'Ananya Rao v. Rohan Rao',
    'Madhav Joshi v. Sub-Registrar, Nashik',
    'Reliant Logistics Ltd. v. Port Trust Authority',
    'Nisha Verma v. Commissioner of Income Tax',
    'People for Clean Air v. State Pollution Control Board',
    'Sanjay Tiwari v. City Cooperative Bank Ltd.',
    'Ritika Sen v. Central Board of Secondary Education',
    'Harpreet Singh v. Punjab State Power Corporation'
];

const CASE_TYPE_TEMPLATES = [
    'Bail application in criminal proceedings',
    'Writ petition under Article 226',
    'Commercial contract enforcement dispute',
    'Property title and injunction matter',
    'Motor accident compensation appeal',
    'Service law and reinstatement claim',
    'Family court maintenance petition',
    'Consumer protection deficiency complaint',
    'Arbitration award challenge petition',
    'Land acquisition compensation reference',
    'Cheque dishonour complaint under NI Act',
    'Probate and succession certificate matter'
];

function pad(num) {
    return String(num).padStart(3, '0');
}

function createCase(index, isPriority = false, priorityData = null) {
    if (isPriority && priorityData) {
        return {
            sl: index,
            id: `PR-${pad(index)}`,
            name: priorityData.name,
            description: priorityData.description,
            bucket: 'fresh',
            priority: priorityData.priority,
            status: 'pending',
            actionDate: ''
        };
    }

    const withinBatch = (index - 1) % ACTIVE_BATCH_SIZE;
    const isBacklog = withinBatch < 5;
    const prefix = isBacklog ? 'BK' : 'FR';
    const generatedPriority = withinBatch === 0
        ? 'urgent'
        : withinBatch === 1
            ? 'high'
            : withinBatch <= 5
                ? 'medium'
                : 'none';

    return {
        sl: index,
        id: `${prefix}-${pad(index)}`,
        name: `${CASE_NAME_TEMPLATES[(index - 1) % CASE_NAME_TEMPLATES.length]} (${2018 + (index % 8)})`,
        description: `${CASE_TYPE_TEMPLATES[(index - 1) % CASE_TYPE_TEMPLATES.length]} - Case file ${index} listed for procedural hearing and document compliance.`,
        bucket: isBacklog ? 'backlog' : 'fresh',
        priority: generatedPriority,
        status: 'pending',
        actionDate: ''
    };
}

function createInitialState() {
    const cases = [];

    // Add all demo priority cases
    DEMO_PRIORITY_CASES.forEach((priorityData, idx) => {
        cases.push(createCase(idx + 1, true, priorityData));
    });

    // Add regular cases starting after priority cases
    const startIndex = DEMO_PRIORITY_CASES.length + 1;
    for (let i = startIndex; i <= TOTAL_CASES; i += 1) {
        cases.push(createCase(i));
    }

    // Include all priority cases + 4 fresh cases (no backlog for demo)
    const activeCasesCount = DEMO_PRIORITY_CASES.length + 4;
    const activeCases = cases.slice(0, Math.min(activeCasesCount, cases.length));

    return {
        cases,
        activeCaseIds: activeCases.map((caseData) => caseData.id),
        cursor: Math.min(activeCasesCount, cases.length)
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
    const hasUrgent = normalizedCases.some((caseData) => caseData.priority === 'urgent');
    const hasHigh = normalizedCases.some((caseData) => caseData.priority === 'high');

    if (!hasUrgent && normalizedCases.length > 0) {
        normalizedCases[0].priority = 'urgent';
    }

    if (!hasHigh && normalizedCases.length > 1) {
        normalizedCases[1].priority = 'high';
    }

    const hasMedium = normalizedCases.some((caseData) => caseData.priority === 'medium');
    if (!hasMedium) {
        const mediumCandidates = normalizedCases.filter((caseData) => caseData.priority === 'none');
        const mediumSlots = Math.min(2, mediumCandidates.length);
        for (let i = 0; i < mediumSlots; i += 1) {
            mediumCandidates[i].priority = 'medium';
        }
    }

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
    button.classList.toggle('hidden', !allFinished);
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
    state.activeCaseIds = state.activeCaseIds.filter((id) => id !== caseId);
    saveState(state);

    return buildView(state);
}

async function apiLoadNewCases() {
    const state = loadState();
    const view = buildView(state);

    if (!view.allFinished) {
        return {
            ok: true,
            reason: 'Finish all current cases before loading new cases.',
            view
        };
    }

    if (state.cursor >= state.cases.length) {
        const nextStart = state.cases.length + 1;
        for (let i = 0; i < ACTIVE_BATCH_SIZE; i += 1) {
            state.cases.push(createCase(nextStart + i));
        }
    }

    const nextSlice = state.cases.slice(state.cursor, state.cursor + ACTIVE_BATCH_SIZE);
    ensurePriorityCoverage(nextSlice);
    state.activeCaseIds = nextSlice.map((caseData) => caseData.id);
    state.cursor += nextSlice.length;

    nextSlice.forEach((caseData) => {
        caseData.status = 'pending';
        caseData.actionDate = '';
    });

    saveState(state);

    return {
        ok: true,
        reason: `${nextSlice.length} new cases loaded.`,
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
        autoLoadIfFinished = true,
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

async function handleCaseAction(event) {
    if (!isJudgeDashboard) return;

    const actionButton = event.target.closest('.case-action-btn');
    if (!actionButton) return;

    const caseItem = actionButton.closest('.case-item');
    if (!caseItem) return;

    const caseId = caseItem.getAttribute('data-case-id');
    const action = actionButton.getAttribute('data-action');
    const dateInput = caseItem.querySelector('.case-date-input');
    const actionDate = dateInput ? dateInput.value : '';

    if (!actionDate) {
        showActionMessage('Please select a date before updating status.');
        return;
    }

    try {
        const payload = await apiUpdateCase(caseId, action, actionDate);
        renderView(payload);

        if (action === 'adjoined') {
            showActionMessage(`Case ${caseId} completed and removed from the list.`);
            return;
        }

        if (action === 'reschedule') {
            showActionMessage(`Case ${caseId} rescheduled to ${actionDate}.`);
            return;
        }

        if (action === 'stay') {
            showActionMessage(`Case ${caseId} marked as Stay.`);
            return;
        }

        showActionMessage(`Case ${caseId} action completed.`);
    } catch (error) {
        showActionMessage(error.message);
    }
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
