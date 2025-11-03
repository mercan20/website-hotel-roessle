<?php
declare(strict_types=1);

/**
 * Konfigurationswerte für den Mailversand
 * Passen Sie diese Werte an die Zieladresse und Ihre Domain an.
 */
const CONTACT_RECIPIENT = 'info@hotelroessle.eu';
const CONTACT_SENDER_ADDRESS = 'no-reply@hotelroessle.eu';
const CONTACT_SENDER_NAME = 'Hotel Rössle Website';
const CONTACT_RATE_LIMIT_MAX = 3;
const CONTACT_RATE_LIMIT_WINDOW = 900; // 15 Minuten

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Ungültige Anfragemethode.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$rawInput = (string) file_get_contents('php://input');
$data = json_decode($rawInput, true);

if (!is_array($data)) {
    $data = $_POST;
}

if (!is_array($data)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Ihre Anfrage konnte nicht verarbeitet werden.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$name = trim((string) ($data['name'] ?? ''));
$email = trim((string) ($data['email'] ?? ''));
$subjectKey = trim((string) ($data['subject'] ?? ''));
$message = trim((string) ($data['message'] ?? ''));
$honeypot = trim((string) ($data['website'] ?? ''));
$timestampRaw = (string) ($data['form_timestamp'] ?? '');

if ($honeypot !== '') {
    echo json_encode([
        'success' => true,
        'message' => 'Vielen Dank für Ihre Nachricht!'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$errors = [];

if ($name === '' || mb_strlen($name) < 3) {
    $errors[] = 'Bitte geben Sie Ihren vollständigen Namen an.';
} elseif (mb_strlen($name) > 120) {
    $errors[] = 'Der Name darf höchstens 120 Zeichen lang sein.';
}

if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors[] = 'Bitte geben Sie eine gültige E-Mail-Adresse an.';
} elseif (mb_strlen($email) > 190) {
    $errors[] = 'Die E-Mail-Adresse ist zu lang.';
}

$allowedSubjects = [
    'allgemein' => 'Allgemeine Anfrage',
    'zimmer' => 'Zimmeranfrage',
    'event' => 'Event-Anfrage',
    'sonstiges' => 'Sonstiges'
];

if ($subjectKey === '' || !array_key_exists($subjectKey, $allowedSubjects)) {
    $errors[] = 'Bitte wählen Sie einen gültigen Betreff.';
}

if ($message === '' || mb_strlen($message) < 10) {
    $errors[] = 'Bitte geben Sie eine Nachricht mit mindestens 10 Zeichen ein.';
} elseif (mb_strlen($message) > 2000) {
    $errors[] = 'Die Nachricht darf höchstens 2000 Zeichen enthalten.';
}

$timestamp = null;
if ($timestampRaw !== '') {
    if (ctype_digit($timestampRaw)) {
        $timestamp = (int) $timestampRaw;
    } else {
        $errors[] = 'Ungültiger Zeitstempel.';
    }
}

if ($timestamp !== null) {
    $now = time();
    if ($timestamp > $now + 60) {
        $errors[] = 'Der Sicherheits-Token ist ungültig. Bitte laden Sie die Seite neu.';
    } elseif (($now - $timestamp) < 3) {
        $errors[] = 'Die Nachricht wurde zu schnell gesendet. Bitte warten Sie einen Moment.';
    }
}

if ($errors) {
    http_response_code(422);
    echo json_encode([
        'success' => false,
        'message' => implode(' ', $errors)
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$rateLimitMessage = enforceRateLimit();
if ($rateLimitMessage !== null) {
    http_response_code(429);
    echo json_encode([
        'success' => false,
        'message' => $rateLimitMessage
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$subjectLine = 'Kontaktformular – ' . $allowedSubjects[$subjectKey];
$sanitizedSubject = preg_replace('/[\r\n]+/', ' ', $subjectLine) ?: $subjectLine;
$encodedSubject = function_exists('mb_encode_mimeheader')
    ? mb_encode_mimeheader($sanitizedSubject, 'UTF-8', 'B', "\r\n")
    : $sanitizedSubject;
$sanitizedName = preg_replace('/[\r\n]+/', ' ', $name) ?: $name;
$replyTo = preg_replace('/[\r\n]+/', ' ', $email) ?: $email;

$normalizedMessage = str_replace(["\r\n", "\r"], "\n", $message);

$bodyLines = [
    'Eine neue Nachricht über das Kontaktformular wurde gesendet:',
    '',
    'Name: ' . $sanitizedName,
    'E-Mail: ' . $replyTo,
    'Betreff: ' . $allowedSubjects[$subjectKey],
    '',
    'Nachricht:',
    $normalizedMessage,
    '',
    'IP-Adresse: ' . getClientIp(),
    'Gesendet am: ' . date('d.m.Y H:i:s')
];

$body = implode("\n", $bodyLines);

$headers = [
    'From: ' . formatAddress(CONTACT_SENDER_NAME, CONTACT_SENDER_ADDRESS),
    'Reply-To: ' . $replyTo,
    'Content-Type: text/plain; charset=UTF-8',
    'X-Mailer: PHP/' . PHP_VERSION
];

$mailSuccess = mail(
    CONTACT_RECIPIENT,
    $encodedSubject,
    $body,
    implode("\r\n", $headers)
);

if (!$mailSuccess) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Die E-Mail konnte nicht versendet werden. Bitte versuchen Sie es später erneut.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

http_response_code(200);

echo json_encode([
    'success' => true,
    'message' => 'Vielen Dank! Ihre Nachricht wurde erfolgreich versendet.'
], JSON_UNESCAPED_UNICODE);

exit;

function enforceRateLimit(): ?string
{
    $ip = getClientIp();
    $storageDir = __DIR__ . '/data';
    $storageFile = $storageDir . '/contact-rate-limit.json';
    $now = time();

    if (!is_dir($storageDir) && !mkdir($storageDir, 0755, true) && !is_dir($storageDir)) {
        return 'Derzeit können wir Ihre Nachricht nicht entgegennehmen. Bitte versuchen Sie es später erneut.';
    }

    $records = [];
    if (is_file($storageFile)) {
        $json = file_get_contents($storageFile);
        if ($json !== false) {
            $decoded = json_decode($json, true);
            if (is_array($decoded)) {
                $records = $decoded;
            }
        }
    }

    $windowStart = $now - CONTACT_RATE_LIMIT_WINDOW;

    foreach ($records as $recordIp => $timestamps) {
        if (!is_array($timestamps)) {
            unset($records[$recordIp]);
            continue;
        }

        $records[$recordIp] = array_values(array_filter($timestamps, static function ($timestamp) use ($windowStart) {
            return is_int($timestamp) && $timestamp >= $windowStart;
        }));
    }

    $currentCount = isset($records[$ip]) ? count($records[$ip]) : 0;
    if ($currentCount >= CONTACT_RATE_LIMIT_MAX) {
        return 'Sie haben das Limit für Nachrichten erreicht. Bitte versuchen Sie es später erneut.';
    }

    $records[$ip][] = $now;

    $encoded = json_encode($records, JSON_UNESCAPED_UNICODE);
    if ($encoded === false || file_put_contents($storageFile, $encoded, LOCK_EX) === false) {
        return 'Derzeit können wir Ihre Nachricht nicht entgegennehmen. Bitte versuchen Sie es später erneut.';
    }

    return null;
}

function getClientIp(): string
{
    $ip = $_SERVER['HTTP_CLIENT_IP'] ?? '';
    if ($ip) {
        return $ip;
    }

    $forwarded = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? '';
    if ($forwarded) {
        $parts = array_map('trim', explode(',', $forwarded));
        if ($parts !== []) {
            return (string) $parts[0];
        }
    }

    return $_SERVER['REMOTE_ADDR'] ?? 'unbekannt';
}

function formatAddress(string $name, string $email): string
{
    $cleanName = str_replace(['\r', '\n'], ' ', $name);
    $cleanEmail = str_replace(['\r', '\n'], '', $email);

    if ($cleanName === '') {
        return $cleanEmail;
    }

    return sprintf('%s <%s>', $cleanName, $cleanEmail);
}
