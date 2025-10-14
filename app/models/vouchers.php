<?php
class VoucherRule {
    private $conn;
    private $table_name = "vouchers";

    public $voucher_id;
    public $voucher_code;
    public $point_require;
    public $discount_percent;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function create() {
        $query = "INSERT INTO " . $this->table_name . " SET voucher_code=:code, points_require=:points, discount_percent=:discount";
        $stmt = $this->conn->prepare($query);
        $this->voucher_code = htmlspecialchars(strip_tags($this->voucher_code));
        $this->point_require = htmlspecialchars(strip_tags($this->point_require));
        $this->discount_percent = htmlspecialchars(strip_tags($this->discount_percent));

        $stmt->bindParam(":code", $this->voucher_code);
        $stmt->bindParam(":points", $this->point_require);
        $stmt->bindParam(":discount", $this->discount_percent);

        if ($stmt->execute()) {
            return true;
        }
        return false;
    }

    public function get() {
        $query = "SELECT voucher_id, voucher_code, points_require, discount_percent FROM " . $this->table_name;
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getById($voucher_id) {
        $query = "SELECT voucher_id, voucher_code, points_require, discount_percent FROM " . $this->table_name . " WHERE voucher_id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $voucher_id, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function update() {
        $query = "UPDATE " . $this->table_name . " SET voucher_code=:code, points_require=:points, discount_percent=:discount WHERE voucher_id=:id";
        $stmt = $this->conn->prepare($query);
        $this->voucher_code = htmlspecialchars(strip_tags($this->voucher_code));
        $this->point_require = htmlspecialchars(strip_tags($this->point_require));
        $this->discount_percent = htmlspecialchars(strip_tags($this->discount_percent));
        $this->voucher_id = htmlspecialchars(strip_tags($this->voucher_id));

        $stmt->bindParam(":code", $this->voucher_code);
        $stmt->bindParam(":points", $this->point_require);
        $stmt->bindParam(":discount", $this->discount_percent);
        $stmt->bindParam(":id", $this->voucher_id, PDO::PARAM_INT);

        return $stmt->execute();
    }

    public function delete($voucher_id) {
        $query = "DELETE FROM " . $this->table_name . " WHERE voucher_id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $voucher_id, PDO::PARAM_INT);
        return $stmt->execute();
    }
}
?>