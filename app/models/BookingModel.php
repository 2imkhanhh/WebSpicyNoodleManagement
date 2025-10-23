<?php
require_once __DIR__ . '/../../config/connect.php';

class BookingModel extends Database {

    // Lấy toàn bộ booking
    public function getAll() {
        $sql = "SELECT booking_id, account_id, table_number, booking_date, booking_time, num_people, note, status, created_at
                FROM bookings
                ORDER BY booking_date DESC, booking_time DESC";

        $conn = $this->getConnection();
        $stmt = $conn->query($sql);
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

        file_put_contents(__DIR__ . '/../../debug_booking.txt', "getAll() result:\n" . print_r($data, true), FILE_APPEND);
        return $data;
    }

    // Lấy theo account ID
    public function getByAccount($account_id) {
        $sql = "SELECT booking_id, account_id, table_number, booking_date, booking_time, num_people, note, status, created_at
                FROM bookings WHERE account_id = ? ORDER BY booking_id DESC";
        $conn = $this->getConnection();
        $stmt = $conn->prepare($sql);
        $stmt->execute([$account_id]);
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

        file_put_contents(__DIR__ . '/../../debug_booking.txt', "getByAccount($account_id):\n" . print_r($data, true), FILE_APPEND);
        return $data;
    }

    // Thêm booking
    public function add($data) {
        $sql = "INSERT INTO bookings (account_id, table_number, booking_date, booking_time, num_people, note, status)
                VALUES (?, ?, ?, ?, ?, ?, 'pending')";
        $conn = $this->getConnection();
        $stmt = $conn->prepare($sql);
        $stmt->execute([
            $data['account_id'],
            $data['table_number'],
            $data['booking_date'],
            $data['booking_time'],
            $data['num_people'],
            $data['note'] ?? null
        ]);
        return ['success' => true];
    }

    // Xóa booking
    public function delete($booking_id) {
        $sql = "DELETE FROM bookings WHERE booking_id = ?";
        $conn = $this->getConnection();
        $stmt = $conn->prepare($sql);
        $stmt->execute([$booking_id]);
        return ['success' => true];
    }
}
?>
