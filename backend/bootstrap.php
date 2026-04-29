<?php
// ===============================================
// ENV LOADER + GLOBAL FUNCTIONS
// ===============================================

function loadEnvFile(string $envPath): void
{
    if (!file_exists($envPath)) {
        return;
    }

    $lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || str_starts_with($line, '#') || !str_contains($line, '=')) {
            continue;
        }

        [$key, $value] = explode('=', $line, 2);
        $key = trim($key);
        $value = trim($value);

        if (
            (str_starts_with($value, '"') && str_ends_with($value, '"')) ||
            (str_starts_with($value, "'") && str_ends_with($value, "'"))
        ) {
            $value = substr($value, 1, -1);
        }

        putenv("$key=$value");
        $_ENV[$key] = $value;
        $_SERVER[$key] = $value;
    }
}

// Load backend .env file manually (no Composer needed)
loadEnvFile(__DIR__ . '/.env');

function envValue(string $key, string $default = ''): string
{
    $value = getenv($key);
    return $value === false ? $default : trim((string) $value);
}

function safespaceAllowedOrigins(): array
{
    $configured = envValue('SAFESPACE_FRONTEND_ORIGINS', envValue('SAFESPACE_FRONTEND_ORIGIN', ''));
    if ($configured === '') {
        return [];
    }

    return array_values(array_filter(array_map('trim', explode(',', $configured))));
}

function safespaceIsAllowedOrigin(string $origin): bool
{
    if ($origin === '') {
        return false;
    }

    if (preg_match('/^http:\/\/localhost:\d+$/', $origin) || preg_match('/^http:\/\/127\.0\.0\.1:\d+$/', $origin)) {
        return true;
    }

    if (preg_match('/^https:\/\/[a-z0-9-]+\.vercel\.app$/i', $origin)) {
        return true;
    }

    if (preg_match('/\.hf\.space$/', $origin)) {
        return true;
    }

    foreach (safespaceAllowedOrigins() as $allowedOrigin) {
        if (strcasecmp($allowedOrigin, $origin) === 0) {
            return true;
        }
    }

    return false;
}

function applyCorsHeaders(): void
{
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';

    if (safespaceIsAllowedOrigin($origin)) {
        header("Access-Control-Allow-Origin: $origin");
        header('Vary: Origin');
        header('Access-Control-Allow-Credentials: true');
    } else {
        header('Access-Control-Allow-Origin: *');
    }

    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
}

/**
 * Send a JSON response with status code
 */
function jsonResponse(int $statusCode, array $data): void
{
    http_response_code($statusCode);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}
