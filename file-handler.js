// File Handler - Supports both PDF (via Gemini) and Excel (via SheetJS)
// Extends PDF Handler with Excel parsing capabilities

class FileHandler extends PDFHandler {
    constructor(apiKey) {
        super(apiKey);
    }

    /**
     * Handle file upload - detects type and routes accordingly
     */
    async handleFileUpload(file) {
        if (!file) {
            throw new Error('Keine Datei ausgewählt');
        }

        const fileType = this.detectFileType(file);

        if (fileType === 'pdf') {
            return await super.handleFileUpload(file);
        } else if (fileType === 'excel') {
            return await this.handleExcelUpload(file);
        } else {
            throw new Error('Nur PDF und Excel (.xlsx) Dateien werden unterstützt');
        }
    }

    /**
     * Detect file type from extension and MIME type
     */
    detectFileType(file) {
        const name = file.name.toLowerCase();
        const type = file.type;

        if (name.endsWith('.pdf') || type === 'application/pdf') {
            return 'pdf';
        }

        if (name.endsWith('.xlsx') ||
            type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
            return 'excel';
        }

        return 'unknown';
    }

    /**
     * Handle Excel file upload
     */
    async handleExcelUpload(file) {
        if (file.size > 10 * 1024 * 1024) {
            throw new Error('Datei zu groß. Maximum 10MB');
        }

        this.uploadedFile = file;
        return file;
    }

    /**
     * Extract data from either PDF or Excel
     */
    async extractDataFromFile(file) {
        const fileType = this.detectFileType(file);

        if (fileType === 'pdf') {
            return await this.extractDataFromPDF(file);
        } else if (fileType === 'excel') {
            return await this.extractDataFromExcel(file);
        }
    }

    /**
     * Extract UPS data from Excel file
     */
    async extractDataFromExcel(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });

                    const extracted Data = this.parseExcelWorkbook(workbook);
                    resolve(extractedData);
                } catch (error) {
                    reject(new Error(`Excel parsing error: ${error.message}`));
                }
            };

            reader.onerror = () => reject(new Error('Fehler beim Lesen der Excel-Datei'));
            reader.readAsArrayBuffer(file);
        });
    }

    /**
     * Parse Excel workbook - scan for keywords
     */
    parseExcelWorkbook(workbook) {
        const extractedData = {
            projectTitle: '',
            problemData: {},
            problemStatement: '',
            rootCauseData: {},
            measuresData: [],
            sustainData: {},
            reapplicationData: []
        };

        // Scan all sheets
        workbook.SheetNames.forEach(sheetName => {
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

            // Scan cells for keywords
            jsonData.forEach((row, rowIndex) => {
                row.forEach((cell, colIndex) => {
                    if (!cell) return;

                    const cellText = String(cell).toLowerCase();
                    const nextCell = row[colIndex + 1] || '';
                    const belowCell = jsonData[rowIndex + 1]?.[colIndex] || '';

                    // Project title detection
                    if (cellText.includes('projekt') || cellText.includes('title')) {
                        extractedData.projectTitle = nextCell || belowCell;
                    }

                    // Problem detection
                    if (cellText.includes('abweichung') || cellText.includes('problem')) {
                        const problemText = nextCell || belowCell;
                        if (problemText && !extractedData.problemStatement) {
                            extractedData.problemStatement = problemText;
                            extractedData.problemData.what = problemText;
                        }
                    }

                    // Root cause detection
                    if (cellText.includes('ursache') || cellText.includes('warum') || cellText.includes('grundursache')) {
                        const causeText = nextCell || belowCell;
                        if (causeText && !extractedData.rootCauseData.identifiedCause) {
                            extractedData.rootCauseData.identifiedCause = causeText;
                        }
                    }

                    // 5-Why detection
                    if (cellText.match(/why\s*[1-5]|warum\s*[1-5]/)) {
                        const whyNum = cellText.match(/[1-5]/)[0];
                        extractedData.rootCauseData[`why${whyNum}`] = nextCell || belowCell;
                    }

                    // Countermeasure / Action detection
                    if ((cellText.includes('aktion') || cellText.includes('maßnahme') || cellText.includes('action')) && nextCell) {
                        // Check if this looks like a header or actual measure
                        if (!cellText.includes('plan') && nextCell.length > 3) {
                            extractedData.measuresData.push({
                                action: nextCell || belowCell,
                                responsible: '',
                                dueDate: '',
                                status: 'Offen'
                            });
                        }
                    }

                    // Standardization detection
                    if (cellText.includes('standardis') || cellText.includes('sop') || cellText.includes('opl')) {
                        if (nextCell && !extractedData.sustainData.standardization) {
                            extractedData.sustainData.standardization = nextCell;
                        }
                    }
                });
            });
        });

        // Deduplicate measures
        if (extractedData.measuresData.length > 0) {
            const unique = [];
            const seen = new Set();
            extractedData.measuresData.forEach(m => {
                if (m.action && !seen.has(m.action)) {
                    seen.add(m.action);
                    unique.push(m);
                }
            });
            extractedData.measuresData = unique;
        }

        return extractedData;
    }

    /**
     * Map extracted Excel data to form fields
     * Same structure as PDF handler
     */
    mapToFormFields(extractedData) {
        // Use same mapping as PDF handler
        return {
            projectTitle: extractedData.projectTitle || '',
            teamName: extractedData.teamName || '',
            businessImpact: extractedData.businessImpact || '',
            largeVagueProblem: extractedData.largeVagueProblem || '',
            what: extractedData.problemData?.what || '',
            where: extractedData.problemData?.where || '',
            when: extractedData.problemData?.when || '',
            who: extractedData.problemData?.who || '',
            which: extractedData.problemData?.which || '',
            how: extractedData.problemData?.how || '',
            howMuch: extractedData.problemData?.howMuch || '',
            problemStatement: extractedData.problemStatement || '',
            ishikawaMensch: extractedData.rootCauseData?.ishikawaMensch || '',
            ishikawaMaschine: extractedData.rootCauseData?.ishikawaMaschine || '',
            ishikawaMethode: extractedData.rootCauseData?.ishikawaMethode || '',
            ishikawaMaterial: extractedData.rootCauseData?.ishikawaMaterial || '',
            ishikawaUmgebung: extractedData.rootCauseData?.ishikawaUmgebung || '',
            why1: extractedData.rootCauseData?.why1 || '',
            why2: extractedData.rootCauseData?.why2 || '',
            why3: extractedData.rootCauseData?.why3 || '',
            why4: extractedData.rootCauseData?.why4 || '',
            why5: extractedData.rootCauseData?.why5 || '',
            rootCause: extractedData.rootCauseData?.identifiedCause || '',
            verification: extractedData.rootCauseData?.verification || '',
            validation: extractedData.sustainData?.validation || '',
            beforeAfter: extractedData.sustainData?.beforeAfter || '',
            standardization: extractedData.sustainData?.standardization || '',
            followUp: extractedData.sustainData?.followUp || '',
            countermeasures: extractedData.measuresData || [],
            reapplicationAreas: extractedData.reapplicationData || []
        };
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FileHandler;
}
