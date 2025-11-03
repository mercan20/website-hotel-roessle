# 📱 Telegram Bot Setup - Detaillierte Anleitung

Schritt-für-Schritt Anleitung zur Einrichtung von Telegram-Benachrichtigungen für Ihr Buchungssystem.

---

## 📋 Was Sie brauchen

- Telegram-Account (kostenlos)
- Smartphone oder Computer mit Telegram
- 10 Minuten Zeit

---

## Schritt 1: Telegram Bot erstellen

### 1.1 BotFather öffnen

1. **Telegram öffnen:**
   - **Smartphone:** Telegram App öffnen
   - **Desktop:** [web.telegram.org](https://web.telegram.org) im Browser
   - **Desktop-App:** Telegram Desktop öffnen

2. **BotFather suchen:**
   - Klicken Sie auf die **Suche** (🔍 oben)
   - Geben Sie ein: `@BotFather`
   - Klicken Sie auf **BotFather** (mit blauem Häkchen ✓)

3. **Chat starten:**
   - Klicken Sie auf **"START"** oder senden Sie `/start`

### 1.2 Bot erstellen

1. **Befehl senden:**
   ```
   /newbot
   ```

2. **Bot-Name eingeben:**
   - BotFather fragt: "Alright, a new bot. How are we going to call it?"
   - Geben Sie ein: `Hotel Rössle Buchungen`
   - (Dieser Name wird Gästen angezeigt)

3. **Bot-Username eingeben:**
   - BotFather fragt: "Now, let's choose a username for your bot."
   - Geben Sie ein: `hotelroessle_buchungen_bot`
   - **Wichtig:** Username muss:
     - Auf `_bot` oder `Bot` enden
     - Einzigartig sein (falls schon vergeben, versuchen Sie: `hotelroessle_buchungen_2024_bot`)
     - Nur Buchstaben, Zahlen und Unterstriche enthalten

### 1.3 Token erhalten

BotFather sendet Ihnen eine Nachricht mit:

```
Done! Congratulations on your new bot. You will find it at t.me/hotelroessle_buchungen_bot.

Use this token to access the HTTP API:
123456789:AABBccDDeeFFggHHiiJJkkLLmmNNooP-qQrR

Keep your token secure and store it safely, it can be used by anyone to control your bot.
```

**Token kopieren:**
- Der Token ist die lange Zeichenfolge nach "Use this token"
- Format: `Zahlen:Buchstaben_und_Zahlen`
- **WICHTIG:** Kopieren Sie den kompletten Token!
- Beispiel: `123456789:AABBccDDeeFFggHHiiJJkkLLmmNNooP-qQrR`

📝 **Notieren Sie den Token sicher!**

---

## Schritt 2: Chat-ID ermitteln

### 2.1 Bot starten

1. **Bot-Link öffnen:**
   - BotFather zeigt einen Link: `t.me/hotelroessle_buchungen_bot`
   - Klicken Sie auf den Link (oder kopieren in Browser)

2. **Chat mit Bot starten:**
   - Klicken Sie auf **"START"**
   - Oder senden Sie eine Nachricht: `Hallo`

### 2.2 Chat-ID abrufen

**Methode A: Browser (einfacher)**

1. **URL erstellen:**
   - Kopieren Sie Ihren Token aus Schritt 1.3
   - Bauen Sie diese URL:
   ```
   https://api.telegram.org/bot[IHR_TOKEN]/getUpdates
   ```
   - Ersetzen Sie `[IHR_TOKEN]` mit Ihrem echten Token (ohne `[` und `]`)
   - Beispiel:
   ```
   https://api.telegram.org/bot123456789:AABBccDD.../getUpdates
   ```

2. **URL im Browser öffnen:**
   - Kopieren Sie die komplette URL
   - Öffnen Sie in neuem Browser-Tab

3. **Chat-ID finden:**
   - Sie sehen JSON-Code ähnlich wie:
   ```json
   {
     "ok": true,
     "result": [
       {
         "update_id": 123456789,
         "message": {
           "message_id": 1,
           "from": {
             "id": 987654321,
             "is_bot": false,
             "first_name": "Ihr Name",
             ...
           },
           "chat": {
             "id": 987654321,
             "first_name": "Ihr Name",
             ...
           }
         }
       }
     ]
   }
   ```

4. **ID kopieren:**
   - Suchen Sie nach: `"chat":{"id":`
   - Die Zahl danach ist Ihre Chat-ID
   - Beispiel: `987654321`
   - **Kopieren Sie diese Zahl!**

📝 **Notieren Sie die Chat-ID!**

**Falls Sie leere `result: []` sehen:**
- Sie haben noch keine Nachricht an den Bot gesendet!
- Gehen Sie zurück zu Schritt 2.1
- Senden Sie "Hallo" an den Bot
- Laden Sie die Browser-Seite neu (F5)

---

**Methode B: Telegram Web (Alternative)**

1. Öffnen Sie [web.telegram.org](https://web.telegram.org)
2. Loggen Sie sich ein
3. Öffnen Sie Ihren Bot-Chat
4. Schauen Sie in die URL-Leiste:
   - Format: `.../#/im?p=u987654321_...`
   - Die Zahl nach `u` ist Ihre Chat-ID: `987654321`

---

## Schritt 3: Daten in Google Sheets eintragen

### 3.1 Google Sheet öffnen

1. Öffnen Sie Ihr Google Sheet: "Hotel Rössle Buchungen"
2. Klicken Sie unten auf das Blatt: **"Einstellungen"**

### 3.2 Token eintragen

1. **Zeile 2 finden:** "Telegram Bot Token"
2. **Spalte B (Wert):** Klicken Sie in die Zelle
3. **Einfügen:** Ihr Token aus Schritt 1.3
   - Beispiel: `123456789:AABBccDDeeFFggHHiiJJkkLLmmNNooP`
   - Komplett einfügen, nichts vergessen!

### 3.3 Chat-ID eintragen

1. **Zeile 3 finden:** "Telegram Chat ID"
2. **Spalte B (Wert):** Klicken Sie in die Zelle
3. **Einfügen:** Ihre Chat-ID aus Schritt 2.2
   - Beispiel: `987654321`
   - Nur die Zahl, ohne Anführungszeichen!

### 3.4 Überprüfen

Die gelbe Warnmeldung (Zeile 8) sollte verschwinden!

---

## Schritt 4: Test-Benachrichtigung senden

### 4.1 Test-Buchung erstellen

1. **In Google Sheet:**
   - Menü: **🏨 Hotel Buchungen** → **🧪 Test-Buchung erstellen**
   - Dialog: "Test-Buchung erstellen?" → Klicken Sie **"Ja"**

2. **Warten:** 5-10 Sekunden

3. **Erfolg prüfen:**
   - Dialog: "✅ Test-Buchung erstellt!" → **"OK"**

### 4.2 Telegram-Nachricht prüfen

Öffnen Sie Telegram - Sie sollten eine Nachricht vom Bot erhalten:

```
🔔 NEUE BUCHUNGSANFRAGE!

👤 Gast: Max Mustermann
📧 Email: test@example.com
📱 Tel: +49 123 456789

📅 Check-In: 23. Okt 2024
📅 Check-Out: 25. Okt 2024
🛏️ 2 Nächte

Zimmer:
• 1x Doppelzimmer

💰 Gesamt: 160,00 €

🆔 Buchungs-ID: BK1234567890

➡️ Zum Bestätigen Google Sheets öffnen
```

**✅ Nachricht erhalten? Perfekt, alles funktioniert!**

**❌ Keine Nachricht erhalten? Siehe Troubleshooting unten**

---

## 🔧 Troubleshooting

### Problem: Keine Telegram-Nachricht bei Test-Buchung

**Checkliste:**

1. **Token richtig kopiert?**
   - Kein Leerzeichen am Anfang/Ende
   - Komplett kopiert (oft 45-50 Zeichen lang)
   - Format: `Zahlen:Buchstaben`
   - Beispiel: `123456789:AABBccDDeeFF...`

2. **Chat-ID richtig kopiert?**
   - Nur Zahlen, keine Buchstaben
   - Kein Leerzeichen
   - Beispiel: `987654321`

3. **Nachricht an Bot gesendet?**
   - Öffnen Sie Bot-Chat in Telegram
   - Senden Sie "Test"
   - Dann erst Chat-ID abrufen

4. **Apps Script Logs prüfen:**
   - Apps Script Editor öffnen
   - Menü: **Executions** (Ausführungen)
   - Letzte Ausführung anklicken
   - Fehler lesen

**Häufige Fehler:**

| Fehler | Ursache | Lösung |
|--------|---------|---------|
| `401 Unauthorized` | Token falsch | Token nochmal kopieren |
| `400 Bad Request: chat not found` | Chat-ID falsch | Chat-ID nochmal ermitteln |
| `400 Bad Request: PEER_ID_INVALID` | Noch keine Nachricht gesendet | "Hallo" an Bot senden |

### Problem: "BotFather antwortet nicht"

- BotFather ist manchmal langsam (30 Sek warten)
- Telegram neu laden
- Anderen Telegram-Client probieren (Desktop statt Mobile)

### Problem: "Username already taken"

- Username ist bereits vergeben
- Versuchen Sie:
  - `hotelroessle_bookings_bot`
  - `roessle_tuttlingen_bot`
  - `hotel_roessle_2024_bot`

---

## 🎯 Zusätzliche Tipps

### Bot anpassen

**Bot-Bild hinzufügen:**
```
/setuserpic
→ Bot auswählen
→ Bild hochladen (Hotel-Logo)
```

**Bot-Beschreibung ändern:**
```
/setdescription
→ Bot auswählen
→ Text eingeben: "Buchungsbenachrichtigungen für Hotel Rössle"
```

**Bot-Befehle definieren:**
```
/setcommands
→ Bot auswählen
→ Eingeben:
help - Hilfe anzeigen
status - Status prüfen
```

### Mehrere Personen benachrichtigen

**Option 1: Telegram-Gruppe erstellen**

1. Neue Gruppe in Telegram erstellen: "Hotel Buchungen"
2. Bot zur Gruppe hinzufügen
3. Nachricht in Gruppe senden: `/my_id @get_id_bot`
4. Gruppen-Chat-ID verwenden (beginnt mit `-`)

**Option 2: Mehrere Bots (nicht empfohlen)**

- Für jede Person eigenen Bot + Chat-ID
- Apps Script anpassen (mehrere Telegram-Calls)

### Bot deaktivieren (temporär)

**In Google Sheet "Einstellungen":**
- Telegram Bot Token Feld leer lassen
- System funktioniert weiter, nur ohne Telegram

---

## ✅ Zusammenfassung

Nach diesem Setup haben Sie:

✅ Telegram Bot erstellt
✅ Token erhalten und gespeichert
✅ Chat-ID ermittelt
✅ Daten in Google Sheet eingetragen
✅ Test-Benachrichtigung erfolgreich erhalten

**Ihre Smartphone-Benachrichtigungen sind jetzt aktiv!** 📱

Bei jeder neuen Buchung erhalten Sie sofort eine Telegram-Nachricht mit allen Details.

---

**Bei weiteren Fragen:** Siehe [DEPLOYMENT.md](DEPLOYMENT.md) oder [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

**Stand:** Oktober 2024
**Erstellt für:** Hotel Rössle Tuttlingen
