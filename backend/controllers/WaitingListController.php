<?php

require_once __DIR__ . '/../config/db.php';

class WaitingListController
{
    private $conn;

    public function __construct($conn)
    {
        $this->conn = $conn;
    }

    // Join waiting list for a specific doctor
    public function joinWaitlist($userId, $doctorId, $purposeCategory, $purposeDetail, $priorityLevel, $customReason = '')
    {
        try {
            // Check if user is already in the waitlist for this doctor
            $checkQuery = "SELECT id FROM waiting_list WHERE user_id = ? AND doctor_id = ? AND status = 'waiting'";
            $stmt = $this->conn->prepare($checkQuery);
            $stmt->bind_param("ii", $userId, $doctorId);
            $stmt->execute();
            if ($stmt->get_result()->num_rows > 0) {
                throw new Exception("You are already on the waiting list for this doctor.");
            }

            // Get the next position
            $posQuery = "SELECT COALESCE(MAX(position), 0) + 1 as next_pos FROM waiting_list WHERE doctor_id = ? AND status = 'waiting'";
            $stmt = $this->conn->prepare($posQuery);
            $stmt->bind_param("i", $doctorId);
            $stmt->execute();
            $nextPos = $stmt->get_result()->fetch_assoc()['next_pos'];

            // Insert into waiting list
            $insertQuery = "INSERT INTO waiting_list (user_id, doctor_id, position, purpose_category, purpose_detail, priority_level, custom_reason, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'waiting')";
            $stmt = $this->conn->prepare($insertQuery);
            $stmt->bind_param("iiissis", $userId, $doctorId, $nextPos, $purposeCategory, $purposeDetail, $priorityLevel, $customReason);
            
            if ($stmt->execute()) {
                return [
                    'success' => true,
                    'message' => 'Successfully joined the waiting list.',
                    'position' => $nextPos
                ];
            } else {
                throw new Exception("Failed to join waiting list.");
            }
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }

    // Get waitlist status for the logged-in user
    public function getWaitlistStatus($userId)
    {
        try {
            $query = "SELECT wl.*, ds.doctor_name, ds.specialization, ds.day_name 
                      FROM waiting_list wl
                      JOIN doctor_schedule ds ON wl.doctor_id = ds.id
                      WHERE wl.user_id = ? 
                      ORDER BY wl.created_at DESC";
            $stmt = $this->conn->prepare($query);
            $stmt->bind_param("i", $userId);
            $stmt->execute();
            $result = $stmt->get_result();

            $list = [];
            while ($row = $result->fetch_assoc()) {
                $list[] = $row;
            }

            return [
                'success' => true,
                'data' => $list
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }

    // Get all waitlist entries (Admin) - Sorted by Priority
    public function getAllWaiting()
    {
        try {
            $query = "SELECT wl.*, ds.doctor_name, ds.specialization, ds.day_name, u.first_name, u.last_name 
                      FROM waiting_list wl
                      JOIN doctor_schedule ds ON wl.doctor_id = ds.id
                      JOIN users u ON wl.user_id = u.id
                      WHERE wl.status = 'waiting'
                      ORDER BY wl.doctor_id, wl.priority_level ASC, wl.created_at ASC";
            $result = $this->conn->query($query);

            $list = [];
            while ($row = $result->fetch_assoc()) {
                $list[] = $row;
            }

            return [
                'success' => true,
                'data' => $list
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }
}
?>
