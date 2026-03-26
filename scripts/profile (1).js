// Profile Page JavaScript - Frontend Logic

// Global variables
let profileData = null;
let apiBaseUrl = '';

// Detect backend on page load
document.addEventListener('DOMContentLoaded', function() {
    detectBackend().then(() => {
        loadProfile();
        setupEventListeners();
    });
});

// Detect available backend
function detectBackend() {
    // Try different ports
    const ports = [3000, 5000]; // Node.js default is 3000, Flask is 5000
    let portIndex = 0;

    function tryPort(port) {
        return fetch(`http://localhost:${port}/api/profile`, { method: 'HEAD' })
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
        }
    });
}

// Setup event listeners
function setupEventListeners() {
    // Theme change handler
    const themeSelect = document.getElementById('theme');
    if (themeSelect) {
        themeSelect.addEventListener('change', handleThemeChange);
    }

    // Load saved preferences
    loadSavedPreferences();
}

// Load profile data
function loadProfile() {
    if (!apiBaseUrl) {
        // Static mode - use mock data
        loadMockProfileData();
        return;
    }

    // Fetch from backend
    fetch(`${apiBaseUrl}/api/profile`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch profile data');
            }
            return response.json();
        })
        .then(data => {
            profileData = data;
            updateProfileUI();
        })
        .catch(error => {
            console.error('Error fetching profile data:', error);
            // Fallback to mock data
            loadMockProfileData();
        });
}

// Load mock profile data for static mode
function loadMockProfileData() {
    profileData = {
        personal: {
            name: "Honorable Judge Harshita Sharma",
            employeeId: "JUD-2024-004",
            dob: "15th March 1982",
            gender: "Female",
            phone: "+91-98765-43210",
            email: "harshita.sharma@nyaypravah.gov.in"
        },
        professional: {
            designation: "District Judge",
            court: "Civil Court, Courtroom 04",
            jurisdiction: "Civil & Family Matters",
            appointmentDate: "1st April 2014",
            barCouncilId: "UP/2010/1234",
            qualification: "LL.M, LL.B (Gold Medalist)"
        },
        stats: {
            totalCases: 247,
            activeCases: 89,
            yearsService: 12,
            casesDisposed: 156,
            avgDisposal: 4.2,
            satisfaction: 4.8,
            awards: 3
        },
        activity: [
            {
                type: "disposal",
                description: "Disposed Civil Suit #CS-2024-089",
                time: "2 hours ago",
                icon: "gavel"
            },
            {
                type: "hearing",
                description: "Scheduled hearing for Family Dispute #FD-2024-045",
                time: "1 day ago",
                icon: "calendar-plus"
            },
            {
                type: "review",
                description: "Reviewed 12 new case filings",
                time: "2 days ago",
                icon: "file-alt"
            },
            {
                type: "award",
                description: "Received 'Excellence in Justice' award",
                time: "1 week ago",
                icon: "award"
            }
        ]
    };

    updateProfileUI();
}

// Update profile UI with data
function updateProfileUI() {
    if (!profileData) return;

    // Update stats
    updateElement('totalCases', profileData.stats.totalCases);
    updateElement('activeCases', profileData.stats.activeCases);
    updateElement('yearsService', profileData.stats.yearsService);
    updateElement('casesDisposed', profileData.stats.casesDisposed);
    updateElement('avgDisposal', profileData.stats.avgDisposal);
    updateElement('satisfaction', profileData.stats.satisfaction);
    updateElement('awards', profileData.stats.awards);

    // Update activity list if available
    if (profileData.activity) {
        updateActivityList(profileData.activity);
    }

    // Add loading animation effect
    animateStats();
}

// Update activity list
function updateActivityList(activities) {
    const activityList = document.getElementById('activityList');
    if (!activityList) return;

    activityList.innerHTML = '';

    activities.forEach(activity => {
        const activityElement = document.createElement('div');
        activityElement.className = 'activity-item';

        activityElement.innerHTML = `
            <div class="activity-icon">
                <i class="fas fa-${activity.icon}"></i>
            </div>
            <div class="activity-content">
                <p>${activity.description}</p>
                <span class="activity-time">${activity.time}</span>
            </div>
        `;

        activityList.appendChild(activityElement);
    });
}

// Update element text content
function updateElement(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value;
    }
}

// Animate stats on load
function animateStats() {
    const statElements = document.querySelectorAll('.stat-number, .metric-value');

    statElements.forEach((element, index) => {
        setTimeout(() => {
            element.style.animation = 'fadeInUp 0.6s ease-out forwards';
        }, index * 100);
    });
}

// Handle theme change
function handleThemeChange(event) {
    const theme = event.target.value;
    applyTheme(theme);
    savePreference('theme', theme);
}

// Apply theme to the page
function applyTheme(theme) {
    const body = document.body;

    // Remove existing theme classes
    body.classList.remove('theme-light', 'theme-dark', 'theme-auto');

    // Add new theme class
    body.classList.add(`theme-${theme}`);

    // For demo purposes, we'll just show a toast
    showToast(`Theme changed to ${theme}`);
}

// Load saved preferences
function loadSavedPreferences() {
    const preferences = {
        theme: localStorage.getItem('nyay-theme') || 'auto',
        notifications: localStorage.getItem('nyay-notifications') || 'all',
        language: localStorage.getItem('nyay-language') || 'en',
        autoRefresh: localStorage.getItem('nyay-autoRefresh') || '60'
    };

    // Apply saved preferences to form elements
    Object.keys(preferences).forEach(key => {
        const element = document.getElementById(key);
        if (element) {
            element.value = preferences[key];
        }
    });

    // Apply theme
    applyTheme(preferences.theme);
}

// Save preferences
function savePreferences() {
    const preferences = {
        theme: document.getElementById('theme').value,
        notifications: document.getElementById('notifications').value,
        language: document.getElementById('language').value,
        autoRefresh: document.getElementById('autoRefresh').value
    };

    if (!apiBaseUrl) {
        // Static mode - save to localStorage only
        Object.keys(preferences).forEach(key => {
            localStorage.setItem(`nyay-${key}`, preferences[key]);
        });
        showToast('Preferences saved successfully');
        return;
    }

    // Save to backend
    fetch(`${apiBaseUrl}/api/profile/preferences`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(preferences)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to save preferences');
        }
        return response.json();
    })
    .then(data => {
        // Also save to localStorage as backup
        Object.keys(preferences).forEach(key => {
            localStorage.setItem(`nyay-${key}`, preferences[key]);
        });
        showToast('Preferences saved successfully');
    })
    .catch(error => {
        console.error('Error saving preferences:', error);
        showToast('Error saving preferences', 'error');
    });
}

// Save individual preference
function savePreference(key, value) {
    localStorage.setItem(`nyay-${key}`, value);
}

// Reset preferences to default
function resetPreferences() {
    if (confirm('Are you sure you want to reset all preferences to default?')) {
        // Clear localStorage
        localStorage.removeItem('nyay-theme');
        localStorage.removeItem('nyay-notifications');
        localStorage.removeItem('nyay-language');
        localStorage.removeItem('nyay-autoRefresh');

        // Reset form elements
        document.getElementById('theme').value = 'auto';
        document.getElementById('notifications').value = 'all';
        document.getElementById('language').value = 'en';
        document.getElementById('autoRefresh').value = '60';

        // Apply default theme
        applyTheme('auto');

        showToast('Preferences reset to default');
    }
}

// Show toast notification
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    if (!toast) return;

    const icon = toast.querySelector('i');
    const span = toast.querySelector('span');

    // Update icon based on type
    if (type === 'error') {
        icon.className = 'fas fa-exclamation-triangle';
        toast.style.backgroundColor = '#dc3545';
    } else if (type === 'warning') {
        icon.className = 'fas fa-exclamation-circle';
        toast.style.backgroundColor = '#ffc107';
    } else {
        icon.className = 'fas fa-check-circle';
        toast.style.backgroundColor = '#28a745';
    }

    span.textContent = message;
    toast.classList.remove('hidden');

    // Auto hide after 3 seconds
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}

// Add some CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    .theme-dark {
        background-color: #1a1a1a;
        color: #ffffff;
    }

    .theme-dark .sidebar {
        background: linear-gradient(135deg, #0f0f0f 0%, #2a2a2a 100%);
    }

    .theme-dark .profile-section,
    .theme-dark .metric-card,
    .theme-dark .activity-item {
        background-color: #2a2a2a;
        border-color: #404040;
    }

    .theme-dark .profile-section h3,
    .theme-dark .info-item label {
        color: #ffffff;
    }
`;
document.head.appendChild(style);

// Make functions globally available
window.loadProfile = loadProfile;
window.savePreferences = savePreferences;
window.resetPreferences = resetPreferences;