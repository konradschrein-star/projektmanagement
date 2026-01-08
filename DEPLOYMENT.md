# Vercel Deployment Anleitung

## Schnellstart - Deployment auf Vercel

### Option 1: Vercel CLI (Empfohlen)

1. **Vercel CLI installieren:**
```bash
npm install -g vercel
```

2. **In das Projektverzeichnis wechseln:**
```bash
cd "C:\Users\konra\OneDrive\HTW\03_Semester 3\Projektmanagement\UPS-Finalizer"
```

3. **Deployment starten:**
```bash
vercel
```

4. **Folgen Sie den Prompts:**
- Login mit GitHub/Email
- Projekt-Setup bestätigen
- Deployment abwarten

5. **Produktions-Deployment:**
```bash
vercel --prod
```

### Option 2: Vercel Dashboard (Einfachste Methode)

1. **Gehen Sie zu:** https://vercel.com
2. **Login** mit Ihrem GitHub Account
3. **Klicken Sie auf** "Add New..." → "Project"
4. **Import Repository:**
   - Suchen Sie nach `konradschrein-star/projektmanagement`
   - Klicken Sie auf "Import"
5. **Configure Project:**
   - Framework Preset: **Other** (oder None)
   - Root Directory: `./` (Standard)
   - Build Command: *leer lassen*
   - Output Directory: *leer lassen*
   - Install Command: *leer lassen*
6. **Klicken Sie auf "Deploy"**

### Nach dem Deployment

Ihre App wird verfügbar sein unter:
- `https://projektmanagement-[unique-id].vercel.app`
- Oder eine Custom Domain, die Sie in den Settings konfigurieren können

### Wichtig: API Key Management

⚠️ **Der Gemini API Key ist NICHT im Code!**

Benutzer müssen ihren eigenen API Key über die Settings (⚙️) in der deployed App eingeben:
1. App öffnen
2. Settings-Icon klicken
3. API Key eingeben
4. Key wird im Browser gespeichert (localhost/Vercel Domain unabhängig)

### Automatische Updates

Jedes Mal wenn Sie zu GitHub pushen, wird Vercel automatisch neu deployen:
```bash
git add .
git commit -m "Update: ..."
git push
```

### Custom Domain (Optional)

1. In Vercel Dashboard → Ihr Projekt
2. Settings → Domains
3. Add Domain: `ups-finalizer.konradschrein.de` (Beispiel)
4. DNS Records wie angezeigt konfigurieren

## Troubleshooting

**Problem: 404 Error bei Vercel**
- Lösung: Vercel muss als "Static Site" behandelt werden
- Root directory sollte `.` sein
- Keine Build Commands nötig

**Problem: API funktioniert nicht**
- API Key in Settings eingeben
- Browser Console prüfen (F12)
- CORS sollte automatisch funktionieren (Client-Side Requests)

## Features nach Deployment

✅ **HTTPS** - Automatisch von Vercel bereitgestellt
✅ **CDN** - Weltweit schnell durch Vercel Edge Network
✅ **Auto-Deploy** - Bei jedem Git Push
✅ **Preview Deployments** - Für jeden Branch/PR
✅ **Analytics** - Vercel Dashboard zeigt Traffic
