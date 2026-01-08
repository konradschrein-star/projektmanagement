// Chat Interface Module - Context-aware chat for output refinement

class ChatInterface {
    constructor(apiKey, onOutputUpdate) {
        this.apiKey = apiKey;
        this.onOutputUpdate = onOutputUpdate; // Callback to update main output
        this.messages = [];
        this.currentContext = null;
        this.isOpen = false;
    }

    /**
     * Initialize chat with current A3 summary context
     */
    init(a3Summary) {
        this.currentContext = a3Summary;
        this.messages = [];
        this.addSystemMessage();
    }

    /**
     * Add system message with context
     */
    addSystemMessage() {
        this.messages.push({
            role: 'system',
            content: this.buildSystemPrompt()
        });
    }

    /**
     * Build system prompt with full context
     */
    buildSystemPrompt() {
        return `Du bist ein Assistent für die Bearbeitung von A3 Summaries im UPS Framework.
Der User hat folgendes A3 Summary generiert:

${this.currentContext}

Deine Aufgaben:
1. Hilf dem User, dieses Summary zu verbessern
2. Bei Änderungswünschen: Gib den VOLLSTÄNDIGEN neuen Abschnitt zurück
3. Sei präzise und professionell
4. Halte dich an Lean Management Standards

Der User kann Anfragen stellen wie:
- "Mache das Problem Statement prägnanter"
- "Ändere den Verantwortlichen bei Maßnahme 1 auf Herr Müller"
- "Füge eine weitere Reapplication Area hinzu"

Antworte immer mit dem vollständigen Markdown-Text der geänderten Sektion.`;
    }

    /**
     * Send user message and get AI response
     */
    async sendMessage(userMessage) {
        // Add user message
        this.messages.push({
            role: 'user',
            content: userMessage
        });

        // Build request for Gemini
        const response = await this.callGeminiChat();

        // Add assistant response
        this.messages.push({
            role: 'assistant',
            content: response
        });

        return response;
    }

    /**
     * Call Gemini API with chat history
     */
    async callGeminiChat() {
        if (!this.apiKey) {
            throw new Error('API Key erforderlich');
        }

        // Convert messages to Gemini format
        const contents = this.messages
            .filter(m => m.role !== 'system')
            .map(m => ({
                role: m.role === 'user' ? 'user' : 'model',
                parts: [{ text: m.content }]
            }));

        // Add system instruction
        const systemInstruction = this.messages.find(m => m.role === 'system');

        const requestBody = {
            contents: contents,
            systemInstruction: systemInstruction ? {
                parts: [{ text: systemInstruction.content }]
            } : undefined,
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 2048,
            }
        };

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${this.apiKey}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || 'Chat request failed');
        }

        const data = await response.json();

        if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
            throw new Error('Invalid chat response');
        }

        return data.candidates[0].content.parts[0].text;
    }

    /**
     * Apply chat suggestion to output
     */
    applyToOutput(newContent) {
        if (this.onOutputUpdate) {
            this.onOutputUpdate(newContent);
        }
    }

    /**
     * Update context when output changes
     */
    updateContext(newA3Summary) {
        this.currentContext = newA3Summary;
        // Update system message
        this.messages[0].content = this.buildSystemPrompt();
    }

    /**
     * Clear chat history
     */
    clear() {
        this.messages = [];
        this.addSystemMessage();
    }

    /**
     * Get formatted chat history
     */
    getHistory() {
        return this.messages.filter(m => m.role !== 'system');
    }

    /**
     * Toggle chat panel
     */
    toggle() {
        this.isOpen = !this.isOpen;
        return this.isOpen;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChatInterface;
}
