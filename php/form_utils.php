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
 *
 * Strato's environment expects sendmail to be called with the "-t" and "-i"
 * flags.  PHP < 8 appended those flags automatically, but since we override
 * the path at runtime we ensure they remain present to keep mail delivery
 * working on the new stack.
 */
function form_configure_mail(string $fromAddress, ?string $sendmailPath = null): void
{
    if ($fromAddress !== '') {
        ini_set('sendmail_from', $fromAddress);
    }

    if ($sendmailPath !== null && $sendmailPath !== '') {
        $normalizedPath = trim($sendmailPath);

        if ($normalizedPath !== '') {
            $hasTFlag = preg_match('/(^|\s)-t(\s|$)/', $normalizedPath) === 1;
            $hasIFlag = preg_match('/(^|\s)-i(\s|$)/', $normalizedPath) === 1;

            if (!$hasTFlag) {
                $normalizedPath .= ' -t';
            }

            if (!$hasIFlag) {
                $normalizedPath .= ' -i';
            }

            ini_set('sendmail_path', $normalizedPath);
        }
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

function form_load_email_signature(?string $filePath = null): string
{
    $path = $filePath ?? FORM_PROJECT_ROOT . '/var/email_signature.txt';

    if ($path === '' || !is_file($path) || !is_readable($path)) {
        return '';
    }

    $contents = file_get_contents($path);
    if ($contents === false) {
        return '';
    }

    $normalized = str_replace("\r", '', trim($contents));

    return $normalized === '' ? '' : $normalized;
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
 * @param array<string, array<int, int>> $entries
 * @return array<string, array<int, int>>
 */
function form_prune_rate_limit_entries(array $entries, int $cutoff): array
{
    $pruned = [];
    foreach ($entries as $key => $timestamps) {
        $recent = array_values(array_filter(
            $timestamps,
            static fn (int $timestamp): bool => $timestamp >= $cutoff
        ));
        if ($recent !== []) {
            $pruned[$key] = $recent;
        }
    }

    return $pruned;
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

    // Store only hashes and drop expired entries so no address list accumulates on disk.
    $data['email'] = form_prune_rate_limit_entries($data['email'], $now - 86400);
    $data['ip'] = form_prune_rate_limit_entries($data['ip'], $now - 3600);

    $emailKey = hash('sha256', strtolower($email));
    $ipKey = hash('sha256', $ip);
    $emailTimestamps = $data['email'][$emailKey] ?? [];
    $ipTimestamps = $data['ip'][$ipKey] ?? [];

    if (count($emailTimestamps) >= $maxEmailPerDay) {
        return [
            'data' => $data,
            'status' => false,
            'message' => $emailLimitMessage,
        ];
    }

    if (count($ipTimestamps) >= $maxIpPerHour) {
        return [
            'data' => $data,
            'status' => false,
            'message' => $ipLimitMessage,
        ];
    }

    $emailTimestamps[] = $now;
    $ipTimestamps[] = $now;

    $data['email'][$emailKey] = $emailTimestamps;
    $data['ip'][$ipKey] = $ipTimestamps;

    return [
        'data' => $data,
        'status' => true,
        'message' => null,
    ];
}
