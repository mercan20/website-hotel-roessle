# 🚀 Deployment-Anleitung - Hotel Rössle Buchungssystem

Schritt-für-Schritt Anleitung zur Einrichtung des vollständigen Buchungssystems mit Google Apps Script, Telegram-Benachrichtigungen und Website-Deployment.

---

## 📋 Voraussetzungen

- ✅ Google-Konto (Gmail)
- ✅ Telegram-Account (für Smartphone-Benachrichtigungen)
- ✅ Domain (z.B. hotelroessle.eu)
- ✅ GitHub-Account (optional, für Netlify)

**Zeitaufwand:** 2-3 Stunden
**Kosten:** 0€ (alles kostenlos)

---

## Phase 1: Google Sheets & Apps Script Setup (30 Min)

### Schritt 1.1: Google Sheet erstellen

1. Öffnen Sie [Google Sheets](https://sheets.google.com)
2. Klicken Sie auf **"Blank"** (Leeres Dokument)
3. Benennen Sie das Dokument: **"Hotel Rössle Buchungen"**
4. Notieren Sie sich die **Sheet-URL** (benötigen Sie später)

### Schritt 1.2: Apps Script Editor öffnen

1. Im Google Sheet: Klicken Sie auf **Extensions** → **Apps Script**
2. Ein neuer Tab öffnet sich mit dem Script-Editor
3. Löschen Sie den Standard-Code (`function myFunction() { ... }`)

### Schritt 1.3: Code einfügen

1. **Code.gs erstellen:**
   - Kopieren Sie den kompletten Inhalt aus `google-apps-script/Code.gs`
   - Fügen Sie ihn im Script-Editor ein

2. **Setup.gs hinzufügen:**
   - Klicken Sie auf **+** (Datei hinzufügen) → **Script**
   - Nennen Sie es: `Setup`
   - Kopieren Sie den kompletten Inhalt aus `google-apps-script/Setup.gs`
   - Fügen Sie ihn ein

3. **Speichern:**
   - Klicken Sie auf das **Disketten-Symbol** (💾) oder `Strg+S`
   - Geben Sie dem Projekt einen Namen: **"Hotel Buchungssystem"**

### Schritt 1.4: Sheets initialisieren

1. Gehen Sie zurück zum **Google Sheet** (Tab wechseln)
2. Laden Sie die Seite neu (`F5`)
3. Ein neues Menü erscheint: **"🏨 Hotel Buchungen"**
4. Klicken Sie auf: **🏨 Hotel Buchungen** → **📋 Komplett-Setup durchführen**

5. **Berechtigungen erteilen:**
   - Ein Popup erscheint: "Autorisierung erforderlich"
   - Klicken Sie auf **"Überprüfen"**
   - Wählen Sie Ihr Google-Konto
   - Klicken Sie auf **"Erweitert"** (unten links)
   - Klicken Sie auf **"Zu Hotel Buchungssystem wechseln (unsicher)"**
   - Klicken Sie auf **"Zulassen"**

6. **Bestätigen:**
   - Dialog: "Setup starten?" → Klicken Sie **"Ja"**
   - Warten Sie 10-20 Sekunden
   - Dialog: "✅ Setup erfolgreich!" → Klicken Sie **"OK"**

### Schritt 1.5: Sheets überprüfen

Sie sollten jetzt **3 Tabellenblätter** sehen (unten):
- ✅ **Buchungen** (leer, nur Header)
- ✅ **Verfügbarkeit** (365 Tage mit voller Verfügbarkeit)
- ✅ **Einstellungen** (gelbe Warnung: Telegram-Daten fehlen)

---

## Phase 2: Telegram Bot Setup (10 Min)

### Schritt 2.1: Telegram Bot erstellen

1. Öffnen Sie **Telegram** (App oder [Web](https://web.telegram.org))
2. Suchen Sie nach: **@BotFather**
3. Senden Sie: `/start`
4. Senden Sie: `/newbot`
5. Antworten Sie auf die Fragen:
   - **Name:** `Hotel Rössle Buchungen` (oder beliebiger Name)
   - **Username:** `hotelroessle_buchungen_bot` (muss auf `_bot` enden und einzigartig sein)

6. **Token erhalten:**
   - BotFather sendet Ihnen eine Nachricht mit Ihrem Token
   - Format: `123456789:AABBccDDeeFFggHHiiJJkkLLmmNNooP`
   - **Kopieren Sie diesen Token** (wichtig!)

### Schritt 2.2: Chat-ID ermitteln

1. **Bot starten:**
   - Klicken Sie im BotFather auf den Link zu Ihrem Bot
   - Oder suchen Sie nach Ihrem Bot-Username
   - Klicken Sie auf **"Start"**
   - Senden Sie eine beliebige Nachricht, z.B. "Hallo"

2. **Chat-ID abrufen:**
   - Öffnen Sie im Browser: `https://api.telegram.org/bot[IHR_TOKEN]/getUpdates`
   - Ersetzen Sie `[IHR_TOKEN]` mit Ihrem Token (aus Schritt 2.1.6)
   - Beispiel: `https://api.telegram.org/bot123456789:AABBccDD.../getUpdates`

3. **Chat-ID finden:**
   - Sie sehen JSON-Code
   - Suchen Sie nach: `"chat":{"id":`
   - Die Zahl dahinter ist Ihre Chat-ID (z.B. `987654321`)
   - **Kopieren Sie diese Chat-ID**

### Schritt 2.3: Telegram-Daten in Google Sheets eintragen

1. Gehen Sie zu Ihrem **Google Sheet**
2. Klicken Sie auf das Blatt **"Einstellungen"**
3. Tragen Sie ein:
   - **Zeile 2, Spalte B (Telegram Bot Token):** Ihr Token aus 2.1.6
   - **Zeile 3, Spalte B (Telegram Chat ID):** Ihre Chat-ID aus 2.2.3

4. Die gelbe Warnung sollte verschwinden

### Schritt 2.4: Telegram-Test

1. In Google Sheet: **🏨 Hotel Buchungen** → **🧪 Test-Buchung erstellen**
2. Klicken Sie **"Ja"**
3. **Prüfen:**
   - ✅ Eintrag im Blatt "Buchungen"?
   - ✅ Telegram-Nachricht auf Ihrem Smartphone erhalten?
   - ✅ Email an `test@example.com` gesendet? (prüfen Sie Gmail "Gesendet")

Falls keine Telegram-Nachricht kommt:
- Token und Chat-ID nochmal überprüfen
- Sicherstellen, dass Sie eine Nachricht an den Bot gesendet haben

---

## Phase 3: Web App Deployment (15 Min)

### Schritt 3.1: Apps Script deployen

1. Gehen Sie zum **Apps Script Editor** (Extensions → Apps Script)
2. Klicken Sie oben rechts auf **"Deploy"** (Bereitstellen) → **"New deployment"** (Neue Bereitstellung)

3. **Deployment konfigurieren:**
   - Klicken Sie auf das **Zahnrad-Symbol** ⚙️ (Type)
   - Wählen Sie: **"Web app"**

4. **Einstellungen:**
   - **Description:** `Buchungssystem API v1.0`
   - **Execute as:** `Me ([ihre-email@gmail.com])`
   - **Who has access:** `Anyone` ⚠️ (WICHTIG!)

5. **Deployen:**
   - Klicken Sie auf **"Deploy"**
   - Bestätigen Sie nochmal die Berechtigungen (falls gefragt)

6. **Web-App URL kopieren:**
   - Ein Dialog erscheint mit der **Web app URL**
   - Format: `https://script.google.com/macros/s/ABC...XYZ/exec`
   - **Kopieren Sie diese URL** (sehr wichtig!)
   - Klicken Sie auf **"Done"**

### Schritt 3.2: URL in Website einfügen

1. Öffnen Sie die Datei: `js/new-script.js`
2. Finden Sie Zeile 11:
   ```javascript
   const BOOKING_API_URL = 'IHRE_GOOGLE_APPS_SCRIPT_URL_HIER';
   ```
3. Ersetzen Sie `IHRE_GOOGLE_APPS_SCRIPT_URL_HIER` mit Ihrer URL aus 3.1.6:
   ```javascript
   const BOOKING_API_URL = 'https://script.google.com/macros/s/ABC...XYZ/exec';
   ```
4. **Speichern!**

### Schritt 3.3: Lokaler Test

1. Öffnen Sie `index.html` in Ihrem Browser (Doppelklick)
2. Scrollen Sie zu **"Jetzt Buchen"**
3. Testen Sie eine Buchung:
   - Wählen Sie 1x Doppelzimmer
   - Wählen Sie Check-In/Check-Out Datum
   - Füllen Sie Ihre echte Email aus (für Test)
   - Klicken Sie **"Buchungsanfrage senden"**

4. **Prüfen:**
   - ✅ Grüne Erfolgsmeldung auf der Website?
   - ✅ Eintrag in Google Sheet "Buchungen"?
   - ✅ Telegram-Benachrichtigung erhalten?
   - ✅ Email an Ihre Test-Email erhalten?

Falls Fehler auftreten:
- Browser-Konsole öffnen (`F12` → Console)
- Fehler ablesen
- Häufigste Ursache: URL falsch kopiert

---

## Phase 4: Website Live Deployment (45 Min)

### Option A: Netlify (Empfohlen - sehr einfach)

#### Schritt 4A.1: GitHub Repository erstellen

1. Gehen Sie zu [GitHub](https://github.com) und loggen Sie sich ein
2. Klicken Sie auf **"New repository"** (Neues Repository)
3. **Repository-Name:** `hotel-roessle-website`
4. **Visibility:** `Private` (empfohlen)
5. Klicken Sie auf **"Create repository"**

#### Schritt 4A.2: Code zu GitHub pushen

```bash
# Terminal öffnen im Website-Ordner
cd /Users/fatmabulut/Documents/Mercan/Website

# Git initialisieren (falls noch nicht geschehen)
git init

# Alle Dateien hinzufügen
git add .

# Commit erstellen
git commit -m "Initial commit - Buchungssystem integriert"

# Remote hinzufügen (ersetzen Sie mit Ihrer GitHub-URL)
git remote add origin https://github.com/IHR-USERNAME/hotel-roessle-website.git

# Pushen
git push -u origin main
```

#### Schritt 4A.3: Netlify Setup

1. Gehen Sie zu [Netlify](https://www.netlify.com)
2. Klicken Sie auf **"Sign up"** (falls noch kein Account)
   - Am besten: "Sign up with GitHub"
3. Nach Login: Klicken Sie auf **"Add new site"** → **"Import an existing project"**

4. **GitHub verbinden:**
   - Klicken Sie auf **"GitHub"**
   - Autorisieren Sie Netlify
   - Wählen Sie Ihr Repository: `hotel-roessle-website`

5. **Deploy-Einstellungen:**
   - **Branch to deploy:** `main`
   - **Build command:** (leer lassen)
   - **Publish directory:** `/` (Root)
   - Klicken Sie auf **"Deploy site"**

6. **Warten:**
   - Deployment dauert 1-2 Minuten
   - Status: "Site is live" → ✅ Fertig!

7. **URL erhalten:**
   - Netlify gibt Ihnen eine URL: `https://random-name-123456.netlify.app`
   - Testen Sie die URL im Browser

#### Schritt 4A.4: Custom Domain verbinden

1. In Netlify: **Site settings** → **Domain management**
2. Klicken Sie auf **"Add custom domain"**
3. Geben Sie ein: `hotelroessle.eu` (oder `www.hotelroessle.eu`)
4. Klicken Sie auf **"Verify"**

5. **DNS konfigurieren:**
   - Netlify zeigt Ihnen DNS-Einstellungen
   - Gehen Sie zu Ihrem Domain-Provider (Strato, IONOS, etc.)
   - Fügen Sie die DNS-Records hinzu:
     ```
     A Record:     @    →  75.2.60.5
     CNAME Record: www  →  random-name-123456.netlify.app
     ```

6. **SSL warten:**
   - DNS-Änderungen dauern 1-24 Stunden
   - SSL-Zertifikat wird automatisch erstellt
   - Netlify zeigt "HTTPS" mit grünem Schloss → ✅ Fertig!

---

### Option B: GitHub Pages (Alternative)

#### Schritt 4B.1: Repository erstellen

1. Wie bei 4A.1, aber:
2. **Repository-Name:** `IHR-USERNAME.github.io` (für Haupt-Domain)
   - Oder beliebiger Name für Subdomain

#### Schritt 4B.2: GitHub Pages aktivieren

1. Im Repository: **Settings** → **Pages**
2. **Source:** `Deploy from a branch`
3. **Branch:** `main` → Ordner: `/ (root)`
4. Klicken Sie auf **"Save"**

5. **URL:**
   - Nach 2-3 Minuten verfügbar unter:
   - `https://IHR-USERNAME.github.io`
   - Oder: `https://IHR-USERNAME.github.io/repository-name`

#### Schritt 4B.3: Custom Domain (Optional)

1. In Repository: **Settings** → **Pages** → **Custom domain**
2. Geben Sie ein: `hotelroessle.eu`
3. Klicken Sie auf **"Save"**

4. **DNS konfigurieren:**
   ```
   A Record: @   →  185.199.108.153
   A Record: @   →  185.199.109.153
   A Record: @   →  185.199.110.153
   A Record: @   →  185.199.111.153
   CNAME:    www →  IHR-USERNAME.github.io
   ```

---

## Phase 5: Finale Tests & Go-Live (15 Min)

### Schritt 5.1: Kompletter Test-Durchlauf

1. **Öffnen Sie Ihre Live-Website:** `https://hotelroessle.eu`
2. **Test-Buchung durchführen:**
   - Wählen Sie echte Daten (z.B. in 2 Wochen)
   - Verwenden Sie Ihre echte Email
   - Füllen Sie alle Felder aus
   - Senden Sie ab

3. **Prüfen Sie alles:**
   - ✅ Grüne Erfolgsmeldung auf Website?
   - ✅ Eintrag in Google Sheet "Buchungen"?
   - ✅ Telegram-Nachricht auf Smartphone?
   - ✅ Email an Gast-Email erhalten?

### Schritt 5.2: Buchung bestätigen

1. **In Google Sheet:**
   - Öffnen Sie Blatt "Buchungen"
   - Klicken Sie auf die Zeile mit Ihrer Test-Buchung
   - Menü: **🏨 Hotel Buchungen** → **✅ Buchung bestätigen**
   - Klicken Sie **"Ja"**

2. **Prüfen:**
   - ✅ Status in Sheet → "Confirmed"?
   - ✅ Verfügbarkeit reduziert in "Verfügbarkeit"-Blatt?
   - ✅ Bestätigungs-Email an Gast erhalten?

### Schritt 5.3: Verfügbarkeit anpassen

1. **Maximale Zimmer ändern:**
   - Blatt "Einstellungen"
   - Zeile 5-7: Passen Sie die Anzahl an:
     - Einzelzimmer (aktuell: 5)
     - Doppelzimmer (aktuell: 10)
     - Familienzimmer (aktuell: 3)

2. **Verfügbarkeit neu initialisieren:**
   - Menü: **🏨 Hotel Buchungen** → **📅 Verfügbarkeit für 365 Tage initialisieren**
   - Dies überschreibt alte Daten!

### Schritt 5.4: Rechtliches finalisieren

1. **USt-IdNr eintragen:**
   - Öffnen Sie `impressum.html`
   - Suchen Sie nach `<!-- USt-IdNr: [HIER EINTRAGEN] -->`
   - Tragen Sie Ihre USt-IdNr ein

2. **AGB erstellen (optional):**
   - Erstellen Sie AGB als PDF
   - Speichern Sie in `images/agb.pdf`
   - Verlinken Sie in `impressum.html`

---

## 🎉 Fertig!

Ihr Buchungssystem ist jetzt live und voll funktionsfähig!

### Was Sie jetzt haben:

✅ Live-Website mit automatischem Buchungssystem
✅ Smartphone-Benachrichtigungen via Telegram
✅ Automatische Emails an Gäste
✅ Google Sheets als Admin-Panel
✅ Verfügbarkeitsverwaltung
✅ SSL/HTTPS (sicher)

### Tägliche Nutzung:

1. **Neue Buchung kommt rein:**
   - 📱 Telegram-Benachrichtigung auf Smartphone
   - 📧 Email an Gast: "Anfrage erhalten"

2. **Sie prüfen in Google Sheets:**
   - Zimmer verfügbar? → Klick auf "✅ Bestätigen"
   - Nicht verfügbar? → Klick auf "❌ Ablehnen"

3. **System sendet automatisch:**
   - Bestätigung an Gast
   - Blockiert Zimmer im Kalender

### Support & Updates:

- **Apps Script aktualisieren:**
  - Neue Version in Script-Editor einfügen
  - Speichern
  - Neues Deployment erstellen (Deploy → "Manage deployments" → "Edit" → "Version: New version")

- **Website aktualisieren:**
  - Code ändern
  - Git commit & push
  - Netlify deployed automatisch (1-2 Min)

---

**Bei Fragen:** Siehe [README.md](README.md) oder [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

**Stand:** Oktober 2024
**Erstellt für:** Hotel Rössle Tuttlingen
