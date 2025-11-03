# Spam-Schutz für das Buchungssystem

## Übersicht

Das Buchungssystem hat **4 Schutzebenen** gegen Spam und Missbrauch:

---

## 🛡️ Schutzebene 1: Herkunftsprüfung (Origin Check)

**Was es macht:**
Nur Buchungen von Ihrer offiziellen Website werden akzeptiert.

**Wie es funktioniert:**
- Jede Buchungsanfrage enthält die URL der Website, von der sie kommt
- Das System prüft, ob diese URL in der Whitelist steht
- Anfragen von anderen Websites werden automatisch blockiert

**Erlaubte Websites:**
```javascript
'https://mercan20.github.io'  // GitHub Pages
'http://localhost:8000'       // Lokales Testen
'http://127.0.0.1:8000'       // Lokales Testen (alternative IP)
```

**Zusätzliche Websites erlauben:**
Falls Sie später eine eigene Domain haben (z.B. hotelroessle.eu), fügen Sie diese in [Code-FormEasy.gs:23-26](google-apps-script/Code-FormEasy.gs#L23-L26) hinzu:

```javascript
ALLOWED_ORIGINS: [
  'https://mercan20.github.io',
  'https://www.hotelroessle.eu',  // ← Ihre Domain hier einfügen
  'http://localhost:8000',
  'http://127.0.0.1:8000'
]
```

**Schutz gegen:**
- Jemand kopiert die API-URL und sendet Spam von einer anderen Website

---

## 🛡️ Schutzebene 2: Rate Limiting

**Was es macht:**
Verhindert, dass dieselbe Person zu viele Buchungen auf einmal sendet.

**Limits:**
- **Maximal 3 Buchungen pro Email-Adresse pro Tag**
- **Maximal 5 Buchungen pro IP-Adresse pro Stunde** (planned, aktuell nur Email)

**Wie es funktioniert:**
1. Wenn jemand eine Buchung sendet, wird die Email-Adresse gespeichert
2. Das System zählt, wie viele Buchungen diese Email in den letzten 24 Stunden gesendet hat
3. Bei mehr als 3 Buchungen: Blockiert mit Fehlermeldung

**Fehlermeldung für Nutzer:**
> "Sie haben bereits mehrere Buchungsanfragen gesendet. Bitte warten Sie auf unsere Antwort."

**Limits anpassen:**
In [Code-FormEasy.gs:17](google-apps-script/Code-FormEasy.gs#L17):
```javascript
MAX_BOOKINGS_PER_EMAIL_PER_DAY: 3,  // ← Hier Zahl ändern
```

**Schutz gegen:**
- Jemand sendet 100 Fake-Buchungen mit derselben Email
- Bot-Angriffe mit derselben Email-Adresse

---

## 🛡️ Schutzebene 3: Daten-Validierung

**Was es macht:**
Prüft, ob alle Pflichtfelder ausgefüllt sind.

**Geprüfte Felder:**
- ✅ Vorname (muss ausgefüllt sein)
- ✅ Nachname (muss ausgefüllt sein)
- ✅ Email (muss ausgefüllt sein)
- ✅ Telefon (muss ausgefüllt sein)
- ✅ Check-in Datum (muss ausgefüllt sein)
- ✅ Check-out Datum (muss ausgefüllt sein)
- ✅ Mindestens 1 Zimmer ausgewählt

**Schutz gegen:**
- Unvollständige Buchungen
- Fehlende Kontaktdaten

---

## 🛡️ Schutzebene 4: Plausibilitätsprüfung

**Was es macht:**
Prüft, ob die Buchungsdaten sinnvoll sind.

### 4.1 Datumsvalidierung

**Geprüft:**
- ✅ Check-in darf **nicht in der Vergangenheit** liegen
- ✅ Check-out muss **nach** Check-in sein
- ✅ Mindestens **1 Nacht** erforderlich
- ✅ Maximal **30 Nächte** buchbar
- ✅ Check-in darf nicht weiter als **1 Jahr** in der Zukunft liegen

**Beispiel:** Jemand versucht Check-in: 01.01.2023, Check-out: 01.01.2024
→ **Blockiert**: "Maximal 30 Nächte buchbar"

### 4.2 Zimmervalidierung

**Geprüft:**
- ✅ Maximal **18 Zimmer gesamt** auf einmal buchbar (5 EZ + 10 DZ + 3 FZ)

**Beispiel:** Jemand versucht 50 Doppelzimmer zu buchen
→ **Blockiert**: "Maximal 18 Zimmer auf einmal buchbar"

**Warum wichtig:**
Hotel Rössle hat nur:
- 5 Einzelzimmer
- 10 Doppelzimmer
- 3 Familienzimmer

### 4.3 Email-Validierung

**Geprüft:**
- ✅ Email muss gültiges Format haben (z.B. `name@example.com`)
- ✅ Muss `@` und `.` enthalten

**Beispiel:** Jemand gibt ein: `asdfgh`
→ **Blockiert**: "Ungültiges E-Mail-Format"

### 4.4 Namensvalidierung

**Geprüft:**
- ✅ Name muss mit einem Buchstaben beginnen (keine Zahlen/Sonderzeichen am Anfang)
- ✅ Umlaute erlaubt (ä, ö, ü, ß)

**Beispiel:** Jemand gibt ein Vorname: `123Spam`
→ **Blockiert**: "Ungültiger Name"

**Erlaubt:**
- ✅ "Müller"
- ✅ "O'Brien"
- ✅ "Jean-Claude"

**Blockiert:**
- ❌ "123Test"
- ❌ "@Spammer"

**Limits anpassen:**
In [Code-FormEasy.gs:19-21](google-apps-script/Code-FormEasy.gs#L19-L21):
```javascript
MIN_NIGHTS: 1,           // ← Mindestanzahl Nächte
MAX_NIGHTS: 30,          // ← Maximalanzahl Nächte
MAX_ROOMS_TOTAL: 18,     // ← Maximalanzahl Zimmer gesamt
```

**Schutz gegen:**
- Unsinnige Buchungen (z.B. 100 Nächte)
- Fake-Daten (z.B. ungültige Email)
- Bot-Angriffe mit zufälligen Daten

---

## 🚫 Zusätzlicher Schutz: Email-Blacklist (manuell)

**Was es macht:**
Sie können einzelne Email-Adressen manuell blockieren.

### Email blockieren:

1. Öffnen Sie Ihr Google Sheet
2. Klicken Sie oben auf **Erweiterungen** → **Apps Script**
3. Wählen Sie in der Dropdown-Liste die Funktion: `blockEmail`
4. Klicken Sie auf **Ausführen**
5. Geben Sie die Email-Adresse ein, die blockiert werden soll

**Oder direkt im Code:**
In [Code-FormEasy.gs:642-645](google-apps-script/Code-FormEasy.gs#L642-L645):
```javascript
const blockedEmails = [
  'spammer@example.com',  // ← Email-Adressen hier eintragen
  'fake@test.com'
];
```

**Blockierte Emails werden gespeichert in:**
- Google Sheet → Neuer Tab: "Blockierte Emails"
- Mit Zeitstempel und Grund

---

## 📊 Spam-Überwachung

### Wo sehen Sie blockierte Anfragen?

1. **Apps Script Logs:**
   - Apps Script Editor öffnen
   - Klicken Sie links auf **Ausführungen**
   - Hier sehen Sie alle Anfragen und ob sie blockiert wurden

2. **Beispiel-Log-Einträge:**
   ```
   ✅ Buchung gespeichert: BK1705847392847
   ❌ Blockiert: Rate Limit überschritten - test@example.com
   ❌ Blockiert: Unerlaubte Herkunft - https://evil-website.com
   ❌ Blockiert: Nicht plausibel - Maximal 30 Nächte buchbar
   ```

3. **Filter in Logs:**
   - Suchen Sie nach "Blockiert" um alle blockierten Anfragen zu sehen

---

## ⚙️ Schutzmaßnahmen anpassen

### Schutz lockern (mehr Buchungen erlauben):

**Rate Limit erhöhen:**
```javascript
MAX_BOOKINGS_PER_EMAIL_PER_DAY: 5,  // Statt 3 → 5 Buchungen pro Tag
```

**Mehr Nächte erlauben:**
```javascript
MAX_NIGHTS: 60,  // Statt 30 → 60 Nächte
```

### Schutz verschärfen (strengere Limits):

**Rate Limit senken:**
```javascript
MAX_BOOKINGS_PER_EMAIL_PER_DAY: 1,  // Nur 1 Buchung pro Tag
```

**Weniger Nächte erlauben:**
```javascript
MAX_NIGHTS: 14,  // Maximal 2 Wochen
```

**Herkunftsprüfung verschärfen:**
Entfernen Sie localhost aus den erlaubten Origins (nur für Production):
```javascript
ALLOWED_ORIGINS: [
  'https://mercan20.github.io'
  // localhost entfernt
]
```

---

## 🔒 Was ist NICHT geschützt?

### 1. Unterschiedliche Email-Adressen
**Szenario:** Jemand erstellt 100 verschiedene Email-Adressen und sendet je 3 Buchungen
**Status:** ⚠️ Möglich, aber unwahrscheinlich
**Warum OK:**
- Erfordert viel Aufwand (100 Email-Adressen erstellen)
- Sie sehen es im Google Sheet
- Sie können einfach ablehnen

### 2. Spam-Buchungen mit echten Daten
**Szenario:** Jemand sendet Buchungen mit plausiblen, aber falschen Daten
**Status:** ⚠️ Möglich
**Warum OK:**
- Sie prüfen jede Buchung vor Bestätigung
- Keine Zahlung ohne Ihre Bestätigung
- Sie können ablehnen

### 3. Distributed Attacks (viele IPs)
**Szenario:** Jemand nutzt 100 verschiedene Computer/IPs für Spam
**Status:** ⚠️ Theoretisch möglich, extrem unwahrscheinlich
**Warum OK:**
- Erfordert enormen Aufwand
- Sie sehen verdächtige Muster im Google Sheet
- Notfall-Lösung: Web-App temporär deaktivieren

---

## 🆘 Notfall-Maßnahmen bei Spam-Angriff

### Option 1: Web-App temporär deaktivieren

1. Apps Script Editor öffnen
2. Klicken Sie auf **Bereitstellen** → **Bereitstellungen verwalten**
3. Klicken Sie auf **Archivieren**
→ Alle Buchungsanfragen werden blockiert (auch echte!)

### Option 2: Nur bestimmte IPs erlauben

Fügen Sie in `doPost()` folgende Zeile hinzu:
```javascript
const allowedIPs = ['Ihre.IP.Adresse.Hier'];
if (!allowedIPs.includes(req.userIp)) {
  return FormEasy.createResponse('error', 'Zugriff verweigert.');
}
```

### Option 3: Google reCAPTCHA hinzufügen

**Für maximalen Schutz:**
- Integrieren Sie Google reCAPTCHA v3 in Ihr Buchungsformular
- Anleitung: https://developers.google.com/recaptcha/docs/v3

---

## 📋 Zusammenfassung

| Schutzebene | Was es verhindert | Wann blockiert |
|-------------|-------------------|----------------|
| **Herkunftsprüfung** | Spam von fremden Websites | Sofort |
| **Rate Limiting** | Mehrfache Buchungen derselben Email | Ab 4. Buchung in 24h |
| **Daten-Validierung** | Leere Felder | Sofort |
| **Plausibilität** | Unsinnige Daten (z.B. 100 Nächte) | Sofort |
| **Email-Blacklist** | Bekannte Spammer | Sofort (manuell) |

**Ihr Risiko:**
- ✅ **Sehr gering** für normale Hotels
- ✅ Kein finanzieller Schaden möglich (keine Zahlung ohne Ihre Bestätigung)
- ✅ Schlimmstenfalls: 5-10 Fake-Buchungen pro Tag, die Sie ablehnen

**Empfehlung:**
- Starten Sie mit den aktuellen Einstellungen
- Überwachen Sie die ersten Wochen
- Passen Sie Limits nur an, wenn wirklich nötig

---

## ❓ Häufige Fragen

### "Kann jemand die URL herausfinden?"
Ja, aber:
- Die URL ist öffentlich (muss sie sein, damit Gäste buchen können)
- Aber: Nur erlaubte Websites können Buchungen senden
- Direkter Zugriff über Browser funktioniert nicht wegen CORS

### "Was passiert mit Spam-Buchungen?"
1. Sie erscheinen im Google Sheet mit Status "Pending"
2. Sie erhalten Telegram-Benachrichtigung
3. Sie können sie einfach ablehnen (1 Klick)
4. Kein finanzieller Schaden, da keine automatische Zahlung

### "Sollte ich reCAPTCHA hinzufügen?"
**Vorerst nein**, weil:
- Aktuelle Schutzmaßnahmen sind ausreichend für kleine Hotels
- reCAPTCHA nervt echte Gäste
- Fügen Sie es nur hinzu, wenn Sie wirklich Spam-Probleme haben

### "Kann ich sehen, wer blockiert wurde?"
Ja:
1. Apps Script Editor → **Ausführungen** (links)
2. Suchen Sie nach "Blockiert"
3. Sehen Sie Email, Grund, Zeitpunkt

---

**Erstellt:** Januar 2025
**Version:** 1.0
