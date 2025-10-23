<?php
require_once __DIR__ . "/../../config/connect.php";
require_once __DIR__ . "/../models/customer.php";
require_once __DIR__ . "/../core/Response.php";

class CustomerController {
    private $db;
    private $customer;

    public function __construct($db) {
        $this->db = $db;
        $this->customer = new Customer($this->db);
    }

    public function updateOrder() {
        if ($_SERVER['REQUEST_METHOD'] != "POST") {
            return array("message" => "Method not allowed.", "success" => false, "status" => 405);
        }

        $input_data = json_decode(file_get_contents("php://input"), true);
        if (!$input_data) {
            return array("message" => "Dữ liệu đầu vào không hợp lệ.", "success" => false, "status" => 400);
        }

        if (empty($input_data['account_id']) || empty($input_data['order_id'])) {
            return array("message" => "Vui lòng cung cấp account_id và order_id.", "success" => false, "status" => 400);
        }

        $account_id = $input_data['account_id'];
        $order_id = $input_data['order_id'];

        if (!$this->customer->existsByAccountId($account_id)) {
            return array("message" => "Không tìm thấy khách hàng với account_id này.", "success" => false, "status" => 404);
        }

        // Lấy customer_id từ account_id
        $customer_data = $this->customer->getByAccountId($account_id);
        if (!$customer_data) {
            return array("message" => "Lỗi khi lấy thông tin khách hàng.", "success" => false, "status" => 500);
        }

        $customer_id = $customer_data['customer_id'];

        // Cập nhật order_id
        if ($this->customer->updateOrderId($customer_id, $order_id)) {
            return array("message" => "Cập nhật order_id thành công.", "success" => true, "status" => 200);
        } else {
            return array("message" => "Lỗi khi cập nhật order_id.", "success" => false, "status" => 500);
        }
    }

    public function getCustomerInfo() {
        if ($_SERVER['REQUEST_METHOD'] != "GET") {
            return ["message" => "Method not allowed.", "success" => false, "status" => 405];
        }

        $account_id = isset($_GET['account_id']) ? $_GET['account_id'] : '';
        if (empty($account_id)) {
            return ["message" => "ID tài khoản không hợp lệ.", "success" => false, "status" => 400];
        }

        $customer_data = $this->customer->getByAccountId($account_id);
        if (!$customer_data) {
            return ["message" => "Không tìm thấy khách hàng.", "success" => false, "status" => 404];
        }

        $points = $customer_data['points'] ?? 0;
        $vouchers = $this->customer->getAvailableVouchers($points);

        return [
            "message" => "Thông tin khách hàng",
            "success" => true,
            "status" => 200,
            "data" => [
                "points" => $points,
                "vouchers" => $vouchers
            ]
        ];
    }
}
?>