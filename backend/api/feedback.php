<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../middleware/auth.php';

$action = $_GET['action'] ?? '';

if ($action === 'submit') {
    $user = requireAuth(); // Optional for anonymous, but let's check if they ARE logged in
    $data = json_decode(file_get_contents("php://input"));
    
    if (empty($data->title) || empty($data->description) || empty($data->type)) {
        echo json_encode(["success" => false, "message" => "Incomplete data"]);
        exit();
    }

    $tracking_id = ($data->type === 'report' ? 'REP' : ($data->type === 'suggestion' ? 'SUG' : 'FDB')) . '-' . rand(1000, 9999);
    $user_id = $data->is_anonymous ? null : $user['id'];
    
    $query = "INSERT INTO feedback_reports (tracking_id, type, title, description, is_anonymous, user_id) VALUES (?, ?, ?, ?, ?, ?)";
    $stmt = $conn->prepare($query);
    $is_anon = $data->is_anonymous ? 1 : 0;
    $stmt->bind_param("ssssii", $tracking_id, $data->type, $data->title, $data->description, $is_anon, $user_id);
    
    if ($stmt->execute()) {
        echo json_encode(["success" => true, "tracking_id" => $tracking_id, "message" => "Report submitted successfully"]);
    } else {
        echo json_encode(["success" => false, "message" => "Database error"]);
    }
} elseif ($action === 'my_reports') {
    $user = requireAuth();
    $query = "SELECT * FROM feedback_reports WHERE user_id = ? OR (is_anonymous = 1 AND user_id IS NULL) ORDER BY created_at DESC LIMIT 10";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("i", $user['id']);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $reports = [];
    while ($row = $result->fetch_assoc()) {
        $reports[] = $row;
    }
    echo json_encode(["success" => true, "data" => $reports]);
} else {
    echo json_encode(["success" => false, "message" => "Invalid action"]);
}
?>
