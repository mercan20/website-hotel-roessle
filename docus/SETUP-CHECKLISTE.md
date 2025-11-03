# ✅ Setup-Checkliste - Hotel Rössle Buchungssystem

Gehen Sie diese Checkliste **Punkt für Punkt** durch. Nach jedem ✅ Häkchen sind Sie einen Schritt weiter!

---

## Phase 1: Google Sheet erstellen

### [ ] 1.1 Google Sheet öffnen
- Öffnen Sie: https://sheets.google.com
- Klicken Sie auf **"Blank"** (Leeres Dokument)
- Benennen Sie es: **"Hotel Rössle Buchungen"**

### [ ] 1.2 Apps Script öffnen
- Im Google Sheet: Menü **Extensions** → **Apps Script**
- Ein neuer Tab öffnet sich
- Löschen Sie den Standard-Code (`function myFunction() {...}`)

### [ ] 1.3 Code.gs einfügen
- Öffnen Sie die Datei: `google-apps-script/Code.gs`
- Kopieren Sie **ALLES** (Strg+A, Strg+C)
- Fügen Sie es im Apps Script Editor ein (Strg+V)

### [ ] 1.4 Setup.gs hinzufügen
- Im Apps Script Editor: Klicken Sie auf **+** (Datei hinzufügen)
- Wählen Sie **Script**
- Namen: `Setup`
- Öffnen Sie die Datei: `google-apps-script/Setup.gs`
- Kopieren Sie **ALLES**
- Fügen Sie es ein

### [ ] 1.5 Speichern
- Klicken Sie auf **💾 Speichern** (oder Strg+S)
- Projekt-Name: **"Hotel Buchungssystem"**

---

## Phase 2: Sheets initialisieren

### [ ] 2.1 Zurück zu Google Sheet
- Wechseln Sie zurück zum Google Sheet Tab
- Laden Sie die Seite neu (**F5**)

### [ ] 2.2 Menü erscheint
- Nach 5-10 Sekunden sollte ein neues Menü erscheinen: **"🏨 Hotel Buchungen"**
- Falls nicht: Nochmal F5, oder 30 Sekunden warten

### [ ] 2.3 Setup ausführen
- Klicken Sie: **🏨 Hotel Buchungen** → **📋 Komplett-Setup durchführen**
- Dialog: "Setup starten?" → Klicken Sie **Ja**

### [ ] 2.4 Berechtigungen erteilen
Ein Popup erscheint: "Autorisierung erforderlich"

**WICHTIG - Folgen Sie GENAU diesen Schritten:**

1. Klicken Sie **"Überprüfen"**
2. Wählen Sie Ihr Google-Konto
3. Google zeigt Warnung: "Diese App wurde nicht von Google bestätigt"
4. Klicken Sie auf **"Erweitert"** (unten links!)
5. Klicken Sie auf **"Zu Hotel Buchungssystem wechseln (unsicher)"**
6. Klicken Sie **"Zulassen"**

**Warum "unsicher"?**
- Das ist Ihr eigenes Script - völlig sicher!
- Google zeigt dies bei allen selbst-erstellten Scripts
- Es gibt kein Risiko

### [ ] 2.5 Setup erfolgreich
- Warten Sie 10-20 Sekunden
- Dialog erscheint: "✅ Setup erfolgreich!"
- Klicken Sie **OK**

### [ ] 2.6 Sheets überprüfen
Unten im Google Sheet sollten Sie jetzt **3 Tabellenblätter** sehen:
- **Buchungen** (leer, nur Header mit 17 Spalten)
- **Verfügbarkeit** (365 Zeilen mit Daten)
- **Einstellungen** (gelbe Warnung: Telegram-Daten fehlen noch)

---

## Phase 3: Telegram Bot einrichten

### [ ] 3.1 Telegram Bot erstellen
1. Telegram öffnen (App oder web.telegram.org)
2. Suchen: **@BotFather**
3. Senden: `/newbot`
4. Name eingeben: `Hotel Rössle Buchungen`
5. Username eingeben: `hotelroessle_buchungen_bot`
6. **Token kopieren!** (Format: `123456789:ABC...`)

### [ ] 3.2 Bot starten
1. Klicken Sie auf den Link zum Bot (von BotFather)
2. Klicken Sie **START**
3. Senden Sie: `Hallo`

### [ ] 3.3 Chat-ID ermitteln
1. Browser öffnen
2. URL eingeben (ersetzen Sie [TOKEN] mit Ihrem Token):
   ```
   https://api.telegram.org/bot[TOKEN]/getUpdates
   ```
3. Suchen Sie nach: `"chat":{"id":`
4. **Chat-ID kopieren!** (Die Zahl, z.B. `987654321`)

### [ ] 3.4 In Google Sheet eintragen
1. Google Sheet öffnen
2. Blatt **"Einstellungen"** anklicken
3. **Zeile 2, Spalte B:** Token einfügen
4. **Zeile 3, Spalte B:** Chat-ID einfügen

### [ ] 3.5 Test-Benachrichtigung
1. Menü: **🏨 Hotel Buchungen** → **🧪 Test-Buchung erstellen**
2. Klicken Sie **Ja**
3. **Prüfen:** Telegram-Nachricht erhalten? ✅

---

## Phase 4: Apps Script Web-App deployen

### [ ] 4.1 Deployment starten
1. Apps Script Editor öffnen
2. Oben rechts: **Deploy** → **New deployment**

### [ ] 4.2 Type auswählen
1. Klicken Sie auf **⚙️** (Zahnrad-Symbol) neben "Select type"
2. Wählen Sie: **Web app**

### [ ] 4.3 Einstellungen
Tragen Sie ein:
- **Description:** `Buchungssystem API v1.0`
- **Execute as:** `Me (ihre-email@gmail.com)`
- **Who has access:** `Anyone` ⚠️ **WICHTIG!**

### [ ] 4.4 Deploy
1. Klicken Sie **Deploy**
2. Bestätigen Sie nochmal Berechtigungen (falls gefragt)

### [ ] 4.5 URL kopieren
1. Ein Dialog erscheint mit der **Web app URL**
2. Format: `https://script.google.com/macros/s/ABC...XYZ/exec`
3. **Kopieren Sie diese URL!**
4. Klicken Sie **Done**

### [ ] 4.6 URL testen
1. Fügen Sie die URL in Browser ein
2. Drücken Sie Enter
3. **Erwartetes Ergebnis:** `{"ok":true,"result":[...]}` oder Fehler-JSON
4. **Nicht erwartet:** "Authorization required" (→ "Anyone" nicht ausgewählt!)

---

## Phase 5: Website konfigurieren

### [ ] 5.1 new-script.js öffnen
- Öffnen Sie: `js/new-script.js`
- Suchen Sie Zeile 10

### [ ] 5.2 URL eintragen
Ersetzen Sie:
```javascript
const BOOKING_API_URL = 'IHRE_GOOGLE_APPS_SCRIPT_URL_HIER';
```

Mit Ihrer URL aus Schritt 4.5:
```javascript
const BOOKING_API_URL = 'https://script.google.com/macros/s/ABC...XYZ/exec';
```

### [ ] 5.3 Speichern
- Speichern Sie die Datei (Strg+S)

---

## Phase 6: Test!

### [ ] 6.1 Website öffnen
**Option A:** Doppelklick auf `index.html`
**Option B:** `python3 -m http.server 8000` → http://localhost:8000

### [ ] 6.2 Zum Formular scrollen
- Scrollen Sie zu "Jetzt Buchen"
- Oder klicken Sie im Menü auf "Buchen"

### [ ] 6.3 Test-Buchung
Füllen Sie aus:
- ✅ Zimmer wählen: 1x Doppelzimmer (+ klicken)
- ✅ Datum wählen: Check-In/Check-Out (Kalender anklicken)
- ✅ Vorname: Ihr Vorname
- ✅ Nachname: Ihr Nachname
- ✅ **E-Mail: Ihre echte Email!** (für Test)
- ✅ Telefon: Ihre Nummer
- ✅ Datenschutz: Häkchen setzen
- ✅ Klicken Sie **"Buchungsanfrage senden"**

### [ ] 6.4 Erfolg prüfen

**Auf Website:**
- [ ] Grüne Erfolgsmeldung erscheint?
- [ ] Text: "Buchungsanfrage erfolgreich übermittelt!"

**Auf Smartphone:**
- [ ] Telegram-Nachricht erhalten?
- [ ] Mit allen Buchungsdetails?

**Im Postfach:**
- [ ] Email erhalten?
- [ ] Betreff: "Ihre Buchungsanfrage bei Hotel Rössle"

**In Google Sheet:**
- [ ] Blatt "Buchungen" öffnen
- [ ] Neue Zeile mit Ihrer Buchung?
- [ ] Status: "Pending"

### [ ] 6.5 Falls FEHLER:
Öffnen Sie Browser-Konsole (**F12** → Tab "Console")
- Was steht für eine Fehlermeldung dort?
- Schicken Sie mir die Meldung!

---

## Phase 7: Buchung bestätigen

### [ ] 7.1 Google Sheet öffnen
- Blatt "Buchungen"
- Klicken Sie auf die Zeile mit Ihrer Test-Buchung

### [ ] 7.2 Bestätigen
- Menü: **🏨 Hotel Buchungen** → **✅ Buchung bestätigen (aktuelle Zeile)**
- Dialog: "Buchung bestätigen?" → **Ja**

### [ ] 7.3 Prüfen
**In Sheet:**
- [ ] Status ändert sich zu "Confirmed"?
- [ ] "Bestätigt von" zeigt Ihre Email?

**Blatt "Verfügbarkeit":**
- [ ] Öffnen Sie Blatt "Verfügbarkeit"
- [ ] Suchen Sie Ihre gebuchten Daten
- [ ] Sind die Zimmer reduziert? (z.B. Doppelzimmer: 10 → 9)

**Im Postfach:**
- [ ] Neue Email erhalten?
- [ ] Betreff: "Buchungsbestätigung - Hotel Rössle"
- [ ] Text: "Ihre Buchung wurde bestätigt!"

---

## 🎉 Fertig!

**Wenn alle Häkchen gesetzt sind, funktioniert Ihr System!**

### Was Sie jetzt haben:
✅ Funktionierende Website mit Buchungsformular
✅ Automatisches Backend (Google Apps Script)
✅ Datenbank (Google Sheets)
✅ Smartphone-Benachrichtigungen (Telegram)
✅ Automatische Emails an Gäste
✅ Admin-Panel (Google Sheets)
✅ Verfügbarkeitskalender (365 Tage)

### Nächster Schritt:
→ **Live deployen:** Siehe [DEPLOYMENT.md](DEPLOYMENT.md) Phase 4

---

## 🆘 Probleme?

### "Menü erscheint nicht"
→ F5 drücken, 30 Sekunden warten
→ Apps Script richtig gespeichert?

### "Berechtigungen kann ich nicht erteilen"
→ "Erweitert" anklicken (unten links im Google-Dialog!)
→ Dann "Zu ... wechseln (unsicher)" anklicken

### "Test-Buchung sendet keine Telegram-Nachricht"
→ Token richtig kopiert? (komplett, kein Leerzeichen)
→ Chat-ID richtig? (nur Zahlen)
→ "Hallo" an Bot gesendet?

### "Website zeigt Fehler"
→ F12 drücken → Console
→ URL richtig in new-script.js?
→ Apps Script deployt mit "Anyone"?

### "Buchung kommt nicht in Google Sheet"
→ Apps Script Logs prüfen: Editor → "Executions"
→ Fehler dort lesen

---

**Stand:** 16. Oktober 2024
**Bei Fragen:** Schicken Sie mir die Fehlermeldung aus der Browser-Console (F12)!
