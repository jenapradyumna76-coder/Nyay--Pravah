const STORAGE_KEY = 'nyay_pravah_dashboard_state_v3';
const TOTAL_CASES = 50;
const ACTIVE_BATCH_SIZE = 10;
const isJudgeDashboard = document.title.includes('Judicial Command Center');

function pad(num) {
    return String(num).padStart(3, '0');
}

function createCase(index) {
    const withinBatch = (index - 1) % ACTIVE_BATCH_SIZE;
    const isBacklog = withinBatch < 5;
    const prefix = isBacklog ? 'BK' : 'FR';

    return {
        sl: index,
        id: `${prefix}-${pad(index)}`,
        name: `Case Party ${index} vs Respondent ${index}`,
        description: `Case file ${index} with preliminary documentation and hearing notes.`,
        bucket: isBacklog ? 'backlog' : 'fresh',
        status: 'pending',
        actionDate: ''
    };
}

function createInitialState() {
    const cases = [];
    for (let i = 1; i <= TOTAL_CASES; i += 1) {
        cases.push(createCase(i));
    }

    return {
        cases,
        activeCaseIds: cases.slice(0, ACTIVE_BATCH_SIZE).map((caseData) => caseData.id),
        cursor: ACTIVE_BATCH_SIZE
    };
}

function getTodayIsoDate() {
    return new Date().toISOString().split('T')[0];
}

function statusLabel(status) {
    if (status === 'adjoined') return 'Adjoined';
    if (status === 'stay') return 'Stay';
    if (status === 'rehearing') return 'Re-hearing';
    return 'Pending';
}

function statusClass(status) {
    if (status === 'adjoined') return 'status-adjoined';
    if (status === 'stay') return 'status-stay';
    if (status === 'rehearing') return 'status-rehearing';
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

    const backlog = filteredActiveCases.filter((caseData) => caseData.bucket === 'backlog');
    const fresh = filteredActiveCases.filter((caseData) => caseData.bucket === 'fresh');
    const allFinished = getActiveCases(state).length === 0;

    return {
        ok: true,
        backlog,
        fresh,
        counts: {
            backlog: backlog.length,
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
                    <button type="button" class="case-action-btn btn-stay" data-action="stay">Mark Stay</button>
                    <button type="button" class="case-action-btn btn-rehearing" data-action="rehearing">Re-hearing</button>
                    <button type="button" class="case-action-btn btn-adjoined" data-action="adjoined">Mark Adjoined</button>
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
        return {
            ok: true,
            reason: 'No new cases remaining in local queue.',
            view
        };
    }

    const nextSlice = state.cases.slice(state.cursor, state.cursor + ACTIVE_BATCH_SIZE);
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
    renderCases(viewPayload.backlog, 'backlog-list');
    renderCases(viewPayload.fresh, 'fresh-list');
    updateBalanceMeter(viewPayload.counts.backlog, viewPayload.counts.fresh);
    updateLoadButtonVisibility(viewPayload.allFinished);
}

async function fetchDashboardData() {
    try {
        const payload = await apiGetView();
        renderView(payload);
    } catch (error) {
        showActionMessage('Unable to load local dashboard data.');
        console.error(error);
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

        const actionText = action === 'rehearing' ? 'Re-hearing' : 'Stay';
        showActionMessage(`Case ${caseId} moved to ${actionText} section.`);
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
