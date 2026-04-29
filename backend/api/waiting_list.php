<?php

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../controllers/WaitingListController.php';
require_once __DIR__ . '/../middleware/auth.php';

// Auth check
$user = requireAuth();
if (!$user) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$action = $_GET['action'] ?? '';
$waitlistController = new WaitingListController($conn);

try {
    switch ($action) {
        case 'join':
            $input = json_decode(file_get_contents('php://input'), true);
            $doctorId = $input['doctor_id'] ?? null;
            $purposeCategory = $input['purpose_category'] ?? 'General Illness';
            $purposeDetail = $input['purpose_detail'] ?? ($input['purpose'] ?? 'General Consultation');
            $priorityLevel = $input['priority_level'] ?? 3;
            $customReason = $input['custom_reason'] ?? '';
            
            if (!$doctorId) {
                throw new Exception('Doctor ID is required');
            }
            
            echo json_encode($waitlistController->joinWaitlist($user['id'], $doctorId, $purposeCategory, $purposeDetail, $priorityLevel, $customReason));
            break;

        case 'status':
            echo json_encode($waitlistController->getWaitlistStatus($user['id']));
            break;

        case 'admin_all':
            echo json_encode($waitlistController->getAllWaiting());
            break;

        default:
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Invalid action'
            ]);
    }
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>
