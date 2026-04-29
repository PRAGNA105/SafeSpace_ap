<?php
// Database Configuration File
require_once __DIR__ . '/../bootstrap.php';
error_reporting(E_ALL);
ini_set('display_errors', 0);

// Return JSON errors to the client instead of HTML stack traces
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

function envOrDefault(string $key, string $default): string
{
    $value = trim((string) getenv($key));
    $placeholderPrefixes = [
        'place_your_',
        'your_',
        'example',
        'changeme',
    ];

    if ($value === '') {
        return $default;
    }

    foreach ($placeholderPrefixes as $prefix) {
        if (str_starts_with(strtolower($value), $prefix)) {
            return $default;
        }
    }

    return $value;
}

// Default to local MySQL for development. Remote DB settings can still be provided via env.
define('DB_HOST', envOrDefault('SAFESPACE_DB_HOST', '127.0.0.1'));
define('DB_PORT', (int) envOrDefault('SAFESPACE_DB_PORT', '3306'));
define('DB_USER', envOrDefault('SAFESPACE_DB_USER', 'root'));
define('DB_PASS', envOrDefault('SAFESPACE_DB_PASS', ''));
define('DB_NAME', envOrDefault('SAFESPACE_DB_NAME', 'safespace'));
define('DB_CA_CERT', envOrDefault('SAFESPACE_DB_CA', ''));

applyCorsHeaders();
header('Content-Type: application/json; charset=UTF-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    $conn = mysqli_init();

    $localHosts = ['localhost', '127.0.0.1'];
    $isLocalDatabase = in_array(strtolower(DB_HOST), $localHosts, true);
    $useSsl = !$isLocalDatabase && DB_CA_CERT !== '' && file_exists(DB_CA_CERT);

    if ($useSsl) {
        $conn->ssl_set(NULL, NULL, DB_CA_CERT, NULL, NULL);
    }

    $conn->real_connect(
        DB_HOST,
        DB_USER,
        DB_PASS,
        DB_NAME,
        DB_PORT,
        NULL,
        $useSsl ? MYSQLI_CLIENT_SSL : 0
    );
    
} catch (Throwable $e) {
    http_response_code(503);
    echo json_encode([
        'success' => false,
        'message' => 'Database unavailable. Connection error: ' . $e->getMessage(),
    ]);
    exit();
}

if ($conn->connect_error) {
    http_response_code(503);
    echo json_encode([
        'success' => false,
        'message' => 'Database connection failed: ' . $conn->connect_error,
    ]);
    exit();
}

// Set charset to UTF-8
$conn->set_charset("utf8mb4");
?>
