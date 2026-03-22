function renderCaseCards(cases, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!cases.length) {
        container.innerHTML = '<div class="empty-cases">No cases found.</div>';
        return;
    }

    container.innerHTML = cases.map((caseData) => `
		<article class="report-card">
			<div class="report-card-title">${caseData.id} - ${caseData.name}</div>
			<div class="report-card-meta">Status: ${caseData.status.toUpperCase()} | Bucket: ${caseData.bucket.toUpperCase()}</div>
			<div class="report-card-meta">${caseData.description}</div>
		</article>
	`).join('');
}

function withSearch(cases, query) {
    const text = (query || '').trim().toLowerCase();
    if (!text) return cases;
    return cases.filter((caseData) => caseData.id.toLowerCase().includes(text));
}

function renderAllCases(state, query) {
    const buckets = window.JudgeCaseStore.getCaseBuckets(state);
    renderCaseCards(withSearch(buckets.pending, query), 'allPendingList');
    renderCaseCards(withSearch(buckets.stay, query), 'allStayList');
    renderCaseCards(withSearch(buckets.rehearing, query), 'allRehearingList');
    renderCaseCards(withSearch(buckets.adjoined, query), 'allAdjoinedList');
}

function renderPendingCases(state, query) {
    const pendingOutsideDashboard = window.JudgeCaseStore.getPendingOutsideDashboard(state);
    renderCaseCards(withSearch(pendingOutsideDashboard, query), 'pendingOutsideList');
}

function renderAnalytics(state, query) {
    const stats = window.JudgeCaseStore.getAnalytics(state);
    const map = {
        analyticsTotalCases: stats.totalCases,
        analyticsActiveDashboard: stats.activeOnDashboard,
        analyticsPending: stats.pending,
        analyticsStay: stats.stay,
        analyticsRehearing: stats.rehearing,
        analyticsAdjoined: stats.adjoined,
        analyticsLoadable: stats.availableToLoad
    };

    Object.keys(map).forEach((id) => {
        const node = document.getElementById(id);
        if (node) {
            node.textContent = String(map[id]);
        }
    });

    renderCaseCards(withSearch(state.cases, query), 'analyticsSearchList');
}

function renderStatusBuckets(state, query) {
    const buckets = window.JudgeCaseStore.getCaseBuckets(state);
    renderCaseCards(withSearch(buckets.stay, query), 'stayList');
    renderCaseCards(withSearch(buckets.rehearing, query), 'rehearingList');
}

document.addEventListener('DOMContentLoaded', () => {
    if (!window.JudgeCaseStore) {
        return;
    }

    const page = document.body.getAttribute('data-judge-page') || 'all';
    const searchInput = document.getElementById('caseSearchInput');

    const renderPage = () => {
        const state = window.JudgeCaseStore.loadState();
        const query = searchInput ? searchInput.value : '';

        if (page === 'all') {
            renderAllCases(state, query);
            return;
        }

        if (page === 'pending') {
            renderPendingCases(state, query);
            return;
        }

        if (page === 'status') {
            renderStatusBuckets(state, query);
            return;
        }

        if (page === 'analytics') {
            renderAnalytics(state, query);
        }
    };

    if (searchInput) {
        searchInput.addEventListener('input', renderPage);
    }

    renderPage();
});
