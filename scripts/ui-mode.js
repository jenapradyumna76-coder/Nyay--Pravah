(function () {
    const MODE_STORAGE_KEY = 'nyay_pravah_ui_mode_v1';
    const MODES = [
        { key: 'light', label: 'Light' },
        { key: 'dark', label: 'Dark' },
        { key: 'study', label: 'Study' }
    ];

    function getSavedMode() {
        const saved = localStorage.getItem(MODE_STORAGE_KEY);
        return MODES.some((mode) => mode.key === saved) ? saved : 'light';
    }

    function applyMode(mode) {
        document.body.setAttribute('data-ui-mode', mode);
        localStorage.setItem(MODE_STORAGE_KEY, mode);

        const currentLabel = document.getElementById('uiModeCurrentLabel');
        if (currentLabel) {
            const active = MODES.find((entry) => entry.key === mode);
            currentLabel.textContent = active ? active.label : 'Light';
        }

        document.querySelectorAll('.ui-mode-option').forEach((button) => {
            const selected = button.getAttribute('data-mode') === mode;
            button.classList.toggle('active', selected);
            button.setAttribute('aria-pressed', selected ? 'true' : 'false');
        });
    }

    function injectStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .ui-mode-switcher {
                position: fixed;
                right: 14px;
                bottom: 14px;
                z-index: 6000;
                display: flex;
                flex-direction: column;
                gap: 8px;
                align-items: flex-end;
            }

            .ui-mode-current {
                border: 1px solid #d1d5db;
                background: #ffffff;
                color: #111827;
                border-radius: 999px;
                padding: 9px 12px;
                box-shadow: 0 10px 18px rgba(15, 23, 42, 0.16);
                cursor: pointer;
                font-size: 12px;
                font-weight: 700;
                display: inline-flex;
                align-items: center;
                gap: 6px;
            }

            .ui-mode-menu {
                display: none;
                min-width: 140px;
                border: 1px solid #d1d5db;
                border-radius: 12px;
                background: #ffffff;
                box-shadow: 0 12px 24px rgba(15, 23, 42, 0.2);
                padding: 6px;
            }

            .ui-mode-menu.open {
                display: block;
            }

            .ui-mode-option {
                width: 100%;
                border: none;
                border-radius: 8px;
                background: transparent;
                color: #111827;
                font-size: 12px;
                font-weight: 700;
                text-align: left;
                padding: 8px 9px;
                cursor: pointer;
            }

            .ui-mode-option:hover {
                background: #f3f4f6;
            }

            .ui-mode-option.active {
                background: #dbeafe;
                color: #1d4ed8;
            }

            body[data-ui-mode='dark'] {
                --main-bg: #0f172a;
                --text-main: #e5e7eb;
                --text-secondary: #94a3b8;
                --text-light: #64748b;
                --border-color: #334155;
                --border-light: #1e293b;
                --primary: #60a5fa;
                --primary-light: rgba(96, 165, 250, 0.16);
                background: #0f172a !important;
                color: #e5e7eb !important;
            }

            body[data-ui-mode='dark'] .main-content,
            body[data-ui-mode='dark'] .top-bar,
            body[data-ui-mode='dark'] .dashboard-header,
            body[data-ui-mode='dark'] .priority-card,
            body[data-ui-mode='dark'] .pane,
            body[data-ui-mode='dark'] .report-section,
            body[data-ui-mode='dark'] .report-card,
            body[data-ui-mode='dark'] .analytics-card,
            body[data-ui-mode='dark'] .profile-section,
            body[data-ui-mode='dark'] .requests-filters,
            body[data-ui-mode='dark'] .requests-list,
            body[data-ui-mode='dark'] .stat-card,
            body[data-ui-mode='dark'] .modal-content,
            body[data-ui-mode='dark'] .modal-dialog,
            body[data-ui-mode='dark'] .judge-case-action-modal__card {
                background: #111827 !important;
                color: #e5e7eb !important;
                border-color: #374151 !important;
            }

            body[data-ui-mode='dark'] input,
            body[data-ui-mode='dark'] select,
            body[data-ui-mode='dark'] textarea,
            body[data-ui-mode='dark'] .search-box {
                background: #0b1220 !important;
                color: #e5e7eb !important;
                border-color: #334155 !important;
            }

            body[data-ui-mode='study'] {
                --main-bg: #f8f4e9;
                --text-main: #3a2f1f;
                --text-secondary: #5d4a30;
                --text-light: #78644a;
                --border-color: #dccfb9;
                --border-light: #efe6d6;
                --primary: #8b6a39;
                --primary-light: rgba(139, 106, 57, 0.16);
                background: #f8f4e9 !important;
                color: #3a2f1f !important;
            }

            body[data-ui-mode='study'] .main-content,
            body[data-ui-mode='study'] .top-bar,
            body[data-ui-mode='study'] .dashboard-header,
            body[data-ui-mode='study'] .priority-card,
            body[data-ui-mode='study'] .pane,
            body[data-ui-mode='study'] .report-section,
            body[data-ui-mode='study'] .report-card,
            body[data-ui-mode='study'] .analytics-card,
            body[data-ui-mode='study'] .profile-section,
            body[data-ui-mode='study'] .requests-filters,
            body[data-ui-mode='study'] .requests-list,
            body[data-ui-mode='study'] .stat-card,
            body[data-ui-mode='study'] .modal-content,
            body[data-ui-mode='study'] .modal-dialog,
            body[data-ui-mode='study'] .judge-case-action-modal__card {
                background: #fffaf0 !important;
                color: #3a2f1f !important;
                border-color: #e4d6bd !important;
            }

            body[data-ui-mode='study'] input,
            body[data-ui-mode='study'] select,
            body[data-ui-mode='study'] textarea,
            body[data-ui-mode='study'] .search-box {
                background: #fff9ee !important;
                color: #3a2f1f !important;
                border-color: #decfb3 !important;
            }

            @media (max-width: 768px) {
                .ui-mode-switcher {
                    right: 10px;
                    bottom: 10px;
                }

                .ui-mode-current {
                    font-size: 11px;
                    padding: 8px 10px;
                }
            }
        `;

        document.head.appendChild(style);
    }

    function injectSwitcher() {
        if (document.getElementById('uiModeSwitcher')) {
            return;
        }

        const switcher = document.createElement('div');
        switcher.className = 'ui-mode-switcher';
        switcher.id = 'uiModeSwitcher';

        switcher.innerHTML = `
            <button type="button" class="ui-mode-current" id="uiModeToggleBtn" aria-expanded="false" aria-controls="uiModeMenu">
                <span>Mode:</span>
                <span id="uiModeCurrentLabel">Light</span>
            </button>
            <div class="ui-mode-menu" id="uiModeMenu">
                ${MODES.map((mode) => `<button type="button" class="ui-mode-option" data-mode="${mode.key}">${mode.label}</button>`).join('')}
            </div>
        `;

        document.body.appendChild(switcher);

        const toggleBtn = document.getElementById('uiModeToggleBtn');
        const menu = document.getElementById('uiModeMenu');

        if (toggleBtn && menu) {
            toggleBtn.addEventListener('click', () => {
                menu.classList.toggle('open');
                toggleBtn.setAttribute('aria-expanded', menu.classList.contains('open') ? 'true' : 'false');
            });

            document.addEventListener('click', (event) => {
                if (!switcher.contains(event.target)) {
                    menu.classList.remove('open');
                    toggleBtn.setAttribute('aria-expanded', 'false');
                }
            });

            menu.querySelectorAll('.ui-mode-option').forEach((button) => {
                button.addEventListener('click', () => {
                    applyMode(button.getAttribute('data-mode'));
                    menu.classList.remove('open');
                    toggleBtn.setAttribute('aria-expanded', 'false');
                });
            });
        }
    }

    function init() {
        injectStyles();
        injectSwitcher();
        applyMode(getSavedMode());

        window.addEventListener('storage', (event) => {
            if (event.key === MODE_STORAGE_KEY && event.newValue) {
                applyMode(event.newValue);
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
