<?php
class Customer {
    private $conn;
    private $table = "customers";

    public $customer_id;
    public $account_id;
    public $points;
    public $order_id;

    public function __construct($db) {
        $this->conn = $db;
    }

    // Tạo customer từ account mới đăng ký
    public function createFromAccount($account_id) {
        error_log("=== Customer createFromAccount DEBUG ===");
        error_log("Account ID: $account_id");
        
        if (!$account_id || $account_id <= 0) {
            error_log("Invalid account_id: $account_id");
            return false;
        }
        
        // Kiểm tra xem customer đã tồn tại chưa
        if ($this->existsByAccountId($account_id)) {
            error_log("Customer already exists for account_id: $account_id");
            return true; // Đã tồn tại thì không cần tạo mới
        }
        
        $query = "INSERT INTO {$this->table} (account_id, points, order_id) 
                VALUES (:account_id, 0, 0)";
        
        error_log("Customer query: " . $query);
        
        $stmt = $this->conn->prepare($query);
        if (!$stmt) {
            $error = $this->conn->errorInfo();
            error_log("Customer prepare failed: " . json_encode($error));
            return false;
        }
        
        $stmt->bindParam(":account_id", $account_id, PDO::PARAM_INT);
        
        $result = $stmt->execute();
        if (!$result) {
            $error = $stmt->errorInfo();
            error_log("Customer execute failed: " . json_encode($error));
            return false;
        }
        
        error_log("Customer created successfully");
        return true;
    }

    // Kiểm tra customer đã tồn tại theo account_id
    public function existsByAccountId($account_id) {
        $query = "SELECT * FROM {$this->table} WHERE account_id = :account_id LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":account_id", $account_id, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->rowCount() > 0;
    }

    // Xóa customer theo account_id (MỚI THÊM)
    public function deleteByAccountId($account_id) {
        error_log("=== Customer deleteByAccountId DEBUG ===");
        error_log("Account ID: $account_id");
        
        if (!$account_id || $account_id <= 0) {
            error_log("Invalid account_id: $account_id");
            return false;
        }
        
        // Kiểm tra xem customer có tồn tại không
        if (!$this->existsByAccountId($account_id)) {
            error_log("Customer does not exist for account_id: $account_id");
            return true; // Không tồn tại thì coi như thành công
        }
        
        $query = "DELETE FROM {$this->table} WHERE account_id = :account_id";
        $stmt = $this->conn->prepare($query);
        if (!$stmt) {
            $error = $this->conn->errorInfo();
            error_log("Customer delete prepare failed: " . json_encode($error));
            return false;
        }
        
        $stmt->bindParam(":account_id", $account_id, PDO::PARAM_INT);
        $result = $stmt->execute();
        
        if ($result) {
            error_log("Customer deleted successfully for account_id: $account_id");
        } else {
            $error = $stmt->errorInfo();
            error_log("Customer delete execute failed: " . json_encode($error));
        }
        
        return $result;
    }

    // Lấy tất cả customers với thông tin account
    public function getAll() {
        $query = "SELECT c.*, a.name, a.email, a.phone, a.status as account_status 
                  FROM {$this->table} c 
                  JOIN accounts a ON c.account_id = a.account_id 
                  WHERE a.role = 0 
                  ORDER BY c.customer_id DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // Lấy customer theo customer_id
    public function getById($customer_id) {
        $query = "SELECT c.*, a.name, a.email, a.phone, a.status as account_status 
                  FROM {$this->table} c 
                  JOIN accounts a ON c.account_id = a.account_id 
                  WHERE c.customer_id = :customer_id LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":customer_id", $customer_id, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // Lấy customer theo account_id
    public function getByAccountId($account_id) {
        $query = "SELECT * FROM {$this->table} WHERE account_id = :account_id LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":account_id", $account_id, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // Cập nhật điểm
    public function updatePoints($customer_id, $points) {
        $query = "UPDATE {$this->table} SET points = :points WHERE customer_id = :customer_id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":points", $points, PDO::PARAM_INT);
        $stmt->bindParam(":customer_id", $customer_id, PDO::PARAM_INT);
        return $stmt->execute();
    }

    // Cập nhật order_id (khi có đơn hàng)
    public function updateOrderId($customer_id, $order_id) {
        $query = "UPDATE {$this->table} SET order_id = :order_id WHERE customer_id = :customer_id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":order_id", $order_id);
        $stmt->bindParam(":customer_id", $customer_id, PDO::PARAM_INT);
        return $stmt->execute();
    }

    // Xóa customer
    public function delete($customer_id) {
        $query = "DELETE FROM {$this->table} WHERE customer_id = :customer_id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":customer_id", $customer_id, PDO::PARAM_INT);
        return $stmt->execute();
    }

    public function getByPhone($phone) {
        $query = "SELECT c.*, a.name, a.email, a.phone 
                FROM {$this->table} c 
                JOIN accounts a ON c.account_id = a.account_id 
                WHERE a.phone = :phone LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":phone", $phone);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
}
?>