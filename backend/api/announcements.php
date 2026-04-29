<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../config/db.php';

$query = "SELECT * FROM announcements ORDER BY created_at DESC";
$result = $conn->query($query);

$announcements = [];
while ($row = $result->fetch_assoc()) {
    // Add relative time logic if needed, but for now just pass raw data
    $announcements[] = [
        "id" => $row['id'],
        "title" => $row['title'],
        "description" => $row['description'],
        "category" => $row['category'],
        "urgent" => (bool)$row['is_urgent'],
        "created_at" => $row['created_at']
    ];
}

echo json_encode(["success" => true, "data" => $announcements]);
?>
