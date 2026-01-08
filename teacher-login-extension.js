// Teacher Login Extension for app-v2.js
// Add these methods to UPSFinalizerV2 class after showApiValidationFeedback method

// ========== TEACHER LOGIN ==========

showTeacherNameModal() {
    const modal = document.getElementById('teacherNameModal');
    const regularGroup = document.getElementById('regularKeyGroup');
    if (modal) modal.style.display = 'block';
    if (regularGroup) regularGroup.style.opacity = '0.3';
}

hideTeacherNameModal() {
    const modal = document.getElementById('teacherNameModal');
    const regularGroup = document.getElementById('regularKeyGroup');
    const nameInput = document.getElementById('teacherNameInput');
    const feedback = document.getElementById('teacherFeedback');

    if (modal) modal.style.display = 'none';
    if (regularGroup) regularGroup.style.opacity = '1';
    if (nameInput) nameInput.value = '';
    if (feedback) feedback.textContent = '';
}

async verifyTeacherAndLogin() {
    const nameInput = document.getElementById('teacherNameInput');
    const feedback = document.getElementById('teacherFeedback');

    if (!nameInput || !feedback) return;

    const name = nameInput.value.trim();

    if (!name) {
        feedback.textContent = 'Bitte Namen eingeben';
        feedback.className = 'teacher-feedback error';
        return;
    }

    // Check if name matches teacher
    if (isTeacher(name)) {
        feedback.textContent = '✓ Willkommen, Prof. Günther! Key wird geladen...';
        feedback.className = 'teacher-feedback success';

        setTimeout(async () => {
            localStorage.setItem('upsApiKey', TEACHER_KEY);
            localStorage.setItem('isTeacherMode', 'true');
            this.apiKey = TEACHER_KEY;

            this.hideTeacherNameModal();
            this.hideApiGateModal();
            location.reload();
        }, 1000);
    } else {
        feedback.textContent = '❌ Zugriff verweigert. Nur für Prof. Günther.';
        feedback.className = 'teacher-feedback error';

        // Funny deterrent
        setTimeout(() => {
            feedback.textContent = '💀 Warnung: Studentenkonto wurde notiert. Bitte eigenen API Key verwenden.';
        }, 2000);
    }
}

// Copy these methods manually into app-v2.js after line 112 (after showApiValidationFeedback method)
// Or extend the class prototype:
UPSFinalizerV2.prototype.showTeacherNameModal = showTeacherNameModal;
UPSFinalizerV2.prototype.hideTeacherNameModal = hideTeacherNameModal;
UPSFinalizerV2.prototype.verifyTeacherAndLogin = verifyTeacherAndLogin;
