// ===================================
// Hotel Rössle - Buchungssystem Backend
// Google Apps Script Web App mit FormEasy
// FINALE VERSION - CORS-frei!
// ===================================

// FormEasy Library ID: 1CAyzGbXdwMlko81SbJAjRp7ewxhyGKhDipDK4v8ZvlpYqrMAAzbFNccL

// Konfiguration
const CONFIG = {
  BOOKINGS_SHEET: 'Buchungen',
  AVAILABILITY_SHEET: 'Verfügbarkeit',
  SETTINGS_SHEET: 'Einstellungen',
  NOTIFICATION_EMAIL: 'info@hotelroessle.eu', // Ihre Email für Benachrichtigungen

  // Anti-Spam Schutz
  MAX_BOOKINGS_PER_EMAIL_PER_DAY: 3,      // Maximal 3 Buchungen pro Email pro Tag
  MAX_BOOKINGS_PER_IP_PER_HOUR: 5,        // Maximal 5 Buchungen pro IP pro Stunde
  MIN_NIGHTS: 1,                          // Mindestens 1 Nacht
  MAX_NIGHTS: 30,                         // Maximal 30 Nächte
  MAX_ROOMS_TOTAL: 18,                    // Maximal 18 Zimmer gesamt (5 EZ + 10 DZ + 3 FZ)
  ALLOWED_ORIGINS: [                      // Nur diese Websites dürfen Buchungen senden
    'https://www.hotelroessle.eu',
    'https://hotelroessle.eu',
    'http://www.hotelroessle.eu',
    'http://hotelroessle.eu',
    'https://mercan20.github.io',
    'http://localhost:8000',
    'http://127.0.0.1:8000'
  ]
};

const RATE_LIMIT_PROPERTY_KEY = 'HOTEL_ROESSLE_BOOKING_RATE_LIMITS_V1';

function normalizeOrigin(origin) {
  if (!origin) {
    return '';
  }
  const trimmed = origin.trim().toLowerCase();
  return trimmed.replace(/\/+$/, '');
}

const NORMALIZED_ALLOWED_ORIGINS = CONFIG.ALLOWED_ORIGINS.map(normalizeOrigin);

// Zimmer-Preise (in Euro)
const ROOM_PRICES = {
  einzelzimmer: 56,
  doppelzimmer: 80,
  familienzimmer: 109
};

// ===================================
// Haupt-Endpunkt - mit FormEasy
// ===================================

/**
 * POST Endpoint - FormEasy empfängt Buchungsanfragen
 */
function doPost(req) {
  try {
    // FormEasy Email-Benachrichtigung aktivieren
    FormEasy.setEmail(CONFIG.NOTIFICATION_EMAIL);

    // ========== SPAM-SCHUTZ #1: Herkunft prüfen ==========
    const origin = req.parameter.origin || req.contextPath || '';
    if (!isAllowedOrigin(origin)) {
      Logger.log('Blockiert: Unerlaubte Herkunft - ' + origin);
      return FormEasy.createResponse('error', 'Zugriff verweigert.');
    }

    const honeypot = (req.parameter.company || '').trim();
    if (honeypot) {
      Logger.log('Blockiert: Honeypot ausgelöst');
      return FormEasy.createResponse('error', 'Ungültige Anfrage.');
    }

    // Daten aus FormEasy extrahieren
    const formData = extractFormData(req);
    const clientIpRaw = (req.userIp || '').trim();
    const clientIp = clientIpRaw || 'unknown';

    formData.origin = formData.origin || origin;
    formData.clientIp = clientIp;
    if (!formData.userAgent && req.parameter.userAgent) {
      formData.userAgent = req.parameter.userAgent;
    }

    // ========== SPAM-SCHUTZ #2: Rate Limiting ==========
    const rateLimitCheck = checkRateLimit(formData.email, clientIp);
    if (!rateLimitCheck.allowed) {
      Logger.log('Blockiert: Rate Limit überschritten - ' + formData.email + ' / ' + clientIp);
      return FormEasy.createResponse('error', rateLimitCheck.message);
    }

    // ========== SPAM-SCHUTZ #3: Daten-Validierung ==========
    if (!validateBookingData(formData)) {
      Logger.log('Validierung fehlgeschlagen: ' + JSON.stringify(formData));
      return FormEasy.createResponse('error', 'Ungültige Daten. Bitte alle Pflichtfelder ausfüllen.');
    }

    // ========== SPAM-SCHUTZ #4: Plausibilitätsprüfung ==========
    const plausibilityCheck = checkPlausibility(formData);
    if (!plausibilityCheck.valid) {
      Logger.log('Blockiert: Nicht plausibel - ' + plausibilityCheck.reason);
      return FormEasy.createResponse('error', plausibilityCheck.reason);
    }

    // Verfügbarkeit prüfen
    const availability = checkAvailability(
      formData.checkin,
      formData.checkout,
      {
        einzelzimmer: formData.einzelzimmer || 0,
        doppelzimmer: formData.doppelzimmer || 0,
        familienzimmer: formData.familienzimmer || 0
      }
    );

    if (!availability.available) {
      Logger.log('Nicht verfügbar: ' + JSON.stringify(availability));
      return FormEasy.createResponse('error', 'Leider sind die gewünschten Zimmer nicht verfügbar.');
    }

    // Buchung speichern
    const bookingId = saveBooking(formData);
    Logger.log('Buchung gespeichert: ' + bookingId);

    // Telegram-Benachrichtigung senden (async)
    try {
      sendTelegramNotification(bookingId, formData);
    } catch (e) {
      Logger.log('Telegram-Fehler (nicht kritisch): ' + e);
    }

    // Bestätigungs-Email an Gast
    try {
      sendGuestEmail(formData, 'received');
    } catch (e) {
      Logger.log('Email-Fehler (nicht kritisch): ' + e);
    }

    // FormEasy Response (speichert auch in Sheet)
    return FormEasy.action(req);

  } catch (error) {
    Logger.log('Fehler in doPost: ' + error);
    return FormEasy.createResponse('error', 'Es ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.');
  }
}

/**
 * Extrahiert Formulardaten aus FormEasy Request
 */
function extractFormData(req) {
  const params = req.parameter;

  return {
    vorname: params.vorname || '',
    nachname: params.nachname || '',
    email: params.email || '',
    telefon: params.telefon || '',
    checkin: params.checkin || '',
    checkout: params.checkout || '',
    einzelzimmer: parseInt(params.einzelzimmer || '0'),
    doppelzimmer: parseInt(params.doppelzimmer || '0'),
    familienzimmer: parseInt(params.familienzimmer || '0'),
    wuensche: params.wuensche || '',
    origin: params.origin || '',
    userAgent: params.userAgent || ''
  };
}

// ===================================
// Verfügbarkeits-Management
// ===================================

function checkAvailability(checkinStr, checkoutStr, rooms) {
  const sheet = getSheet(CONFIG.AVAILABILITY_SHEET);
  const data = sheet.getDataRange().getValues();

  const checkin = new Date(checkinStr);
  const checkout = new Date(checkoutStr);

  let available = true;
  let unavailableRooms = [];

  for (let date = new Date(checkin); date < checkout; date.setDate(date.getDate() + 1)) {
    const dateStr = formatDate(date);
    const rowIndex = data.findIndex(row => formatDate(row[0]) === dateStr);

    if (rowIndex === -1) {
      available = false;
      unavailableRooms.push({ date: dateStr, reason: 'Datum nicht im System' });
      continue;
    }

    const row = data[rowIndex];
    const availableEinzelzimmer = row[1] || 0;
    const availableDoppelzimmer = row[2] || 0;
    const availableFamilienzimmer = row[3] || 0;

    if (rooms.einzelzimmer > availableEinzelzimmer) {
      available = false;
      unavailableRooms.push({ date: dateStr, room: 'Einzelzimmer' });
    }
    if (rooms.doppelzimmer > availableDoppelzimmer) {
      available = false;
      unavailableRooms.push({ date: dateStr, room: 'Doppelzimmer' });
    }
    if (rooms.familienzimmer > availableFamilienzimmer) {
      available = false;
      unavailableRooms.push({ date: dateStr, room: 'Familienzimmer' });
    }
  }

  return { available, unavailableRooms };
}

function blockRooms(checkinStr, checkoutStr, rooms) {
  const sheet = getSheet(CONFIG.AVAILABILITY_SHEET);
  const data = sheet.getDataRange().getValues();

  const checkin = new Date(checkinStr);
  const checkout = new Date(checkoutStr);

  for (let date = new Date(checkin); date < checkout; date.setDate(date.getDate() + 1)) {
    const dateStr = formatDate(date);
    const rowIndex = data.findIndex(row => formatDate(row[0]) === dateStr);

    if (rowIndex !== -1) {
      const row = rowIndex + 1;

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

function saveBooking(data) {
  const sheet = getSheet(CONFIG.BOOKINGS_SHEET);
  const bookingId = 'BK' + new Date().getTime();

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

  sheet.appendRow([
    bookingId,
    new Date(),
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
    'Pending',
    '',
    new Date(),
    data.origin || '',
    data.clientIp || '',
    data.userAgent || ''
  ]);

  return bookingId;
}

function confirmBooking(bookingId) {
  const sheet = getSheet(CONFIG.BOOKINGS_SHEET);
  const data = sheet.getDataRange().getValues();
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

  sheet.getRange(rowIndex + 1, 15).setValue('Confirmed');
  sheet.getRange(rowIndex + 1, 16).setValue(Session.getActiveUser().getEmail());

  blockRooms(
    bookingData.checkin,
    bookingData.checkout,
    {
      einzelzimmer: bookingData.einzelzimmer,
      doppelzimmer: bookingData.doppelzimmer,
      familienzimmer: bookingData.familienzimmer
    }
  );

  sendGuestEmail(bookingData, 'confirmed');
  return { success: true, message: 'Buchung bestätigt!' };
}

function declineBooking(bookingId, reason) {
  const sheet = getSheet(CONFIG.BOOKINGS_SHEET);
  const data = sheet.getDataRange().getValues();
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

  sheet.getRange(rowIndex + 1, 15).setValue('Declined');
  sheet.getRange(rowIndex + 1, 16).setValue(Session.getActiveUser().getEmail());

  sendGuestEmail(bookingData, 'declined');
  return { success: true, message: 'Buchung abgelehnt!' };
}

// ===================================
// Telegram-Integration
// ===================================

function sendTelegramNotification(bookingId, data) {
  const settings = getSettings();

  if (!settings.telegramToken || !settings.telegramChatId) {
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

  const payload = {
    chat_id: settings.telegramChatId,
    text: message,
    parse_mode: 'Markdown'
  };

  UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });
}

// ===================================
// Email-Versand
// ===================================

function sendGuestEmail(data, type) {
  let subject = '';
  let body = '';

  if (type === 'received') {
    subject = 'Ihre Buchungsanfrage bei Hotel Rössle';
    body = `Sehr geehrte/r ${data.vorname} ${data.nachname},

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
Honbergstrasse 8, 78532 Tuttlingen
Tel: +49 (0) 7461 2913
info@hotelroessle.eu`;
  } else if (type === 'confirmed') {
    subject = 'Buchungsbestätigung - Hotel Rössle';
    body = `Sehr geehrte/r ${data.vorname} ${data.nachname},

wir freuen uns, Ihnen mitteilen zu können, dass Ihre Buchung bestätigt wurde!

Ihre Buchungsdetails:
- Check-In: ${formatDate(data.checkin)} (ab 14:00 Uhr)
- Check-Out: ${formatDate(data.checkout)} (bis 11:00 Uhr)
${data.einzelzimmer > 0 ? `- ${data.einzelzimmer}x Einzelzimmer\n` : ''}${data.doppelzimmer > 0 ? `- ${data.doppelzimmer}x Doppelzimmer\n` : ''}${data.familienzimmer > 0 ? `- ${data.familienzimmer}x Familienzimmer\n` : ''}
Wir freuen uns auf Ihren Besuch!

Mit freundlichen Grüßen
Ihr Team vom Hotel Rössle

---
Hotel Rössle Tuttlingen
Honbergstrasse 8, 78532 Tuttlingen
Tel: +49 (0) 7461 2913`;
  } else if (type === 'declined') {
    subject = 'Buchungsanfrage - Hotel Rössle';
    body = `Sehr geehrte/r ${data.vorname} ${data.nachname},

leider müssen wir Ihnen mitteilen, dass Ihre angefragten Zimmer zum gewünschten Zeitraum nicht verfügbar sind.

${data.reason ? `Grund: ${data.reason}\n\n` : ''}Gerne können Sie uns für alternative Termine kontaktieren.

Mit freundlichen Grüßen
Ihr Team vom Hotel Rössle`;
  }

  try {
    MailApp.sendEmail({
      to: data.email,
      subject: subject,
      body: body
    });
  } catch (error) {
    Logger.log('Email-Fehler: ' + error);
  }
}

// ===================================
// Hilfs-Funktionen
// ===================================

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

function getSheet(sheetName) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  return spreadsheet.getSheetByName(sheetName);
}

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

function getSpreadsheetUrl() {
  return SpreadsheetApp.getActiveSpreadsheet().getUrl();
}

function formatDate(date) {
  if (typeof date === 'string') {
    date = new Date(date);
  }
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
}

// ===================================
// SPAM-SCHUTZ FUNKTIONEN
// ===================================

/**
 * Prüft ob die Anfrage von einer erlaubten Website kommt
 */
function isAllowedOrigin(origin) {
  if (!origin) {
    return false;
  }

  const normalized = normalizeOrigin(origin);
  return NORMALIZED_ALLOWED_ORIGINS.indexOf(normalized) !== -1;
}

/**
 * Rate Limiting: Verhindert zu viele Buchungen von derselben Email
 */
function checkRateLimit(email, ip) {
  const normalizedEmail = (email || '').toLowerCase();
  const clientIp = ip || 'unknown';
  const now = Date.now();
  const emailWindowStart = now - 24 * 60 * 60 * 1000;
  const ipWindowStart = now - 60 * 60 * 1000;

  const store = loadRateLimitStore();

  const emailEntries = pruneTimestamps(store.email[normalizedEmail] || [], emailWindowStart);
  const ipEntries = pruneTimestamps(store.ip[clientIp] || [], ipWindowStart);

  store.email[normalizedEmail] = emailEntries;
  store.ip[clientIp] = ipEntries;

  if (normalizedEmail) {
    const sheetCheck = checkEmailRateLimitInSheet(normalizedEmail, emailWindowStart);
    if (!sheetCheck.allowed) {
      saveRateLimitStore(store);
      return sheetCheck;
    }
  }

  if (emailEntries.length >= CONFIG.MAX_BOOKINGS_PER_EMAIL_PER_DAY) {
    saveRateLimitStore(store);
    return {
      allowed: false,
      message: 'Sie haben bereits mehrere Buchungsanfragen gesendet. Bitte warten Sie auf unsere Antwort.'
    };
  }

  if (CONFIG.MAX_BOOKINGS_PER_IP_PER_HOUR && ipEntries.length >= CONFIG.MAX_BOOKINGS_PER_IP_PER_HOUR) {
    saveRateLimitStore(store);
    return {
      allowed: false,
      message: 'Von Ihrer IP-Adresse sind bereits mehrere Buchungsanfragen eingegangen. Bitte versuchen Sie es später erneut.'
    };
  }

  emailEntries.push(now);
  ipEntries.push(now);
  store.email[normalizedEmail] = emailEntries;
  store.ip[clientIp] = ipEntries;
  saveRateLimitStore(store);

  return { allowed: true };
}

function loadRateLimitStore() {
  try {
    const props = PropertiesService.getScriptProperties();
    const raw = props.getProperty(RATE_LIMIT_PROPERTY_KEY);
    if (!raw) {
      return { email: {}, ip: {} };
    }
    const parsed = JSON.parse(raw);
    const emailStore = typeof parsed.email === 'object' && parsed.email !== null ? parsed.email : {};
    const ipStore = typeof parsed.ip === 'object' && parsed.ip !== null ? parsed.ip : {};
    return { email: emailStore, ip: ipStore };
  } catch (error) {
    Logger.log('RateLimitStore (load) Fehler: ' + error);
    return { email: {}, ip: {} };
  }
}

function saveRateLimitStore(store) {
  try {
    const props = PropertiesService.getScriptProperties();
    props.setProperty(RATE_LIMIT_PROPERTY_KEY, JSON.stringify(store));
  } catch (error) {
    Logger.log('RateLimitStore (save) Fehler: ' + error);
  }
}

function pruneTimestamps(timestamps, minTimestamp) {
  if (!Array.isArray(timestamps)) {
    return [];
  }
  return timestamps
    .map(function (value) { return Number(value); })
    .filter(function (value) { return !isNaN(value) && value >= minTimestamp; });
}

function checkEmailRateLimitInSheet(email, windowStart) {
  if (!email) {
    return { allowed: true };
  }

  const sheet = getSheet(CONFIG.BOOKINGS_SHEET);
  if (!sheet) {
    return { allowed: true };
  }

  const data = sheet.getDataRange().getValues();
  let bookingsLast24h = 0;

  for (let i = 1; i < data.length; i++) {
    const rowEmail = (data[i][4] || '').toString().toLowerCase();
    if (rowEmail !== email) {
      continue;
    }

    const timestamp = data[i][1];
    const createdAt = timestamp instanceof Date ? timestamp : new Date(timestamp);
    if (!isNaN(createdAt.getTime()) && createdAt.getTime() > windowStart) {
      bookingsLast24h++;
    }
  }

  if (bookingsLast24h >= CONFIG.MAX_BOOKINGS_PER_EMAIL_PER_DAY) {
    return {
      allowed: false,
      message: 'Sie haben bereits mehrere Buchungsanfragen gesendet. Bitte warten Sie auf unsere Antwort.'
    };
  }

  return { allowed: true };
}

/**
 * Plausibilitätsprüfung: Verhindert unsinnige Buchungen
 */
function checkPlausibility(data) {
  const checkin = new Date(data.checkin);
  const checkout = new Date(data.checkout);
  const now = new Date();

  // Check-in darf nicht in der Vergangenheit liegen
  if (checkin < now) {
    return {
      valid: false,
      reason: 'Check-in-Datum muss in der Zukunft liegen.'
    };
  }

  // Check-out muss nach Check-in sein
  if (checkout <= checkin) {
    return {
      valid: false,
      reason: 'Check-out muss nach Check-in liegen.'
    };
  }

  // Anzahl Nächte prüfen
  const nights = Math.ceil((checkout - checkin) / (1000 * 60 * 60 * 24));
  if (nights < CONFIG.MIN_NIGHTS) {
    return {
      valid: false,
      reason: `Mindestens ${CONFIG.MIN_NIGHTS} Nacht erforderlich.`
    };
  }
  if (nights > CONFIG.MAX_NIGHTS) {
    return {
      valid: false,
      reason: `Maximal ${CONFIG.MAX_NIGHTS} Nächte buchbar.`
    };
  }

  // Gesamtzahl Zimmer prüfen
  const totalRooms = (data.einzelzimmer || 0) + (data.doppelzimmer || 0) + (data.familienzimmer || 0);
  if (totalRooms > CONFIG.MAX_ROOMS_TOTAL) {
    return {
      valid: false,
      reason: `Maximal ${CONFIG.MAX_ROOMS_TOTAL} Zimmer auf einmal buchbar.`
    };
  }

  // Email-Format prüfen
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(data.email)) {
    return {
      valid: false,
      reason: 'Ungültiges E-Mail-Format.'
    };
  }

  // Namen prüfen (keine Zahlen/Sonderzeichen am Anfang)
  const nameRegex = /^[a-zA-ZäöüÄÖÜß]/;
  if (!nameRegex.test(data.vorname) || !nameRegex.test(data.nachname)) {
    return {
      valid: false,
      reason: 'Ungültiger Name.'
    };
  }

  // Check-in nicht zu weit in der Zukunft (z.B. max 1 Jahr)
  const oneYearFromNow = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
  if (checkin > oneYearFromNow) {
    return {
      valid: false,
      reason: 'Check-in-Datum zu weit in der Zukunft.'
    };
  }

  return { valid: true };
}

/**
 * Manuelle Blockierungsliste (optional)
 */
function isBlocked(email) {
  // Hier können Sie manuell Email-Adressen blockieren
  const blockedEmails = [
    // 'spammer@example.com',
    // 'test@test.com'
  ];

  return blockedEmails.includes(email.toLowerCase());
}

/**
 * Admin-Funktion: Email blockieren
 */
function blockEmail(email) {
  const sheet = getSheet(CONFIG.SETTINGS_SHEET);

  // Prüfe ob "Blockierte Emails" Sheet existiert, sonst erstelle es
  let blockedSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Blockierte Emails');
  if (!blockedSheet) {
    blockedSheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet('Blockierte Emails');
    blockedSheet.appendRow(['Email', 'Blockiert am', 'Grund']);
  }

  blockedSheet.appendRow([email, new Date(), 'Manuell blockiert']);

  Logger.log('Email blockiert: ' + email);
}
