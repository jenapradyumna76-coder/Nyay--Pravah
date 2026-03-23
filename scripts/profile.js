const JUDGE_USERS_KEY = 'nyay_pravah_judge_users_v1';
const LAWYER_USERS_KEY = 'nyay_pravah_lawyer_users_v1';
const ACTIVE_USER_KEY = 'nyay_pravah_active_user';

function getUsersByRole(role) {
    const key = role === 'judge' ? JUDGE_USERS_KEY : LAWYER_USERS_KEY;
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.warn('Unable to parse profile users from storage.', error);
        return [];
    }
}

function saveUsersByRole(role, users) {
    const key = role === 'judge' ? JUDGE_USERS_KEY : LAWYER_USERS_KEY;
    localStorage.setItem(key, JSON.stringify(users));
}

function getActiveUser() {
    try {
        const data = sessionStorage.getItem(ACTIVE_USER_KEY);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.warn('Unable to parse active user from session storage.', error);
        return null;
    }
}

function getCurrentRoleFromPath() {
    const page = window.location.pathname.toLowerCase();
    return page.includes('judge-') ? 'judge' : 'lawyer';
}

function findProfileUser(role) {
    const users = getUsersByRole(role);
    const activeUser = getActiveUser();

    if (activeUser && activeUser.email) {
        const match = users.find((user) => user.email === activeUser.email);
        if (match) {
            return { user: match, users };
        }
    }

    return {
        user: users[0] || null,
        users
    };
}

function setText(id, value) {
    const node = document.getElementById(id);
    if (!node) return;
    node.textContent = value || '-';
}

function renderProfile(role, user) {
    const defaultPhoto = '../asset/logo/mainlogo.jpeg';
    const photoNode = document.getElementById('profile-photo');

    if (photoNode) {
        photoNode.src = user && user.profilePhoto ? user.profilePhoto : defaultPhoto;
    }

    setText('profile-name', user ? user.fullName : role === 'judge' ? 'Hon. Judge' : 'Lead Counsel');
    setText('profile-role', role === 'judge' ? 'Presiding Judge' : 'Defense/Prosecution Counsel');
    setText('profile-email', user ? user.email : '-');
    setText('profile-contact', user ? user.contactNo : '-');

    const descriptionText = user && user.description ? user.description : 'No description added yet.';
    setText('profile-description-text', descriptionText);

    const descriptionInput = document.getElementById('profile-description-input');
    if (descriptionInput) {
        descriptionInput.value = user && user.description ? user.description : '';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const role = getCurrentRoleFromPath();
    const result = findProfileUser(role);
    renderProfile(role, result.user);

    const saveBtn = document.getElementById('save-description-btn');
    if (!saveBtn) return;

    saveBtn.addEventListener('click', () => {
        if (role !== 'judge') return;

        const descriptionInput = document.getElementById('profile-description-input');
        const messageNode = document.getElementById('profile-save-message');
        if (!descriptionInput || !result.user) {
            if (messageNode) {
                messageNode.textContent = 'No registered judge profile found.';
            }
            return;
        }

        const updatedDescription = descriptionInput.value.trim();
        const updatedUsers = result.users.map((user) => {
            if (user.email !== result.user.email) {
                return user;
            }

            return {
                ...user,
                description: updatedDescription
            };
        });

        saveUsersByRole(role, updatedUsers);
        result.user.description = updatedDescription;
        renderProfile(role, result.user);

        if (messageNode) {
            messageNode.textContent = 'Description saved successfully.';
        }
    });
});
