<?php
require_once __DIR__ . '/bootstrap.php';
require_once __DIR__ . '/config/db.php';

echo json_encode([
    'success' => true,
    'message' => 'Connection successful',
    'host' => DB_HOST,
    'user' => DB_USER,
    'db' => DB_NAME
]);
