<?php
declare(strict_types=1);

mb_internal_encoding('UTF-8');
date_default_timezone_set('Europe/Berlin');
header('Content-Type: application/json; charset=UTF-8');

require_once __DIR__ . '/php/form_utils.php';

$recipient = 'info@hotelroessle.eu';
$subjectPrefix = 'Buchungsanfrage Hotel Rössle';
$returnPath = 'info@hotelroessle.eu';

form_configure_mail($returnPath, '/usr/sbin/sendmail');

const BOOKING_ALLOWED_ORIGINS = [
    'https://www.hotelroessle.eu',
    'https://hotelroessle.eu',
    'http://www.hotelroessle.eu',
    'http://hotelroessle.eu',
    'https://www.gast-roessle.de',
    'https://gast-roessle.de',
    'http://www.gast-roessle.de',
    'http://gast-roessle.de',
];

const BOOKING_MAX_EMAILS_PER_DAY = 3;
const BOOKING_MAX_EMAILS_PER_IP_PER_HOUR = 5;
const BOOKING_MIN_NIGHTS = 1;
const BOOKING_MAX_NIGHTS = 30;
const BOOKING_MAX_ROOMS_TOTAL = 18;
const BOOKING_RATE_LIMIT_FILE = 'hotel_roessle_booking_limits.json';
const BOOKING_LOG_CONTEXT = 'booking';
const BOOKING_MAX_NOTES_LENGTH = 1000;
const BOOKING_MAX_COMPANY_LENGTH = 160;

const BOOKING_ROOM_LIMITS = [
    'einzelzimmer' => 5,
    'doppelzimmer' => 10,
    'familienzimmer' => 3,
];
const BOOKING_NAME_PATTERN = "/^[A-Za-zÀ-ÖØ-öø-ÿ' \-]{2,}$/u";
const BOOKING_PHONE_PATTERN = '/^[0-9+()\\s-]{6,}$/';
const BOOKING_MAX_ADVANCE_DAYS = 365;

function respondWithJson(int $status, array $payload): void
{
    http_response_code($status);
    $json = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($json === false) {
        $json = json_encode([
            'success' => false,
            'message' => 'Die Anfrage konnte nicht verarbeitet werden.',
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }
    echo (string)$json;
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respondWithJson(405, [
        'success' => false,
        'message' => 'Method Not Allowed',
    ]);
}

if (!form_is_origin_allowed(BOOKING_ALLOWED_ORIGINS)) {
    respondWithJson(403, [
        'success' => false,
        'message' => 'Diese Anfrage stammt nicht von einer erlaubten Website.',
    ]);
}

$honeypot = form_get_post_value('website');
if ($honeypot !== '') {
    respondWithJson(400, [
        'success' => false,
        'message' => 'Die Anfrage konnte nicht verarbeitet werden.',
    ]);
}

$firstName = form_get_post_value('vorname');
$lastName = form_get_post_value('nachname');
$company = form_get_post_value('company');
$emailRaw = form_get_post_value('email');
$email = filter_var($emailRaw, FILTER_SANITIZE_EMAIL) ?: '';
$phone = form_get_post_value('telefon');
$notes = form_get_post_value('wuensche');
$checkinRaw = form_get_post_value('checkin');
$checkoutRaw = form_get_post_value('checkout');
$originSent = form_get_post_value('origin');
$userAgentSent = form_get_post_value('userAgent');

$errors = [];

if ($firstName === '' || $lastName === '' || $email === '' || $phone === '') {
    $errors[] = 'Bitte füllen Sie alle Pflichtfelder aus.';
}

if (!preg_match(BOOKING_NAME_PATTERN, $firstName)) {
    $errors[] = 'Bitte geben Sie einen gültigen Vornamen ein.';
}

if (!preg_match(BOOKING_NAME_PATTERN, $lastName)) {
    $errors[] = 'Bitte geben Sie einen gültigen Nachnamen ein.';
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors[] = 'Bitte geben Sie eine gültige E-Mail-Adresse an.';
}

if (!preg_match(BOOKING_PHONE_PATTERN, $phone)) {
    $errors[] = 'Bitte geben Sie eine gültige Telefonnummer an.';
}

if ($notes !== '' && mb_strlen($notes) > BOOKING_MAX_NOTES_LENGTH) {
    $errors[] = 'Die Nachricht für besondere Wünsche ist zu lang.';
}

if ($company !== '' && mb_strlen($company) > BOOKING_MAX_COMPANY_LENGTH) {
    $errors[] = 'Der Firmenname ist zu lang.';
}

$checkin = DateTimeImmutable::createFromFormat('Y-m-d', $checkinRaw) ?: null;
$checkout = DateTimeImmutable::createFromFormat('Y-m-d', $checkoutRaw) ?: null;

if ($checkin === null || $checkout === null) {
    $errors[] = 'Bitte wählen Sie An- und Abreisedatum aus.';
}

if ($checkin !== null && $checkout !== null && $checkout <= $checkin) {
    $errors[] = 'Der Check-out muss nach dem Check-in liegen.';
}

$today = new DateTimeImmutable('today');
if ($checkin !== null && $checkin < $today) {
    $errors[] = 'Der Check-in darf nicht in der Vergangenheit liegen.';
}

$maxAdvanceDate = $today->modify('+' . BOOKING_MAX_ADVANCE_DAYS . ' days');
if ($checkin !== null && $checkin > $maxAdvanceDate) {
    $errors[] = 'Der Check-in darf höchstens ein Jahr im Voraus liegen.';
}

$nights = 0;
if ($checkin !== null && $checkout !== null && $errors === []) {
    $nights = (int)$checkin->diff($checkout)->format('%a');
    if ($nights < BOOKING_MIN_NIGHTS) {
        $errors[] = 'Es muss mindestens eine Nacht gebucht werden.';
    }
    if ($nights > BOOKING_MAX_NIGHTS) {
        $errors[] = 'Es können maximal 30 Nächte am Stück gebucht werden.';
    }
}

$einzelzimmer = filter_var($_POST['einzelzimmer'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 0]]) ?? 0;
$doppelzimmer = filter_var($_POST['doppelzimmer'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 0]]) ?? 0;
$familienzimmer = filter_var($_POST['familienzimmer'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 0]]) ?? 0;

$totalRooms = $einzelzimmer + $doppelzimmer + $familienzimmer;
if ($totalRooms === 0) {
    $errors[] = 'Bitte wählen Sie mindestens ein Zimmer aus.';
}

if ($totalRooms > BOOKING_MAX_ROOMS_TOTAL) {
    $errors[] = 'Es können maximal ' . BOOKING_MAX_ROOMS_TOTAL . ' Zimmer pro Anfrage gebucht werden.';
}

if ($einzelzimmer > BOOKING_ROOM_LIMITS['einzelzimmer']) {
    $errors[] = 'Für Einzelzimmer können maximal ' . BOOKING_ROOM_LIMITS['einzelzimmer'] . ' Zimmer angefragt werden.';
}

if ($doppelzimmer > BOOKING_ROOM_LIMITS['doppelzimmer']) {
    $errors[] = 'Für Doppelzimmer können maximal ' . BOOKING_ROOM_LIMITS['doppelzimmer'] . ' Zimmer angefragt werden.';
}

if ($familienzimmer > BOOKING_ROOM_LIMITS['familienzimmer']) {
    $errors[] = 'Für Familienzimmer können maximal ' . BOOKING_ROOM_LIMITS['familienzimmer'] . ' Zimmer angefragt werden.';
}

if ($errors !== []) {
    respondWithJson(400, [
        'success' => false,
        'message' => $errors[0],
        'errors' => $errors,
    ]);
}

$rateLimitData = form_load_rate_limits(BOOKING_RATE_LIMIT_FILE);
$clientIpRaw = $_SERVER['REMOTE_ADDR'] ?? '';
$clientIp = filter_var($clientIpRaw, FILTER_VALIDATE_IP) ?: 'unbekannt';
$rateLimitResult = form_enforce_rate_limits(
    $rateLimitData,
    $email,
    $clientIp,
    BOOKING_MAX_EMAILS_PER_DAY,
    BOOKING_MAX_EMAILS_PER_IP_PER_HOUR,
    'Sie haben bereits mehrere Buchungsanfragen gesendet. Bitte warten Sie auf unsere Antwort.',
    'Von Ihrer IP-Adresse sind bereits mehrere Anfragen eingegangen. Bitte versuchen Sie es später erneut.'
);
if ($rateLimitResult['status'] === false) {
    form_log_event(BOOKING_LOG_CONTEXT, 'Rate limit triggered', [
        'email' => $email,
        'ip' => $clientIp,
    ]);
    respondWithJson(429, [
        'success' => false,
        'message' => $rateLimitResult['message'] ?? 'Zu viele Anfragen. Bitte versuchen Sie es später erneut.',
    ]);
}

$checkinForMail = $checkin?->format('d.m.Y') ?? 'unbekannt';
$checkoutForMail = $checkout?->format('d.m.Y') ?? 'unbekannt';

$lines = [];
$lines[] = 'Neue Buchungsanfrage über die Website:';
$lines[] = '';
$lines[] = 'Name: ' . $firstName . ' ' . $lastName;
$lines[] = 'E-Mail: ' . $email;
$lines[] = 'Telefon: ' . $phone;
if ($company !== '') {
    $lines[] = 'Firma: ' . $company;
}
$lines[] = '';
$lines[] = 'Reisedaten:';
$lines[] = '  Check-in: ' . $checkinForMail;
$lines[] = '  Check-out: ' . $checkoutForMail;
$lines[] = '  Nächte: ' . $nights;
$lines[] = '';
$lines[] = 'Zimmerwunsch:';
$lines[] = '  Einzelzimmer: ' . $einzelzimmer;
$lines[] = '  Doppelzimmer: ' . $doppelzimmer;
$lines[] = '  Familienzimmer: ' . $familienzimmer;

if ($notes !== '') {
    $lines[] = '';
    $lines[] = 'Besondere Wünsche:';
    $lines[] = '  ' . $notes;
}

$metadata = [];
$metadata[] = 'IP-Adresse: ' . $clientIp;
$metadata[] = 'Browser: ' . ($userAgentSent !== '' ? $userAgentSent : ($_SERVER['HTTP_USER_AGENT'] ?? 'unbekannt'));
$originSource = $originSent !== '' ? $originSent : form_determine_origin();
if ($originSource !== '') {
    $metadata[] = 'Ursprung: ' . $originSource;
}
$metadata[] = 'Übermittelt am: ' . (new DateTimeImmutable('now', new DateTimeZone('Europe/Berlin')))->format('d.m.Y H:i:s');

$lines[] = '';
$lines[] = 'Technische Angaben:';
foreach ($metadata as $metaLine) {
    $lines[] = '  ' . $metaLine;
}

$messageBody = implode("\n", $lines) . "\n";

$subjectParts = [
    $subjectPrefix,
    trim($firstName . ' ' . $lastName),
];
if ($checkin !== null && $checkout !== null) {
    $subjectParts[] = $checkinForMail . ' – ' . $checkoutForMail;
}

$subjectRaw = form_sanitize_header_value(implode(' | ', array_filter($subjectParts)));
$subject = mb_encode_mimeheader($subjectRaw, 'UTF-8', 'B', "\r\n");

$fromNameRaw = form_sanitize_header_value('Hotel Rössle');
$fromNameEncoded = mb_encode_mimeheader($fromNameRaw, 'UTF-8', 'B', "\r\n");
$replyToNameRaw = form_sanitize_header_value(trim($firstName . ' ' . $lastName));
$replyToNameEncoded = $replyToNameRaw !== ''
    ? mb_encode_mimeheader($replyToNameRaw, 'UTF-8', 'B', "\r\n")
    : '';

$headers = [
    sprintf('From: %s <%s>', $fromNameEncoded, $recipient),
    'Reply-To: ' . ($replyToNameEncoded !== ''
        ? sprintf('%s <%s>', $replyToNameEncoded, $email)
        : $email),
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'X-Mailer: PHP/' . PHP_VERSION,
];

$mailContext = [
    'email' => $email,
    'recipient' => $recipient,
    'ip' => $clientIp,
];

form_log_event(BOOKING_LOG_CONTEXT, 'Attempting to send booking email', $mailContext);

$mailSent = mail(
    $recipient,
    $subject,
    $messageBody,
    implode("\r\n", $headers),
    '-f' . $returnPath
);

if (!$mailSent) {
    form_log_event(BOOKING_LOG_CONTEXT, 'Booking email send failed', $mailContext);
    respondWithJson(500, [
        'success' => false,
        'message' => 'Die Anfrage konnte nicht gesendet werden. Bitte versuchen Sie es später erneut.',
    ]);
}

form_save_rate_limits(BOOKING_RATE_LIMIT_FILE, $rateLimitResult['data']);

form_log_event(BOOKING_LOG_CONTEXT, 'Booking email sent successfully', $mailContext);

$ackSubject = mb_encode_mimeheader(
    form_sanitize_header_value('Ihre Buchungsanfrage beim Hotel Rössle'),
    'UTF-8',
    'B',
    "\r\n"
);
$ackLines = [];
$ackLines[] = 'Guten Tag ' . trim($firstName . ' ' . $lastName) . ',';
$ackLines[] = '';
$ackLines[] = 'vielen Dank für Ihre Buchungsanfrage. Wir haben Ihre Nachricht erhalten und melden uns zeitnah.';

if ($company !== '') {
    $ackLines[] = '';
    $ackLines[] = 'Hinterlegter Firmenname: ' . $company;
}

if ($checkin !== null && $checkout !== null) {
    $roomParts = [];
    if ($einzelzimmer > 0) {
        $roomParts[] = $einzelzimmer . ' Einzelzimmer';
    }
    if ($doppelzimmer > 0) {
        $roomParts[] = $doppelzimmer . ' Doppelzimmer';
    }
    if ($familienzimmer > 0) {
        $roomParts[] = $familienzimmer . ' Familienzimmer';
    }

    $periodLine = 'Wir haben Ihre Anfrage für den Zeitraum ' . $checkinForMail . ' bis ' . $checkoutForMail;
    if ($roomParts !== []) {
        $periodLine .= ' für ' . implode(', ', $roomParts);
    }
    $periodLine .= ' erhalten.';

    $ackLines[] = '';
    $ackLines[] = $periodLine;
}

$ackLines[] = '';
$ackLines[] = 'Bei Rückfragen antworten Sie einfach auf diese E-Mail.';

$signature = form_load_email_signature();
if ($signature !== '') {
    $ackLines[] = '';
    $ackLines[] = $signature;
}

$ackBody = implode("\n", $ackLines) . "\n";

$ackHeaders = [
    sprintf('From: %s <%s>', $fromNameEncoded, $recipient),
    sprintf('Reply-To: %s <%s>', $fromNameEncoded, $recipient),
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'X-Mailer: PHP/' . PHP_VERSION,
];

$ackSent = mail(
    $email,
    $ackSubject,
    $ackBody,
    implode("\r\n", $ackHeaders),
    '-f' . $returnPath
);

if (!$ackSent) {
    form_log_event(BOOKING_LOG_CONTEXT, 'Booking acknowledgement email failed', ['email' => $email]);
} else {
    form_log_event(BOOKING_LOG_CONTEXT, 'Booking acknowledgement email sent', ['email' => $email]);
}

respondWithJson(200, [
    'success' => true,
    'message' => 'Vielen Dank! Ihre Buchungsanfrage wurde erfolgreich übermittelt.',
]);
