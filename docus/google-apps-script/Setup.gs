// ===================================
// Hotel Rössle - Setup & Initialisierung
// Einmalig nach dem Erstellen des Google Sheets ausführen
// ===================================

/**
 * SETUP-ANLEITUNG:
 * 1. Neues Google Sheet erstellen: "Hotel Rössle Buchungen"
 * 2. Tools → Script editor öffnen
 * 3. Code.gs und Setup.gs einfügen
 * 4. Menü "Setup" ausführen → "Komplett-Setup durchführen"
 * 5. Berechtigungen akzeptieren
 * 6. Telegram-Daten in Sheet "Einstellungen" eintragen
 * 7. Web App deployen (siehe DEPLOYMENT.md)
 */

/**
 * Erstellt ein benutzerdefiniertes Menü im Google Sheet
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🏨 Hotel Buchungen')
    .addItem('📋 Komplett-Setup durchführen', 'setupAll')
    .addSeparator()
    .addItem('📅 Verfügbarkeit für 365 Tage initialisieren', 'initializeAvailability')
    .addItem('⚙️ Einstellungen-Sheet erstellen', 'createSettingsSheet')
    .addSeparator()
    .addItem('✅ Buchung bestätigen (aktuelle Zeile)', 'confirmCurrentBooking')
    .addItem('❌ Buchung ablehnen (aktuelle Zeile)', 'declineCurrentBooking')
    .addSeparator()
    .addItem('🧪 Test-Buchung erstellen', 'createTestBooking')
    .addItem('📊 Statistiken anzeigen', 'showStatistics')
    .addToUi();
}

/**
 * Komplett-Setup: Alle Sheets erstellen und initialisieren
 */
function setupAll() {
  const ui = SpreadsheetApp.getUi();

  const result = ui.alert(
    'Setup starten?',
    'Dies erstellt alle notwendigen Tabellenblätter und initialisiert die Verfügbarkeit für 365 Tage.\n\nFortfahren?',
    ui.ButtonSet.YES_NO
  );

  if (result !== ui.Button.YES) {
    return;
  }

  try {
    // Sheets erstellen
    createBookingsSheet();
    createAvailabilitySheet();
    createSettingsSheet();

    // Verfügbarkeit initialisieren
    initializeAvailability();

    ui.alert('✅ Setup erfolgreich!', 'Alle Sheets wurden erstellt und initialisiert.\n\nBitte tragen Sie jetzt Ihre Telegram-Daten im Sheet "Einstellungen" ein.', ui.ButtonSet.OK);

  } catch (error) {
    ui.alert('❌ Fehler beim Setup', error.toString(), ui.ButtonSet.OK);
  }
}

/**
 * Erstellt das Buchungen-Sheet
 */
function createBookingsSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName('Buchungen');

  if (!sheet) {
    sheet = spreadsheet.insertSheet('Buchungen');
  } else {
    sheet.clear();
  }

  // Header erstellen
  const headers = [
    'Buchungs-ID',
    'Buchungsdatum',
    'Vorname',
    'Nachname',
    'E-Mail',
    'Telefon',
    'Check-In',
    'Check-Out',
    'Nächte',
    'Einzelzimmer',
    'Doppelzimmer',
    'Familienzimmer',
    'Gesamtpreis (€)',
    'Wünsche',
    'Status',
    'Bestätigt von',
    'Zeitstempel'
  ];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

  // Formatierung
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground('#4a90e2');
  headerRange.setFontColor('#ffffff');
  headerRange.setFontWeight('bold');
  headerRange.setHorizontalAlignment('center');

  // Spaltenbreiten anpassen
  sheet.setColumnWidth(1, 120); // Buchungs-ID
  sheet.setColumnWidth(2, 110); // Buchungsdatum
  sheet.setColumnWidth(3, 100); // Vorname
  sheet.setColumnWidth(4, 100); // Nachname
  sheet.setColumnWidth(5, 200); // E-Mail
  sheet.setColumnWidth(6, 120); // Telefon
  sheet.setColumnWidth(7, 100); // Check-In
  sheet.setColumnWidth(8, 100); // Check-Out
  sheet.setColumnWidth(9, 60); // Nächte
  sheet.setColumnWidth(10, 100); // Einzelzimmer
  sheet.setColumnWidth(11, 100); // Doppelzimmer
  sheet.setColumnWidth(12, 110); // Familienzimmer
  sheet.setColumnWidth(13, 110); // Gesamtpreis
  sheet.setColumnWidth(14, 200); // Wünsche
  sheet.setColumnWidth(15, 90); // Status
  sheet.setColumnWidth(16, 150); // Bestätigt von
  sheet.setColumnWidth(17, 140); // Zeitstempel

  // Zeilen einfrieren
  sheet.setFrozenRows(1);

  Logger.log('Buchungen-Sheet erstellt');
}

/**
 * Erstellt das Verfügbarkeits-Sheet
 */
function createAvailabilitySheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName('Verfügbarkeit');

  if (!sheet) {
    sheet = spreadsheet.insertSheet('Verfügbarkeit');
  } else {
    sheet.clear();
  }

  // Header erstellen
  const headers = [
    'Datum',
    'Einzelzimmer verfügbar',
    'Doppelzimmer verfügbar',
    'Familienzimmer verfügbar'
  ];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

  // Formatierung
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground('#34a853');
  headerRange.setFontColor('#ffffff');
  headerRange.setFontWeight('bold');
  headerRange.setHorizontalAlignment('center');

  // Spaltenbreiten
  sheet.setColumnWidth(1, 120); // Datum
  sheet.setColumnWidth(2, 150); // Einzelzimmer
  sheet.setColumnWidth(3, 150); // Doppelzimmer
  sheet.setColumnWidth(4, 160); // Familienzimmer

  // Zeilen einfrieren
  sheet.setFrozenRows(1);

  Logger.log('Verfügbarkeits-Sheet erstellt');
}

/**
 * Erstellt das Einstellungen-Sheet
 */
function createSettingsSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName('Einstellungen');

  if (!sheet) {
    sheet = spreadsheet.insertSheet('Einstellungen');
  } else {
    sheet.clear();
  }

  // Einstellungen mit Beschreibungen
  const settings = [
    ['Einstellung', 'Wert', 'Beschreibung'],
    ['Telegram Bot Token', '', 'Von @BotFather erhalten (z.B. 123456:ABC-DEF...)'],
    ['Telegram Chat ID', '', 'Ihre Chat-ID (siehe Anleitung in TELEGRAM-SETUP.md)'],
    ['E-Mail Empfänger', 'info@hotelroessle.eu', 'Haupt-Email für Benachrichtigungen'],
    ['Max Einzelzimmer', 5, 'Anzahl verfügbare Einzelzimmer'],
    ['Max Doppelzimmer', 10, 'Anzahl verfügbare Doppelzimmer'],
    ['Max Familienzimmer', 3, 'Anzahl verfügbare Familienzimmer']
  ];

  sheet.getRange(1, 1, settings.length, 3).setValues(settings);

  // Formatierung
  const headerRange = sheet.getRange(1, 1, 1, 3);
  headerRange.setBackground('#fbbc04');
  headerRange.setFontColor('#000000');
  headerRange.setFontWeight('bold');
  headerRange.setHorizontalAlignment('center');

  // Wichtige Felder hervorheben
  sheet.getRange(2, 1, 2, 2).setBackground('#fff3cd');

  // Spaltenbreiten
  sheet.setColumnWidth(1, 200);
  sheet.setColumnWidth(2, 300);
  sheet.setColumnWidth(3, 400);

  // Zeilen einfrieren
  sheet.setFrozenRows(1);

  // Hinweis hinzufügen
  sheet.getRange(8, 1, 1, 3).merge();
  sheet.getRange(8, 1).setValue('⚠️ WICHTIG: Tragen Sie Ihren Telegram Bot Token und Chat ID ein, um Smartphone-Benachrichtigungen zu erhalten!');
  sheet.getRange(8, 1).setBackground('#f8d7da');
  sheet.getRange(8, 1).setFontWeight('bold');

  Logger.log('Einstellungen-Sheet erstellt');
}

/**
 * Initialisiert Verfügbarkeit für die nächsten 365 Tage
 */
function initializeAvailability() {
  const ui = SpreadsheetApp.getUi();
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Verfügbarkeit');

  if (!sheet) {
    ui.alert('❌ Fehler', 'Sheet "Verfügbarkeit" nicht gefunden. Bitte zuerst Setup durchführen.', ui.ButtonSet.OK);
    return;
  }

  // Einstellungen laden
  const settingsSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Einstellungen');
  const settingsData = settingsSheet.getDataRange().getValues();

  const maxEinzelzimmer = settingsData[4][1] || 5;
  const maxDoppelzimmer = settingsData[5][1] || 10;
  const maxFamilienzimmer = settingsData[6][1] || 3;

  // Bestehende Daten löschen (außer Header)
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.deleteRows(2, lastRow - 1);
  }

  // 365 Tage generieren
  const today = new Date();
  const data = [];

  for (let i = 0; i < 365; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);

    data.push([
      formatDateForSheet(date),
      maxEinzelzimmer,
      maxDoppelzimmer,
      maxFamilienzimmer
    ]);
  }

  // Daten einfügen
  sheet.getRange(2, 1, data.length, 4).setValues(data);

  // Datumsformat anwenden
  sheet.getRange(2, 1, data.length, 1).setNumberFormat('dd.mm.yyyy');

  // Conditional Formatting für niedrige Verfügbarkeit
  const rules = sheet.getConditionalFormatRules();

  // Rot: Keine Zimmer verfügbar
  const rule1 = SpreadsheetApp.newConditionalFormatRule()
    .whenNumberEqualTo(0)
    .setBackground('#f4c7c3')
    .setFontColor('#cc0000')
    .setRanges([sheet.getRange(2, 2, data.length, 3)])
    .build();

  // Orange: Nur noch 1-2 Zimmer verfügbar
  const rule2 = SpreadsheetApp.newConditionalFormatRule()
    .whenNumberBetween(1, 2)
    .setBackground('#fce8b2')
    .setRanges([sheet.getRange(2, 2, data.length, 3)])
    .build();

  sheet.setConditionalFormatRules([rule1, rule2, ...rules]);

  ui.alert('✅ Verfügbarkeit initialisiert!', `${data.length} Tage wurden mit folgender Verfügbarkeit erstellt:\n\n• ${maxEinzelzimmer}x Einzelzimmer\n• ${maxDoppelzimmer}x Doppelzimmer\n• ${maxFamilienzimmer}x Familienzimmer`, ui.ButtonSet.OK);

  Logger.log(`Verfügbarkeit für ${data.length} Tage initialisiert`);
}

/**
 * Bestätigt die Buchung in der aktuell ausgewählten Zeile
 */
function confirmCurrentBooking() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Buchungen');
  const ui = SpreadsheetApp.getUi();

  if (!sheet) {
    ui.alert('❌ Fehler', 'Bitte öffnen Sie das Sheet "Buchungen"', ui.ButtonSet.OK);
    return;
  }

  const activeRange = sheet.getActiveRange();
  const row = activeRange.getRow();

  if (row === 1) {
    ui.alert('❌ Fehler', 'Bitte wählen Sie eine Buchungszeile aus (nicht die Header-Zeile)', ui.ButtonSet.OK);
    return;
  }

  const bookingId = sheet.getRange(row, 1).getValue();

  if (!bookingId) {
    ui.alert('❌ Fehler', 'Keine gültige Buchung ausgewählt', ui.ButtonSet.OK);
    return;
  }

  const status = sheet.getRange(row, 15).getValue();

  if (status === 'Confirmed') {
    ui.alert('ℹ️ Info', 'Diese Buchung wurde bereits bestätigt', ui.ButtonSet.OK);
    return;
  }

  const result = ui.alert(
    'Buchung bestätigen?',
    `Möchten Sie die Buchung ${bookingId} wirklich bestätigen?\n\nDies wird:\n• Die Zimmer im Kalender blockieren\n• Eine Bestätigungs-Email an den Gast senden`,
    ui.ButtonSet.YES_NO
  );

  if (result !== ui.Button.YES) {
    return;
  }

  try {
    confirmBooking(bookingId);
    ui.alert('✅ Erfolgreich!', `Buchung ${bookingId} wurde bestätigt.\n\nEmail wurde an den Gast gesendet.`, ui.ButtonSet.OK);
  } catch (error) {
    ui.alert('❌ Fehler', error.toString(), ui.ButtonSet.OK);
  }
}

/**
 * Lehnt die Buchung in der aktuell ausgewählten Zeile ab
 */
function declineCurrentBooking() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Buchungen');
  const ui = SpreadsheetApp.getUi();

  if (!sheet) {
    ui.alert('❌ Fehler', 'Bitte öffnen Sie das Sheet "Buchungen"', ui.ButtonSet.OK);
    return;
  }

  const activeRange = sheet.getActiveRange();
  const row = activeRange.getRow();

  if (row === 1) {
    ui.alert('❌ Fehler', 'Bitte wählen Sie eine Buchungszeile aus (nicht die Header-Zeile)', ui.ButtonSet.OK);
    return;
  }

  const bookingId = sheet.getRange(row, 1).getValue();

  if (!bookingId) {
    ui.alert('❌ Fehler', 'Keine gültige Buchung ausgewählt', ui.ButtonSet.OK);
    return;
  }

  const result = ui.prompt(
    'Buchung ablehnen',
    `Möchten Sie die Buchung ${bookingId} ablehnen?\n\nBitte geben Sie optional einen Grund ein:`,
    ui.ButtonSet.OK_CANCEL
  );

  if (result.getSelectedButton() !== ui.Button.OK) {
    return;
  }

  const reason = result.getResponseText() || 'Zimmer nicht verfügbar';

  try {
    declineBooking(bookingId, reason);
    ui.alert('✅ Erfolgreich!', `Buchung ${bookingId} wurde abgelehnt.\n\nEmail wurde an den Gast gesendet.`, ui.ButtonSet.OK);
  } catch (error) {
    ui.alert('❌ Fehler', error.toString(), ui.ButtonSet.OK);
  }
}

/**
 * Erstellt eine Test-Buchung
 */
function createTestBooking() {
  const ui = SpreadsheetApp.getUi();

  const result = ui.alert(
    'Test-Buchung erstellen?',
    'Dies erstellt eine Test-Buchung mit Beispiel-Daten.\n\nFortfahren?',
    ui.ButtonSet.YES_NO
  );

  if (result !== ui.Button.YES) {
    return;
  }

  const testData = {
    vorname: 'Max',
    nachname: 'Mustermann',
    email: 'test@example.com',
    telefon: '+49 123 456789',
    checkin: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // In 7 Tagen
    checkout: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000), // In 9 Tagen
    doppelzimmer: 1,
    einzelzimmer: 0,
    familienzimmer: 0,
    wuensche: 'Dies ist eine Test-Buchung'
  };

  try {
    const bookingId = saveBooking(testData);
    ui.alert('✅ Test-Buchung erstellt!', `Buchungs-ID: ${bookingId}\n\nÜberprüfen Sie das Sheet "Buchungen" und Ihre Telegram-Benachrichtigung.`, ui.ButtonSet.OK);

    // Telegram-Test
    sendTelegramNotification(bookingId, testData);

  } catch (error) {
    ui.alert('❌ Fehler', error.toString(), ui.ButtonSet.OK);
  }
}

/**
 * Zeigt Statistiken
 */
function showStatistics() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Buchungen');
  const ui = SpreadsheetApp.getUi();

  if (!sheet) {
    ui.alert('❌ Fehler', 'Sheet "Buchungen" nicht gefunden', ui.ButtonSet.OK);
    return;
  }

  const data = sheet.getDataRange().getValues();
  let totalBookings = data.length - 1; // Minus Header
  let pendingCount = 0;
  let confirmedCount = 0;
  let declinedCount = 0;

  for (let i = 1; i < data.length; i++) {
    const status = data[i][14]; // Status-Spalte
    if (status === 'Pending') pendingCount++;
    if (status === 'Confirmed') confirmedCount++;
    if (status === 'Declined') declinedCount++;
  }

  ui.alert(
    '📊 Buchungs-Statistiken',
    `Gesamt: ${totalBookings} Buchungen\n\n` +
    `⏳ Pending: ${pendingCount}\n` +
    `✅ Bestätigt: ${confirmedCount}\n` +
    `❌ Abgelehnt: ${declinedCount}`,
    ui.ButtonSet.OK
  );
}

/**
 * Hilfsfunktion: Datum für Sheet formatieren
 */
function formatDateForSheet(date) {
  return Utilities.formatDate(date, Session.getScriptTimeZone(), 'dd.MM.yyyy');
}
