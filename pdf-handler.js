// PDF Handler Module - Handles PDF upload and data extraction

class PDFHandler {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.uploadedFile = null;
    }

    /**
     * Handle file upload from input or drag & drop
     */
    async handleFileUpload(file) {
        // Validate file
        if (!file) {
            throw new Error('Keine Datei ausgewählt');
        }

        if (file.type !== 'application/pdf') {
            throw new Error('Bitte nur PDF-Dateien hochladen');
        }

        if (file.size > 10 * 1024 * 1024) { // 10MB limit
            throw new Error('Datei zu groß. Maximum 10MB');
        }

        this.uploadedFile = file;
        return file;
    }

    /**
     * Upload PDF to Gemini and extract UPS data
     */
    async extractDataFromPDF(file) {
        if (!this.apiKey) {
            throw new Error('API Key erforderlich für PDF-Analyse');
        }

        // Step 1: Upload file to Gemini File API
        const uploadedFile = await this.uploadToGemini(file);

        // Step 2: Process with Gemini Vision
        const extractedData = await this.processWithGemini(uploadedFile);

        return extractedData;
    }

    /**
     * Upload file to Gemini File API
     */
    async uploadToGemini(file) {
        const formData = new FormData();
        formData.append('file', file);

        const uploadUrl = `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${this.apiKey}`;

        const response = await fetch(uploadUrl, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Upload fehlgeschlagen: ${error.error?.message || 'Unbekannter Fehler'}`);
        }

        const data = await response.json();
        return data.file;
    }

    /**
     * Process uploaded file with Gemini to extract structured data
     */
    async processWithGemini(uploadedFile) {
        const prompt = this.buildExtractionPrompt();

        const requestBody = {
            contents: [{
                parts: [
                    {
                        fileData: {
                            mimeType: uploadedFile.mimeType,
                            fileUri: uploadedFile.uri
                        }
                    },
                    {
                        text: prompt
                    }
                ]
            }],
            generationConfig: {
                temperature: 0.1, // Low temperature for accurate extraction
                maxOutputTokens: 2048,
            }
        };

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${this.apiKey}`;

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Analyse fehlgeschlagen: ${error.error?.message || 'Unbekannter Fehler'}`);
        }

        const data = await response.json();
        const textResponse = data.candidates[0].content.parts[0].text;

        // Parse JSON response
        try {
            // Extract JSON from markdown code blocks if present
            let jsonText = textResponse;
            const jsonMatch = textResponse.match(/```json\n?([\s\S]*?)\n?```/);
            if (jsonMatch) {
                jsonText = jsonMatch[1];
            }

            const extractedData = JSON.parse(jsonText);
            return extractedData;
        } catch (e) {
            console.error('JSON Parse Error:', e);
            console.error('Response:', textResponse);
            throw new Error('Konnte extrahierte Daten nicht verarbeiten. Bitte PDF manuell eingeben.');
        }
    }

    /**
     * Build prompt for data extraction
     */
    buildExtractionPrompt() {
        return CONFIG.PDF_EXTRACTION_PROMPT;
    }

    /**
     * Convert extracted data to form field values
     */
    mapToFormFields(extractedData) {
        return {
            // Simple fields - direct mapping
            projectTitle: extractedData.projectTitle || '',
            teamName: extractedData.teamName || '',
            businessImpact: extractedData.business Impact || '',
            largeVagueProblem: extractedData.largeVagueProblem || '',
                what: extractedData.what || '',
                    where: extractedData.where || '',
                        when: extractedData.when || '',
                            who: extractedData.who || '',
                                which: extractedData.which || '',
                                    how: extractedData.how || '',
                                        howMuch: extractedData.howMuch || '',
                                            problemStatement: extractedData.problemStatement || '',
                                                ishikawaMensch: extractedData.ishikawaMensch || '',
                                                    ishikawaMaschine: extractedData.ishikawaMaschine || '',
                                                        ishikawaMethode: extractedData.ishikawaMethode || '',
                                                            ishikawaMaterial: extractedData.ishikawaMaterial || '',
                                                                ishikawaUmgebung: extractedData.ishikawaUmgebung || '',
                                                                    why1: extractedData.why1 || '',
                                                                        why2: extractedData.why2 || '',
                                                                            why3: extractedData.why3 || '',
                                                                                why4: extractedData.why4 || '',
                                                                                    why5: extractedData.why5 || '',
                                                                                        rootCause: extractedData.rootCause || '',
                                                                                            verification: extractedData.verification || '',
                                                                                                validation: extractedData.validation || '',
                                                                                                    beforeAfter: extractedData.beforeAfter || '',
                                                                                                        standardization: extractedData.standardization || '',
                                                                                                            followUp: extractedData.followUp || '',

                                                                                                                // Complex fields - arrays
                                                                                                                countermeasures: extractedData.countermeasures || [],
                                                                                                                    reapplicationAreas: extractedData.reapplicationAreas || []
    };
}
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PDFHandler;
}
