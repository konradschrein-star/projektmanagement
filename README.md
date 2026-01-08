# UPS Finalizer V3 - Ultimate Edition 🚀

**AI-Driven Management Summary Engine with End Portal Visual Theme**

Ein professionelles Tool zur Erstellung von A3-Summary-Dokumenten nach der UPS-Methodik (Understanding Problem-Solving), powered by Google Gemini AI und gestaltet mit einem atemberaubenden Minecraft End Portal inspirierten Design.

![Version](https://img.shields.io/badge/version-3.0-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)
![AI](https://img.shields.io/badge/AI-Gemini-orange)
![Theme](https://img.shields.io/badge/theme-End%20Portal-teal)

---

## ✨ Highlights V3

### 🌌 End Portal Visual Theme
- **8000 interaktive Partikel** mit WebGL-Shadern
- **Grün/Teal Farbpalette** (mystisch & elegant)
- **Quadratische Partikel** mit variierender Größe
- **Parallax Maus-Tracking**
- **60 FPS Performance**

### 🎨 Elegant Mystical UI
- **Dunkler Hintergrund** (#010602)
- **Glassmorphism Design** mit grünen Neon-Borders
- **Weißer Text** für maximale Lesbarkeit
- **Glow-Effekte** bei Hover
- **Professionelle Inputs** mit Focus-Animationen

---

## 🎯 Key Features

### Phase 1: Core ✅
- ✅ Multi-Step Wizard für UPS-Methodik
- ✅ Lokale Datenpersistenz
- ✅ Responsive Design

### Phase 2: Advanced ✅
- ✅ **API Key Validation Gate**
- ✅ **PDF Upload** (Gap-Analyse Parsing via Gemini Vision)
- ✅ **Excel Upload** (.xlsx Support via SheetJS)
- ✅ **Interactive Chat** (AI-gestützte Output-Verfeinerung)
- ✅ **JSON Save/Load** (Projektverwaltung)
- ✅ **A3 PDF Export** (Pixel-Perfect)
- ✅ **KI-gestützte Generierung** - Nutzt Google Gemini API für:
- Automatische A3 Summary Erstellung
- "Golden Thread" Validierung
- Reapplication Matrix Generierung

💾 **Lokale Datenspeicherung** - Alle Daten bleiben im Browser (localStorage)

🎨 **Modernes Design** - Dark Mode, Glassmorphism, Animationen

📄 **Export-Funktionen** - Markdown Download, Drucken, Zwischenablage

## Setup

### 1. Repository klonen

```bash
git clone https://github.com/konradschrein-star/projektmanagement.git
cd UPS-Finalizer
```

### 2. API Key konfigurieren

Sie benötigen einen **Google Gemini API Key**:

1. Besuchen Sie [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Erstellen Sie einen neuen API Key
3. Öffnen Sie die Anwendung und klicken Sie auf das Einstellungs-Icon ⚙️
4. Geben Sie Ihren API Key ein

**Hinweis:** Der API Key wird nur lokal in Ihrem Browser gespeichert und niemals an externe Server gesendet (außer Google Gemini API).

### 3. Anwendung starten

Da dies eine reine Client-Side Anwendung ist, benötigen Sie nur einen lokalen Webserver:

**Option A: Mit Python**
```bash
python -m http.server 8080
```

**Option B: Mit Node.js**
```bash
npx http-server . -p 8080
```

**Option C: Mit VS Code**
- Installieren Sie die Extension "Live Server"
- Rechtsklick auf `index.html` → "Open with Live Server"

Öffnen Sie dann: `http://localhost:8080`

## Verwendung

### Schritt 1: Projekt-Daten eingeben
Erfassen Sie alle Informationen aus Ihrem UPS-Projekt in den strukturierten Formularen.

### Schritt 2: A3 Summary generieren
Klicken Sie auf "A3 Summary generieren" - die KI erstellt automatisch:
- Konsolidierte Problem-Statement
- Root Cause Zusammenfassung
- Countermeasures Tabelle
- Reapplication Matrix

### Schritt 3: Exportieren
Nutzen Sie die Export-Funktionen:
- **Kopieren** - Markdown in Zwischenablage
- **Download** - Als `.md` Datei speichern
- **Drucken** - PDF via Browser-Druckfunktion (A3-Format)

## Technologie-Stack

- **HTML5** - Semantische Struktur
- **CSS3** - Custom Properties, Grid, Flexbox
- **Vanilla JavaScript** - Keine Frameworks, nur Web APIs
- **Google Gemini API** - KI-Generierung

## Sicherheit & Datenschutz

🔒 **100% Client-Side** - Keine Server-Kommunikation außer Google Gemini API

🔒 **Lokale Speicherung** - Alle Daten in localStorage (niemals auf einem Server)

🔒 **API Key Schutz** - Key wird nur im Browser gespeichert, `.gitignore` schützt vor versehentlichem Commit

## Projekt-Struktur

```
UPS-Finalizer/
├── index.html          # Haupt-HTML-Struktur
├── styles.css          # Design System & Styling
├── app.js             # Hauptlogik & Event Handling
├── config.js          # API-Konfiguration (nicht in Git!)
├── .gitignore         # Schützt sensible Daten
└── README.md          # Diese Datei
```

## Wartung & Anpassung

### Prompt anpassen
Die System-Instruktion für die KI befindet sich in `config.js`:
```javascript
SYSTEM_INSTRUCTION: `Rolle & Kontext: ...`
```

### Design anpassen
Das Design-System nutzt CSS Custom Properties in `styles.css`:
```css
:root {
    --clr-primary-500: hsl(220, 85%, 50%);
    /* ... weitere Variablen */
}
```

## Lizenz

Dieses Projekt ist für Lehrzwecke im Rahmen des Kurses "Projektmanagement" an der HTW erstellt.

## Kontakt

Konrad Schrein  
HTW - Semester 3  
Projektmanagement
