const DASHBOARD_STORAGE_KEY = 'nyay_pravah_dashboard_state_v6';
const ANALYTICS_SYNC_INTERVAL_MS = 5000;

let analyticsSyncTimer = null;
let analyticsRenderInProgress = false;

function setText(id, value) {
    const node = document.getElementById(id);
    if (!node) return;
    node.textContent = String(value);
}

function getDaysFromActionDate(actionDate) {
    if (!actionDate) return 0;

    const chosenDate = new Date(actionDate);
    if (Number.isNaN(chosenDate.getTime())) return 0;

    const now = new Date();
    const msInDay = 24 * 60 * 60 * 1000;
    return Math.max(0, Math.floor(Math.abs(now - chosenDate) / msInDay));
}

function renderLiveAnalytics() {
    if (analyticsRenderInProgress) return;
    if (!window.JudgeCaseStore) return;

    analyticsRenderInProgress = true;

    try {
        const state = window.JudgeCaseStore.loadState();
        const stats = window.JudgeCaseStore.getAnalytics(state);
        const disposedCases = state.cases.filter((caseData) => caseData.status === 'adjoined');

        const totalDisposalDays = disposedCases.reduce((sum, caseData) => {
            return sum + getDaysFromActionDate(caseData.actionDate);
        }, 0);

        const avgDisposal = disposedCases.length === 0
            ? '0.0'
            : (totalDisposalDays / disposedCases.length).toFixed(1);

        setText('total-cases', stats.totalCases);
        setText('disposed-cases', stats.adjoined);
        setText('pending-cases', stats.pending);
        setText('avg-disposal', avgDisposal);
    } finally {
        analyticsRenderInProgress = false;
    }
}

function startAnalyticsAutoSync() {
    if (analyticsSyncTimer) {
        clearInterval(analyticsSyncTimer);
    }

    analyticsSyncTimer = setInterval(() => {
        renderLiveAnalytics();
    }, ANALYTICS_SYNC_INTERVAL_MS);
}

function stopAnalyticsAutoSync() {
    if (analyticsSyncTimer) {
        clearInterval(analyticsSyncTimer);
        analyticsSyncTimer = null;
    }
}

function setupAnalyticsLiveSync() {
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            renderLiveAnalytics();
        }
    });

    window.addEventListener('focus', renderLiveAnalytics);

    window.addEventListener('storage', (event) => {
        if (event.key === DASHBOARD_STORAGE_KEY) {
            renderLiveAnalytics();
        }
    });

    window.addEventListener('beforeunload', stopAnalyticsAutoSync);
}

function refreshAnalytics() {
    renderLiveAnalytics();
}

document.addEventListener('DOMContentLoaded', () => {
    renderLiveAnalytics();
    startAnalyticsAutoSync();
    setupAnalyticsLiveSync();
});

window.refreshAnalytics = refreshAnalytics;
