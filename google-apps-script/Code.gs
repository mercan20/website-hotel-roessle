// ===================================
// Hotel Rössle - Buchungssystem Backend
// Google Apps Script Web App
// ===================================

// Konfiguration (wird aus Sheet "Einstellungen" gelesen)
const CONFIG = {
  SHEET_ID: '', // Wird automatisch aus aktivem Spreadsheet gelesen
  BOOKINGS_SHEET: 'Buchungen',
  AVAILABILITY_SHEET: 'Verfügbarkeit',
  SETTINGS_SHEET: 'Einstellungen'
};

// Zimmer-Preise (in Euro)
const ROOM_PRICES = {
  einzelzimmer: 56,
  doppelzimmer: 80,
  familienzimmer: 109
};

// ===================================
// Haupt-Endpunkte (Web App Entry Points)
// ===================================

/**
 * POST Endpoint - Neue Buchungsanfrage erstellen
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    // Validierung
    if (!validateBookingData(data)) {
      return createResponse({ success: false, error: 'Ungültige Daten' }, 400);
    }

    // Verfügbarkeit prüfen
    const availability = checkAvailability(
      data.checkin,
      data.checkout,
      {
        einzelzimmer: data.einzelzimmer || 0,
        doppelzimmer: data.doppelzimmer || 0,
        familienzimmer: data.familienzimmer || 0
      }
    );

    if (!availability.available) {
      return createResponse({
        success: false,
        error: 'Leider sind nicht alle gewünschten Zimmer verfügbar.',
        unavailableRooms: availability.unavailableRooms
      }, 409);
    }

    // Buchung speichern
    const bookingId = saveBooking(data);

    // Telegram-Benachrichtigung senden
    sendTelegramNotification(bookingId, data);

    // Bestätigungs-Email an Gast
    sendGuestEmail(data, 'received');

    return createResponse({
      success: true,
      bookingId: bookingId,
      message: 'Ihre Buchungsanfrage wurde erfolgreich übermittelt!'
    });

  } catch (error) {
    Logger.log('Error in doPost: ' + error);
    return createResponse({ success: false, error: error.toString() }, 500);
  }
}

/**
 * GET Endpoint - Verfügbarkeit abfragen
 */
function doGet(e) {
  try {
    const action = e.parameter.action;

    if (action === 'availability') {
      const startDate = e.parameter.startDate || new Date();
      const endDate = e.parameter.endDate || addDays(new Date(), 90);

      const availability = getAvailabilityRange(startDate, endDate);
      return createResponse({ success: true, availability: availability });
    }

    return createResponse({ success: false, error: 'Unknown action' }, 400);

  } catch (error) {
    Logger.log('Error in doGet: ' + error);
    return createResponse({ success: false, error: error.toString() }, 500);
  }
}

// ===================================
// Verfügbarkeits-Management
// ===================================

/**
 * Prüft ob die gewünschten Zimmer verfügbar sind
 */
function checkAvailability(checkinStr, checkoutStr, rooms) {
  const sheet = getSheet(CONFIG.AVAILABILITY_SHEET);
  const data = sheet.getDataRange().getValues();

  const checkin = new Date(checkinStr);
  const checkout = new Date(checkoutStr);

  let available = true;
  let unavailableRooms = [];

  // Durch alle Tage zwischen Check-In und Check-Out iterieren
  for (let date = new Date(checkin); date < checkout; date.setDate(date.getDate() + 1)) {
    const dateStr = formatDate(date);

    // Zeile für dieses Datum finden
    const rowIndex = data.findIndex(row => formatDate(row[0]) === dateStr);

    if (rowIndex === -1) {
      // Datum nicht in Verfügbarkeit → nicht verfügbar
      available = false;
      unavailableRooms.push({ date: dateStr, reason: 'Datum nicht im System' });
      continue;
    }

    const row = data[rowIndex];
    const availableEinzelzimmer = row[1] || 0;
    const availableDoppelzimmer = row[2] || 0;
    const availableFamilienzimmer = row[3] || 0;

    // Prüfen ob genug Zimmer verfügbar sind
    if (rooms.einzelzimmer > availableEinzelzimmer) {
      available = false;
      unavailableRooms.push({ date: dateStr, room: 'Einzelzimmer', requested: rooms.einzelzimmer, available: availableEinzelzimmer });
    }
    if (rooms.doppelzimmer > availableDoppelzimmer) {
      available = false;
      unavailableRooms.push({ date: dateStr, room: 'Doppelzimmer', requested: rooms.doppelzimmer, available: availableDoppelzimmer });
    }
    if (rooms.familienzimmer > availableFamilienzimmer) {
      available = false;
      unavailableRooms.push({ date: dateStr, room: 'Familienzimmer', requested: rooms.familienzimmer, available: availableFamilienzimmer });
    }
  }

  return { available, unavailableRooms };
}

/**
 * Verfügbarkeit für einen Datumsbereich abrufen
 */
function getAvailabilityRange(startDate, endDate) {
  const sheet = getSheet(CONFIG.AVAILABILITY_SHEET);
  const data = sheet.getDataRange().getValues();

  const availability = [];

  for (let i = 1; i < data.length; i++) { // Skip header
    const row = data[i];
    const date = new Date(row[0]);

    if (date >= startDate && date <= endDate) {
      availability.push({
        date: formatDate(date),
        einzelzimmer: row[1] || 0,
        doppelzimmer: row[2] || 0,
        familienzimmer: row[3] || 0
      });
    }
  }

  return availability;
}

/**
 * Zimmer blockieren (nach Bestätigung)
 */
function blockRooms(checkinStr, checkoutStr, rooms) {
  const sheet = getSheet(CONFIG.AVAILABILITY_SHEET);
  const data = sheet.getDataRange().getValues();

  const checkin = new Date(checkinStr);
  const checkout = new Date(checkoutStr);

  // Durch alle Tage iterieren
  for (let date = new Date(checkin); date < checkout; date.setDate(date.getDate() + 1)) {
    const dateStr = formatDate(date);

    // Zeile finden
    const rowIndex = data.findIndex(row => formatDate(row[0]) === dateStr);

    if (rowIndex !== -1) {
      const row = rowIndex + 1; // +1 wegen 1-basiertem Index in Sheets

      // Verfügbarkeit reduzieren
      if (rooms.einzelzimmer > 0) {
        const current = sheet.getRange(row, 2).getValue();
        sheet.getRange(row, 2).setValue(Math.max(0, current - rooms.einzelzimmer));
      }
      if (rooms.doppelzimmer > 0) {
        const current = sheet.getRange(row, 3).getValue();
        sheet.getRange(row, 3).setValue(Math.max(0, current - rooms.doppelzimmer));
      }
      if (rooms.familienzimmer > 0) {
        const current = sheet.getRange(row, 4).getValue();
        sheet.getRange(row, 4).setValue(Math.max(0, current - rooms.familienzimmer));
      }
    }
  }
}

// ===================================
// Buchungs-Management
// ===================================

/**
 * Buchung in Google Sheets speichern
 */
function saveBooking(data) {
  const sheet = getSheet(CONFIG.BOOKINGS_SHEET);

  // Buchungs-ID generieren
  const bookingId = 'BK' + new Date().getTime();

  // Anzahl Nächte berechnen
  const checkin = new Date(data.checkin);
  const checkout = new Date(data.checkout);
  const nights = Math.ceil((checkout - checkin) / (1000 * 60 * 60 * 24));

  // Gesamtpreis berechnen
  const einzelzimmerCount = data.einzelzimmer || 0;
  const doppelzimmerCount = data.doppelzimmer || 0;
  const familienzimmerCount = data.familienzimmer || 0;

  const pricePerNight =
    (einzelzimmerCount * ROOM_PRICES.einzelzimmer) +
    (doppelzimmerCount * ROOM_PRICES.doppelzimmer) +
    (familienzimmerCount * ROOM_PRICES.familienzimmer);

  const totalPrice = pricePerNight * nights;

  // Neue Zeile hinzufügen
  sheet.appendRow([
    bookingId,
    new Date(), // Datum der Buchung
    data.vorname,
    data.nachname,
    data.email,
    data.telefon,
    formatDate(checkin),
    formatDate(checkout),
    nights,
    einzelzimmerCount,
    doppelzimmerCount,
    familienzimmerCount,
    totalPrice,
    data.wuensche || '',
    'Pending', // Status
    '', // Bestätigt von
    new Date() // Zeitstempel
  ]);

  return bookingId;
}

/**
 * Buchung bestätigen (von Admin aufgerufen)
 */
function confirmBooking(bookingId) {
  const sheet = getSheet(CONFIG.BOOKINGS_SHEET);
  const data = sheet.getDataRange().getValues();

  // Buchung finden
  const rowIndex = data.findIndex(row => row[0] === bookingId);

  if (rowIndex === -1) {
    throw new Error('Buchung nicht gefunden: ' + bookingId);
  }

  const row = data[rowIndex];
  const bookingData = {
    vorname: row[2],
    nachname: row[3],
    email: row[4],
    telefon: row[5],
    checkin: row[6],
    checkout: row[7],
    einzelzimmer: row[9],
    doppelzimmer: row[10],
    familienzimmer: row[11]
  };

  // Status aktualisieren
  sheet.getRange(rowIndex + 1, 15).setValue('Confirmed');
  sheet.getRange(rowIndex + 1, 16).setValue(Session.getActiveUser().getEmail());

  // Zimmer blockieren
  blockRooms(
    bookingData.checkin,
    bookingData.checkout,
    {
      einzelzimmer: bookingData.einzelzimmer,
      doppelzimmer: bookingData.doppelzimmer,
      familienzimmer: bookingData.familienzimmer
    }
  );

  // Bestätigungs-Email an Gast
  sendGuestEmail(bookingData, 'confirmed');

  return { success: true, message: 'Buchung bestätigt!' };
}

/**
 * Buchung ablehnen (von Admin aufgerufen)
 */
function declineBooking(bookingId, reason) {
  const sheet = getSheet(CONFIG.BOOKINGS_SHEET);
  const data = sheet.getDataRange().getValues();

  // Buchung finden
  const rowIndex = data.findIndex(row => row[0] === bookingId);

  if (rowIndex === -1) {
    throw new Error('Buchung nicht gefunden: ' + bookingId);
  }

  const row = data[rowIndex];
  const bookingData = {
    vorname: row[2],
    nachname: row[3],
    email: row[4],
    reason: reason || 'Zimmer nicht verfügbar'
  };

  // Status aktualisieren
  sheet.getRange(rowIndex + 1, 15).setValue('Declined');
  sheet.getRange(rowIndex + 1, 16).setValue(Session.getActiveUser().getEmail());

  // Ablehnungs-Email an Gast
  sendGuestEmail(bookingData, 'declined');

  return { success: true, message: 'Buchung abgelehnt!' };
}

// ===================================
// Telegram-Integration
// ===================================

/**
 * Telegram-Benachrichtigung senden
 */
function sendTelegramNotification(bookingId, data) {
  const settings = getSettings();

  if (!settings.telegramToken || !settings.telegramChatId) {
    Logger.log('Telegram nicht konfiguriert - Benachrichtigung übersprungen');
    return;
  }

  // Anzahl Nächte berechnen
  const checkin = new Date(data.checkin);
  const checkout = new Date(data.checkout);
  const nights = Math.ceil((checkout - checkin) / (1000 * 60 * 60 * 24));

  // Gesamtpreis berechnen
  const einzelzimmerCount = data.einzelzimmer || 0;
  const doppelzimmerCount = data.doppelzimmer || 0;
  const familienzimmerCount = data.familienzimmer || 0;

  const pricePerNight =
    (einzelzimmerCount * ROOM_PRICES.einzelzimmer) +
    (doppelzimmerCount * ROOM_PRICES.doppelzimmer) +
    (familienzimmerCount * ROOM_PRICES.familienzimmer);

  const totalPrice = pricePerNight * nights;

  // Zimmer-Liste erstellen
  let roomsList = '';
  if (einzelzimmerCount > 0) roomsList += `• ${einzelzimmerCount}x Einzelzimmer\n`;
  if (doppelzimmerCount > 0) roomsList += `• ${doppelzimmerCount}x Doppelzimmer\n`;
  if (familienzimmerCount > 0) roomsList += `• ${familienzimmerCount}x Familienzimmer\n`;

  // Nachricht formatieren
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

  // Telegram API Call
  const url = `https://api.telegram.org/bot${settings.telegramToken}/sendMessage`;

  const payload = {
    chat_id: settings.telegramChatId,
    text: message,
    parse_mode: 'Markdown'
  };

  try {
    const response = UrlFetchApp.fetch(url, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });

    Logger.log('Telegram notification sent: ' + response.getContentText());
  } catch (error) {
    Logger.log('Error sending Telegram notification: ' + error);
  }
}

// ===================================
// Email-Versand
// ===================================

/**
 * Email an Gast senden
 */
function sendGuestEmail(data, type) {
  let subject = '';
  let body = '';

  if (type === 'received') {
    subject = 'Ihre Buchungsanfrage bei Hotel Rössle';
    body = `
Sehr geehrte/r ${data.vorname} ${data.nachname},

vielen Dank für Ihre Buchungsanfrage bei Hotel Rössle!

Wir haben folgende Daten erhalten:
- Check-In: ${formatDate(data.checkin)}
- Check-Out: ${formatDate(data.checkout)}
${data.einzelzimmer > 0 ? `- ${data.einzelzimmer}x Einzelzimmer\n` : ''}${data.doppelzimmer > 0 ? `- ${data.doppelzimmer}x Doppelzimmer\n` : ''}${data.familienzimmer > 0 ? `- ${data.familienzimmer}x Familienzimmer\n` : ''}
Wir prüfen die Verfügbarkeit und melden uns innerhalb der nächsten 24 Stunden bei Ihnen.

Mit freundlichen Grüßen
Ihr Team vom Hotel Rössle

---
Hotel Rössle Tuttlingen
Honbergstrasse 8
78532 Tuttlingen
Tel: +49 (0) 7461 2913
info@hotelroessle.eu
    `;
  } else if (type === 'confirmed') {
    subject = 'Buchungsbestätigung - Hotel Rössle';
    body = `
Sehr geehrte/r ${data.vorname} ${data.nachname},

wir freuen uns, Ihnen mitteilen zu können, dass Ihre Buchung bestätigt wurde! ✓

Ihre Buchungsdetails:
- Check-In: ${formatDate(data.checkin)} (ab 14:00 Uhr)
- Check-Out: ${formatDate(data.checkout)} (bis 11:00 Uhr)
${data.einzelzimmer > 0 ? `- ${data.einzelzimmer}x Einzelzimmer\n` : ''}${data.doppelzimmer > 0 ? `- ${data.doppelzimmer}x Doppelzimmer\n` : ''}${data.familienzimmer > 0 ? `- ${data.familienzimmer}x Familienzimmer\n` : ''}
Wir freuen uns auf Ihren Besuch!

Bei Fragen erreichen Sie uns unter:
Tel: +49 (0) 7461 2913
Email: info@hotelroessle.eu

Mit freundlichen Grüßen
Ihr Team vom Hotel Rössle

---
Hotel Rössle Tuttlingen
Honbergstrasse 8
78532 Tuttlingen
    `;
  } else if (type === 'declined') {
    subject = 'Buchungsanfrage - Hotel Rössle';
    body = `
Sehr geehrte/r ${data.vorname} ${data.nachname},

leider müssen wir Ihnen mitteilen, dass Ihre angefragten Zimmer zum gewünschten Zeitraum nicht verfügbar sind.

${data.reason ? `Grund: ${data.reason}\n\n` : ''}Gerne können Sie uns für alternative Termine kontaktieren:
Tel: +49 (0) 7461 2913
Email: info@hotelroessle.eu

Wir würden uns freuen, Sie zu einem anderen Zeitpunkt begrüßen zu dürfen!

Mit freundlichen Grüßen
Ihr Team vom Hotel Rössle

---
Hotel Rössle Tuttlingen
Honbergstrasse 8
78532 Tuttlingen
    `;
  }

  try {
    MailApp.sendEmail({
      to: data.email,
      subject: subject,
      body: body
    });
    Logger.log(`Email sent to ${data.email}: ${type}`);
  } catch (error) {
    Logger.log(`Error sending email to ${data.email}: ${error}`);
  }
}

// ===================================
// Hilfs-Funktionen
// ===================================

/**
 * Validierung der Buchungsdaten
 */
function validateBookingData(data) {
  if (!data.vorname || !data.nachname || !data.email || !data.telefon) {
    return false;
  }
  if (!data.checkin || !data.checkout) {
    return false;
  }
  const roomCount = (data.einzelzimmer || 0) + (data.doppelzimmer || 0) + (data.familienzimmer || 0);
  if (roomCount === 0) {
    return false;
  }
  return true;
}

/**
 * HTTP Response erstellen
 */
function createResponse(data, statusCode = 200) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Google Sheet abrufen
 */
function getSheet(sheetName) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  return spreadsheet.getSheetByName(sheetName);
}

/**
 * Einstellungen aus Sheet laden
 */
function getSettings() {
  const sheet = getSheet(CONFIG.SETTINGS_SHEET);
  const data = sheet.getDataRange().getValues();

  return {
    telegramToken: data[1][1] || '',
    telegramChatId: data[2][1] || '',
    emailRecipient: data[3][1] || 'info@hotelroessle.eu',
    maxEinzelzimmer: data[4][1] || 5,
    maxDoppelzimmer: data[5][1] || 10,
    maxFamilienzimmer: data[6][1] || 3
  };
}

/**
 * Spreadsheet URL abrufen
 */
function getSpreadsheetUrl() {
  return SpreadsheetApp.getActiveSpreadsheet().getUrl();
}

/**
 * Datum formatieren (DD.MM.YYYY)
 */
function formatDate(date) {
  if (typeof date === 'string') {
    date = new Date(date);
  }
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
}

/**
 * Tage zu Datum hinzufügen
 */
function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}
