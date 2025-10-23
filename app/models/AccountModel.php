<?php
class AccountModel {
    private $conn;
    private $table = "accounts";

    public function __construct($db) {
        $this->conn = $db;
    }

    // 🔹 Lấy thông tin tài khoản theo ID
    public function getById($id) {
        $query = "SELECT account_id, role, name, email, phone, password, status FROM {$this->table} WHERE account_id = ?";
        $stmt = $this->conn->prepare($query);
        $stmt->execute([$id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // 🔹 Cập nhật thông tin tài khoản
    public function update($id, $name, $phone, $password) {
        $query = "UPDATE {$this->table} SET name = ?, phone = ?, password = ? WHERE account_id = ?";
        $stmt = $this->conn->prepare($query);
        return $stmt->execute([$name, $phone, $password, $id]);
    }
}
?>
