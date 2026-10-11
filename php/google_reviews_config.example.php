<?php
// Vorlage: als var/google_reviews_config.php auf dem Server speichern (var/ ist nicht im
// Repository und nicht öffentlich erreichbar) und den API-Schlüssel eintragen.
// Schlüssel: Google Cloud Console, „Places API (New)“ aktivieren, Schlüssel auf diese API
// und die IP-Adresse des Servers beschränken.

return [
    'api_key' => '',

    // Optional – sonst gelten die Standardwerte aus php/google_reviews.php:
    // 'place_id' => '',      // leer: wird einmalig über die Suche nach dem Hotel ermittelt
    // 'min_rating' => 4,     // nur Bewertungen ab so vielen Sternen zeigen
    // 'max_reviews' => 5,    // Google liefert höchstens 5
    // 'exclude_authors' => ['Name wie bei Google'],  // Bewertung ausblenden (z. B. nach Widerspruch)
];
