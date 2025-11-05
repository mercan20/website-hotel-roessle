<?php
// contact.php - verarbeitet Kontaktformular und versendet E-Mails

declare(strict_types=1);

// UTF-8 als Standard setzen
mb_internal_encoding('UTF-8');
header('Content-Type: text/html; charset=UTF-8');

require_once __DIR__ . '/php/form_utils.php';

// Konfiguration
$recipient = 'info@gast-roessle.de';
$subjectPrefix = 'Kontaktformular Hotel Rössle';
$returnPath = 'info@gast-roessle.de'; // Wichtig für Hoster wie Strato

form_configure_mail($returnPath, '/usr/sbin/sendmail');

const ALLOWED_ORIGINS = [
    'https://www.hotelroessle.eu',
    'https://hotelroessle.eu',
    'http://www.hotelroessle.eu',
    'http://hotelroessle.eu',
    'https://www.gast-roessle.de',
    'https://gast-roessle.de',
    'http://www.gast-roessle.de',
    'http://gast-roessle.de',
];

const MAX_EMAILS_PER_DAY = 3;
const MAX_EMAILS_PER_IP_PER_HOUR = 5;
const MIN_MESSAGE_LENGTH = 20;
const MAX_MESSAGE_LENGTH = 4000;
const RATE_LIMIT_FILE = 'hotel_roessle_contact_limits.json';
const CONTACT_LOG_CONTEXT = 'contact';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo '<h1>Method Not Allowed</h1>';
    exit;
}

if (!form_is_origin_allowed(ALLOWED_ORIGINS)) {
    http_response_code(403);
    echo '<h1>Zugriff verweigert</h1>';
    echo '<p>Diese Anfrage stammt nicht von einer erlaubten Website.</p>';
    echo '<p><a href="index.html#kontakt">Zurück zum Kontaktformular</a></p>';
    exit;
}

$name = form_get_post_value('name');
$email = filter_var($_POST['email'] ?? '', FILTER_SANITIZE_EMAIL);
$subject = form_get_post_value('subject');
$message = form_get_post_value('message');
$phone = form_get_post_value('phone');
$honeypot = form_get_post_value('company');

$errors = [];

if ($honeypot !== '') {
    $errors[] = 'Ungültige Anfrage erkannt.';
}

if ($name === '') {
    $errors[] = 'Bitte geben Sie Ihren Namen an.';
} elseif (mb_strlen($name) > 120) {
    $errors[] = 'Der Name ist zu lang.';
}

if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors[] = 'Bitte geben Sie eine gültige E-Mail-Adresse an.';
}

if ($subject === '') {
    $errors[] = 'Bitte wählen Sie einen Betreff aus.';
} elseif (mb_strlen($subject) > 120) {
    $errors[] = 'Der Betreff ist zu lang.';
}

if ($message === '') {
    $errors[] = 'Bitte schreiben Sie eine Nachricht.';
} elseif (mb_strlen($message) < MIN_MESSAGE_LENGTH) {
    $errors[] = 'Die Nachricht muss mindestens ' . MIN_MESSAGE_LENGTH . ' Zeichen enthalten.';
} elseif (mb_strlen($message) > MAX_MESSAGE_LENGTH) {
    $errors[] = 'Die Nachricht darf maximal ' . number_format(MAX_MESSAGE_LENGTH, 0, ',', '.') . ' Zeichen enthalten.';
}

if ($phone !== '' && mb_strlen($phone) > 60) {
    $errors[] = 'Die Telefonnummer ist zu lang.';
}

if ($errors !== []) {
    form_log_event(CONTACT_LOG_CONTEXT, 'Validation failed', [
        'email' => $email,
        'ip' => $clientIpRaw,
    ]);
    http_response_code(400);
    echo '<h1>Fehler beim Versenden</h1>';
    echo '<ul>';
    foreach ($errors as $error) {
        echo '<li>' . htmlspecialchars($error, ENT_QUOTES, 'UTF-8') . '</li>';
    }
    echo '</ul>';
    echo '<p><a href="index.html#kontakt">Zurück zum Kontaktformular</a></p>';
    exit;
}

$clientIpRaw = $_SERVER['REMOTE_ADDR'] ?? '';
$clientIp = filter_var($clientIpRaw, FILTER_VALIDATE_IP) ?: 'unknown';
$rateLimitData = form_load_rate_limits(RATE_LIMIT_FILE);
$rateLimitResult = form_enforce_rate_limits(
    $rateLimitData,
    $email,
    $clientIp,
    MAX_EMAILS_PER_DAY,
    MAX_EMAILS_PER_IP_PER_HOUR,
    'Sie haben bereits mehrere Nachrichten gesendet. Bitte versuchen Sie es später erneut.',
    'Von Ihrer IP-Adresse sind bereits mehrere Anfragen eingegangen. Bitte versuchen Sie es später erneut.'
);

if ($rateLimitResult['status'] === false) {
    form_log_event(CONTACT_LOG_CONTEXT, 'Rate limit triggered', [
        'email' => $email,
        'ip' => $clientIp,
    ]);
    http_response_code(429);
    echo '<h1>Zu viele Anfragen</h1>';
    echo '<p>' . htmlspecialchars($rateLimitResult['message'], ENT_QUOTES, 'UTF-8') . '</p>';
    echo '<p><a href="index.html#kontakt">Zurück zum Kontaktformular</a></p>';
    exit;
}

// E-Mail-Inhalt erstellen
$emailSubject = $subjectPrefix . ' – ' . form_sanitize_header_value($subject);

$lines = [
    'Neue Kontaktanfrage über hotelroessle.eu',
    '---------------------------------------',
    'Name: ' . $name,
    'E-Mail: ' . $email,
];

if ($phone !== '') {
    $lines[] = 'Telefon: ' . $phone;
}

$lines[] = 'Betreff: ' . $subject;
$lines[] = '';
$lines[] = 'Nachricht:';
$lines[] = $message;
$lines[] = '';
$lines[] = 'IP-Adresse: ' . ($_SERVER['REMOTE_ADDR'] ?? 'unbekannt');
$lines[] = 'User-Agent: ' . ($_SERVER['HTTP_USER_AGENT'] ?? 'unbekannt');

$emailBody = implode("\n", $lines);

$headers = [
    'From' => sprintf('"%s" <%s>', mb_encode_mimeheader('Hotel Rössle'), $recipient),
    'Reply-To' => sprintf('"%s" <%s>', mb_encode_mimeheader(form_sanitize_header_value($name)), $email),
    'X-Mailer' => 'PHP/' . PHP_VERSION,
    'Content-Type' => 'text/plain; charset=UTF-8',
];

$formattedHeaders = '';
foreach ($headers as $key => $value) {
    $formattedHeaders .= $key . ': ' . $value . "\r\n";
}

$additionalParameters = sprintf('-f%s', $returnPath);

$mailContext = [
    'email' => $email,
    'recipient' => $recipient,
    'ip' => $clientIp,
];

form_log_event(CONTACT_LOG_CONTEXT, 'Attempting to send contact email', $mailContext);

$mailSent = mail(
    $recipient,
    $emailSubject,
    $emailBody,
    $formattedHeaders,
    $additionalParameters
);

if (!$mailSent) {
    form_log_event(CONTACT_LOG_CONTEXT, 'Contact email send failed', $mailContext);
    http_response_code(500);
    echo '<h1>Versand fehlgeschlagen</h1>';
    echo '<p>Bitte versuchen Sie es später erneut oder kontaktieren Sie uns telefonisch.</p>';
    echo '<p><a href="index.html#kontakt">Zurück zum Kontaktformular</a></p>';
    exit;
}

form_save_rate_limits(RATE_LIMIT_FILE, $rateLimitResult['data']);

form_log_event(CONTACT_LOG_CONTEXT, 'Contact email sent successfully', $mailContext);

$ackSubject = form_sanitize_header_value('Ihre Nachricht an das Hotel Rössle');
$ackLines = [];
$ackLines[] = 'Guten Tag ' . $name . ',';
$ackLines[] = '';
$ackLines[] = 'vielen Dank für Ihre Nachricht. Wir haben Ihre Anfrage erhalten und melden uns zeitnah.';

if ($subject !== '') {
    $ackLines[] = '';
    $ackLines[] = 'Betreff: ' . $subject;
}

$ackLines[] = '';
$ackLines[] = 'Bei Rückfragen antworten Sie gerne direkt auf diese E-Mail.';

$signature = form_load_email_signature();
if ($signature !== '') {
    $ackLines[] = '';
    $ackLines[] = $signature;
}

$ackBody = implode("\n", $ackLines) . "\n";

$ackHeaders = [
    'From' => sprintf('"%s" <%s>', mb_encode_mimeheader('Hotel Rössle'), $recipient),
    'Reply-To' => sprintf('"%s" <%s>', mb_encode_mimeheader('Hotel Rössle'), $recipient),
    'X-Mailer' => 'PHP/' . PHP_VERSION,
    'Content-Type' => 'text/plain; charset=UTF-8',
];

$ackFormattedHeaders = '';
foreach ($ackHeaders as $key => $value) {
    $ackFormattedHeaders .= $key . ': ' . $value . "\r\n";
}

$ackSent = mail(
    $email,
    $ackSubject,
    $ackBody,
    $ackFormattedHeaders,
    $additionalParameters
);

if (!$ackSent) {
    form_log_event(CONTACT_LOG_CONTEXT, 'Contact acknowledgement email failed', ['email' => $email]);
} else {
    form_log_event(CONTACT_LOG_CONTEXT, 'Contact acknowledgement email sent', ['email' => $email]);
}

?>
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <title>Nachricht gesendet – Hotel Rössle</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="css/new-style.css">
</head>
<body class="section-contact">
    <main style="max-width: 720px; margin: 3rem auto; padding: 2rem; background: #fff; border-radius: 12px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);">
        <h1>Vielen Dank für Ihre Nachricht!</h1>
        <p>Wir haben Ihre Anfrage erhalten und melden uns so schnell wie möglich bei Ihnen.</p>
        <p><a href="index.html" style="color: #b48b36; font-weight: 600;">Zurück zur Startseite</a></p>
    </main>
</body>
</html>
