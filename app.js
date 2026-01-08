// UPS Finalizer - Main Application Logic

class UPSFinalizer {
    constructor() {
        this.currentStep = 0;
        this.totalSteps = 6; // header + 5 steps
        this.countermeasures = [];
        this.reapplicationAreas = [];

        this.init();
    }

    init() {
        this.loadSavedData();
        this.attachEventListeners();
        this.addInitialCountermeasure();
        this.addInitialReapplication();
    }

    // Event Listeners
    attachEventListeners() {
        // Navigation
        document.getElementById('nextBtn').addEventListener('click', () => this.nextStep());
        document.getElementById('prevBtn').addEventListener('click', () => this.prevStep());

        // Settings
        document.getElementById('settingsBtn').addEventListener('click', () => this.openSettings());
        document.getElementById('closeSettings').addEventListener('click', () => this.closeSettings());

        // API Key
        document.getElementById('apiKey').addEventListener('change', (e) => this.saveApiKey(e.target.value));

        // Clear Data
        document.getElementById('clearDataBtn').addEventListener('click', () => this.clearAllData());

        // Dynamic Lists
        document.getElementById('addCountermeasure').addEventListener('click', () => this.addCountermeasure());
        document.getElementById('addReapplication').addEventListener('click', () => this.addReapplication());

        // Generate
        document.getElementById('generateBtn').addEventListener('click', () => this.generateA3Summary());

        // Output Actions
        document.getElementById('copyBtn').addEventListener('click', () => this.copyToClipboard());
        document.getElementById('downloadBtn').addEventListener('click', () => this.downloadMarkdown());
        document.getElementById('printBtn').addEventListener('click', () => window.print());
        document.getElementById('newBtn').addEventListener('click', () => this.startNew());

        // Auto-save form data
        const formInputs = document.querySelectorAll('#upsForm input, #upsForm textarea, #upsForm select');
        formInputs.forEach(input => {
            input.addEventListener('change', () => this.saveFormData());
        });
    }

    // Navigation Methods
    nextStep() {
        if (this.currentStep < this.totalSteps - 1) {
            this.currentStep++;
            this.updateStepDisplay();
        }
    }

    prevStep() {
        if (this.currentStep > 0) {
            this.currentStep--;
            this.updateStepDisplay();
        }
    }

    updateStepDisplay() {
        // Hide all steps
        const steps = document.querySelectorAll('.form-step');
        steps.forEach(step => step.classList.remove('active'));

        // Show current step
        steps[this.currentStep].classList.add('active');

        // Update step indicators
        const dots = document.querySelectorAll('.step-dot');
        dots.forEach((dot, index) => {
            if (index === this.currentStep) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });

        // Update navigation buttons
        document.getElementById('prevBtn').disabled = this.currentStep === 0;

        const nextBtn = document.getElementById('nextBtn');
        if (this.currentStep === this.totalSteps - 1) {
            nextBtn.style.display = 'none';
        } else {
            nextBtn.style.display = 'flex';
        }

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Dynamic Countermeasures
    addCountermeasure() {
        const index = this.countermeasures.length;
        this.countermeasures.push({ action: '', responsible: '', dueDate: '', status: '' });

        const container = document.getElementById('countermeasuresList');
        const item = document.createElement('div');
        item.className = 'countermeasure-item';
        item.dataset.index = index;

        item.innerHTML = `
            <div class="item-header">
                <span class="item-number">Maßnahme ${index + 1}</span>
                <button type="button" class="remove-btn" onclick="app.removeCountermeasure(${index})">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
            <div class="item-grid">
                <div class="form-group">
                    <label for="cm_action_${index}">Maßnahme</label>
                    <input type="text" id="cm_action_${index}" data-field="action" data-index="${index}" placeholder="Beschreibung der Maßnahme">
                </div>
                <div class="form-group">
                    <label for="cm_responsible_${index}">Verantwortlich</label>
                    <input type="text" id="cm_responsible_${index}" data-field="responsible" data-index="${index}" placeholder="Name">
                </div>
                <div class="form-group">
                    <label for="cm_dueDate_${index}">Fälligkeitsdatum</label>
                    <input type="date" id="cm_dueDate_${index}" data-field="dueDate" data-index="${index}">
                </div>
                <div class="form-group">
                    <label for="cm_status_${index}">Status</label>
                    <select id="cm_status_${index}" data-field="status" data-index="${index}">
                        <option value="">Wählen...</option>
                        <option value="Geplant">Geplant</option>
                        <option value="In Bearbeitung">In Bearbeitung</option>
                        <option value="Erledigt">Erledigt</option>
                    </select>
                </div>
            </div>
        `;

        container.appendChild(item);

        // Attach change listeners
        item.querySelectorAll('input, select').forEach(input => {
            input.addEventListener('change', (e) => {
                const idx = parseInt(e.target.dataset.index);
                const field = e.target.dataset.field;
                this.countermeasures[idx][field] = e.target.value;
                this.saveFormData();
            });
        });
    }

    removeCountermeasure(index) {
        this.countermeasures.splice(index, 1);
        this.renderCountermeasures();
        this.saveFormData();
    }

    renderCountermeasures() {
        const container = document.getElementById('countermeasuresList');
        container.innerHTML = '';
        this.countermeasures.forEach((_, index) => this.addCountermeasure());
    }

    addInitialCountermeasure() {
        this.addCountermeasure();
    }

    // Dynamic Reapplication Areas
    addReapplication() {
        const index = this.reapplicationAreas.length;
        this.reapplicationAreas.push({ area: '', contact: '', status: '' });

        const container = document.getElementById('reapplicationList');
        const item = document.createElement('div');
        item.className = 'reapplication-item';
        item.dataset.index = index;

        item.innerHTML = `
            <div class="item-header">
                <span class="item-number">Bereich ${index + 1}</span>
                <button type="button" class="remove-btn" onclick="app.removeReapplication(${index})">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
            <div class="item-grid-full">
                <div class="form-group">
                    <label for="ra_area_${index}">Bereich / Maschine</label>
                    <input type="text" id="ra_area_${index}" data-field="area" data-index="${index}" placeholder="z.B. Produktionslinie 2">
                </div>
                <div class="form-group">
                    <label for="ra_contact_${index}">Ansprechpartner</label>
                    <input type="text" id="ra_contact_${index}" data-field="contact" data-index="${index}" placeholder="Name">
                </div>
                <div class="form-group">
                    <label for="ra_status_${index}">Transfer Status</label>
                    <select id="ra_status_${index}" data-field="status" data-index="${index}">
                        <option value="">Wählen...</option>
                        <option value="Geplant">Geplant</option>
                        <option value="Offen">Offen</option>
                        <option value="In Umsetzung">In Umsetzung</option>
                        <option value="Abgeschlossen">Abgeschlossen</option>
                    </select>
                </div>
            </div>
        `;

        container.appendChild(item);

        // Attach change listeners
        item.querySelectorAll('input, select').forEach(input => {
            input.addEventListener('change', (e) => {
                const idx = parseInt(e.target.dataset.index);
                const field = e.target.dataset.field;
                this.reapplicationAreas[idx][field] = e.target.value;
                this.saveFormData();
            });
        });
    }

    removeReapplication(index) {
        this.reapplicationAreas.splice(index, 1);
        this.renderReapplicationAreas();
        this.saveFormData();
    }

    renderReapplicationAreas() {
        const container = document.getElementById('reapplicationList');
        container.innerHTML = '';
        this.reapplicationAreas.forEach((_, index) => this.addReapplication());
    }

    addInitialReapplication() {
        this.addReapplication();
    }

    // Data Collection
    collectFormData() {
        return {
            // Header
            projectTitle: document.getElementById('projectTitle').value,
            teamName: document.getElementById('teamName').value,
            businessImpact: document.getElementById('businessImpact').value,

            // Step 1: Problem Investigation
            largeVagueProblem: document.getElementById('largeVagueProblem').value,
            what: document.getElementById('what').value,
            where: document.getElementById('where').value,
            when: document.getElementById('when').value,
            who: document.getElementById('who').value,
            which: document.getElementById('which').value,
            how: document.getElementById('how').value,
            howMuch: document.getElementById('howMuch').value,
            problemStatement: document.getElementById('problemStatement').value,

            // Step 2: Root Cause
            ishikawaMensch: document.getElementById('ishikawaMensch').value,
            ishikawaMaschine: document.getElementById('ishikawaMaschine').value,
            ishikawaMethode: document.getElementById('ishikawaMethode').value,
            ishikawaMaterial: document.getElementById('ishikawaMaterial').value,
            ishikawaUmgebung: document.getElementById('ishikawaUmgebung').value,
            why1: document.getElementById('why1').value,
            why2: document.getElementById('why2').value,
            why3: document.getElementById('why3').value,
            why4: document.getElementById('why4').value,
            why5: document.getElementById('why5').value,
            rootCause: document.getElementById('rootCause').value,
            verification: document.getElementById('verification').value,

            // Step 3: Countermeasures
            countermeasures: this.countermeasures,

            // Step 4: Sustain
            validation: document.querySelector('input[name="validation"]:checked')?.value || '',
            beforeAfter: document.getElementById('beforeAfter').value,
            standardization: document.getElementById('standardization').value,
            followUp: document.getElementById('followUp').value,

            // Step 5: Reapplication
            reapplicationAreas: this.reapplicationAreas
        };
    }

    // Local Storage
    saveFormData() {
        const data = this.collectFormData();
        localStorage.setItem('upsFormData', JSON.stringify(data));
    }

    loadSavedData() {
        const saved = localStorage.getItem('upsFormData');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                this.restoreFormData(data);
            } catch (e) {
                console.error('Error loading saved data:', e);
            }
        }

        // Load API key
        const apiKey = localStorage.getItem('upsApiKey');
        if (apiKey) {
            document.getElementById('apiKey').value = apiKey;
        }
    }

    restoreFormData(data) {
        // Restore simple fields
        Object.keys(data).forEach(key => {
            const element = document.getElementById(key);
            if (element && typeof data[key] === 'string') {
                element.value = data[key];
            }
        });

        // Restore radio buttons
        if (data.validation) {
            const radio = document.querySelector(`input[name="validation"][value="${data.validation}"]`);
            if (radio) radio.checked = true;
        }

        // Restore dynamic lists
        if (data.countermeasures && data.countermeasures.length > 0) {
            this.countermeasures = data.countermeasures;
            this.renderCountermeasures();
        }

        if (data.reapplicationAreas && data.reapplicationAreas.length > 0) {
            this.reapplicationAreas = data.reapplicationAreas;
            this.renderReapplicationAreas();
        }
    }

    saveApiKey(key) {
        localStorage.setItem('upsApiKey', key);
    }

    clearAllData() {
        if (confirm('Möchten Sie wirklich alle gespeicherten Daten löschen? Dies kann nicht rückgängig gemacht werden.')) {
            localStorage.removeItem('upsFormData');
            localStorage.removeItem('upsApiKey');
            location.reload();
        }
    }

    // Settings Modal
    openSettings() {
        document.getElementById('settingsModal').classList.add('active');
    }

    closeSettings() {
        document.getElementById('settingsModal').classList.remove('active');
    }

    // AI Generation
    async generateA3Summary() {
        const data = this.collectFormData();

        // Validation
        if (!data.projectTitle || !data.problemStatement || !data.rootCause) {
            alert('Bitte füllen Sie mindestens Projekttitel, Problem Statement und Root Cause aus.');
            return;
        }

        // Get API key
        const apiKey = localStorage.getItem('upsApiKey') || CONFIG.FALLBACK_API_KEY;
        if (!apiKey) {
            alert('Bitte geben Sie einen Gemini API Key in den Einstellungen ein.');
            this.openSettings();
            return;
        }

        // Show loading
        document.getElementById('loadingOverlay').style.display = 'flex';

        try {
            const prompt = this.buildPrompt(data);
            const response = await this.callGeminiAPI(apiKey, prompt);

            // Parse and display result
            this.displayResult(response);

            // Hide loading and show output
            document.getElementById('loadingOverlay').style.display = 'none';
            document.getElementById('outputSection').style.display = 'block';

            // Scroll to output
            document.getElementById('outputSection').scrollIntoView({ behavior: 'smooth' });

        } catch (error) {
            console.error('Generation error:', error);
            document.getElementById('loadingOverlay').style.display = 'none';
            alert('Fehler bei der Generierung: ' + error.message);
        }
    }

    buildPrompt(data) {
        // Build structured prompt with all data
        let prompt = CONFIG.SYSTEM_INSTRUCTION + '\n\n';
        prompt += 'Input-Daten (Kontext): Hier sind die rohen Projektdaten, die du verarbeiten musst:\n\n';

        // Add all collected data
        prompt += `Projekt/Business Case: ${data.businessImpact}\n\n`;

        prompt += `Step 1 - Problem Statement (aus 6W-2H):\n`;
        prompt += `- Was: ${data.what}\n`;
        prompt += `- Wo (ON THE FLOOR): ${data.where}\n`;
        prompt += `- Wann: ${data.when}\n`;
        prompt += `- Wer: ${data.who}\n`;
        prompt += `- Welches Muster: ${data.which}\n`;
        prompt += `- Wie: ${data.how}\n`;
        prompt += `- Wie viel: ${data.howMuch}\n`;
        prompt += `Problem Statement: ${data.problemStatement}\n\n`;

        prompt += `Step 2 - Root Cause (aus 5-Why/Ishikawa):\n`;
        prompt += `Ishikawa Kategorien:\n`;
        prompt += `- Mensch: ${data.ishikawaMensch}\n`;
        prompt += `- Maschine: ${data.ishikawaMaschine}\n`;
        prompt += `- Methode: ${data.ishikawaMethode}\n`;
        prompt += `- Material: ${data.ishikawaMaterial}\n`;
        prompt += `- Umgebung: ${data.ishikawaUmgebung}\n`;
        prompt += `5-Why Kette:\n`;
        prompt += `1. ${data.why1}\n`;
        prompt += `2. ${data.why2}\n`;
        prompt += `3. ${data.why3}\n`;
        prompt += `4. ${data.why4}\n`;
        prompt += `5. ${data.why5}\n`;
        prompt += `True Root Cause: ${data.rootCause}\n`;
        prompt += `Verifikation: ${data.verification}\n\n`;

        prompt += `Step 3 - Countermeasures (Action Plan):\n`;
        data.countermeasures.forEach((cm, i) => {
            prompt += `${i + 1}. ${cm.action} | Verantwortlich: ${cm.responsible} | Status: ${cm.status}\n`;
        });
        prompt += '\n';

        prompt += `Step 4 - Sustain Results (Check):\n`;
        prompt += `Validierung: ${data.validation}\n`;
        prompt += `Vorher/Nachher: ${data.beforeAfter}\n`;
        prompt += `Standardisierung: ${data.standardization}\n`;
        prompt += `Follow-up: ${data.followUp}\n\n`;

        prompt += `Step 5 - Reapplication Potential:\n`;
        data.reapplicationAreas.forEach((ra, i) => {
            prompt += `${i + 1}. ${ra.area} | Kontakt: ${ra.contact} | Status: ${ra.status}\n`;
        });
        prompt += '\n';

        prompt += 'Output-Format: Generiere den Output exakt im folgenden Markdown-Format:\n\n';
        prompt += CONFIG.OUTPUT_TEMPLATE;

        prompt += '\n\nFülle alle Platzhalter mit den bereitgestellten Daten aus und stelle sicher, dass der "Golden Thread" konsistent ist.';

        return prompt;
    }

    async callGeminiAPI(apiKey, prompt) {
        const url = `${CONFIG.GEMINI_API_URL}?key=${apiKey}`;

        const requestBody = {
            contents: [{
                parts: [{
                    text: prompt
                }]
            }],
            generationConfig: {
                temperature: 0.4,
                maxOutputTokens: 2048,
            }
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || 'API request failed');
        }

        const data = await response.json();

        if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
            throw new Error('Invalid API response format');
        }

        return data.candidates[0].content.parts[0].text;
    }

    displayResult(markdown) {
        const outputContent = document.getElementById('outputContent');

        // Simple markdown to HTML conversion
        let html = markdown;

        // Headers
        html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
        html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
        html = html.replace(/^### (.+)$/gm, '<h3>$3</h3>');

        // Bold
        html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

        // Blockquotes
        html = html.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');

        // Lists
        html = html.replace(/^\* (.+)$/gm, '<li>$1</li>');
        html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');

        // Tables
        html = this.convertMarkdownTables(html);

        // Line breaks
        html = html.replace(/\n\n/g, '</p><p>');
        html = '<p>' + html + '</p>';

        // Horizontal rules
        html = html.replace(/^---$/gm, '<hr>');

        outputContent.innerHTML = html;

        // Store for export
        this.lastGeneratedMarkdown = markdown;
    }

    convertMarkdownTables(html) {
        // Simple table conversion
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

                // Skip alignment row
                if (cells.every(c => c.match(/^:?-+:?$/))) {
                    continue;
                }

                // Determine if header or data row
                const isHeader = i === 0 || !lines[i - 1]?.includes('|');
                const tag = isHeader ? 'th' : 'td';

                tableHTML += '<tr>';
                cells.forEach(cell => {
                    tableHTML += `<${tag}>${cell}</${tag}>`;
                });
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

        if (inTable) {
            tableHTML += '</table>';
            resultHTML += tableHTML;
        }

        return resultHTML;
    }

    // Output Actions
    copyToClipboard() {
        if (!this.lastGeneratedMarkdown) return;

        navigator.clipboard.writeText(this.lastGeneratedMarkdown).then(() => {
            alert('Markdown in Zwischenablage kopiert!');
        }).catch(err => {
            console.error('Copy failed:', err);
        });
    }

    downloadMarkdown() {
        if (!this.lastGeneratedMarkdown) return;

        const data = this.collectFormData();
        const filename = `A3_Summary_${data.projectTitle.replace(/\s+/g, '_')}.md`;

        const blob = new Blob([this.lastGeneratedMarkdown], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();

        URL.revokeObjectURL(url);
    }

    startNew() {
        if (confirm('Möchten Sie ein neues Projekt starten? Nicht gespeicherte Änderungen gehen verloren.')) {
            this.clearAllData();
        }
    }
}

// Initialize app when DOM is ready
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new UPSFinalizer();
});

// Close modal on outside click
window.addEventListener('click', (e) => {
    const modal = document.getElementById('settingsModal');
    if (e.target === modal) {
        app.closeSettings();
    }
});
