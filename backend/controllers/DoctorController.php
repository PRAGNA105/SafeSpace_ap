<?php

require_once __DIR__ . '/../config/db.php';

class DoctorController
{
    private $conn;

    public function __construct($conn)
    {
        $this->conn = $conn;
    }

    // Get all doctor schedules (excludes Orthopedic)
    public function getSchedule()
    {
        try {
            $query = "SELECT ds.*, 
                             (SELECT COUNT(*) FROM appointments a 
                              WHERE a.doctor_id = ds.id 
                              AND a.appointment_date = CURDATE() 
                              AND a.status NOT IN ('Cancelled','expired')) as current_appointments
                      FROM doctor_schedule ds 
                      WHERE ds.specialization != 'Orthopedic'
                      ORDER BY FIELD(day_name, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')";
            $result = $this->conn->query($query);
            
            if (!$result) {
                throw new Exception("Query failed: " . $this->conn->error);
            }

            $schedule = [];
            while ($row = $result->fetch_assoc()) {
                $row['current_appointments'] = (int)$row['current_appointments'];
                $row['max_slots'] = (int)($row['max_slots'] ?? 10);
                $row['is_coming_soon'] = (bool)($row['is_coming_soon'] ?? false);
                $schedule[] = $row;
            }

            return [
                'success' => true,
                'data' => $schedule
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }

    // Get available services (unique specializations)
    public function getServices()
    {
        try {
            $query = "SELECT 
                        specialization,
                        GROUP_CONCAT(DISTINCT doctor_name) as doctors,
                        MIN(is_coming_soon) as is_coming_soon,
                        MIN(cabin_number) as cabin_number,
                        MIN(timings) as timings
                      FROM doctor_schedule 
                      WHERE specialization NOT IN ('Orthopedic', 'N/A')
                      GROUP BY specialization
                      ORDER BY FIELD(specialization, 'General Doctor', 'Gynaecologist', 'Psychiatrist', 'Lab Test')";
            $result = $this->conn->query($query);
            
            $services = [];
            while ($row = $result->fetch_assoc()) {
                $row['is_coming_soon'] = (bool)$row['is_coming_soon'];
                $services[] = $row;
            }

            return ['success' => true, 'data' => $services];
        } catch (Exception $e) {
            return ['success' => false, 'message' => $e->getMessage()];
        }
    }

    // Get schedule for a specific service with actual dates for next 7 days
    public function getScheduleByService($specialization)
    {
        try {
            // Get all schedule rows for this specialization
            $query = "SELECT ds.*,
                             (SELECT COUNT(*) FROM appointments a 
                              WHERE a.doctor_id = ds.id 
                              AND a.appointment_date = ? 
                              AND a.status NOT IN ('Cancelled','expired')) as current_appointments
                      FROM doctor_schedule ds
                      WHERE ds.specialization = ?
                      AND ds.status != 'Offline'
                      ORDER BY FIELD(day_name, 'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday')";

            // Build actual dates for next 14 days
            $dates = [];
            $today = new DateTime();
            
            for ($i = 0; $i < 14; $i++) {
                $date = clone $today;
                $date->modify("+$i days");
                $dayName = $date->format('l'); // e.g. "Monday"
                $dateStr = $date->format('Y-m-d');
                $displayDate = $dayName . ', ' . $date->format('M j');
                
                // Find matching doctor_schedule rows for this day
                $stmt = $this->conn->prepare($query);
                $stmt->bind_param("ss", $dateStr, $specialization);
                $stmt->execute();
                $result = $stmt->get_result();
                
                while ($row = $result->fetch_assoc()) {
                    if ($row['day_name'] === $dayName) {
                        $currentApts = (int)$row['current_appointments'];
                        $maxSlots = (int)($row['max_slots'] ?? 10);
                        $isPast = ($dateStr < $today->format('Y-m-d'));
                        $isComingSoon = (bool)($row['is_coming_soon'] ?? false);
                        $slotsLeft = max(0, $maxSlots - $currentApts);
                        
                        $dates[] = [
                            'doctor_id' => (int)$row['id'],
                            'doctor_name' => $row['doctor_name'],
                            'specialization' => $row['specialization'],
                            'day_name' => $dayName,
                            'date' => $dateStr,
                            'display_date' => $displayDate,
                            'status' => $row['status'],
                            'max_slots' => $maxSlots,
                            'current_appointments' => $currentApts,
                            'slots_left' => $slotsLeft,
                            'cabin_number' => $row['cabin_number'],
                            'timings' => $row['timings'],
                            'is_coming_soon' => $isComingSoon,
                            'is_past' => $isPast,
                            'bookable' => !$isPast && !$isComingSoon && $slotsLeft > 0 && $row['status'] === 'Available',
                        ];
                    }
                }
            }

            return ['success' => true, 'data' => $dates];
        } catch (Exception $e) {
            return ['success' => false, 'message' => $e->getMessage()];
        }
    }

    // Update doctor status
    public function updateStatus($id, $status)
    {
        try {
            if (!in_array($status, ['Available', 'Busy', 'Offline'])) {
                throw new Exception("Invalid status provided");
            }

            $query = "UPDATE doctor_schedule SET status = ? WHERE id = ?";
            $stmt = $this->conn->prepare($query);
            $stmt->bind_param("si", $status, $id);
            
            if ($stmt->execute()) {
                return [
                    'success' => true,
                    'message' => 'Status updated successfully'
                ];
            } else {
                throw new Exception("Failed to update status");
            }
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }
}
?>
