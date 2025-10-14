# Hotel Rössle - Moderne Website

Eine moderne, responsive Website für Hotel Rössle in Tuttlingen.

## 📋 Funktionen

✅ **Vollständig responsive** - Funktioniert perfekt auf Smartphones, Tablets und Desktop
✅ **Moderne Benutzeroberfläche** - Klares, minimalistisches Design
✅ **Buchungsformular** - Mit automatischer Preisberechnung
✅ **Kontaktformular** - Für allgemeine Anfragen
✅ **Mobile Navigation** - Hamburger-Menü für mobile Geräte
✅ **Schnelle Ladezeiten** - Optimiert und ohne schwere Frameworks
✅ **DSGVO-konform** - Mit Datenschutzerklärung und Impressum

## 🗂️ Seitenstruktur

```
Website/
├── index.html          # Startseite
├── zimmer.html         # Preise
├── events.html         # Räumlichkeiten
├── freizeit.html       # Freizeitaktivitäten
├── kontakt.html        # Kontaktseite mit Formular
├── buchung.html        # Buchungsformular
├── impressum.html      # Impressum & AGB
├── datenschutz.html    # Datenschutzerklärung
├── css/
│   └── style.css       # Haupt-Stylesheet
├── js/
│   ├── main.js         # Haupt-JavaScript
│   └── booking.js      # Buchungsformular-Logik
└── images/             # Bilder-Ordner
```

## 🚀 Website öffnen

1. Öffnen Sie `index.html` in einem modernen Webbrowser
2. Oder starten Sie einen lokalen Webserver:
   ```bash
   python -m http.server 8000
   ```
   Dann öffnen Sie: http://localhost:8000

## 📸 Bilder hinzufügen

Die Website nutzt momentan Platzhalter-Icons. So fügen Sie echte Bilder hinzu:

1. Legen Sie Ihre Bilder im `images/` Ordner ab
2. Empfohlene Bilder:
   - `einzelzimmer.jpg` - Einzelzimmer (min. 800x600px)
   - `doppelzimmer.jpg` - Doppelzimmer (min. 800x600px)
   - `familienzimmer.jpg` - Familienzimmer (min. 800x600px)
   - `hotel-exterior.jpg` - Außenansicht Hotel
   - `logo.png` - Hotel Logo
   - Event-Bilder, Freizeitaktivitäten, etc.

3. Ersetzen Sie die Platzhalter in den HTML-Dateien:
   ```html
   <!-- Statt: -->
   <div class="card-image" style="background: ...">🛏️</div>

   <!-- Verwenden Sie: -->
   <img src="images/einzelzimmer.jpg" alt="Einzelzimmer" class="card-image">
   ```

## 📧 Kontakt- und Buchungsformulare

### Wichtig für die Produktion:

Die Formulare sind aktuell nur Frontend-Simulationen. Für echte Funktionalität müssen Sie:

### Option 1: Email-Service (Einfach)
- Verwenden Sie einen Service wie [Formspree](https://formspree.io/) oder [EmailJS](https://www.emailjs.com/)
- Beide bieten kostenlose Pläne und sind einfach zu integrieren

### Option 2: Backend mit Google Sheets (Empfohlen für Sie)

1. **Google Apps Script erstellen:**
   - Erstellen Sie ein Google Sheet für Buchungen
   - Tools → Skript-Editor
   - Fügen Sie ein Script hinzu, das Formulardaten empfängt

2. **Beispiel Apps Script:**
```javascript
function doPost(e) {
  var sheet = SpreadsheetApp.openById('IHRE_SHEET_ID').getActiveSheet();
  var data = JSON.parse(e.postData.contents);

  sheet.appendRow([
    new Date(),
    data.roomType,
    data.checkIn,
    data.checkOut,
    data.firstName,
    data.lastName,
    data.email,
    data.phone,
    data.numberOfGuests,
    data.specialRequests
  ]);

  // Email senden
  MailApp.sendEmail({
    to: 'info@hotelroessle.eu',
    subject: 'Neue Buchungsanfrage',
    body: 'Siehe Google Sheet für Details'
  });

  return ContentService.createTextOutput(JSON.stringify({success: true}));
}
```

3. **In booking.js ändern:**
```javascript
// Zeile 145 in booking.js ersetzen mit:
fetch('IHRE_GOOGLE_APPS_SCRIPT_URL', {
    method: 'POST',
    body: JSON.stringify(bookingData)
})
.then(response => response.json())
.then(data => {
    // Erfolgsmelding anzeigen
});
```

### Option 3: PHP Backend (Traditionell)

Erstellen Sie `api/booking.php`:
```php
<?php
$data = json_decode(file_get_contents('php://input'), true);
$to = 'info@hotelroessle.eu';
$subject = 'Neue Buchungsanfrage';
$message = "Neue Buchung von: " . $data['firstName'] . " " . $data['lastName'];
mail($to, $subject, $message);
?>
```

## 🎨 Design anpassen

### Farben ändern
Bearbeiten Sie die CSS-Variablen in `css/style.css` (Zeile 7-16):

```css
:root {
  --primary-color: #2c5f2d;      /* Hauptfarbe */
  --accent-color: #c9a961;       /* Akzentfarbe */
  --text-dark: #2d2d2d;          /* Text dunkel */
  /* ... */
}
```

### Schriftarten ändern
```css
:root {
  --font-primary: 'Ihre Schriftart', sans-serif;
  --font-heading: 'Ihre Überschrift-Schrift', serif;
}
```

## 📱 Getestet auf

- ✅ Chrome / Edge (aktuell)
- ✅ Firefox (aktuell)
- ✅ Safari (iOS & macOS)
- ✅ Mobile Browser (iOS & Android)

## 🔧 Technologie-Stack

- **HTML5** - Semantisches Markup
- **CSS3** - Modern mit CSS Variables, Grid, Flexbox
- **Vanilla JavaScript** - Keine Frameworks, schnell & leicht
- **Responsive Design** - Mobile-First Ansatz

## 📝 Nächste Schritte

### Vor dem Live-Gang:

1. ✅ **Bilder hinzufügen** - Echte Hotelbilder einfügen
2. ✅ **USt-IdNr ergänzen** - In `impressum.html` eintragen
3. ✅ **Backend einrichten** - Formular-Funktionalität aktivieren
4. ✅ **Google Maps** - Echte Karte in `kontakt.html` einbinden
5. ✅ **Testing** - Alle Seiten und Formulare testen
6. ✅ **SEO** - Meta-Tags und Beschreibungen optimieren
7. ✅ **Analytics** - Google Analytics oder Alternative einbinden (optional)

### Google Maps einbinden:

In `kontakt.html` (Zeile ca. 157), ersetzen Sie den Platzhalter mit:

```html
<iframe
    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2694.2!2d8.8165!3d47.9885!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDfCsDU5JzE4LjYiTiA4wrA0OCc1OS40IkU!5e0!3m2!1sde!2sde!4v1234567890"
    width="100%"
    height="400"
    style="border:0; border-radius: 8px;"
    allowfullscreen=""
    loading="lazy">
</iframe>
```

## 🆘 Support

Bei Fragen oder Problemen:
- Öffnen Sie die Browser-Konsole (F12) für Fehlermeldungen
- Überprüfen Sie, dass alle Dateien korrekt verlinkt sind
- Stellen Sie sicher, dass der Webserver läuft (nicht nur Datei öffnen)

## 📄 Lizenz

© 2024 Hotel Rössle Tuttlingen. Alle Rechte vorbehalten.

---

**Erstellt mit ❤️ für Hotel Rössle**
