# TODO - Hotel Rössle Website

## 🔴 Wichtig - Vor dem Live-Gang

### 1. Backend für Buchungsformular einrichten
- [ ] Entscheiden zwischen Google Sheets API, Email-Service oder eigenem Backend
- [ ] API-Endpunkt für Buchungsanfragen erstellen
- [ ] Email-Benachrichtigungen einrichten (an info@hotelroessle.eu)
- [ ] Test-Buchung durchführen und verifizieren
- [ ] Optional: Google Sheets Integration für Verfügbarkeitsprüfung

**Siehe README.md für detaillierte Anleitungen**

### 2. Backend für Kontaktformular einrichten
- [ ] API-Endpunkt für Kontaktanfragen erstellen
- [ ] Email-Benachrichtigungen einrichten
- [ ] Spam-Schutz implementieren (z.B. reCAPTCHA)

### 3. Bilder hinzufügen
- [ ] Hotelfotos aufnehmen oder auswählen
- [ ] Bilder optimieren (WebP Format, max. 1920px Breite)
- [ ] Bilder in `images/` Ordner hochladen:
  - einzelzimmer.jpg (min. 800x600px)
  - doppelzimmer.jpg (min. 800x600px)
  - familienzimmer.jpg (min. 800x600px)
  - hotel-exterior.jpg
  - event-raum.jpg
  - logo.png (transparenter Hintergrund)
  - hero-background.jpg (min. 1920x1080px)
- [ ] Platzhalter in HTML-Dateien ersetzen

### 4. Rechtliche Informationen vervollständigen
- [ ] USt-IdNr in `impressum.html` eintragen (Zeile 56)
- [ ] AGB-PDF erstellen und in `images/` hochladen
- [ ] Datenschutzerklärung rechtlich prüfen lassen
- [ ] Cookie-Banner implementieren (falls Tracking gewünscht)

### 5. Google Maps einbinden
- [ ] Google Maps API Key erstellen
- [ ] Karte in `kontakt.html` einbinden (Zeile 157)
- [ ] Marker für Hotel Rössle setzen

## 🟡 Wichtig - Verbesserungen

### 6. SEO Optimierung
- [ ] Meta-Descriptions für alle Seiten optimieren
- [ ] Open Graph Tags hinzufügen (für Social Media)
- [ ] sitemap.xml erstellen
- [ ] robots.txt erstellen
- [ ] Google Search Console einrichten
- [ ] Structured Data (Schema.org) für Hotel hinzufügen

### 7. Performance-Optimierung
- [ ] Bilder komprimieren (TinyPNG oder ähnlich)
- [ ] WebP Format für alle Bilder verwenden
- [ ] Lazy Loading für Bilder aktivieren
- [ ] CSS/JS minifizieren (für Produktion)
- [ ] Caching-Headers konfigurieren

### 8. Testing
- [ ] Alle Formulare testen (Buchung, Kontakt)
- [ ] Mobile Ansicht auf echten Geräten testen
- [ ] Cross-Browser-Testing (Chrome, Firefox, Safari, Edge)
- [ ] Accessibility-Test mit Screen Reader
- [ ] Links überprüfen (keine 404-Fehler)
- [ ] W3C HTML Validator durchlaufen lassen

## 🟢 Optional - Nice to Have

### 9. Analytics & Tracking
- [ ] Google Analytics einbinden (falls gewünscht)
- [ ] Cookie-Consent-Banner implementieren
- [ ] Conversion-Tracking einrichten

### 10. Zusätzliche Features
- [ ] Online-Verfügbarkeitskalender einbinden
- [ ] Mehrsprachigkeit (Englisch)
- [ ] Bildergalerie mit Lightbox
- [ ] Bewertungen/Testimonials-Sektion
- [ ] Newsletter-Anmeldung
- [ ] WhatsApp-Button für schnellen Kontakt
- [ ] Chatbot oder Live-Chat

### 11. Social Media
- [ ] Social Media Links aktualisieren (Facebook, Instagram)
- [ ] Social Media Icons austauschen (echte Icons statt Platzhalter)
- [ ] Instagram-Feed einbinden (optional)

### 12. Hosting & Deployment
- [ ] Hosting-Provider auswählen
- [ ] Domain konfigurieren (www.hotelroessle.eu)
- [ ] SSL-Zertifikat einrichten
- [ ] FTP/Git-Deployment einrichten
- [ ] Backup-Strategie festlegen

## ✅ Fertiggestellt

- [x] Projekt-Struktur erstellen
- [x] Responsive HTML/CSS Framework aufbauen
- [x] 8 HTML-Seiten erstellen (Home, Zimmer, Events, Freizeit, Kontakt, Buchung, Impressum, Datenschutz)
- [x] Mobile Navigation implementieren
- [x] Buchungsformular mit Preisberechnung
- [x] Kontaktformular
- [x] Footer mit allen wichtigen Links
- [x] README.md Dokumentation
- [x] Git Repository initialisieren

---

**Stand:** 12. Oktober 2024
**Erstellt von:** Claude Code
