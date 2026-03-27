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

function setInputValue(id, value) {
    const node = document.getElementById(id);
    if (!node) return;
    node.value = value || '';
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

    setInputValue('profile-description-input', user && user.description ? user.description : '');
    setInputValue('profile-email-input', user && user.email ? user.email : '');
    setInputValue('profile-contact-input', user && user.contactNo ? user.contactNo : '');
}

document.addEventListener('DOMContentLoaded', () => {
    const role = getCurrentRoleFromPath();
    const result = findProfileUser(role);
    renderProfile(role, result.user);

    const saveBtn = document.getElementById('save-profile-btn') || document.getElementById('save-description-btn');
    if (!saveBtn) return;

    saveBtn.addEventListener('click', () => {
        const descriptionInput = document.getElementById('profile-description-input');
        const emailInput = document.getElementById('profile-email-input');
        const contactInput = document.getElementById('profile-contact-input');
        const messageNode = document.getElementById('profile-save-message');

        if (!result.user) {
            if (messageNode) {
                messageNode.textContent = 'No registered profile found.';
            }
            return;
        }

        const originalEmail = result.user.email;
        const updatedEmail = emailInput ? emailInput.value.trim() : result.user.email;
        const updatedContact = contactInput ? contactInput.value.trim() : (result.user.contactNo || '');
        const updatedDescription = descriptionInput ? descriptionInput.value.trim() : (result.user.description || '');

        if (!updatedEmail) {
            if (messageNode) {
                messageNode.textContent = 'Email is required.';
            }
            return;
        }

        const emailTakenByOther = result.users.some((user) => user.email === updatedEmail && user.email !== originalEmail);
        if (emailTakenByOther) {
            if (messageNode) {
                messageNode.textContent = 'This email is already used by another account.';
            }
            return;
        }

        const updatedUsers = result.users.map((user) => {
            if (user.email !== originalEmail) {
                return user;
            }

            return {
                ...user,
                email: updatedEmail,
                contactNo: updatedContact,
                description: updatedDescription
            };
        });

        saveUsersByRole(role, updatedUsers);

        const activeUser = getActiveUser();
        if (activeUser && activeUser.email === originalEmail) {
            sessionStorage.setItem(ACTIVE_USER_KEY, JSON.stringify({
                ...activeUser,
                email: updatedEmail,
                contactNo: updatedContact
            }));
        }

        const refreshedUser = updatedUsers.find((user) => user.email === updatedEmail) || null;
        result.user = refreshedUser;
        result.users = updatedUsers;
        renderProfile(role, refreshedUser);

        if (messageNode) {
            messageNode.textContent = 'Profile saved successfully.';
        }
    });
});
