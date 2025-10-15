<?php
require_once __DIR__ . "/../../config/connect.php";
require_once __DIR__ . "/../models/customer.php";
require_once __DIR__ . "/../models/points.php";
require_once __DIR__ . "/../models/vouchers.php";

class PaymentController {
    private $conn;
    private $customer;
    private $pointRule;
    private $voucherRule;

    public function __construct($db) {
        $this->conn = $db;
        $this->customer = new Customer($db);
        $this->pointRule = new PointRule($db);
        $this->voucherRule = new VoucherRule($db);
    }

    // Kiểm tra khách hàng theo SĐT
    public function checkCustomer() {
        if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
            return ["success" => false, "message" => "Method not allowed", "status" => 405];
        }

        $phone = $_GET['phone'] ?? '';
        if (empty($phone)) {
            return ["success" => false, "message" => "Thiếu số điện thoại", "status" => 400];
        }

        $customer = $this->customer->getByPhone($phone);
        if ($customer) {
            return ["success" => true, "message" => "Khách hàng đã có tài khoản", "data" => $customer, "status" => 200];
        } else {
            return ["success" => false, "message" => "Khách hàng chưa có tài khoản", "status" => 404];
        }
    }

    // Tính điểm và kiểm tra voucher
    public function calculatePointsVoucher() {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            return ["success" => false, "message" => "Method not allowed", "status" => 405];
        }

        $input = json_decode(file_get_contents("php://input"), true);
        $total_amount = $input['total_amount'] ?? 0;
        $customer_id = $input['customer_id'] ?? 0;

        if ($total_amount <= 0 || !$customer_id) {
            return ["success" => false, "message" => "Thiếu dữ liệu cần thiết", "status" => 400];
        }

        // --- Lấy quy định tích điểm ---
        $rules = $this->pointRule->get();
        $earned_points = 0;
        foreach ($rules as $rule) {
            if ($total_amount >= $rule['min_amount'] &&
                ($rule['max_amount'] == null || $total_amount <= $rule['max_amount'])) {
                $earned_points = $rule['points_earned'];
                break;
            }
        }

        // --- Cộng điểm mới cho khách ---
        $customer = $this->customer->getById($customer_id);
        $new_points = $customer['points'] + $earned_points;
        $this->customer->updatePoints($customer_id, $new_points);

        // --- Tìm voucher có thể đổi ---
        $vouchers = $this->voucherRule->get();
        $available_vouchers = [];
        foreach ($vouchers as $v) {
            if ($v['point_require'] <= $new_points) {
                $available_vouchers[] = $v;
            }
        }

        // --- Chọn voucher tốt nhất (giảm giá cao nhất) ---
        $discount_percent = 0;
        if (!empty($available_vouchers)) {
            usort($available_vouchers, fn($a, $b) => $b['discount_percent'] - $a['discount_percent']);
            $discount_percent = $available_vouchers[0]['discount_percent'];
        }

        // --- Tính tổng sau giảm ---
        $final_amount = $total_amount - ($total_amount * $discount_percent / 100);

        return [
            "success" => true,
            "message" => "Tính điểm & voucher thành công",
            "earned_points" => $earned_points,
            "new_points" => $new_points,
            "discount_percent" => $discount_percent,
            "final_amount" => $final_amount,
            "available_vouchers" => $available_vouchers
        ];
    }
}
?>
