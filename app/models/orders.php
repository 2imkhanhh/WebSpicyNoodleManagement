<?php
class Order {
    private $conn;
    private $table_name = "orders";
    private $details_table_name = "order_details";

    public $order_id;
    public $orderDate;
    public $totalPrice;
    public $status;
    public $tableID;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function create() {
        $query = "INSERT INTO " . $this->table_name . " (orderDate, totalPrice, status, tableID) VALUES (:orderDate, :totalPrice, :status, :tableID)";
        $stmt = $this->conn->prepare($query);

        $this->orderDate = htmlspecialchars(strip_tags($this->orderDate));
        $this->totalPrice = htmlspecialchars(strip_tags($this->totalPrice));
        $this->status = htmlspecialchars(strip_tags($this->status));
        $this->tableID = htmlspecialchars(strip_tags($this->tableID));

        $stmt->bindParam(":orderDate", $this->orderDate);
        $stmt->bindParam(":totalPrice", $this->totalPrice);
        $stmt->bindParam(":status", $this->status);
        $stmt->bindParam(":tableID", $this->tableID, PDO::PARAM_INT);

        if ($stmt->execute()) {
            return $this->conn->lastInsertId();
        }
        return false;
    }

    public function update($order_id) {
        $setParts = [];
        $params = [':order_id' => $order_id];
        
        if (isset($this->orderDate)) {
            $setParts[] = "orderDate = :orderDate";
            $params[':orderDate'] = $this->orderDate;
        }
        if (isset($this->totalPrice)) {
            $setParts[] = "totalPrice = :totalPrice";
            $params[':totalPrice'] = $this->totalPrice;
        }
        if (isset($this->status)) {
            $setParts[] = "status = :status";
            $params[':status'] = $this->status;
        }
        if (isset($this->tableID)) {
            $setParts[] = "tableID = :tableID";
            $params[':tableID'] = $this->tableID;
        }
        
        if (empty($setParts)) {
            return false;
        }
        
        $query = "UPDATE " . $this->table_name . " SET " . implode(', ', $setParts) . " WHERE order_id = :order_id";
        $stmt = $this->conn->prepare($query);
        return $stmt->execute($params);
    }

    public function updateDetails($order_id) {
        // Xóa chi tiết cũ
        $deleteQuery = "DELETE FROM " . $this->details_table_name . " WHERE order_id = :order_id";
        $deleteStmt = $this->conn->prepare($deleteQuery);
        $deleteStmt->bindParam(":order_id", $order_id, PDO::PARAM_INT);
        $deleteStmt->execute();

        // Thêm chi tiết mới (sẽ được gọi từ controller)
        return true;
    }

    public function addDetail($order_id, $food_id, $quantity, $price) {
        $query = "INSERT INTO " . $this->details_table_name . " (order_id, food_id, quantity, price) VALUES (:order_id, :food_id, :quantity, :price)";
        $stmt = $this->conn->prepare($query);

        $stmt->bindParam(":order_id", $order_id, PDO::PARAM_INT);
        $stmt->bindParam(":food_id", $food_id, PDO::PARAM_INT);
        $stmt->bindParam(":quantity", $quantity, PDO::PARAM_INT);
        $stmt->bindParam(":price", $price);

        return $stmt->execute();
    }

    public function get($order_id = null) {
        $query = "SELECT order_id, orderDate, totalPrice, status, tableID FROM " . $this->table_name;
        if ($order_id) {
            $query .= " WHERE order_id = :order_id";
        }
        $stmt = $this->conn->prepare($query);
        if ($order_id) {
            $stmt->bindParam(":order_id", $order_id, PDO::PARAM_INT);
        }
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getDetails($order_id) {
        $query = "SELECT od.*, m.name, m.price as original_price 
                  FROM " . $this->details_table_name . " od 
                  JOIN menu m ON od.food_id = m.food_id 
                  WHERE od.order_id = :order_id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":order_id", $order_id, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function delete($order_id) {
        $query_details = "DELETE FROM " . $this->details_table_name . " WHERE order_id = :order_id";
        $stmt_details = $this->conn->prepare($query_details);
        $stmt_details->bindParam(":order_id", $order_id, PDO::PARAM_INT);
        $stmt_details->execute();

        $query = "DELETE FROM " . $this->table_name . " WHERE order_id = :order_id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":order_id", $order_id, PDO::PARAM_INT);

        return $stmt->execute();
    }
}
?>