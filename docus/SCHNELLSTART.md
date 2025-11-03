# ⚡ Schnellstart-Anleitung

Die wichtigsten Schritte um Ihr Buchungssystem in **unter 1 Stunde** live zu bringen!

---

## 🎯 Ziel

Am Ende haben Sie:
- ✅ Funktionierende Website mit Buchungssystem
- ✅ Benachrichtigungen auf Ihrem Smartphone
- ✅ Automatische Emails an Gäste

**Zeit:** 45-60 Minuten
**Kosten:** 0€

---

## 📝 Checkliste Vorbereitung

Stellen Sie sicher, dass Sie haben:

- [ ] Google-Account (Gmail)
- [ ] Telegram auf Smartphone installiert
- [ ] Diese Dateien bereit:
  - `google-apps-script/Code.gs`
  - `google-apps-script/Setup.gs`
  - `js/new-script.js`

---

## 🚀 Los geht's!

### ⏱️ Schritt 1: Google Sheet Setup (10 Min)

```
1. https://sheets.google.com → Neues Dokument
2. Benennen: "Hotel Rössle Buchungen"
3. Extensions → Apps Script
4. Code.gs und Setup.gs einfügen (aus google-apps-script/ Ordner)
5. Speichern (💾)
6. Zurück zu Sheet → Neu laden (F5)
7. Menü: 🏨 Hotel Buchungen → 📋 Komplett-Setup durchführen
8. Berechtigungen erlauben → Ja klicken
```

**✅ Fertig wenn:** Sie 3 Sheets sehen (Buchungen, Verfügbarkeit, Einstellungen)

---

### ⏱️ Schritt 2: Telegram Bot (5 Min)

```
1. Telegram öffnen → Suche: @BotFather
2. Senden: /newbot
3. Name: Hotel Rössle Buchungen
4. Username: hotelroessle_buchungen_bot
5. TOKEN KOPIEREN! (z.B. 123456:ABC...)

6. Bot öffnen → START klicken → "Hallo" senden

7. Browser: https://api.telegram.org/bot[IHR_TOKEN]/getUpdates
   (TOKEN ersetzen!)

8. Chat-ID kopieren (die Zahl bei "chat":{"id":...)
```

**Eintragen in Google Sheet "Einstellungen":**
- Zeile 2 = Token
- Zeile 3 = Chat-ID

**✅ Test:** Menü → 🧪 Test-Buchung → Telegram-Nachricht erhalten?

---

### ⏱️ Schritt 3: Apps Script Web-App (5 Min)

```
1. Apps Script Editor öffnen
2. Oben rechts: Deploy → New deployment
3. Type (⚙️): Web app
4. Execute as: Me
5. Who has access: Anyone ⚠️
6. Deploy klicken
7. URL KOPIEREN! (https://script.google.com/macros/s/.../exec)
```

**Eintragen in js/new-script.js:**
```javascript
// Zeile 11 finden:
const BOOKING_API_URL = 'IHRE_URL_HIER_EINFÜGEN';
```

**✅ Fertig wenn:** URL ist in new-script.js eingefügt

---

### ⏱️ Schritt 4: Website-Test (5 Min)

```
1. index.html im Browser öffnen (Doppelklick)
2. Zum Buchungsformular scrollen
3. Test-Buchung:
   - 1x Doppelzimmer
   - Datum auswählen
   - Ihre echte Email
   - Absenden
```

**✅ Prüfen:**
- [ ] Grüne Meldung auf Website?
- [ ] Telegram-Nachricht erhalten?
- [ ] Email erhalten?
- [ ] Eintrag in Google Sheet?

**❌ Fehler?** Browser-Konsole öffnen (F12) → Fehlermeldung lesen

---

### ⏱️ Schritt 5: Live-Deployment (30 Min)

**Option A: Netlify (empfohlen)**

```
1. GitHub-Account erstellen (falls nötig)

2. Terminal öffnen:
   cd /Users/fatmabulut/Documents/Mercan/Website
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/USERNAME/hotel-roessle.git
   git push -u origin main

3. https://netlify.com → Login
4. New site → Import from Git → GitHub
5. Repository auswählen
6. Deploy!

7. Domain verbinden:
   - Site settings → Domain management
   - Add custom domain: hotelroessle.eu
   - DNS bei Provider einstellen (A + CNAME Records)
```

**✅ Fertig wenn:** Website unter hotelroessle.eu erreichbar

---

## 🎉 Fertig!

**Test auf Live-Website:**
1. https://hotelroessle.eu öffnen
2. Buchung testen
3. Buchung in Google Sheet bestätigen:
   - Zeile anklicken
   - Menü: 🏨 Hotel Buchungen → ✅ Bestätigen
   - Email-Bestätigung prüfen

---

## 🆘 Probleme?

### "Telegram-Nachricht kommt nicht"
→ Token/Chat-ID nochmal prüfen
→ "Hallo" an Bot senden
→ getUpdates nochmal aufrufen

### "Website zeigt Fehler"
→ F12 drücken → Console → Fehler lesen
→ API-URL korrekt in new-script.js?
→ Apps Script deployt?

### "Deployment schlägt fehl"
→ Git richtig initialisiert?
→ Alle Dateien committed?
→ GitHub-URL korrekt?

---

## 📚 Detaillierte Anleitungen

Für ausführliche Schritt-für-Schritt Guides:

- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Komplette Deployment-Anleitung mit Screenshots
- **[TELEGRAM-SETUP.md](TELEGRAM-SETUP.md)** - Detaillierte Telegram-Konfiguration
- **[README.md](README.md)** - Gesamtübersicht & Architektur

---

## ⚙️ Tägliche Nutzung

**Wenn Buchung eingeht:**

1. 📱 **Telegram-Benachrichtigung** auf Smartphone
2. 📧 **Email** an Gast: "Anfrage erhalten"
3. 💻 **Google Sheet** öffnen
4. ✅ **Bestätigen** → Automatische Email + Zimmer blockiert
   oder
   ❌ **Ablehnen** → Automatische Absage-Email

**Das war's!** 🎉

---

**Stand:** Oktober 2024
**Support:** Bei Fragen siehe README.md
