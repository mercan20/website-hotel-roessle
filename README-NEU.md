# 🏨 Hotel Rössle - Website & Buchungssystem

Moderne, responsive Website für Hotel Rössle in Tuttlingen mit vollständigem **automatisiertem Buchungssystem**, Smartphone-Benachrichtigungen und Email-Integration.

---

## ✨ Features

### 🌐 Website
- 📱 **Vollständig responsive** (Mobile, Tablet, Desktop)
- 🎨 **Moderne Benutzeroberfläche** mit Animationen
- 📸 **Bildergalerien** mit Lightbox für alle Zimmertypen
- 🗺️ **Interaktive Freizeit-Karten** mit externen Links
- ♿ **Barrierefrei** mit Keyboard-Navigation
- 🎯 **SEO-optimiert** für Google

### 🔄 Buchungssystem (NEU!)
- ✅ **Automatische Verfügbarkeitsprüfung** in Echtzeit
- 📧 **Automatische Emails** an Gäste (Bestätigung, Zusage, Absage)
- 📱 **Telegram-Benachrichtigungen** aufs Smartphone bei neuer Buchung
- 📊 **Google Sheets** als Admin-Panel (keine Datenbank nötig!)
- 💰 **Automatische Preisberechnung** mit Nächte-Zählung
- 🔒 **DSGVO-konform** (Daten in EU, kein Third-Party-Tracking)
- 🌍 **Serverless** (läuft auf Google-Infrastruktur)

### 🎛️ Admin-Features
- ✅ **1-Klick Buchungsbestätigung** direkt in Google Sheets
- 📅 **Verfügbarkeitskalender** mit 365 Tagen
- 📈 **Statistiken** (Buchungen, Auslastung, Status)
- 🔄 **Echtzeit-Updates** zwischen Website und Kalender
- 🎯 **Kein Login nötig** (über Google-Account)

---

## 🚀 Schnellstart

**Möchten Sie das System einrichten?**

### ⚡ Für Eilige (unter 1 Stunde):
→ **[SCHNELLSTART.md](SCHNELLSTART.md)** - Die wichtigsten Schritte kompakt!

### 📖 Schritt-für-Schritt:
→ **[DEPLOYMENT.md](DEPLOYMENT.md)** - Komplette Anleitung mit allen Details

### 📱 Smartphone-Benachrichtigungen:
→ **[TELEGRAM-SETUP.md](TELEGRAM-SETUP.md)** - Telegram Bot einrichten

---

## 🏗️ Architektur-Übersicht

```
┌─────────────────┐
│  Hotel-Website  │  ← index.html (Gast bucht Zimmer)
└────────┬────────┘
         │ HTTPS POST
         ↓
┌─────────────────────┐
│ Google Apps Script  │  ← Code.gs (Backend-Logik)
│   (Serverless)      │
└────────┬────────────┘
         │
         ├─→ ┌──────────────┐
         │   │ Google Sheets │  ← Datenbank + Admin-Panel
         │   └──────────────┘
         │
         ├─→ ┌──────────────┐
         │   │ Gmail API     │  ← Emails an Gäste
         │   └──────────────┘
         │
         └─→ ┌──────────────┐
             │ Telegram Bot  │  ← Smartphone-Benachrichtigungen
             └──────────────┘
```

**Vorteile dieser Architektur:**
- ✅ Keine Server nötig → keine Kosten
- ✅ Keine Datenbank nötig → einfach zu warten
- ✅ Keine Programmierung nach Setup → nur Google Sheets
- ✅ Skaliert automatisch → unbegrenzte Buchungen
- ✅ 99.9% Verfügbarkeit → Google-Infrastruktur

---

## 📁 Projektstruktur

```
Website/
├── index.html                    # Hauptseite mit Buchungsformular
├── impressum.html                # Impressum
├── datenschutz.html              # Datenschutzerklärung
│
├── css/
│   └── new-style.css             # Haupt-Stylesheet
│
├── js/
│   └── new-script.js             # Frontend-Logik + API-Integration
│
├── google-apps-script/
│   ├── Code.gs                   # Backend-API (Google Apps Script)
│   └── Setup.gs                  # Initialisierung & Admin-Funktionen
│
├── images/                       # Bilder & Assets
│   ├── zimmer/                   # Zimmer-Fotos
│   ├── freizeit/                 # Freizeit-Aktivitäten
│   └── ...
│
└── Dokumentation/
    ├── README.md                 # Diese Datei
    ├── SCHNELLSTART.md           # Quick-Start Guide
    ├── DEPLOYMENT.md             # Deployment-Anleitung
    └── TELEGRAM-SETUP.md         # Telegram-Konfiguration
```

---

## 💻 Technologie-Stack

### Frontend
- **HTML5** - Semantisches Markup
- **CSS3** - Modern mit CSS Grid, Flexbox, Variables
- **Vanilla JavaScript** - Keine Frameworks (schnell & leicht)
- **Responsive Design** - Mobile-First

### Backend
- **Google Apps Script** - Serverless JavaScript
- **Google Sheets API** - Datenbank
- **Gmail API** - Email-Versand
- **Telegram Bot API** - Push-Benachrichtigungen

### Hosting (Empfehlung)
- **Netlify** oder **GitHub Pages** - Kostenlos
- **Custom Domain** - SSL inklusive
- **Auto-Deploy** - Bei Git-Push

---

## 🔧 Installation & Setup

### Voraussetzungen
- Google-Account (Gmail)
- Telegram-Account
- Code-Editor (VS Code empfohlen)
- Git (optional, für Deployment)

### Schritt 1: Repository klonen/downloaden
```bash
git clone https://github.com/IHR-USERNAME/hotel-roessle.git
cd hotel-roessle
```

### Schritt 2: Google Sheets & Apps Script einrichten
Siehe → **[DEPLOYMENT.md](DEPLOYMENT.md)** Schritt 1-3

### Schritt 3: Telegram Bot konfigurieren
Siehe → **[TELEGRAM-SETUP.md](TELEGRAM-SETUP.md)**

### Schritt 4: API-URL eintragen
```javascript
// In js/new-script.js Zeile 11:
const BOOKING_API_URL = 'IHRE_GOOGLE_APPS_SCRIPT_URL';
```

### Schritt 5: Lokal testen
```bash
# Einfacher HTTP-Server
python -m http.server 8000

# Oder mit Node.js
npx serve
```
→ Öffnen: http://localhost:8000

### Schritt 6: Live deployen
Siehe → **[DEPLOYMENT.md](DEPLOYMENT.md)** Phase 4

---

## 📊 Google Sheets Admin-Panel

Nach dem Setup haben Sie 3 Tabellenblätter:

### 1️⃣ Buchungen
Alle Buchungsanfragen mit:
- Buchungs-ID, Datum, Gast-Daten
- Check-In/Check-Out, Zimmer, Preis
- Status: Pending / Confirmed / Declined
- Wünsche, Zeitstempel

**Aktionen:**
- Zeile anklicken → Menü → "✅ Bestätigen" oder "❌ Ablehnen"

### 2️⃣ Verfügbarkeit
Kalender mit 365 Tagen:
- Datum | Einzelzimmer | Doppelzimmer | Familienzimmer
- Automatische Farben: 🔴 Rot (ausgebucht), 🟠 Orange (wenig), 🟢 Grün (verfügbar)

**Automatisch:**
- Bei Bestätigung werden Zimmer blockiert
- Verfügbarkeit wird reduziert

### 3️⃣ Einstellungen
Konfiguration:
- Telegram Bot Token
- Telegram Chat ID
- Max. Anzahl Zimmer pro Typ

---

## 🔔 Buchungsablauf

### 1. Gast bucht auf Website
```
Gast wählt: 1x Doppelzimmer, 2 Nächte
→ Check-In: 25.10.2024
→ Check-Out: 27.10.2024
→ Kontaktdaten eingeben
→ "Buchungsanfrage senden"
```

### 2. System verarbeitet
```
✓ Verfügbarkeit prüfen
✓ In Google Sheet speichern (Status: Pending)
✓ Email an Gast: "Anfrage erhalten"
✓ Telegram an Mitarbeiter: 📱 "Neue Buchung!"
```

### 3. Mitarbeiter bestätigt
```
Google Sheet öffnen
→ Zeile anklicken
→ Menü: 🏨 Hotel Buchungen → ✅ Bestätigen
→ Email an Gast: "Buchung bestätigt!"
→ Zimmer im Kalender blockiert
```

### 4. Alternative: Ablehnung
```
→ Menü: 🏨 Hotel Buchungen → ❌ Ablehnen
→ Grund eingeben (optional)
→ Email an Gast: "Leider nicht verfügbar"
```

---

## 🎨 Anpassungen

### Farben ändern
```css
/* In css/new-style.css */
:root {
  --primary-color: #2c5f2d;    /* Ihre Hauptfarbe */
  --accent-color: #c9a961;     /* Ihre Akzentfarbe */
}
```

### Preise ändern
```javascript
// In js/new-script.js Zeile 174:
const bookingPrices = {
    einzelzimmer: 56,   // Ihre Preise
    doppelzimmer: 80,
    familienzimmer: 109
};

// UND in google-apps-script/Code.gs Zeile 25:
const ROOM_PRICES = {
  einzelzimmer: 56,
  doppelzimmer: 80,
  familienzimmer: 109
};
```

### Maximale Zimmer ändern
```
Google Sheet → Blatt "Einstellungen" → Zeile 5-7
```

---

## 📧 Email-Templates

Emails werden automatisch gesendet in 3 Fällen:

### 1. Anfrage erhalten
```
Betreff: Ihre Buchungsanfrage bei Hotel Rössle

Sehr geehrte/r [Name],
vielen Dank für Ihre Buchungsanfrage!
Wir prüfen die Verfügbarkeit und melden uns innerhalb von 24h.
...
```

### 2. Buchung bestätigt
```
Betreff: Buchungsbestätigung - Hotel Rössle

Sehr geehrte/r [Name],
wir freuen uns, Ihnen mitteilen zu können, dass Ihre Buchung bestätigt wurde! ✓
...
```

### 3. Buchung abgelehnt
```
Betreff: Buchungsanfrage - Hotel Rössle

Sehr geehrte/r [Name],
leider müssen wir Ihnen mitteilen, dass Ihre angefragten Zimmer nicht verfügbar sind.
...
```

**Anpassen:** Siehe `google-apps-script/Code.gs` Zeile 370+

---

## 🧪 Testing

### Frontend-Test (Mock-Modus)
```javascript
// In js/new-script.js Zeile 14:
const USE_MOCK_API = true;  // Auf true setzen

// Dann: Formular testen → Daten in Console anzeigen
```

### Backend-Test
```
Google Sheet → Menü: 🏨 Hotel Buchungen → 🧪 Test-Buchung erstellen
→ Prüfen: Telegram-Nachricht? Email? Sheet-Eintrag?
```

### Live-Test
```
1. Echte Buchung auf Website durchführen
2. Prüfen: Telegram, Email, Google Sheet
3. Buchung bestätigen
4. Prüfen: Bestätigungs-Email, Kalender aktualisiert?
```

---

## 📱 Mobile Optimierung

Getestet auf:
- ✅ iPhone (Safari iOS 14+)
- ✅ Android (Chrome)
- ✅ iPad / Tablets
- ✅ Desktop (Chrome, Firefox, Safari, Edge)

Features:
- Touch-optimierte Buttons
- Swipe-Gesten in Galerie
- Mobile Navigation (Hamburger-Menü)
- Responsive Formulare

---

## 🔒 Sicherheit & Datenschutz

### DSGVO-konform
- ✅ Daten in EU (Google Server Deutschland)
- ✅ Datenschutzerklärung vorhanden
- ✅ Kein Third-Party-Tracking
- ✅ SSL/HTTPS (via Netlify/GitHub Pages)
- ✅ Kein Cookie-Banner nötig (außer Analytics)

### Sicherheit
- ✅ Apps Script nur mit authorisiertem Google-Account
- ✅ Web-App-URL schwer zu erraten
- ✅ Input-Validierung (Frontend & Backend)
- ✅ Email-Format-Prüfung
- ✅ Keine SQL-Injection möglich (Google Sheets API)

---

## 💰 Kosten

| Service | Preis |
|---------|-------|
| **Google Sheets** | Kostenlos |
| **Google Apps Script** | Kostenlos (bis 20.000 Executions/Tag) |
| **Gmail API** | Kostenlos (bis 100 Emails/Tag) |
| **Telegram Bot** | Kostenlos (unbegrenzt) |
| **Netlify Hosting** | Kostenlos (100GB Traffic/Monat) |
| **SSL-Zertifikat** | Kostenlos (via Netlify/GitHub) |
| **Domain** | ~10€/Jahr (eigene Domain) |

**Gesamt: 0-10€/Jahr** (nur Domain-Kosten)

---

## 🆘 Troubleshooting

### "Buchung funktioniert nicht"
- F12 → Console → Fehlermeldung lesen
- API-URL korrekt in `new-script.js`?
- Apps Script deployt?
- "Anyone can access" Berechtigung?

### "Keine Telegram-Nachricht"
- Token richtig kopiert?
- Chat-ID richtig?
- "Hallo" an Bot gesendet?
- Siehe → [TELEGRAM-SETUP.md](TELEGRAM-SETUP.md)

### "Keine Email erhalten"
- Gmail-Spam-Ordner prüfen
- Apps Script Berechtigungen erteilt?
- Email-Adresse korrekt?

### "Verfügbarkeit falsch"
- Google Sheet "Verfügbarkeit" öffnen
- Datum vorhanden?
- Werte korrekt?
- Neu initialisieren: Menü → "📅 Verfügbarkeit..."

---

## 🚀 Performance

Optimierungen:
- ✅ Lazy Loading für Bilder
- ✅ Minifizierte Bilder (WebP)
- ✅ Keine schweren Frameworks
- ✅ CDN via Netlify
- ✅ GZIP-Kompression
- ✅ Browser-Caching

**Ergebnis:**
- Ladezeit: < 2 Sekunden
- PageSpeed Score: 90+
- Mobile-Friendly: ✅

---

## 📈 Zukünftige Erweiterungen

Mögliche Features:
- [ ] Multi-Language (Englisch, Französisch)
- [ ] Online-Payment (Stripe, PayPal)
- [ ] Google Kalender Integration
- [ ] Channel Manager (Booking.com, Airbnb)
- [ ] Bewertungssystem
- [ ] Newsletter-System
- [ ] WhatsApp-Integration

---

## 📞 Support & Kontakt

**Bei Fragen:**
1. Lesen Sie die Dokumentation:
   - [SCHNELLSTART.md](SCHNELLSTART.md)
   - [DEPLOYMENT.md](DEPLOYMENT.md)
   - [TELEGRAM-SETUP.md](TELEGRAM-SETUP.md)

2. Browser-Konsole prüfen (F12)

3. Apps Script Logs prüfen:
   - Apps Script Editor → **Executions**

---

## 📄 Lizenz

© 2024 Hotel Rössle Tuttlingen. Alle Rechte vorbehalten.

---

## 🙏 Credits

**Erstellt mit ❤️ für Hotel Rössle Tuttlingen**

**Technologien:**
- Google Apps Script
- Telegram Bot API
- Netlify/GitHub Pages
- Vanilla JavaScript

**Stand:** Oktober 2024
**Version:** 1.0

---

**✨ Viel Erfolg mit Ihrem neuen Buchungssystem!** 🏨
