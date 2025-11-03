# FormEasy Installation - Schritt für Schritt

## Überblick

FormEasy löst das CORS-Problem, das verhindert hat, dass Buchungen von der Website im Google Sheet ankommen. Diese Anleitung zeigt Ihnen genau, wie Sie FormEasy in Ihr Google Apps Script Projekt integrieren.

## ⏱️ Zeitaufwand: 10-15 Minuten

---

## Schritt 1: FormEasy Library zu Apps Script hinzufügen

### 1.1 Apps Script Editor öffnen
1. Öffnen Sie Ihr Google Sheet mit den Buchungen
2. Klicken Sie auf **Erweiterungen** → **Apps Script**

### 1.2 FormEasy Library hinzufügen
1. Im Apps Script Editor, klicken Sie links auf das **+** Symbol neben "Bibliotheken"
2. Ein Dialog öffnet sich: "Bibliothek hinzufügen"
3. Fügen Sie diese Script-ID ein:
   ```
   1CAyzGbXdwMlko81SbJAjRp7ewxhyGKhDipDK4v8ZvlpYqrMAAzbFNccL
   ```
4. Klicken Sie auf **Suchen**
5. FormEasy erscheint in der Liste
6. Wählen Sie die **neueste Version** (höchste Nummer)
7. Bei "Identifier" sollte **FormEasy** stehen (nicht ändern!)
8. Klicken Sie auf **Hinzufügen**

✅ **Erfolgreich**: Sie sehen jetzt "FormEasy" in der Liste der Bibliotheken links

---

## Schritt 2: Code.gs mit Code-FormEasy.gs ersetzen

### 2.1 Alten Code sichern (optional)
1. Öffnen Sie die Datei **Code.gs** im Apps Script Editor
2. Kopieren Sie den kompletten Inhalt in eine Textdatei auf Ihrem Computer
3. Speichern Sie diese als `Code-BACKUP.gs` (nur zur Sicherheit)

### 2.2 Neuen Code einfügen
1. Öffnen Sie auf Ihrem Computer die Datei:
   ```
   /Users/fatmabulut/Documents/Mercan/Website/google-apps-script/Code-FormEasy.gs
   ```
2. Kopieren Sie den **kompletten Inhalt** der Datei
3. Zurück im Apps Script Editor: Öffnen Sie **Code.gs**
4. **Löschen Sie den kompletten alten Inhalt** (Strg+A → Entf)
5. **Fügen Sie den neuen Code ein** (Strg+V)
6. Klicken Sie auf **Speichern** (Disketten-Symbol oder Strg+S)

✅ **Erfolgreich**: Code.gs enthält jetzt den FormEasy-Code (419 Zeilen)

---

## Schritt 3: Telegram-Zugangsdaten konfigurieren

### 3.1 Telegram-Einstellungen prüfen
1. In **Code.gs** (neu), suchen Sie nach Zeile 5-7:
   ```javascript
   const CONFIG = {
     TELEGRAM_BOT_TOKEN: '8389655531:AAG6E9sE39G_gyMb8yr4jb8c2L_EcqZABeU',
     TELEGRAM_CHAT_ID: '6321955278',
   ```

2. **Diese Werte sollten bereits korrekt sein!** Falls nicht, ersetzen Sie sie mit Ihren Werten aus `TELEGRAM-CREDENTIALS.txt`

✅ **Erfolgreich**: Telegram Bot Token und Chat ID sind eingetragen

---

## Schritt 4: Web App neu deployen

### 4.1 Neue Bereitstellung erstellen
1. Klicken Sie oben rechts auf **Bereitstellen** → **Neue Bereitstellung**
2. **Beschreibung** eingeben: `FormEasy Integration - CORS Fix`
3. Bei "Typ" sollte **Web-App** ausgewählt sein
4. **Wer hat Zugriff**: Wählen Sie **Jeder** (wichtig!)
5. Klicken Sie auf **Bereitstellen**
6. Es öffnet sich ein Dialog mit der **Web-App-URL**
7. **Kopieren Sie diese URL komplett** (Strg+C)
   - Format: `https://script.google.com/macros/s/AKfyc...../exec`

### 4.2 URL speichern
1. Erstellen Sie eine neue Textdatei auf Ihrem Computer: `BOOKING-API-URL.txt`
2. Fügen Sie die kopierte URL ein und speichern Sie die Datei

✅ **Erfolgreich**: Sie haben eine neue Web-App-URL, die FormEasy verwendet

---

## Schritt 5: Website-Code aktualisieren

### 5.1 new-script.js öffnen
1. Öffnen Sie die Datei:
   ```
   /Users/fatmabulut/Documents/Mercan/Website/js/new-script.js
   ```

### 5.2 API-URL aktualisieren
1. Suchen Sie nach Zeile 1-2:
   ```javascript
   const BOOKING_API_URL = 'https://script.google.com/macros/s/AKfycb...';
   const USE_MOCK_API = false;
   ```

2. Ersetzen Sie die URL mit Ihrer **neuen URL aus Schritt 4.2**:
   ```javascript
   const BOOKING_API_URL = 'https://script.google.com/macros/s/IHRE_NEUE_URL_HIER/exec';
   const USE_MOCK_API = false;
   ```

3. **Wichtig**: `USE_MOCK_API` muss `false` sein!

### 5.3 Datei speichern
1. Speichern Sie `new-script.js` (Strg+S)

✅ **Erfolgreich**: Website verwendet jetzt die neue FormEasy-API

---

## Schritt 6: Website lokal testen

### 6.1 Lokalen Server starten
1. Öffnen Sie Terminal
2. Navigieren Sie zum Website-Ordner:
   ```bash
   cd /Users/fatmabulut/Documents/Mercan/Website
   ```
3. Starten Sie den lokalen Server:
   ```bash
   python3 -m http.server 8000
   ```

### 6.2 Test-Buchung durchführen
1. Öffnen Sie Browser: `http://localhost:8000`
2. Scrollen Sie zum Buchungsformular
3. Füllen Sie alle Felder aus:
   - **Vorname**: Test
   - **Nachname**: Buchung
   - **E-Mail**: ihre-email@example.com
   - **Telefon**: +49123456789
   - **Check-in**: Wählen Sie ein Datum in der Zukunft
   - **Check-out**: 2-3 Tage nach Check-in
   - **Zimmer**: 1 Doppelzimmer
4. Klicken Sie auf **Buchung anfragen**

### 6.3 Erfolg prüfen
**Sie sollten jetzt sehen:**

1. ✅ **Erfolgsbestätigung auf der Website**:
   - Grüne Meldung: "Vielen Dank! Ihre Buchungsanfrage wurde erfolgreich übermittelt..."

2. ✅ **Telegram-Benachrichtigung auf Ihrem Smartphone**:
   - Sie erhalten eine Nachricht vom Bot: "Neue Buchungsanfrage!"
   - Mit allen Buchungsdetails

3. ✅ **E-Mail an Gast**:
   - Test-E-Mail kommt an: "Vielen Dank für Ihre Buchungsanfrage..."

4. ✅ **Eintrag im Google Sheet**:
   - Öffnen Sie Ihr Google Sheet
   - Im Tab "Buchungen" erscheint eine neue Zeile
   - Status: "Ausstehend"

### 6.4 Browser-Konsole prüfen (falls Fehler)
1. Drücken Sie **F12** (Developer Tools)
2. Klicken Sie auf **Console**
3. **Kein roter Fehler sollte erscheinen!**
4. Sie sollten sehen:
   ```
   Booking submitted successfully!
   ```

---

## Schritt 7: Auf GitHub Pages testen

### 7.1 Änderungen committen und pushen
1. Öffnen Sie Terminal im Website-Ordner
2. Führen Sie folgende Befehle aus:
   ```bash
   git add js/new-script.js
   git commit -m "Update API URL for FormEasy integration"
   git push origin tuttlingen-section
   ```

### 7.2 Test auf GitHub Pages
1. Öffnen Sie: `https://mercan20.github.io/website-hotel-roessle/`
2. Wiederholen Sie die Test-Buchung aus Schritt 6.2
3. Prüfen Sie wieder:
   - ✅ Erfolgsbestätigung auf Website
   - ✅ Telegram-Benachrichtigung
   - ✅ E-Mail an Gast
   - ✅ Eintrag im Google Sheet

✅ **Erfolgreich**: Das Buchungssystem funktioniert jetzt auch auf GitHub Pages!

---

## Schritt 8: Buchung bestätigen/ablehnen testen

### 8.1 Google Sheet öffnen
1. Öffnen Sie Ihr Google Sheet mit den Buchungen
2. Gehen Sie zum Tab **Buchungen**
3. Sie sehen die Test-Buchung in der ersten Zeile

### 8.2 Buchung bestätigen
1. Klicken Sie auf **Hotel Buchungen** (oben in der Menüleiste)
2. Wählen Sie **Aktuelle Buchung bestätigen**
3. Es erscheint eine Bestätigung: "Buchung wurde bestätigt!"

**Was passiert jetzt:**
- ✅ Status ändert sich von "Ausstehend" zu "Bestätigt"
- ✅ Gast erhält Bestätigungs-E-Mail
- ✅ Sie erhalten Telegram-Nachricht: "Buchung bestätigt"

### 8.3 Buchung ablehnen (optional testen)
1. Erstellen Sie eine zweite Test-Buchung über die Website
2. Klicken Sie auf **Hotel Buchungen** → **Aktuelle Buchung ablehnen**
3. Bestätigen Sie die Aktion

**Was passiert jetzt:**
- ✅ Status ändert sich zu "Abgelehnt"
- ✅ Gast erhält Absage-E-Mail
- ✅ Sie erhalten Telegram-Nachricht: "Buchung abgelehnt"

---

## Troubleshooting

### Problem 1: "FormEasy is not defined"
**Fehler im Apps Script Editor:**
```
ReferenceError: FormEasy is not defined
```

**Lösung:**
- Prüfen Sie, ob FormEasy Library korrekt hinzugefügt wurde (Schritt 1.2)
- Identifier muss genau **FormEasy** heißen (Groß-/Kleinschreibung beachten!)
- Speichern Sie das Projekt und deployen Sie neu

### Problem 2: "Unauthorized" (401 Fehler)
**Fehler in Browser-Konsole:**
```
Failed to load resource: the server responded with a status of 401 (Unauthorized)
```

**Lösung:**
- In Apps Script: Bereitstellen → Bereitstellung verwalten
- Prüfen Sie: "Wer hat Zugriff" muss **Jeder** sein
- Falls nicht: Neue Bereitstellung erstellen mit "Jeder"

### Problem 3: Keine E-Mail kommt an
**Symptom:** Buchung erscheint im Sheet, aber keine E-Mail

**Lösung:**
- Prüfen Sie Spam-Ordner
- Prüfen Sie in Code.gs Zeile 6: `NOTIFICATION_EMAIL` muss Ihre E-Mail enthalten
- Testen Sie mit Gmail-Adresse (funktioniert am zuverlässigsten)

### Problem 4: Keine Telegram-Nachricht
**Symptom:** Buchung erscheint im Sheet, aber keine Telegram-Nachricht

**Lösung:**
1. Prüfen Sie Bot Token und Chat ID in Code.gs (Zeile 5-7)
2. Testen Sie den Bot manuell:
   - Öffnen Sie Apps Script Editor
   - Wählen Sie Funktion: `testTelegramConnection`
   - Klicken Sie auf **Ausführen**
   - Sie sollten sofort eine Telegram-Nachricht erhalten

### Problem 5: CORS-Fehler bleibt bestehen
**Fehler in Browser-Konsole:**
```
Access to fetch at '...' from origin '...' has been blocked by CORS policy
```

**Lösung:**
- Prüfen Sie, ob Code-FormEasy.gs wirklich komplett in Code.gs eingefügt wurde
- Prüfen Sie, ob FormEasy Library hinzugefügt wurde
- Deployen Sie eine **neue Bereitstellung** (nicht "Test-Bereitstellungen verwalten")
- Verwenden Sie die neue URL in new-script.js

---

## Checkliste - Alles erledigt?

Gehen Sie diese Checkliste durch, um sicherzustellen, dass alles funktioniert:

- [ ] FormEasy Library wurde zu Apps Script hinzugefügt
- [ ] Code.gs wurde mit Code-FormEasy.gs ersetzt
- [ ] Telegram Bot Token und Chat ID sind korrekt eingetragen
- [ ] Neue Web-App wurde bereitgestellt (mit "Jeder" Zugriff)
- [ ] Neue API-URL wurde in new-script.js eingetragen
- [ ] USE_MOCK_API ist auf `false` gesetzt
- [ ] Lokaler Test erfolgreich (Buchung kommt in Google Sheet an)
- [ ] GitHub Pages Test erfolgreich
- [ ] Telegram-Benachrichtigung funktioniert
- [ ] E-Mail an Gast funktioniert
- [ ] Buchung bestätigen funktioniert
- [ ] Buchung ablehnen funktioniert
- [ ] Keine CORS-Fehler in Browser-Konsole

---

## Nächste Schritte nach erfolgreicher Installation

### 1. Test-Daten löschen
- Löschen Sie alle Test-Buchungen aus dem Google Sheet
- Beginnen Sie mit sauberer Buchungsliste

### 2. E-Mail-Texte anpassen (optional)
- Öffnen Sie Code.gs
- Suchen Sie nach Funktion `sendGuestEmail()` (Zeile 200+)
- Passen Sie die E-Mail-Texte an Ihren Stil an

### 3. Zimmerpreise prüfen
- In Code.gs, Zeile 10-12:
  ```javascript
  EINZELZIMMER_PREIS: 56,
  DOPPELZIMMER_PREIS: 80,
  FAMILIENZIMMER_PREIS: 109
  ```
- Stimmen diese Preise? Falls nicht, ändern Sie sie

### 4. Verfügbarkeit einrichten
- Öffnen Sie Google Sheet → Tab "Verfügbarkeit"
- Tragen Sie Daten ein, an denen Zimmer **nicht** verfügbar sind
- Format: `2024-12-24`, `2024-12-25` (Weihnachten gesperrt)

### 5. Live gehen!
- Wenn alles funktioniert, können Sie die Website live schalten
- Siehe `DEPLOYMENT.md` für Hosting-Optionen

---

## Support

Falls Sie Probleme haben:

1. **Browser-Konsole prüfen** (F12 → Console)
   - Gibt es rote Fehlermeldungen?
   - Kopieren Sie die Fehlermeldung

2. **Apps Script Logs prüfen**
   - Apps Script Editor → Ausführungen (links im Menü)
   - Sehen Sie Fehler in den letzten Ausführungen?

3. **Schritt-für-Schritt nochmal durchgehen**
   - Haben Sie wirklich alle Schritte befolgt?
   - Besonders wichtig: FormEasy Library hinzugefügt? Neu deployed?

---

**Viel Erfolg! 🎉**

Nach dieser Installation sollte Ihr Buchungssystem endlich funktionieren. Das CORS-Problem ist damit gelöst und Buchungen von der Website kommen direkt in Ihrem Google Sheet an.
