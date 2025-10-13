<?php
class Account {
    private $conn;
    private $table = "accounts";

    public $account_id;
    public $role;
    public $name;
    public $email;
    public $phone;
    public $password;
    public $status;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function exists($email, $phone) {
        $query = "SELECT * FROM {$this->table} WHERE email = :email OR phone = :phone LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":email", $email);
        $stmt->bindParam(":phone", $phone);
        $stmt->execute();
        return $stmt->rowCount() > 0;
    }

    // public function register() {
    //     if(isset($status) || empty($status)){
    //         $this->status = 1;
    //     }
    //     $query = "INSERT INTO {$this->table} (role, name, email, phone, password, status)
    //               VALUES (:role, :name, :email, :phone, :password, :status)";
    //     $stmt = $this->conn->prepare($query);

    //     $this->role = htmlspecialchars($this->role);
    //     $this->name = htmlspecialchars($this->name);
    //     $this->email = htmlspecialchars($this->email);
    //     $this->phone = htmlspecialchars($this->phone);
    //     $this->password = password_hash($this->password, PASSWORD_BCRYPT);
    //     $this->status = htmlspecialchars($this->status);

    //     $stmt->bindParam(":role", $this->role);
    //     $stmt->bindParam(":name", $this->name);
    //     $stmt->bindParam(":email", $this->email);
    //     $stmt->bindParam(":phone", $this->phone);
    //     $stmt->bindParam(":password", $this->password);
    //     $stmt->bindParam(":status", $this->status);

    //     if (!$stmt->execute()) {
    //         $error = $stmt->errorInfo();
    //         Response::json(["message" => "Lỗi SQL: " . $error[2]], 500);
    //         return false;
    //     }

    //     return true;
    // }

    public function login() {
        $query = "SELECT * FROM {$this->table} 
                  WHERE phone = :input OR email = :input LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":input", $this->phone);
        $stmt->execute();

        if ($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            if (password_verify($this->password, $row['password'])) {
                return $row;
            }
        }
        return false;
    }

    public function get() {
        $query = "SELECT account_id, name, email, phone, role, status FROM {$this->table}";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getById($id) {
        $query = "SELECT account_id, name, email, phone, role, status FROM {$this->table} WHERE account_id = :id LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $id, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function create() {
        $query = "INSERT INTO accounts" . " (role, name, email, phone, password, status) VALUES (:role, :name, :email, :phone, :password, :status)";
        $stmt = $this->conn->prepare($query);

        $this->role = htmlspecialchars(strip_tags($this->role));
        $this->name = htmlspecialchars(strip_tags($this->name));
        $this->email = htmlspecialchars(strip_tags($this->email));
        $this->phone = htmlspecialchars(strip_tags($this->phone));
        $this->password = password_hash($this->password, PASSWORD_BCRYPT);
        $this->status = htmlspecialchars(strip_tags($this->status));

        $stmt->bindParam(":role", $this->role);
        $stmt->bindParam(":name", $this->name);
        $stmt->bindParam(":email", $this->email);
        $stmt->bindParam(":phone", $this->phone);
        $stmt->bindParam(":password", $this->password);
        $stmt->bindParam(":status", $this->status);

        if ($this->role == 0) {
            // Tạo customer nếu là khách hàng
            require_once __DIR__ . '/customer.php';
            $customer = new Customer($this->conn);
            $account_id = $this->conn->lastInsertId();
            $customer->createFromAccount($account_id);
        }

        return $stmt->execute();
    }

    public function update() {
        $query = "UPDATE " . $this->table . " SET name=:name, email=:email, phone=:phone, role=:role, status=:status WHERE account_id=:account_id";
        $stmt = $this->conn->prepare($query);

        $this->name = htmlspecialchars(strip_tags($this->name));
        $this->email = htmlspecialchars(strip_tags($this->email));
        $this->phone = htmlspecialchars(strip_tags($this->phone));
        $this->role = htmlspecialchars(strip_tags($this->role)); // 0, 1, 2
        $this->status = htmlspecialchars(strip_tags($this->status));
        $this->account_id = htmlspecialchars(strip_tags($this->account_id));

        $stmt->bindParam(":name", $this->name);
        $stmt->bindParam(":email", $this->email);
        $stmt->bindParam(":phone", $this->phone);
        $stmt->bindParam(":role", $this->role);
        $stmt->bindParam(":status", $this->status);
        $stmt->bindParam(":account_id", $this->account_id, PDO::PARAM_INT);

        return $stmt->execute();
    }

    public function delete($account_id) {
        $query = "DELETE FROM " . $this->table . " WHERE account_id = :account_id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":account_id", $account_id, PDO::PARAM_INT);

        return $stmt->execute();
    }

    public function getCustomers() {
        $query = "SELECT account_id, name, email, phone, role, status FROM {$this->table} WHERE role = 0";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function registerWithCustomer() {
    try {
        $name = $this->name;
        $email = $this->email ?: ''; // ✅ Convert null thành empty string
        $phone = $this->phone;
        $password = $this->password;
        
        if (empty($name) || empty($phone) || empty($password)) {
            return false;
        }
        
        $this->conn->beginTransaction();
        
        // ✅ Dùng empty string thay vì NULL cho email
        $query = "INSERT INTO accounts (role, name, email, phone, password, status)
                  VALUES (0, :name, :email, :phone, :password, 1)";
        
        $stmt = $this->conn->prepare($query);
        $hashed_password = password_hash($password, PASSWORD_BCRYPT);
        
        $name = htmlspecialchars(strip_tags($name));
        $email = htmlspecialchars(strip_tags($email)); // Empty string OK
        $phone = htmlspecialchars(strip_tags($phone));
        
        $stmt->bindParam(':name', $name, PDO::PARAM_STR);
        $stmt->bindParam(':email', $email, PDO::PARAM_STR); // Empty string thay vì NULL
        $stmt->bindParam(':phone', $phone, PDO::PARAM_STR);
        $stmt->bindParam(':password', $hashed_password, PDO::PARAM_STR);
        
        if (!$stmt->execute()) {
            throw new Exception("Account insert failed: " . implode($stmt->errorInfo()));
        }
        
        $account_id = $this->conn->lastInsertId();
        
        require_once __DIR__ . '/customer.php';
        $customer = new Customer($this->conn);
        
        if (!$customer->createFromAccount($account_id)) {
            throw new Exception("Customer insert failed");
        }
        
        $this->conn->commit();
        return $account_id;
        
    } catch (Exception $e) {
        if ($this->conn->inTransaction()) {
            $this->conn->rollBack();
        }
        error_log("registerWithCustomer: " . $e->getMessage());
        return false;
    }
}
}
?>