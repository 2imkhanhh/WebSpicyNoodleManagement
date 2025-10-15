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
        $query = "INSERT INTO accounts (role, name, email, phone, password, status) VALUES (:role, :name, :email, :phone, :password, :status)";
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

        if ($stmt->execute()) {
            $account_id = $this->conn->lastInsertId();
            
            if ($this->role == 0) {
                // Tạo customer nếu là khách hàng
                require_once __DIR__ . '/customer.php';
                $customer = new Customer($this->conn);
                $customer->createFromAccount($account_id);
            }
            return true;
        }
        return false;
    }

    public function update() {
        // Lấy thông tin tài khoản hiện tại để so sánh role
        $currentQuery = "SELECT role FROM {$this->table} WHERE account_id = :account_id";
        $currentStmt = $this->conn->prepare($currentQuery);
        $currentStmt->bindParam(":account_id", $this->account_id, PDO::PARAM_INT);
        $currentStmt->execute();
        $currentData = $currentStmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$currentData) {
            return false;
        }
        
        $currentRole = $currentData['role'];
        $newRole = $this->role;

        // Bắt đầu transaction
        $this->conn->beginTransaction();

        try {
            // Cập nhật thông tin tài khoản
            $query = "UPDATE {$this->table} SET name=:name, email=:email, phone=:phone, role=:role, status=:status WHERE account_id=:account_id";
            $stmt = $this->conn->prepare($query);

            $this->name = htmlspecialchars(strip_tags($this->name));
            $this->email = htmlspecialchars(strip_tags($this->email));
            $this->phone = htmlspecialchars(strip_tags($this->phone));
            $this->role = htmlspecialchars(strip_tags($this->role));
            $this->status = htmlspecialchars(strip_tags($this->status));
            $this->account_id = htmlspecialchars(strip_tags($this->account_id));

            $stmt->bindParam(":name", $this->name);
            $stmt->bindParam(":email", $this->email);
            $stmt->bindParam(":phone", $this->phone);
            $stmt->bindParam(":role", $this->role);
            $stmt->bindParam(":status", $this->status);
            $stmt->bindParam(":account_id", $this->account_id, PDO::PARAM_INT);

            if (!$stmt->execute()) {
                throw new Exception("Không thể cập nhật tài khoản.");
            }

            // Xử lý logic customer dựa trên sự thay đổi role
            require_once __DIR__ . '/customer.php';
            $customer = new Customer($this->conn);

            if ($currentRole != 0 && $newRole == 0) {
                // Từ Nhân viên/Quản lý sang Khách hàng: Thêm vào bảng customers
                error_log("Changing from role $currentRole to customer role 0 for account_id: " . $this->account_id);
                if (!$customer->createFromAccount($this->account_id)) {
                    throw new Exception("Không thể thêm khách hàng vào bảng customers.");
                }
                error_log("Customer created successfully for account_id: " . $this->account_id);
                
            } elseif ($currentRole == 0 && $newRole != 0) {
                // Từ Khách hàng sang Nhân viên/Quản lý: Xóa khỏi bảng customers
                error_log("Changing from customer role 0 to role $newRole for account_id: " . $this->account_id);
                if (!$customer->deleteByAccountId($this->account_id)) {
                    throw new Exception("Không thể xóa khách hàng khỏi bảng customers.");
                }
                error_log("Customer deleted successfully for account_id: " . $this->account_id);
            }

            // Commit transaction
            $this->conn->commit();
            return true;

        } catch (Exception $e) {
            // Rollback nếu có lỗi
            $this->conn->rollBack();
            error_log("Update account error: " . $e->getMessage());
            return false;
        }
    }

    public function delete($account_id) {
        // Lấy role hiện tại trước khi xóa
        $query = "SELECT role FROM {$this->table} WHERE account_id = :account_id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":account_id", $account_id, PDO::PARAM_INT);
        $stmt->execute();
        $role = $stmt->fetch(PDO::FETCH_ASSOC)['role'] ?? null;

        // Bắt đầu transaction
        $this->conn->beginTransaction();

        try {
            if ($role == 0) {
                // Xóa bản ghi trong customers trước nếu là khách hàng
                require_once __DIR__ . '/customer.php';
                $customer = new Customer($this->conn);
                if (!$customer->deleteByAccountId($account_id)) {
                    throw new Exception("Không thể xóa khách hàng khỏi bảng customers.");
                }
                error_log("Customer deleted for account_id: $account_id before account deletion");
            }

            // Xóa tài khoản
            $deleteQuery = "DELETE FROM {$this->table} WHERE account_id = :account_id";
            $deleteStmt = $this->conn->prepare($deleteQuery);
            $deleteStmt->bindParam(":account_id", $account_id, PDO::PARAM_INT);
            
            if (!$deleteStmt->execute()) {
                throw new Exception("Không thể xóa tài khoản.");
            }

            // Commit transaction
            $this->conn->commit();
            return true;

        } catch (Exception $e) {
            // Rollback nếu có lỗi
            $this->conn->rollBack();
            error_log("Delete account error: " . $e->getMessage());
            return false;
        }
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
            $email = $this->email ?: '';
            $phone = $this->phone;
            $password = $this->password;
            
            if (empty($name) || empty($phone) || empty($password)) {
                return false;
            }
            
            $this->conn->beginTransaction();
            
            $query = "INSERT INTO accounts (role, name, email, phone, password, status)
                      VALUES (0, :name, :email, :phone, :password, 1)";
            
            $stmt = $this->conn->prepare($query);
            $hashed_password = password_hash($password, PASSWORD_BCRYPT);
            
            $name = htmlspecialchars(strip_tags($name));
            $email = htmlspecialchars(strip_tags($email));
            $phone = htmlspecialchars(strip_tags($phone));
            
            $stmt->bindParam(':name', $name, PDO::PARAM_STR);
            $stmt->bindParam(':email', $email, PDO::PARAM_STR);
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