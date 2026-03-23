function renderLawyerCaseCards(cases, containerId) {
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

function lawyerWithSearch(cases, query) {
    const text = (query || '').trim().toLowerCase();
    if (!text) return cases;
    return cases.filter((caseData) => caseData.id.toLowerCase().includes(text));
}

function renderLawyerAllCases(state, query) {
    const buckets = window.JudgeCaseStore.getCaseBuckets(state);
    renderLawyerCaseCards(lawyerWithSearch(buckets.pending, query), 'lawyerAllPendingList');
    renderLawyerCaseCards(lawyerWithSearch(buckets.stay, query), 'lawyerAllStayList');
    renderLawyerCaseCards(lawyerWithSearch(buckets.rehearing, query), 'lawyerAllRehearingList');
    renderLawyerCaseCards(lawyerWithSearch(buckets.adjoined, query), 'lawyerAllAdjoinedList');
}

function renderLawyerPendingCases(state, query) {
    const pendingOutsideDashboard = window.JudgeCaseStore.getPendingOutsideDashboard(state);
    renderLawyerCaseCards(lawyerWithSearch(pendingOutsideDashboard, query), 'lawyerPendingOutsideList');
}

function renderLawyerMissingCases(state, query) {
    const missingCases = state.cases.filter((caseData) => caseData.status === 'pending' && caseData.sl % 3 === 0);
    renderLawyerCaseCards(lawyerWithSearch(missingCases, query), 'lawyerMissingDetailsList');
}

function renderLawyerAdjoinmentCases(state, query) {
    const buckets = window.JudgeCaseStore.getCaseBuckets(state);
    renderLawyerCaseCards(lawyerWithSearch(buckets.adjoined, query), 'lawyerAdjoinmentList');
}

function renderLawyerAnalytics(state, query) {
    const stats = window.JudgeCaseStore.getAnalytics(state);
    const map = {
        lawyerAnalyticsTotalCases: stats.totalCases,
        lawyerAnalyticsActiveDashboard: stats.activeOnDashboard,
        lawyerAnalyticsPending: stats.pending,
        lawyerAnalyticsStay: stats.stay,
        lawyerAnalyticsRehearing: stats.rehearing,
        lawyerAnalyticsAdjoined: stats.adjoined,
        lawyerAnalyticsLoadable: stats.availableToLoad
    };

    Object.keys(map).forEach((id) => {
        const node = document.getElementById(id);
        if (node) {
            node.textContent = String(map[id]);
        }
    });

    renderLawyerCaseCards(lawyerWithSearch(state.cases, query), 'lawyerAnalyticsSearchList');
}

document.addEventListener('DOMContentLoaded', () => {
    if (!window.JudgeCaseStore) {
        return;
    }

    const page = document.body.getAttribute('data-lawyer-page') || 'all';
    const searchInput = document.getElementById('caseSearchInput');

    const renderPage = () => {
        const state = window.JudgeCaseStore.loadState();
        const query = searchInput ? searchInput.value : '';

        if (page === 'all') {
            renderLawyerAllCases(state, query);
            return;
        }

        if (page === 'pending') {
            renderLawyerPendingCases(state, query);
            return;
        }

        if (page === 'missing') {
            renderLawyerMissingCases(state, query);
            return;
        }

        if (page === 'adjoinment') {
            renderLawyerAdjoinmentCases(state, query);
            return;
        }

        if (page === 'analytics') {
            renderLawyerAnalytics(state, query);
        }
    };

    if (searchInput) {
        searchInput.addEventListener('input', renderPage);
    }

    renderPage();
});
