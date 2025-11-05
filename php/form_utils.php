<?php
declare(strict_types=1);

/**
 * Utility helpers shared by the contact and booking form handlers.
 */

if (!defined('FORM_PROJECT_ROOT')) {
    define('FORM_PROJECT_ROOT', dirname(__DIR__));
}

if (!defined('FORM_STORAGE_DIR')) {
    define('FORM_STORAGE_DIR', FORM_PROJECT_ROOT . '/var');
}

if (!defined('FORM_LOG_DIR')) {
    define('FORM_LOG_DIR', FORM_PROJECT_ROOT . '/logs');
}

/**
 * Ensure that a directory exists and is writable.
 */
function form_ensure_directory(string $directory): void
{
    if (is_dir($directory)) {
        return;
    }

    @mkdir($directory, 0775, true);
}

/**
 * Configure PHP's mail transport similar to the legacy Joomla setup.
 */
function form_configure_mail(string $fromAddress, ?string $sendmailPath = null): void
{
    if ($fromAddress !== '') {
        ini_set('sendmail_from', $fromAddress);
    }

    if ($sendmailPath !== null && $sendmailPath !== '') {
        ini_set('sendmail_path', $sendmailPath);
    }
}

function form_get_post_value(string $key): string
{
    return trim((string)($_POST[$key] ?? ''));
}

function form_sanitize_header_value(string $value): string
{
    return str_replace(["\r", "\n"], '', $value);
}

function form_determine_origin(): string
{
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    if ($origin !== '') {
        return $origin;
    }

    $referer = $_SERVER['HTTP_REFERER'] ?? '';
    if ($referer === '') {
        return '';
    }

    $scheme = parse_url($referer, PHP_URL_SCHEME);
    $host = parse_url($referer, PHP_URL_HOST);
    if ($scheme === null || $host === null) {
        return '';
    }

    $origin = $scheme . '://' . $host;
    $port = parse_url($referer, PHP_URL_PORT);
    if ($port !== null) {
        $origin .= ':' . $port;
    }

    return $origin;
}

function form_is_origin_allowed(array $allowedOrigins): bool
{
    $origin = form_determine_origin();
    if ($origin === '') {
        return false;
    }

    return in_array($origin, $allowedOrigins, true);
}

function form_get_rate_limit_path(string $storageFile): string
{
    form_ensure_directory(FORM_STORAGE_DIR);

    return FORM_STORAGE_DIR . DIRECTORY_SEPARATOR . $storageFile;
}

/**
 * Build the path to the log file and make sure the log directory exists.
 */
function form_get_log_path(string $fileName): string
{
    form_ensure_directory(FORM_LOG_DIR);

    return FORM_LOG_DIR . DIRECTORY_SEPARATOR . $fileName;
}

/**
 * Write a structured entry to a log file.
 *
 * @param array<string, scalar|null> $context
 */
function form_log_event(string $channel, string $message, array $context = []): void
{
    $timestamp = (new DateTimeImmutable('now', new DateTimeZone('Europe/Berlin')))
        ->format('Y-m-d H:i:s');

    $logLine = sprintf('[%s] %s: %s', $timestamp, $channel, $message);

    if ($context !== []) {
        $encodedContext = json_encode($context, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if ($encodedContext !== false) {
            $logLine .= ' ' . $encodedContext;
        }
    }

    $logLine .= PHP_EOL;

    $logFile = form_get_log_path('form_mail.log');

    file_put_contents($logFile, $logLine, FILE_APPEND | LOCK_EX);
}

/**
 * @return array{email: array<string, array<int, int>>, ip: array<string, array<int, int>>}
 */
function form_load_rate_limits(string $storageFile): array
{
    $path = form_get_rate_limit_path($storageFile);
    if (!is_file($path)) {
        return ['email' => [], 'ip' => []];
    }

    $content = file_get_contents($path);
    if ($content === false) {
        return ['email' => [], 'ip' => []];
    }

    $decoded = json_decode($content, true);
    if (!is_array($decoded)) {
        return ['email' => [], 'ip' => []];
    }

    $emailEntries = [];
    if (isset($decoded['email']) && is_array($decoded['email'])) {
        foreach ($decoded['email'] as $key => $timestamps) {
            if (is_string($key) && is_array($timestamps)) {
                $emailEntries[$key] = array_values(array_map('intval', $timestamps));
            }
        }
    }

    $ipEntries = [];
    if (isset($decoded['ip']) && is_array($decoded['ip'])) {
        foreach ($decoded['ip'] as $key => $timestamps) {
            if (is_string($key) && is_array($timestamps)) {
                $ipEntries[$key] = array_values(array_map('intval', $timestamps));
            }
        }
    }

    return [
        'email' => $emailEntries,
        'ip' => $ipEntries,
    ];
}

/**
 * @param array{email: array<string, array<int, int>>, ip: array<string, array<int, int>>} $data
 */
function form_save_rate_limits(string $storageFile, array $data): void
{
    $path = form_get_rate_limit_path($storageFile);
    $tempPath = $path . '.tmp';

    $encoded = json_encode($data, JSON_PRETTY_PRINT);
    if ($encoded === false) {
        return;
    }

    $file = fopen($tempPath, 'wb');
    if ($file === false) {
        return;
    }

    fwrite($file, $encoded);
    fclose($file);

    if (!@rename($tempPath, $path)) {
        file_put_contents($path, $encoded, LOCK_EX);
        @unlink($tempPath);
    }
}

/**
 * @param array{email: array<string, array<int, int>>, ip: array<string, array<int, int>>} $data
 * @return array{data: array{email: array<string, array<int, int>>, ip: array<string, array<int, int>>}, status: bool, message:?string}
 */
function form_enforce_rate_limits(
    array $data,
    string $email,
    string $ip,
    int $maxEmailPerDay,
    int $maxIpPerHour,
    string $emailLimitMessage,
    string $ipLimitMessage,
    ?int $now = null
): array {
    $now = $now ?? time();

    if (!isset($data['email']) || !is_array($data['email'])) {
        $data['email'] = [];
    }
    if (!isset($data['ip']) || !is_array($data['ip'])) {
        $data['ip'] = [];
    }

    $normalizedEmail = strtolower($email);
    $emailTimestamps = $data['email'][$normalizedEmail] ?? [];
    $ipTimestamps = $data['ip'][$ip] ?? [];

    $emailTimestamps = array_values(array_filter(
        $emailTimestamps,
        static fn (int $timestamp): bool => $timestamp >= $now - 86400
    ));
    $ipTimestamps = array_values(array_filter(
        $ipTimestamps,
        static fn (int $timestamp): bool => $timestamp >= $now - 3600
    ));

    if (count($emailTimestamps) >= $maxEmailPerDay) {
        $data['email'][$normalizedEmail] = $emailTimestamps;
        $data['ip'][$ip] = $ipTimestamps;

        return [
            'data' => $data,
            'status' => false,
            'message' => $emailLimitMessage,
        ];
    }

    if (count($ipTimestamps) >= $maxIpPerHour) {
        $data['email'][$normalizedEmail] = $emailTimestamps;
        $data['ip'][$ip] = $ipTimestamps;

        return [
            'data' => $data,
            'status' => false,
            'message' => $ipLimitMessage,
        ];
    }

    $emailTimestamps[] = $now;
    $ipTimestamps[] = $now;

    $data['email'][$normalizedEmail] = $emailTimestamps;
    $data['ip'][$ip] = $ipTimestamps;

    return [
        'data' => $data,
        'status' => true,
        'message' => null,
    ];
}
