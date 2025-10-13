<?php
class TableModel {
    private $conn;
    private $table_name = "tablefood";

    public $table_id;
    public $name;
    public $quantity;
    public $status;
    public $order_id; // Thêm property cho order_id

    public function __construct() {
        $database = new Database();
        $this->conn = $database->getConnection();
    }

    public function create() {
        $query = "INSERT INTO " . $this->table_name . " SET name=:name, quantity=:quantity, status=:status";
        $stmt = $this->conn->prepare($query);

        $this->name = htmlspecialchars(strip_tags($this->name));
        $this->quantity = htmlspecialchars(strip_tags($this->quantity));
        $this->status = htmlspecialchars(strip_tags($this->status));

        $stmt->bindParam(":name", $this->name);
        $stmt->bindParam(":quantity", $this->quantity);
        $stmt->bindParam(":status", $this->status);

        return $stmt->execute();
    }

    public function get() {
        $query = "SELECT table_id, name, quantity, status, order_id FROM " . $this->table_name;
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getById($table_id) {
        $query = "SELECT table_id, name, quantity, status, order_id FROM " . $this->table_name . " WHERE table_id = :table_id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":table_id", $table_id, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getByStatus($status) {
        $query = "SELECT table_id, name, quantity, status, order_id FROM " . $this->table_name . " WHERE status = :status";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":status", $status);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function update() {
        $setParts = [];
        $params = [':table_id' => $this->table_id];

        if (isset($this->name)) {
            $setParts[] = "name = :name";
            $params[':name'] = $this->name;
        }
        if (isset($this->quantity)) {
            $setParts[] = "quantity = :quantity";
            $params[':quantity'] = $this->quantity;
        }
        if (isset($this->status)) {
            $setParts[] = "status = :status";
            $params[':status'] = $this->status;
        }
        if (isset($this->order_id)) {
            $setParts[] = "order_id = :order_id";
            $params[':order_id'] = $this->order_id;
        }

        if (empty($setParts)) {
            return false;
        }

        $query = "UPDATE " . $this->table_name . " SET " . implode(', ', $setParts) . " WHERE table_id = :table_id";
        $stmt = $this->conn->prepare($query);
        
        return $stmt->execute($params);
    }

    public function delete($table_id) {
        $query = "DELETE FROM " . $this->table_name . " WHERE table_id = :table_id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":table_id", $table_id, PDO::PARAM_INT);

        return $stmt->execute();
    }
}
?>