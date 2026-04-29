<?php
require_once __DIR__ . '/../config/db.php';

class QueueController {
    private $conn;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function getQueueStatus($doctorId, $date = null) {
        if (!$date) {
            $date = date('Y-m-d');
        }

        // Get basic doctor info
        $docQuery = "SELECT doctor_name, specialization, timings, cabin_number FROM doctor_schedule WHERE id = ?";
        $docStmt = $this->conn->prepare($docQuery);
        $docStmt->bind_param("i", $doctorId);
        $docStmt->execute();
        $doctor = $docStmt->get_result()->fetch_assoc();

        if (!$doctor) {
            return ['success' => false, 'message' => 'Doctor not found'];
        }

        // Total patients today (not cancelled/expired)
        $totalQuery = "SELECT COUNT(*) as total FROM appointments 
                       WHERE doctor_id = ? AND appointment_date = ? 
                       AND status NOT IN ('Cancelled','expired')";
        $totalStmt = $this->conn->prepare($totalQuery);
        $totalStmt->bind_param("is", $doctorId, $date);
        $totalStmt->execute();
        $total = $totalStmt->get_result()->fetch_assoc()['total'];

        // Current token being served
        $currentQuery = "SELECT token_number FROM appointments 
                          WHERE doctor_id = ? AND appointment_date = ? 
                          AND status IN ('Confirmed', 'Pending', 'waiting', 'in_consultation')
                          ORDER BY priority_level ASC, created_at ASC LIMIT 1";
        $currentStmt = $this->conn->prepare($currentQuery);
        $currentStmt->bind_param("is", $doctorId, $date);
        $currentStmt->execute();
        $currentResult = $currentStmt->get_result()->fetch_assoc();
        $currentToken = $currentResult['token_number'] ?? 0;

        // Waiting count
        $waitingQuery = "SELECT COUNT(*) as waiting FROM appointments 
                         WHERE doctor_id = ? AND appointment_date = ? 
                         AND status IN ('Confirmed', 'Pending', 'waiting')";
        $waitingStmt = $this->conn->prepare($waitingQuery);
        $waitingStmt->bind_param("is", $doctorId, $date);
        $waitingStmt->execute();
        $waiting = $waitingStmt->get_result()->fetch_assoc()['waiting'];

        // Completed count
        $completedQuery = "SELECT COUNT(*) as completed FROM appointments 
                           WHERE doctor_id = ? AND appointment_date = ? 
                           AND status = 'Completed'";
        $completedStmt = $this->conn->prepare($completedQuery);
        $completedStmt->bind_param("is", $doctorId, $date);
        $completedStmt->execute();
        $completed = $completedStmt->get_result()->fetch_assoc()['completed'];

        $estWait = $waiting * 12;

        return [
            'success' => true,
            'data' => [
                'doctor_name' => $doctor['doctor_name'],
                'specialization' => $doctor['specialization'],
                'timings' => $doctor['timings'],
                'cabin_number' => $doctor['cabin_number'],
                'total_patients' => (int)$total,
                'current_token' => (int)$currentToken,
                'waiting_count' => (int)$waiting,
                'completed_count' => (int)$completed,
                'estimated_wait_time' => $estWait . " minutes"
            ]
        ];
    }

    public function getAllQueues() {
        $today = date('Y-m-d');
        $dayName = date('l');
        
        $query = "SELECT id, doctor_name, specialization FROM doctor_schedule 
                  WHERE status != 'Offline' AND day_name = ? AND is_coming_soon = 0
                  AND specialization NOT IN ('Orthopedic', 'N/A')";
        $stmt = $this->conn->prepare($query);
        $stmt->bind_param("s", $dayName);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $queues = [];
        while ($row = $result->fetch_assoc()) {
            $queueData = $this->getQueueStatus($row['id'], $today);
            if ($queueData['success']) {
                $queues[] = $queueData['data'];
            }
        }
        return ['success' => true, 'data' => $queues];
    }
}
?>
