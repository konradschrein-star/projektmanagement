// UPS Finalizer V2 - CORRECTED VERSION
// Core Features: API Validation, Gap-Analyse PDF Import, Chat, A3 Export
// NO POSTER FEATURE

// Import Phase 2 modules will be loaded via script tags

class UPSFinalizerV2 {
    constructor() {
        // Core state
        this.currentStep = 0;
        this.totalSteps = 6;
        this.mode = 'manual';
        this.countermeasures = [];
        this.reapplicationAreas = [];
        this.apiKey = null;
        this.lastGeneratedMarkdown = '';

        // Phase 2 modules (initialized after API validation)
        this.pdfHandler = null;
        this.chatInterface = null;

        this.initApp();
    }

    async initApp() {
        // STEP 1: Validate API Key (BLOCKING)
        this.apiKey = await this.validateApiKeyOnStart();

        if (!this.apiKey) {
            this.showApiGateModal();
            return;
        }

        // STEP 2: Initialize Phase 2/3 modules
        this.fileHandler = new FileHandler(this.apiKey); // FileHandler supports PDF + Excel
        this.chatInterface = new ChatInterface(this.apiKey, (newContent) => {
            this.updateOutputFromChat(newContent);
        });

        // STEP 3: Show app
        document.getElementById('mainApp').style.display = 'block';
        this.init();
    }

    init() {
        this.loadSavedData();
        this.attachEventListeners();
        this.addInitialCountermeasure();
        this.addInitialReapplication();
    }

    // ========== API KEY VALIDATION ==========

    async validateApiKeyOnStart() {
        const key = localStorage.getItem('upsApiKey');
        if (!key) return null;

        const isValid = await this.testApiKey(key);
        return isValid ? key : null;
    }

    async testApiKey(key) {
        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
            return response.ok;
        } catch {
            return false;
        }
    }

    showApiGateModal() {
        document.getElementById('apiGateModal').classList.add('active');
    }

    hideApiGateModal() {
        document.getElementById('apiGateModal').classList.remove('active');
    }

    async handleApiKeyValidation() {
        const keyInput = document.getElementById('gateApiKey');
        const key = keyInput.value.trim();

        if (!key) {
            this.showApiValidationFeedback('Bitte API Key eingeben', 'error');
            return;
        }

        this.showApiValidationFeedback('Key wird validiert...', 'loading');

        const isValid = await this.testApiKey(key);

        if (isValid) {
            localStorage.setItem('upsApiKey', key);
            this.apiKey = key;
            this.showApiValidationFeedback('✓ Key gültig!', 'success');

            setTimeout(() => {
                this.hideApiGateModal();
                location.reload(); // Restart app with valid key
            }, 1000);
        } else {
            this.showApiValidationFeedback('❌ Ungültiger Key', 'error');
        }
    }

    showApiValidationFeedback(message, type) {
        const feedback = document.getElementById('apiValidationFeedback');
        if (feedback) {
            feedback.textContent = message;
            feedback.className = `api-validation-feedback ${type}`;
        }
    }

    // ========== MODE MANAGEMENT ==========

    switchMode(newMode) {
        this.mode = newMode;

        document.querySelectorAll('.mode-option').forEach(opt => {
            opt.classList.toggle('active', opt.dataset.mode === newMode);
        });

        if (newMode === 'pdf') {
            document.getElementById('uploadSection').style.display = 'block';
            document.getElementById('inputSection').style.display = 'none';
        } else {
            document.getElementById('uploadSection').style.display = 'none';
            document.getElementById('inputSection').style.display = 'block';
        }
    }

    // ========== FILE UPLOAD (PDF/EXCEL GAP-ANALYSE PARSING) ==========

    async handlePDFUpload(file) {
        try {
            const fileType = file.name.toLowerCase().endsWith('.xlsx') ? 'Excel' : 'PDF';
            this.showLoading(`${fileType} wird analysiert...`);

            await this.fileHandler.handleFileUpload(file);
            const extractedData = await this.fileHandler.extractDataFromFile(file);

            // Auto-fill with smart mapping
            this.autoFillFromGapAnalyse(extractedData);

            this.showToast(`✅ ${fileType} analysiert! Felder automatisch ausgefüllt.`, 'success');
            this.switchMode('manual'); // Switch to review

        } catch (error) {
            console.error('PDF Error:', error);
            this.showToast(`❌ Fehler: ${error.message}`, 'error');
        } finally {
            this.hideLoading();
        }
    }

    autoFillFromGapAnalyse(data) {
        // Smart mapping from Gap-Analyse structure
        if (data.projectTitle) {
            document.getElementById('projectTitle').value = data.projectTitle;
        }

        if (data.problemData) {
            const pd = data.problemData;
            if (pd.what) document.getElementById('what').value = pd.what;
            if (pd.where) document.getElementById('where').value = pd.where;
            if (pd.when) document.getElementById('when').value = pd.when;
            if (pd.who) document.getElementById('who').value = pd.who;
            if (pd.howMuch) document.getElementById('howMuch').value = pd.howMuch;
        }

        if (data.problemStatement) {
            document.getElementById('problemStatement').value = data.problemStatement;
        }

        if (data.rootCauseData) {
            const rc = data.rootCauseData;
            if (rc.identifiedCause) document.getElementById('rootCause').value = rc.identifiedCause;
            if (rc.verification) document.getElementById('verification').value = rc.verification;

            // Map Whys
            if (rc.why1) document.getElementById('why1').value = rc.why1;
            if (rc.why2) document.getElementById('why2').value = rc.why2;
            if (rc.why3) document.getElementById('why3').value = rc.why3;
            if (rc.why4) document.getElementById('why4').value = rc.why4;
            if (rc.why5) document.getElementById('why5').value = rc.why5;
        }

        // Measures
        if (data.measuresData && data.measuresData.length > 0) {
            this.countermeasures = data.measuresData;
            this.renderCountermeasures();
        }

        // Sustain
        if (data.sustainData) {
            const sd = data.sustainData;
            if (sd.beforeAfter) document.getElementById('beforeAfter').value = sd.beforeAfter;
            if (sd.standardization) document.getElementById('standardization').value = sd.standardization;
        }

        // Reapplication (if provided, otherwise will be auto-generated)
        if (data.reapplicationData && data.reapplicationData.length > 0) {
            this.reapplicationAreas = data.reapplicationData;
            this.renderReapplicationAreas();
        }

        this.saveFormData();
    }

    // ========== AI GENERATION (WITH PHANTOM GRUPPE 6) ==========

    async generateA3Summary() {
        const data = this.collectFormData();

        if (!data.projectTitle || !data.problemStatement) {
            this.showToast('Bitte mindestens Projekttitel und Problem Statement ausfüllen', 'error');
            return;
        }

        this.showLoading('A3 Summary wird generiert...');

        try {
            const prompt = this.buildPhantomPrompt(data);
            const response = await this.callGeminiAPI(prompt);

            this.displayResult(response);
            this.chatInterface.init(response);

            this.hideLoading();
            document.getElementById('outputSection').style.display = 'block';
            document.getElementById('outputSection').scrollIntoView({ behavior: 'smooth' });

            this.showToast('✅ A3 Summary generiert!', 'success');

        } catch (error) {
            console.error('Generation error:', error);
            this.hideLoading();
            this.showToast(`❌ ${error.message}`, 'error');
        }
    }

    buildPhantomPrompt(data) {
        let prompt = `${CONFIG.SYSTEM_INSTRUCTION}\n\n`;

        prompt += `PHANTOM GRUPPE 6 REGEL:
Da kein Input von Gruppe 6 vorhanden ist, MUSST du die Reapplication Matrix selbst generieren.
Basierend auf dem Problem "${data.problemStatement}", erstelle 2-3 logische Vorschläge für ähnliche Bereiche im Unternehmen.

Beispiele:
- Wenn Problem an "Maschine 17" -> Vorschlag:  "Maschine 18, 19"
- Wenn Problem in "Produktionslinie A" -> Vorschlag: "Produktionslinie B, C"
- Wenn Problem in "Schicht 1" -> Vorschlag: "Schicht 2, Wochenendschicht"

Input-Daten:\n\n`;

        prompt += `Business Impact: ${data.businessImpact}\n`;
        prompt += `Problem: ${data.problemStatement}\n`;
        prompt += `Root Cause: ${data.rootCause}\n\n`;

        prompt += `Countermeasures:\n`;
        data.countermeasures.forEach((cm, i) => {
            prompt += `${i + 1}. ${cm.action} | ${cm.responsible} | ${cm.status}\n`;
        });

        prompt += `\nStandardization: ${data.standardization}\n\n`;

        prompt += `OUTPUT FORMAT:\n${CONFIG.OUTPUT_TEMPLATE}`;

        return prompt;
    }

    async callGeminiAPI(prompt) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${this.apiKey}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.4, maxOutputTokens: 2048 }
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || 'API failed');
        }

        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
    }

    // ========== CHAT INTERFACE ==========

    toggleChat() {
        const panel = document.getElementById('chatPanel');
        const isOpen = panel.classList.toggle('open');

        if (isOpen && !this.chatInterface.currentContext) {
            this.chatInterface.init(this.lastGeneratedMarkdown);
        }
    }

    async sendChatMessage() {
        const input = document.getElementById('chatInput');
        const message = input.value.trim();

        if (!message) return;

        this.addChatMessage(message, 'user');
        input.value = '';

        try {
            const response = await this.chatInterface.sendMessage(message);
            this.addChatMessage(response, 'assistant');
        } catch (error) {
            this.showToast(`❌ Chat error: ${error.message}`, 'error');
        }
    }

    addChatMessage(content, role) {
        const container = document.getElementById('chatMessages');
        const msg = document.createElement('div');
        msg.className = `chat-message ${role}`;

        if (role === 'assistant') {
            const escapedContent = content.replace(/`/g, '\\`').replace(/\$/g, '\\$');
            msg.innerHTML = `
                <div class="message-content">${this.escapeHtml(content)}</div>
                <button class="apply-btn" onclick="app.applyChatMessage(\`${escapedContent}\`)">Anwenden</button>
            `;
        } else {
            msg.innerHTML = `<div class="message-content">${this.escapeHtml(content)}</div>`;
        }

        container.appendChild(msg);
        container.scrollTop = container.scrollHeight;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    applyChatMessage(content) {
        this.lastGeneratedMarkdown = content;
        this.displayResult(content);
        this.chatInterface.updateContext(content);
        this.showToast('✅ Änderungen übernommen!', 'success');
    }

    updateOutputFromChat(newContent) {
        this.applyChatMessage(newContent);
    }

    // ========== JSON SAVE/LOAD (PHASE 3) ==========

    saveProjectAsJSON() {
        const data = this.collectFormData();
        data.exportTimestamp = new Date().toISOString();
        data.exportVersion = 'UPS Finalizer v2.0';

        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `UPS_Project_${data.projectTitle || 'Untitled'}_${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showToast('✅ Projekt als JSON gespeichert!', 'success');
    }

    loadProjectFromJSON(file) {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);

                // Restore all fields
                Object.keys(data).forEach(key => {
                    const element = document.getElementById(key);
                    if (element && typeof data[key] === 'string') {
                        element.value = data[key];
                    }
                });

                // Restore arrays
                if (data.countermeasures) {
                    this.countermeasures = data.countermeasures;
                    this.renderCountermeasures();
                }
                if (data.reapplicationAreas) {
                    this.reapplicationAreas = data.reapplicationAreas;
                    this.renderReapplicationAreas();
                }

                this.saveFormData();
                this.showToast('✅ Projekt erfolgreich geladen!', 'success');

            } catch (error) {
                this.showToast(`❌ Fehler beim Laden: ${error.message}`, 'error');
            }
        };

        reader.readAsText(file);
    }

    // ========== A3 PDF EXPORT (PIXEL-PERFECT) ==========

    async exportToPDF() {
        const element = document.getElementById('outputContent');
        element.classList.add('a3-layout');

        this.showLoading('PDF wird generiert...');

        try {
            const opt = {
                margin: [10, 10],
                filename: `A3_Summary_${document.getElementById('projectTitle').value || 'UPS'}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true },
                jsPDF: {
                    unit: 'mm',
                    format: 'a3',
                    orientation: 'landscape'
                }
            };

            await html2pdf().set(opt).from(element).save();
            this.showToast('✅ PDF heruntergeladen!', 'success');
        } catch (error) {
            this.showToast(`❌ PDF Fehler: ${error.message}`, 'error');
        } finally {
            element.classList.remove('a3-layout');
            this.hideLoading();
        }
    }

    // ========== UI HELPERS ==========

    showLoading(text = 'Wird geladen...') {
        const overlay = document.getElementById('loadingOverlay');
        const loadingText = document.getElementById('loadingText');
        if (loadingText) loadingText.textContent = text;
        if (overlay) overlay.style.display = 'flex';
    }

    hideLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) overlay.style.display = 'none';
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;

        const container = document.getElementById('toastContainer');
        if (container) {
            container.appendChild(toast);
            setTimeout(() => toast.classList.add('show'), 100);
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => container.removeChild(toast), 300);
            }, 4000);
        }
    }

    displayResult(markdown) {
        this.lastGeneratedMarkdown = markdown;
        const outputContent = document.getElementById('outputContent');

        // Simple markdown rendering
        let html = markdown;
        html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
        html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
        html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');
        html = html.replace(/^\* (.+)$/gm, '<li>$1</li>');
        html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');
        html = this.convertMarkdownTables(html);
        html = html.replace(/\n\n/g, '</p><p>');
        html = '<p>' + html + '</p>';
        html = html.replace(/^---$/gm, '<hr>');

        outputContent.innerHTML = html;
    }

    convertMarkdownTables(html) {
        const lines = html.split('\n');
        let inTable = false;
        let tableHTML = '';
        let resultHTML = '';

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            if (line.includes('|')) {
                if (!inTable) {
                    inTable = true;
                    tableHTML = '<table>';
                }

                const cells = line.split('|').map(c => c.trim()).filter(c => c);
                if (cells.every(c => c.match(/^:?-+:?$/))) continue;

                const isHeader = i === 0 || !lines[i - 1]?.includes('|');
                const tag = isHeader ? 'th' : 'td';

                tableHTML += '<tr>';
                cells.forEach(cell => tableHTML += `<${tag}>${cell}</${tag}>`);
                tableHTML += '</tr>';
            } else {
                if (inTable) {
                    tableHTML += '</table>';
                    resultHTML += tableHTML;
                    tableHTML = '';
                    inTable = false;
                }
                resultHTML += line + '\n';
            }
        }

        if (inTable) resultHTML += tableHTML + '</table>';

        return resultHTML;
    }

    // ========== EVENT LISTENERS ==========

    attachEventListeners() {
        // API Gate
        const validateBtn = document.getElementById('validateAndEnter');
        if (validateBtn) {
            validateBtn.addEventListener('click', () => this.handleApiKeyValidation());
        }

        // Teacher Login
        const teacherLoginBtn = document.getElementById('teacherLoginBtn');
        const teacherCancelBtn = document.getElementById('teacherCancelBtn');
        const teacherConfirmBtn = document.getElementById('teacherConfirmBtn');

        if (teacherLoginBtn) {
            teacherLoginBtn.addEventListener('click', () => this.showTeacherNameModal());
        }
        if (teacherCancelBtn) {
            teacherCancelBtn.addEventListener('click', () => this.hideTeacherNameModal());
        }
        if (teacherConfirmBtn) {
            teacherConfirmBtn.addEventListener('click', () => this.verifyTeacherAndLogin());
        }

        // Mode selector
        document.querySelectorAll('.mode-option').forEach(opt => {
            opt.addEventListener('click', () => this.switchMode(opt.dataset.mode));
        });

        // PDF Upload
        const uploadZone = document.getElementById('uploadZone');
        const fileInput = document.getElementById('pdfFileInput');
        const selectBtn = document.getElementById('selectPdfBtn');

        if (selectBtn) selectBtn.addEventListener('click', () => fileInput.click());
        if (fileInput) fileInput.addEventListener('change', (e) => {
            if (e.target.files[0]) this.handlePDFUpload(e.target.files[0]);
        });

        if (uploadZone) {
            uploadZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadZone.classList.add('dragover');
            });
            uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('dragover'));
            uploadZone.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadZone.classList.remove('dragover');
                if (e.dataTransfer.files[0]) this.handlePDFUpload(e.dataTransfer.files[0]);
            });
        }

        // Chat
        const chatToggle = document.getElementById('chatToggleBtn');
        const chatClose = document.getElementById('chatCloseBtn');
        const chatSend = document.getElementById('chatSendBtn');
        const chatInput = document.getElementById('chatInput');

        if (chatToggle) chatToggle.addEventListener('click', () => this.toggleChat());
        if (chatClose) chatClose.addEventListener('click', () => this.toggleChat());
        if (chatSend) chatSend.addEventListener('click', () => this.sendChatMessage());
        if (chatInput) {
            chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendChatMessage();
                }
            });
        }

        // Generate
        const generateBtn = document.getElementById('generateBtn');
        if (generateBtn) generateBtn.addEventListener('click', () => this.generateA3Summary());

        // Export PDF
        const downloadPdfBtn = document.getElementById('downloadPdfBtn');
        if (downloadPdfBtn) downloadPdfBtn.addEventListener('click', () => this.exportToPDF());

        // JSON Save/Load (Phase 3)
        const saveDataBtn = document.getElementById('saveData Btn');
        const loadDataBtn = document.getElementById('loadDataBtn');
        const loadDataInput = document.getElementById('loadDataInput');

        if (saveDataBtn) saveDataBtn.addEventListener('click', () => this.saveProjectAsJSON());
        if (loadDataBtn) loadDataBtn.addEventListener('click', () => loadDataInput.click());
        if (loadDataInput) loadDataInput.addEventListener('change', (e) => {
            if (e.target.files[0]) this.loadProjectFromJSON(e.target.files[0]);
        });

        // KEEP ALL OTHER EVENT LISTENERS FROM V1
        // (Navigation, countermeasures, settings, etc.)
        // ... existing code ...
    }

    // ========== COPY ALL OTHER METHODS FROM V1 ==========
    // navigation, countermeasures, reapplication, collectFormData, saveFormData, etc.

    collectFormData() {
        return {
            projectTitle: document.getElementById('projectTitle')?.value || '',
            teamName: document.getElementById('teamName')?.value || '',
            businessImpact: document.getElementById('businessImpact')?.value || '',
            problemStatement: document.getElementById('problemStatement')?.value || '',
            what: document.getElementById('what')?.value || '',
            where: document.getElementById('where')?.value || '',
            when: document.getElementById('when')?.value || '',
            who: document.getElementById('who')?.value || '',
            which: document.getElementById('which')?.value || '',
            how: document.getElementById('how')?.value || '',
            howMuch: document.getElementById('howMuch')?.value || '',
            rootCause: document.getElementById('rootCause')?.value || '',
            verification: document.getElementById('verification')?.value || '',
            validation: document.querySelector('input[name="validation"]:checked')?.value || '',
            beforeAfter: document.getElementById('beforeAfter')?.value || '',
            standardization: document.getElementById('standardization')?.value || '',
            followUp: document.getElementById('followUp')?.value || '',
            countermeasures: this.countermeasures,
            reapplicationAreas: this.reapplicationAreas
        };
    }

    saveFormData() {
        const data = this.collectFormData();
        localStorage.setItem('upsFormData', JSON.stringify(data));
    }

    loadSavedData() {
        const saved = localStorage.getItem('upsFormData');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                // Restore simple fields
                Object.keys(data).forEach(key => {
                    const element = document.getElementById(key);
                    if (element && typeof data[key] === 'string') {
                        element.value = data[key];
                    }
                });

                // Restore arrays
                if (data.countermeasures) this.countermeasures = data.countermeasures;
                if (data.reapplicationAreas) this.reapplicationAreas = data.reapplicationAreas;
            } catch (e) {
                console.error('Load error:', e);
            }
        }
    }

    addInitialCountermeasure() {
        this.addCountermeasure();
    }

    addInitialReapplication() {
        this.addReapplication();
    }

    addCountermeasure() {
        // Simplified - full implementation from v1
        const container = document.getElementById('countermeasuresList');
        if (container) {
            const index = this.countermeasures.length;
            this.countermeasures.push({ action: '', responsible: '', dueDate: '', status: '' });
            // ... full HTML rendering from v1 ...
        }
    }

    addReapplication() {
        // Simplified - full implementation from v1
        const container = document.getElementById('reapplicationList');
        if (container) {
            const index = this.reapplicationAreas.length;
            this.reapplicationAreas.push({ area: '', contact: '', status: '' });
            // ... full HTML rendering from v1 ...
        }
    }

    renderCountermeasures() {
        const container = document.getElementById('countermeasuresList');
        if (container) {
            container.innerHTML = '';
            this.countermeasures.forEach(() => this.addCountermeasure());
        }
    }

    renderReapplicationAreas() {
        const container = document.getElementById('reapplicationList');
        if (container) {
            container.innerHTML = '';
            this.reapplicationAreas.forEach(() => this.addReapplication());
        }
    }
}

// Initialize - Make globally accessible for V3
document.addEventListener('DOMContentLoaded', () => {
    const appInstance = new UPSFinalizerV2();
    window.app = appInstance; // Global access for V3 HTML bindings
});

