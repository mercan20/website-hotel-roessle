# Telegram Benachrichtigungen für mehrere Mitarbeiter

## Übersicht

Aktuell erhält **nur eine Person** (Sie) die Telegram-Benachrichtigungen. Hier sind 3 Methoden, um mehrere Mitarbeiter einzubinden.

---

## ✅ Methode 1: Telegram-Gruppe (EINFACHSTE LÖSUNG)

### Vorteile:
- ✅ Einfachste Einrichtung
- ✅ Alle Mitarbeiter sehen alle Buchungen
- ✅ Mitarbeiter können in der Gruppe kommunizieren
- ✅ Neue Mitarbeiter: Einfach zur Gruppe hinzufügen
- ✅ Keine Code-Änderung nötig

### Nachteile:
- ⚠️ Alle sehen alles (keine Privatsphäre)
- ⚠️ Benachrichtigungen können nicht individuell angepasst werden

### Schritt-für-Schritt Anleitung:

#### 1. Telegram-Gruppe erstellen

1. Öffnen Sie Telegram App
2. Klicken Sie auf das **Stift-Symbol** (neue Nachricht)
3. Wählen Sie **"Neue Gruppe"**
4. Geben Sie einen Namen ein: **"Hotel Rössle Buchungen"**
5. Fügen Sie Mitarbeiter hinzu (können auch später hinzugefügt werden)
6. Klicken Sie auf **Fertig**

#### 2. Bot zur Gruppe hinzufügen

1. Öffnen Sie die neu erstellte Gruppe
2. Klicken Sie oben auf den **Gruppennamen**
3. Scrollen Sie zu **"Teilnehmer"**
4. Klicken Sie auf **"Teilnehmer hinzufügen"**
5. Suchen Sie Ihren Bot (er heißt wie der Name, den Sie beim BotFather angegeben haben)
6. Bot zur Gruppe hinzufügen

**WICHTIG:** Der Bot braucht Admin-Rechte!
1. Klicken Sie auf den Bot in der Teilnehmerliste
2. Wählen Sie **"Zum Admin ernennen"**

#### 3. Gruppen-Chat-ID herausfinden

**Variante A: Mit Apps Script (empfohlen)**

1. Öffnen Sie Ihr Google Sheet
2. Klicken Sie auf **Erweiterungen** → **Apps Script**
3. Erstellen Sie eine neue Funktion (fügen Sie am Ende von Code.gs ein):

```javascript
function getGroupChatId() {
  const settings = getSettings();
  const token = settings.telegramToken;
  const url = `https://api.telegram.org/bot${token}/getUpdates`;

  const response = UrlFetchApp.fetch(url);
  const data = JSON.parse(response.getContentText());

  Logger.log('=== TELEGRAM UPDATES ===');
  Logger.log(JSON.stringify(data, null, 2));

  // Extrahiere Chat IDs
  if (data.result && data.result.length > 0) {
    data.result.forEach((update, index) => {
      if (update.message && update.message.chat) {
        Logger.log(`\nChat #${index + 1}:`);
        Logger.log(`  Type: ${update.message.chat.type}`);
        Logger.log(`  Title: ${update.message.chat.title || 'N/A'}`);
        Logger.log(`  Chat ID: ${update.message.chat.id}`);
      }
    });
  }
}
```

4. **WICHTIG:** Schreiben Sie **zuerst** eine Testnachricht in die Gruppe (z.B. "Test")
5. Wählen Sie die Funktion **getGroupChatId** aus der Dropdown-Liste
6. Klicken Sie auf **Ausführen**
7. Öffnen Sie die **Logs** (Execution log)
8. Suchen Sie nach der **Chat ID** der Gruppe
   - Format: `-1001234567890` (beginnt mit **Minus-Zeichen** und `-100`)
   - Type: `supergroup` oder `group`

**Variante B: Mit Online-Tool**

1. Schreiben Sie eine Nachricht in die Gruppe (z.B. "Test")
2. Öffnen Sie im Browser:
   ```
   https://api.telegram.org/bot8389655531:AAG6E9sE39G_gyMb8yr4jb8c2L_EcqZABeU/getUpdates
   ```
3. Suchen Sie nach `"chat":{"id":-1001234567890`
4. Die Zahl nach `"id":` ist Ihre Gruppen-Chat-ID (**mit Minus-Zeichen!**)

#### 4. Chat-ID im Google Sheet ändern

1. Öffnen Sie Ihr Google Sheet
2. Gehen Sie zum Tab **"Einstellungen"**
3. Zeile 3, Spalte B: **Telegram Chat ID**
4. Ersetzen Sie die alte Chat ID mit der **Gruppen-Chat-ID**
   - Beispiel: `-1001234567890`
   - **WICHTIG:** Das Minus-Zeichen muss dabei sein!

#### 5. Testen

1. Senden Sie eine Testbuchung über die Website
2. **Alle Mitarbeiter in der Gruppe** sollten die Benachrichtigung erhalten!

---

## 🔧 Methode 2: Mehrere Chat-IDs (für Fortgeschrittene)

Jeder Mitarbeiter erhält individuelle Benachrichtigungen auf sein eigenes Telegram.

### Vorteile:
- ✅ Jeder Mitarbeiter hat eigene Benachrichtigungen
- ✅ Privatsphäre: Andere sehen nicht, wer die Nachricht gelesen hat
- ✅ Individuelle Benachrichtigungs-Einstellungen möglich

### Nachteile:
- ⚠️ Aufwändiger einzurichten
- ⚠️ Code-Änderung erforderlich
- ⚠️ Keine Gruppen-Kommunikation

### Schritt-für-Schritt Anleitung:

#### 1. Chat-IDs aller Mitarbeiter sammeln

**Jeder Mitarbeiter muss:**
1. Telegram öffnen
2. Den Bot suchen (Name aus BotFather)
3. Auf **Start** klicken
4. Eine Nachricht senden (z.B. "Hallo")

**Sie als Admin:**
1. Öffnen Sie Apps Script Editor
2. Nutzen Sie die `getGroupChatId()` Funktion (siehe oben)
3. Notieren Sie alle Chat-IDs

**Beispiel:**
- Mitarbeiter 1 (Sie): `6321955278`
- Mitarbeiter 2 (Anna): `1234567890`
- Mitarbeiter 3 (Peter): `9876543210`

#### 2. Google Sheet erweitern

1. Öffnen Sie Ihr Google Sheet → Tab **"Einstellungen"**
2. Fügen Sie neue Zeilen hinzu:

| Einstellung | Wert |
|-------------|------|
| Telegram Bot Token | 8389655531:AAG6E9sE39G_gyMb8yr4jb8c2L_EcqZABeU |
| Telegram Chat ID 1 | 6321955278 |
| Telegram Chat ID 2 | 1234567890 |
| Telegram Chat ID 3 | 9876543210 |

#### 3. Code-FormEasy.gs anpassen

**3.1 getSettings() Funktion erweitern:**

Suchen Sie die Funktion `getSettings()` (Zeile ~484) und ersetzen Sie sie:

```javascript
function getSettings() {
  const sheet = getSheet(CONFIG.SETTINGS_SHEET);
  const data = sheet.getDataRange().getValues();

  // Sammle alle Telegram Chat IDs (ab Zeile 2)
  const chatIds = [];
  for (let i = 2; i < data.length; i++) {
    const settingName = data[i][0];
    const settingValue = data[i][1];

    if (settingName && settingName.startsWith('Telegram Chat ID') && settingValue) {
      chatIds.push(settingValue.toString());
    }
  }

  return {
    telegramToken: data[1][1] || '',
    telegramChatIds: chatIds, // GEÄNDERT: Array statt einzelne ID
    emailRecipient: data[3][1] || 'info@hotelroessle.eu',
    maxEinzelzimmer: data[4][1] || 5,
    maxDoppelzimmer: data[5][1] || 10,
    maxFamilienzimmer: data[6][1] || 3
  };
}
```

**3.2 sendTelegramNotification() Funktion erweitern:**

Suchen Sie die Funktion `sendTelegramNotification()` (Zeile ~330) und ersetzen Sie diese Zeilen:

```javascript
function sendTelegramNotification(bookingId, data) {
  const settings = getSettings();

  if (!settings.telegramToken || !settings.telegramChatIds || settings.telegramChatIds.length === 0) {
    Logger.log('Telegram nicht konfiguriert');
    return;
  }

  const checkin = new Date(data.checkin);
  const checkout = new Date(data.checkout);
  const nights = Math.ceil((checkout - checkin) / (1000 * 60 * 60 * 24));

  const einzelzimmerCount = data.einzelzimmer || 0;
  const doppelzimmerCount = data.doppelzimmer || 0;
  const familienzimmerCount = data.familienzimmer || 0;

  const pricePerNight =
    (einzelzimmerCount * ROOM_PRICES.einzelzimmer) +
    (doppelzimmerCount * ROOM_PRICES.doppelzimmer) +
    (familienzimmerCount * ROOM_PRICES.familienzimmer);

  const totalPrice = pricePerNight * nights;

  let roomsList = '';
  if (einzelzimmerCount > 0) roomsList += `• ${einzelzimmerCount}x Einzelzimmer\n`;
  if (doppelzimmerCount > 0) roomsList += `• ${doppelzimmerCount}x Doppelzimmer\n`;
  if (familienzimmerCount > 0) roomsList += `• ${familienzimmerCount}x Familienzimmer\n`;

  const message = `🔔 *NEUE BUCHUNGSANFRAGE!*

👤 *Gast:* ${data.vorname} ${data.nachname}
📧 *Email:* ${data.email}
📱 *Tel:* ${data.telefon}

📅 *Check-In:* ${formatDate(checkin)}
📅 *Check-Out:* ${formatDate(checkout)}
🛏️ *${nights} ${nights === 1 ? 'Nacht' : 'Nächte'}*

*Zimmer:*
${roomsList}
💰 *Gesamt:* ${totalPrice.toFixed(2)} €

${data.wuensche ? `📝 *Wünsche:* ${data.wuensche}\n\n` : ''}🆔 *Buchungs-ID:* ${bookingId}

➡️ [Zum Bestätigen Google Sheets öffnen](${getSpreadsheetUrl()})`;

  const url = `https://api.telegram.org/bot${settings.telegramToken}/sendMessage`;

  // GEÄNDERT: Sende an ALLE Chat-IDs
  settings.telegramChatIds.forEach(chatId => {
    const payload = {
      chat_id: chatId,
      text: message,
      parse_mode: 'Markdown'
    };

    try {
      UrlFetchApp.fetch(url, {
        method: 'post',
        contentType: 'application/json',
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
      });
      Logger.log(`Telegram gesendet an Chat ID: ${chatId}`);
    } catch (e) {
      Logger.log(`Fehler beim Senden an Chat ID ${chatId}: ${e}`);
    }
  });
}
```

#### 4. Testen

1. Speichern Sie die Code-Änderungen
2. Senden Sie eine Testbuchung
3. **Alle Mitarbeiter** sollten die Benachrichtigung erhalten!

---

## 📢 Methode 3: Telegram Channel (für viele Mitarbeiter)

Für Teams mit **vielen Mitarbeitern** (>10 Personen).

### Vorteile:
- ✅ Unbegrenzt viele Mitarbeiter
- ✅ One-Way-Kommunikation (nur Bot sendet)
- ✅ Sauberer als Gruppe

### Nachteile:
- ⚠️ Mitarbeiter können nicht antworten
- ⚠️ Komplizierter einzurichten

### Anleitung:

1. **Telegram Channel erstellen:**
   - Telegram öffnen → Neuer Channel
   - Name: "Hotel Rössle Buchungen"
   - Typ: **Privat** (nur Mitarbeiter mit Link können beitreten)

2. **Bot zum Channel hinzufügen:**
   - Channel-Einstellungen → Administratoren
   - Bot hinzufügen und als Admin ernennen

3. **Channel-ID herausfinden:**
   - Gleiche Methode wie bei Gruppen (siehe Methode 1, Schritt 3)
   - Format: `-100...` (beginnt mit Minus)

4. **Im Google Sheet eintragen:**
   - Tab "Einstellungen" → Telegram Chat ID
   - Channel-ID eintragen (mit Minus!)

5. **Mitarbeiter einladen:**
   - Channel-Einstellungen → Einladungslink erstellen
   - Link an Mitarbeiter senden

---

## 🎯 Welche Methode soll ich wählen?

| Anzahl Mitarbeiter | Empfohlene Methode | Aufwand | Features |
|--------------------|-------------------|---------|----------|
| **2-5 Personen** | **Methode 1: Gruppe** | ⭐ Einfach | Kommunikation möglich |
| **3-10 Personen** | Methode 2: Mehrere IDs | ⭐⭐ Mittel | Individuelle Benachrichtigungen |
| **>10 Personen** | Methode 3: Channel | ⭐⭐⭐ Komplex | One-Way-Benachrichtigungen |

**Meine Empfehlung für Hotel Rössle:**
→ **Methode 1 (Telegram-Gruppe)** - Einfach, funktioniert sofort, keine Code-Änderung

---

## ❓ Häufige Fragen

### "Kann ich nachträglich Mitarbeiter hinzufügen?"
**Ja!**
- **Methode 1 (Gruppe):** Einfach zur Gruppe einladen
- **Methode 2 (Mehrere IDs):** Chat-ID im Google Sheet hinzufügen
- **Methode 3 (Channel):** Einladungslink senden

### "Können Mitarbeiter auch antworten/bestätigen?"
**Nein, nicht direkt.**
- Buchungen müssen im **Google Sheet bestätigt** werden
- In einer **Gruppe** können Mitarbeiter aber miteinander kommunizieren (z.B. "Ich kümmere mich darum")

### "Was passiert, wenn jemand die Gruppe verlässt?"
**Bei Methode 1 (Gruppe):**
- Person erhält keine Benachrichtigungen mehr
- Alle anderen erhalten weiterhin Benachrichtigungen

**Bei Methode 2 (Mehrere IDs):**
- Chat-ID aus Google Sheet löschen
- Person erhält keine Benachrichtigungen mehr

### "Sehen alte Mitarbeiter neue Buchungen?"
**Bei Methode 1 (Gruppe):**
- Wenn Sie jemanden aus der Gruppe entfernen: **Nein**
- Alte Nachrichten bleiben sichtbar, neue nicht

**Bei Methode 2 (Mehrere IDs):**
- Wenn Sie Chat-ID aus Sheet löschen: **Nein**

### "Kann ich verschiedene Benachrichtigungen für verschiedene Mitarbeiter?"
**Ja, aber nur mit Methode 2 (Mehrere IDs) + Code-Anpassung.**

Beispiel: Nur Chefin erhält Buchungen >500€:
```javascript
settings.telegramChatIds.forEach(chatId => {
  // Spezielle Regeln
  if (chatId === '6321955278' || totalPrice > 500) {
    // Sende Nachricht
  }
});
```

---

## 🆘 Troubleshooting

### Problem: "Gruppe erhält keine Nachrichten"
**Lösung:**
1. Prüfen Sie: Ist der Bot wirklich in der Gruppe?
2. Prüfen Sie: Hat der Bot Admin-Rechte?
3. Prüfen Sie: Ist die Chat-ID korrekt (mit Minus-Zeichen)?
4. Testen Sie: Senden Sie manuell eine Nachricht mit `getGroupChatId()`

### Problem: "Chat-ID wird nicht gefunden"
**Lösung:**
1. Schreiben Sie zuerst eine Nachricht in die Gruppe
2. Warten Sie 1-2 Minuten
3. Führen Sie `getGroupChatId()` erneut aus
4. Prüfen Sie: Beginnt die Chat-ID mit `-100`?

### Problem: "Nur ich erhalte Nachrichten, andere nicht"
**Lösung (Methode 1):**
- Prüfen Sie: Sind andere Mitarbeiter in der Gruppe?
- Prüfen Sie: Haben sie Benachrichtigungen aktiviert?

**Lösung (Methode 2):**
- Prüfen Sie: Stehen alle Chat-IDs im Google Sheet?
- Prüfen Sie: Hat jeder Mitarbeiter den Bot gestartet?

---

**Erstellt:** Januar 2025
**Letzte Aktualisierung:** Januar 2025
