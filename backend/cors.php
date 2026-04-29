<?php
// ===============================================
// GLOBAL CORS HANDLER FOR ALL API ENDPOINTS
// ===============================================

require_once __DIR__ . '/bootstrap.php';

applyCorsHeaders();

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit();
}
