<?php
require_once __DIR__ . "/../../config/connect.php";
require_once __DIR__ . "/../models/account.php";
require_once __DIR__ . "/../core/Response.php";

class AccountController {
    private $db;
    private $account;

    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
        $this->account = new Account($this->db);
    }

    public function register($data) {
        if (empty($data->phone) || empty($data->password) || empty($data->name)) {
            Response::json(["message" => "Vui lòng nhập đầy đủ thông tin!"], 400);
            return;
        }

        $email_check = $data->email ?? null;
        if ($this->account->exists($email_check, $data->phone)) {
            Response::json(["message" => "Email hoặc số điện thoại đã tồn tại!"], 409);
            return;
        }

        $this->account->name = $data->name;
        $this->account->email = $data->email ?? null;
        $this->account->phone = $data->phone;
        $this->account->password = $data->password;

        $account_id = $this->account->registerWithCustomer();

        if ($account_id) {
            Response::json([
                "success" => true,
                "message" => "Đăng ký thành công!",
                "account_id" => $account_id
            ], 201);
        } else {
            Response::json([
                "success" => false,
                "message" => "Lỗi tạo tài khoản và khách hàng!"
            ], 500);
        }
    }

    public function login($data) {
        if (empty($data->phone) || empty($data->password)) {
            Response::json(["message" => "Vui lòng nhập đầy đủ thông tin đăng nhập!"], 400);
        }

        $this->account->phone = $data->phone;
        $this->account->password = $data->password;

        $user = $this->account->login();

        if ($user) {
            session_start();
            $_SESSION['user'] = [
                "id" => $user["account_id"],
                "name" => $user["name"],
                "role" => $user["role"],
                "status" => $user["status"]
            ];
            Response::json([
                "success" => true,
                "message" => "Đăng nhập thành công!",
                "user" => [
                    "id" => $user["account_id"],
                    "name" => $user["name"],
                    "role" => $user["role"],
                    "status" => $user["status"]
                ]
            ]);
        } else {
            Response::json(["success" => false, "message" => "Sai tài khoản hoặc mật khẩu!"], 401);
        }
    }

    public function get() {
        if ($_SERVER['REQUEST_METHOD'] != "GET") {
            return array("message" => "Method not allowed.", "success" => false, "status" => 405);
        }

        $account_id = isset($_GET['id']) ? $_GET['id'] : '';
        $role_filter = isset($_GET['role']) ? $_GET['role'] : null;

        if (!empty($account_id)) {
            $accounts = $this->account->getById($account_id);
            if (empty($accounts)) {
                return array("message" => "Không tìm thấy tài khoản.", "success" => false, "status" => 404);
            }
            return array("message" => "Tài khoản theo ID", "success" => true, "status" => 200, "data" => $accounts);
        } else {
            if ($role_filter === '0') {
                return $this->getCustomers();
            } else {
                $accounts = $this->account->get();
                return array("message" => "Danh sách tài khoản", "success" => true, "status" => 200, "data" => $accounts);
            }
        }
    }

    public function create() {
        if ($_SERVER['REQUEST_METHOD'] != "POST") {
            return array("message" => "Method not allowed.", "success" => false, "status" => 405);
        }

        $input_data = json_decode(file_get_contents("php://input"), true);
        if (!$input_data) {
            $input_data = array(
                "name" => $_POST['name'] ?? '',
                "email" => $_POST['email'] ?? '',
                "phone" => $_POST['phone'] ?? '',
                "password" => $_POST['password'] ?? '',
                "role" => $_POST['role'] ?? '',
                "status" => $_POST['status'] ?? ''
            );
        }

        if (empty($input_data['name']) || empty($input_data['phone']) || empty($input_data['password'])) {
            return array("message" => "Tên, số điện thoại và mật khẩu không được để trống.", "success" => false, "status" => 400);
        }

        $this->account->name = htmlspecialchars($input_data['name']);
        $this->account->email = htmlspecialchars($input_data['email']);
        $this->account->phone = htmlspecialchars($input_data['phone']);
        $this->account->password = htmlspecialchars($input_data['password']);
        $this->account->role = htmlspecialchars($input_data['role']);
        $this->account->status = htmlspecialchars($input_data['status']);

        if ($this->account->create()) {
            return array("message" => "Tài khoản được thêm thành công.", "success" => true, "status" => 201);
        } else {
            return array("message" => "Không thể thêm tài khoản.", "success" => false, "status" => 400);
        }
    }

    public function update() {
        if ($_SERVER['REQUEST_METHOD'] != "POST") {
            return array("message" => "Method not allowed.", "success" => false, "status" => 405);
        }

        $account_id = isset($_GET['id']) ? $_GET['id'] : '';
        if (empty($account_id)) {
            return array("message" => "ID tài khoản không hợp lệ.", "success" => false, "status" => 400);
        }

        $input_data = json_decode(file_get_contents("php://input"), true);
        if (!$input_data) {
            $input_data = array(
                "name" => $_POST['name'] ?? '',
                "email" => $_POST['email'] ?? '',
                "phone" => $_POST['phone'] ?? '',
                "role" => $_POST['role'] ?? '',
                "status" => $_POST['status'] ?? ''
            );
        }

        if (empty($input_data['name']) || empty($input_data['phone'])) {
            return array("message" => "Tên và số điện thoại không được để trống.", "success" => false, "status" => 400);
        }

        $this->account->account_id = $account_id;
        $this->account->name = htmlspecialchars(strip_tags($input_data['name']));
        $this->account->email = htmlspecialchars(strip_tags($input_data['email']));
        $this->account->phone = htmlspecialchars(strip_tags($input_data['phone']));
        $this->account->role = htmlspecialchars(strip_tags($input_data['role']));
        $this->account->status = htmlspecialchars(strip_tags($input_data['status']));

        if ($this->account->update()) {
            return array("message" => "Tài khoản được cập nhật thành công.", "success" => true, "status" => 200);
        } else {
            return array("message" => "Không thể cập nhật tài khoản.", "success" => false, "status" => 400);
        }
    }

    public function delete() {
        if ($_SERVER['REQUEST_METHOD'] != "DELETE") {
            return array("message" => "Method not allowed.", "success" => false, "status" => 405);
        }

        $account_id = isset($_GET['id']) ? $_GET['id'] : '';
        if (empty($account_id)) {
            return array("message" => "ID tài khoản không hợp lệ.", "success" => false, "status" => 400);
        }

        if ($this->account->delete($account_id)) {
            return array("message" => "Tài khoản đã được xóa thành công.", "success" => true, "status" => 200);
        } else {
            return array("message" => "Không thể xóa tài khoản.", "success" => false, "status" => 400);
        }
    }

    public function getCustomers() {
        if ($_SERVER['REQUEST_METHOD'] != "GET") {
            return array("message" => "Method not allowed.", "success" => false, "status" => 405);
        }

        $customers = $this->account->getCustomers();
        return array("message" => "Danh sách khách hàng", "success" => true, "status" => 200, "data" => $customers);
    }

    public function searchCustomers($search) {
        if ($_SERVER['REQUEST_METHOD'] != "GET") {
            return array("message" => "Method not allowed.", "success" => false, "status" => 405);
        }

        $customers = $this->account->searchCustomers($search);
        if (empty($customers)) {
            return array(
                "message" => "Không tìm thấy khách hàng khớp với từ khóa '$search'.",
                "success" => true,
                "status" => 200,
                "data" => []
            );
        }
        return array(
            "message" => "Kết quả tìm kiếm khách hàng",
            "success" => true,
            "status" => 200,
            "data" => $customers
        );
    }
}
?>