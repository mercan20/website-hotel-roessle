<?php
declare(strict_types=1);

/**
 * Google-Bewertungen über die Places API (New) abrufen und zwischenspeichern.
 *
 * Google wird höchstens einmal am Tag gefragt; dazwischen liefert reviews.php den
 * Zwischenspeicher aus var/. Besucherdaten gehen dabei nicht an Google: Den Abruf macht
 * der Server, und Profilbilder der Verfasser werden nicht übernommen.
 *
 * Einrichtung: API-Schlüssel in var/google_reviews_config.php hinterlegen
 * (Vorlage: php/google_reviews_config.example.php) oder als Umgebungsvariable
 * GOOGLE_PLACES_API_KEY setzen.
 */

const REVIEWS_TTL = 86400;   // Bewertungen einmal am Tag neu holen
const REVIEWS_RETRY = 3600;  // nach einem Fehler frühestens nach einer Stunde erneut versuchen

function reviews_storage_dir(): string
{
    return dirname(__DIR__) . '/var';
}

function reviews_cache_file(): string
{
    return reviews_storage_dir() . '/google_reviews.json';
}

/**
 * Konfiguration aus var/google_reviews_config.php (nicht im Repository), ergänzt um Standardwerte.
 */
function reviews_config(): array
{
    $config = [];
    $file = reviews_storage_dir() . '/google_reviews_config.php';
    if (is_file($file)) {
        $loaded = require $file;
        if (is_array($loaded)) {
            $config = $loaded;
        }
    }

    $envKey = getenv('GOOGLE_PLACES_API_KEY');
    if (($config['api_key'] ?? '') === '' && is_string($envKey) && $envKey !== '') {
        $config['api_key'] = $envKey;
    }

    return $config + [
        'api_key' => '',
        'place_id' => '',                       // leer: wird einmalig über die Suche ermittelt
        'search' => 'Hotel Rössle, Honbergstraße 8, 78532 Tuttlingen',
        'language' => 'de',
        'min_rating' => 4,                      // nur Bewertungen ab so vielen Sternen zeigen
        'max_reviews' => 5,                     // Google liefert höchstens 5
        'exclude_authors' => [],                // Namen, deren Bewertung nicht erscheinen soll (z. B. nach Widerspruch)
    ];
}

/**
 * Anfrage an Google (cURL, sonst PHP-Streams); gibt das dekodierte JSON zurück.
 *
 * @throws RuntimeException
 */
function reviews_request(string $method, string $url, array $headers, ?array $body = null): array
{
    $payload = $body === null ? null : json_encode($body, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
    if ($payload !== null) {
        $headers[] = 'Content-Type: application/json';
    }

    $status = 0;
    if (function_exists('curl_init')) {
        $curl = curl_init($url);
        curl_setopt_array($curl, [
            CURLOPT_CUSTOMREQUEST => $method,
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CONNECTTIMEOUT => 5,
            CURLOPT_TIMEOUT => 10,
        ]);
        if ($payload !== null) {
            curl_setopt($curl, CURLOPT_POSTFIELDS, $payload);
        }
        $response = curl_exec($curl);
        $status = (int) curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
        $error = curl_error($curl);
    } else {
        $context = stream_context_create(['http' => [
            'method' => $method,
            'header' => implode("\r\n", $headers),
            'content' => $payload ?? '',
            'timeout' => 10,
            'ignore_errors' => true,
        ]]);
        $response = @file_get_contents($url, false, $context);
        $responseHeaders = function_exists('http_get_last_response_headers') ? (http_get_last_response_headers() ?? []) : [];
        if (isset($responseHeaders[0]) && preg_match('/\s(\d{3})(\s|$)/', $responseHeaders[0], $match)) {
            $status = (int) $match[1];
        }
        $error = $response === false ? 'keine Verbindung' : '';
    }

    if (!is_string($response) || $response === '') {
        throw new RuntimeException('Google nicht erreichbar: ' . $error);
    }
    $data = json_decode($response, true);
    if (!is_array($data)) {
        throw new RuntimeException('Unerwartete Antwort von Google (HTTP ' . $status . ')');
    }
    if ($status >= 400 || isset($data['error'])) {
        throw new RuntimeException('Google meldet: ' . ($data['error']['message'] ?? 'HTTP ' . $status));
    }
    return $data;
}

/**
 * Place-ID des Hotels über die Textsuche ermitteln (Abfrage nur der ID ist kostenlos).
 *
 * @throws RuntimeException
 */
function reviews_find_place_id(array $config): string
{
    $data = reviews_request('POST', 'https://places.googleapis.com/v1/places:searchText', [
        'X-Goog-Api-Key: ' . $config['api_key'],
        'X-Goog-FieldMask: places.id',
    ], [
        'textQuery' => $config['search'],
        'languageCode' => $config['language'],
    ]);

    $placeId = $data['places'][0]['id'] ?? '';
    if (!is_string($placeId) || $placeId === '') {
        throw new RuntimeException('Hotel bei Google nicht gefunden: ' . $config['search']);
    }
    return $placeId;
}

/**
 * Bewertung, Anzahl und die (höchstens 5) Bewertungen mit Text holen. Die Texte bleiben im
 * Original; Googles automatische Übersetzung wird nicht verwendet.
 *
 * @throws RuntimeException
 */
function reviews_fetch(array $config, string $placeId): array
{
    $url = 'https://places.googleapis.com/v1/places/' . rawurlencode($placeId)
        . '?languageCode=' . rawurlencode($config['language']);
    $data = reviews_request('GET', $url, [
        'X-Goog-Api-Key: ' . $config['api_key'],
        'X-Goog-FieldMask: displayName,formattedAddress,rating,userRatingCount,googleMapsUri,reviews',
    ]);

    return reviews_normalize($data);
}

/**
 * Antwort der Places API auf die Felder reduzieren, die die Website braucht.
 */
function reviews_normalize(array $data): array
{
    $reviews = [];
    foreach ($data['reviews'] ?? [] as $review) {
        $original = $review['originalText'] ?? $review['text'] ?? [];
        $text = trim((string) ($original['text'] ?? ''));
        if ($text === '') {
            continue; // nur Sterne ohne Text
        }
        $reviews[] = [
            'author' => (string) ($review['authorAttribution']['displayName'] ?? ''),
            'authorUri' => (string) ($review['authorAttribution']['uri'] ?? ''),
            'rating' => (int) ($review['rating'] ?? 0),
            'text' => $text,
            'lang' => (string) ($original['languageCode'] ?? ''),
            'published' => (string) ($review['publishTime'] ?? ''),
            'uri' => (string) ($review['googleMapsUri'] ?? ''),
        ];
    }

    return [
        'name' => (string) ($data['displayName']['text'] ?? ''),
        'address' => (string) ($data['formattedAddress'] ?? ''),
        'rating' => isset($data['rating']) ? (float) $data['rating'] : null,
        'count' => isset($data['userRatingCount']) ? (int) $data['userRatingCount'] : null,
        'mapsUri' => (string) ($data['googleMapsUri'] ?? ''),
        'reviews' => $reviews,
    ];
}

function reviews_read_cache(): array
{
    $file = reviews_cache_file();
    if (!is_file($file)) {
        return [];
    }
    $cache = json_decode((string) file_get_contents($file), true);
    return is_array($cache) ? $cache : [];
}

function reviews_write_cache(array $cache): void
{
    $directory = reviews_storage_dir();
    if (!is_dir($directory)) {
        @mkdir($directory, 0775, true);
    }
    $temp = reviews_cache_file() . '.tmp';
    $json = json_encode($cache, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
    if ($json !== false && file_put_contents($temp, $json) !== false) {
        rename($temp, reviews_cache_file());
    }
}

/**
 * Zwischenspeicher liefern und bei Bedarf erneuern: höchstens einmal am Tag, nach einem Fehler
 * frühestens nach einer Stunde. Schlägt der Abruf fehl, bleiben die bisherigen Bewertungen stehen.
 */
function reviews_get(bool $force = false): array
{
    $config = reviews_config();
    $cache = reviews_read_cache();
    if ($config['api_key'] === '') {
        return $cache;
    }

    $due = static function (array $cache): bool {
        $now = time();
        $stale = !isset($cache['data']) || $now - (int) ($cache['fetchedAt'] ?? 0) >= REVIEWS_TTL;
        return $stale && $now - (int) ($cache['lastAttempt'] ?? 0) >= REVIEWS_RETRY;
    };
    if (!$force && !$due($cache)) {
        return $cache;
    }

    // Nur ein Aufruf gleichzeitig fragt Google; die anderen liefern den bisherigen Stand
    $lock = @fopen(reviews_storage_dir() . '/google_reviews.lock', 'c');
    if ($lock === false || !flock($lock, LOCK_EX | LOCK_NB)) {
        return $cache;
    }

    try {
        $cache = reviews_read_cache(); // könnte inzwischen erneuert worden sein
        if ($force || $due($cache)) {
            $cache['lastAttempt'] = time();
            $placeId = $config['place_id'] !== '' ? $config['place_id'] : (string) ($cache['placeId'] ?? '');
            try {
                if ($placeId === '') {
                    $placeId = reviews_find_place_id($config);
                }
                $cache['placeId'] = $placeId;
                $cache['data'] = reviews_fetch($config, $placeId);
                $cache['fetchedAt'] = time();
                unset($cache['error']);
            } catch (Throwable $exception) {
                $cache['error'] = $exception->getMessage();
                if ($config['place_id'] === '') {
                    unset($cache['placeId']); // gefundene ID beim nächsten Versuch neu suchen
                }
                error_log('Google-Bewertungen: ' . $exception->getMessage());
            }
            reviews_write_cache($cache);
        }
    } finally {
        flock($lock, LOCK_UN);
        fclose($lock);
    }

    return $cache;
}

/**
 * Was die Website anzeigt: Gesamtbewertung und die Bewertungen ab der Mindestzahl an Sternen
 * (ohne ausgeschlossene Verfasser), deutschsprachige zuerst, sonst in Googles Reihenfolge.
 */
function reviews_public(array $cache, array $config): array
{
    $data = $cache['data'] ?? null;
    if (!is_array($data)) {
        return ['reviews' => []];
    }

    $minRating = (int) $config['min_rating'];
    $lower = static fn (string $text): string => function_exists('mb_strtolower') ? mb_strtolower($text) : strtolower($text);
    $excluded = array_map($lower, array_map('strval', (array) $config['exclude_authors']));
    $reviews = array_values(array_filter(
        $data['reviews'] ?? [],
        static fn (array $review): bool => $review['rating'] >= $minRating
            && !in_array($lower($review['author']), $excluded, true)
    ));
    usort($reviews, static fn (array $a, array $b): int => (int) !str_starts_with($a['lang'], 'de') <=> (int) !str_starts_with($b['lang'], 'de'));

    return [
        'rating' => $data['rating'],
        'count' => $data['count'],
        'mapsUri' => $data['mapsUri'],
        'minRating' => $minRating,
        'fetchedAt' => isset($cache['fetchedAt']) ? gmdate('c', (int) $cache['fetchedAt']) : null,
        'reviews' => array_slice($reviews, 0, max(0, (int) $config['max_reviews'])),
    ];
}
