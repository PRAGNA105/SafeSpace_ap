<?php
require_once __DIR__ . '/../config/db.php';

try {
    $result = $conn->query('SELECT 1 as ok');
    $row = $result ? $result->fetch_assoc() : ['ok' => 0];

    jsonResponse(200, [
        'success' => true,
        'status' => 'ok',
        'database' => ((int) ($row['ok'] ?? 0)) === 1 ? 'connected' : 'unknown',
        'timestamp' => date(DATE_ATOM),
    ]);
} catch (Throwable $e) {
    jsonResponse(503, [
        'success' => false,
        'status' => 'error',
        'message' => 'Health check failed: ' . $e->getMessage(),
        'timestamp' => date(DATE_ATOM),
    ]);
}
