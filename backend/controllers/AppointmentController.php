<?php
require_once __DIR__ . '/../config/db.php';

class AppointmentController {
    private $conn;

    public function __construct($db) {
        $this->conn = $db;
    }

    // Expire old appointments automatically
    public function expireOldAppointments() {
        $today = date('Y-m-d');
        $query = "UPDATE appointments SET status = 'expired' 
                  WHERE appointment_date IS NOT NULL 
                  AND appointment_date < ? 
                  AND status IN ('Confirmed', 'Pending', 'waiting')";
        $stmt = $this->conn->prepare($query);
        $stmt->bind_param("s", $today);
        $stmt->execute();
    }

    public function createAppointment($userId, $doctorId, $studentName, $doctorName, $specialization, $day, $purposeCategory, $purposeDetail, $priorityLevel, $notes, $customReason = '', $appointmentDate = null) {
        // Validate appointment_date is not in the past
        $today = date('Y-m-d');
        if ($appointmentDate) {
            if ($appointmentDate < $today) {
                return ['success' => false, 'message' => 'Cannot book appointment for a past date.'];
            }
        } else {
            // If no date provided, default to today (backwards compat)
            $appointmentDate = $today;
        }

        // Check if slots are available for the specific date
        $slotQuery = "SELECT max_slots, 
                        (SELECT COUNT(*) FROM appointments 
                         WHERE doctor_id = ? AND appointment_date = ? 
                         AND status NOT IN ('Cancelled','expired')) as current_count 
                      FROM doctor_schedule WHERE id = ?";
        $slotStmt = $this->conn->prepare($slotQuery);
        $slotStmt->bind_param("isi", $doctorId, $appointmentDate, $doctorId);
        $slotStmt->execute();
        $slotResult = $slotStmt->get_result()->fetch_assoc();

        if (!$slotResult) {
            return ['success' => false, 'message' => 'Invalid doctor or day selected. Please choose a doctor from the dashboard again.'];
        }
        
        if ((int) $slotResult['current_count'] >= (int) $slotResult['max_slots']) {
            return ['success' => false, 'message' => 'Slots are full for this date. Please join the waiting list.', 'slots_full' => true];
        }

        // Create appointment
        $query = "INSERT INTO appointments (user_id, doctor_id, token_number, student_name, doctor_name, specialization, appointment_day, appointment_date, purpose_category, purpose_detail, priority_level, notes, custom_reason, status) 
                  VALUES (?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Confirmed')";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bind_param("iisssssssiss", $userId, $doctorId, $studentName, $doctorName, $specialization, $day, $appointmentDate, $purposeCategory, $purposeDetail, $priorityLevel, $notes, $customReason);
        
        if ($stmt->execute()) {
            $appointmentId = $this->conn->insert_id;
            
            // Rebalance tokens for this doctor and date
            $this->rebalanceTokens($doctorId, $appointmentDate);
            
            // Get the new token number
            $tokenQuery = "SELECT token_number FROM appointments WHERE id = ?";
            $tokenStmt = $this->conn->prepare($tokenQuery);
            $tokenStmt->bind_param("i", $appointmentId);
            $tokenStmt->execute();
            $newToken = $tokenStmt->get_result()->fetch_assoc()['token_number'];

            return [
                'success' => true,
                'message' => 'Appointment booked successfully',
                'appointment_id' => $appointmentId,
                'token_number' => $newToken,
                'priority_level' => $priorityLevel
            ];
        }
        return ['success' => false, 'message' => 'Failed to book appointment: ' . $stmt->error];
    }

    private function rebalanceTokens($doctorId, $dateOrDay) {
        // Try matching by date first, fallback to day name
        $query = "SELECT id FROM appointments 
                  WHERE doctor_id = ? AND (appointment_date = ? OR appointment_day = ?) 
                  AND status IN ('Confirmed', 'Pending', 'waiting', 'in_consultation') 
                  ORDER BY priority_level ASC, created_at ASC";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bind_param("iss", $doctorId, $dateOrDay, $dateOrDay);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $position = 1;
        while ($row = $result->fetch_assoc()) {
            $updateQuery = "UPDATE appointments SET token_number = ? WHERE id = ?";
            $updateStmt = $this->conn->prepare($updateQuery);
            $updateStmt->bind_param("ii", $position, $row['id']);
            $updateStmt->execute();
            $position++;
        }
    }

    public function getStudentAppointments($userId) {
        $this->expireOldAppointments();
        $query = "SELECT * FROM appointments WHERE user_id = ? ORDER BY 
                  CASE WHEN appointment_date >= CURDATE() THEN 0 ELSE 1 END,
                  appointment_date ASC, created_at DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->bind_param("i", $userId);
        $stmt->execute();
        $result = $stmt->get_result();
        return $result->fetch_all(MYSQLI_ASSOC);
    }

    public function getAllAppointments($filter = 'all') {
        $this->expireOldAppointments();
        $today = date('Y-m-d');

        switch ($filter) {
            case 'today':
                $query = "SELECT a.*, TIMESTAMPDIFF(MINUTE, a.created_at, NOW()) as waited_minutes 
                          FROM appointments a
                          WHERE a.appointment_date = ? 
                          AND a.status NOT IN ('expired','Cancelled','Completed')
                          ORDER BY a.priority_level ASC, a.created_at ASC";
                $stmt = $this->conn->prepare($query);
                $stmt->bind_param("s", $today);
                $stmt->execute();
                return $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

            case 'upcoming':
                $query = "SELECT * FROM appointments 
                          WHERE appointment_date > ? 
                          AND status NOT IN ('expired','Cancelled','Completed')
                          ORDER BY appointment_date ASC, priority_level ASC";
                $stmt = $this->conn->prepare($query);
                $stmt->bind_param("s", $today);
                $stmt->execute();
                return $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

            case 'past':
                $query = "SELECT * FROM appointments 
                          WHERE (appointment_date < ? OR status IN ('expired','Cancelled','Completed'))
                          ORDER BY appointment_date DESC, created_at DESC
                          LIMIT 100";
                $stmt = $this->conn->prepare($query);
                $stmt->bind_param("s", $today);
                $stmt->execute();
                return $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

            default:
                $query = "SELECT * FROM appointments ORDER BY created_at DESC";
                $result = $this->conn->query($query);
                return $result->fetch_all(MYSQLI_ASSOC);
        }
    }

    public function updateStatus($appointmentId, $status) {
        $validStatuses = ['Pending', 'Confirmed', 'Cancelled', 'Completed', 'waiting', 'in_consultation', 'expired'];
        if (!in_array($status, $validStatuses)) {
            return ['success' => false, 'message' => 'Invalid status: ' . $status];
        }

        $query = "UPDATE appointments SET status = ? WHERE id = ?";
        $stmt = $this->conn->prepare($query);
        $stmt->bind_param("si", $status, $appointmentId);
        if ($stmt->execute()) {
            if (in_array($status, ['Cancelled', 'Completed', 'expired'])) {
                $infoQuery = "SELECT doctor_id, appointment_date, appointment_day FROM appointments WHERE id = ?";
                $infoStmt = $this->conn->prepare($infoQuery);
                $infoStmt->bind_param("i", $appointmentId);
                $infoStmt->execute();
                if ($info = $infoStmt->get_result()->fetch_assoc()) {
                    $dateKey = $info['appointment_date'] ?: $info['appointment_day'];
                    $this->rebalanceTokens($info['doctor_id'], $dateKey);
                }
            }
            return ['success' => true, 'message' => 'Status updated successfully'];
        }
        return ['success' => false, 'message' => 'Failed to update status: ' . $stmt->error];
    }
}
