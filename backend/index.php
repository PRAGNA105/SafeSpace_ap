<?php
require_once __DIR__ . '/bootstrap.php';

applyCorsHeaders();
jsonResponse(200, [
    'success' => true,
    'message' => 'SafeSpace PHP API',
    'version' => '1.0.0',
    'endpoints' => [
        'health' => '/api/health.php',
        'auth' => '/api/auth.php',
        'user' => '/api/user.php',
        'appointments' => '/api/appointments.php',
    ],
]);
