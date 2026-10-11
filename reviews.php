<?php
// reviews.php - liefert die Google-Bewertungen für die Startseite als JSON.
// Google wird höchstens einmal am Tag gefragt (siehe php/google_reviews.php).
// Von Hand oder per Cronjob erneuern: php reviews.php --refresh

declare(strict_types=1);

require_once __DIR__ . '/php/google_reviews.php';

if (PHP_SAPI === 'cli') {
    $cache = reviews_get(in_array('--refresh', $argv ?? [], true));
    $data = $cache['data'] ?? [];
    if (reviews_config()['api_key'] === '') {
        fwrite(STDERR, "Kein API-Schlüssel: var/google_reviews_config.php anlegen (Vorlage: php/google_reviews_config.example.php).\n");
        exit(1);
    }
    if (isset($cache['error'])) {
        fwrite(STDERR, 'Fehler: ' . $cache['error'] . "\n");
    }
    if ($data !== []) {
        printf(
            "%s, %s\nPlace-ID %s\n%s von 5 aus %s Bewertungen, %d mit Text, abgerufen %s\n",
            $data['name'],
            $data['address'],
            $cache['placeId'] ?? '?',
            $data['rating'] ?? '?',
            $data['count'] ?? '?',
            count($data['reviews']),
            date('d.m.Y H:i', (int) ($cache['fetchedAt'] ?? 0))
        );
    }
    exit(isset($cache['error']) ? 1 : 0);
}

header('Content-Type: application/json; charset=UTF-8');
header('Cache-Control: public, max-age=3600');
header('X-Robots-Tag: noindex');

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    http_response_code(405);
    header('Allow: GET');
    echo '{"reviews":[]}';
    exit;
}

echo json_encode(
    reviews_public(reviews_get(), reviews_config()),
    JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
);
