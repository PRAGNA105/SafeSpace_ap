<?php

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../controllers/AdminController.php';

require_once __DIR__ . '/../middleware/auth.php';

// Authenticate via standard user token (role system not yet implemented)
$user = requireAuth();

$action = $_GET['action'] ?? '';
$adminController = new AdminController($conn);

try {
    switch ($action) {
        case 'all-users':
            echo json_encode($adminController->getAllUsers());
            break;

        case 'user-details':
            $userId = $_GET['user_id'] ?? null;
            if (!$userId) {
                throw new Exception('User ID is required');
            }
            echo json_encode($adminController->getUserDetails($userId));
            break;

        case 'user-activity':
            $userId = $_GET['user_id'] ?? null;
            $limit = $_GET['limit'] ?? 50;
            if (!$userId) {
                throw new Exception('User ID is required');
            }
            echo json_encode($adminController->getUserActivityTimeline($userId, $limit));
            break;



        case 'dashboard-summary':
            echo json_encode($adminController->getDashboardSummary());
            break;

        default:
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Invalid action',
                'available_actions' => [
                    'all-users',
                    'user-details?user_id=ID',
                    'user-activity?user_id=ID',
                    'dashboard-summary'
                ]
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
