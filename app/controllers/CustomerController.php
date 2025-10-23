<?php
require_once __DIR__ . "/../../config/connect.php";
require_once __DIR__ . "/../models/customer.php";
require_once __DIR__ . "/../models/orders.php";
require_once __DIR__ . "/../models/points.php";
require_once __DIR__ . "/../core/Response.php";

class CustomerController {
    private $db;
    private $customer;
    private $order;
    private $pointRule;

    public function __construct($db) {
        $this->db = $db;
        $this->customer = new Customer($this->db);
        $this->order = new Order($this->db);
        $this->pointRule = new PointRule($this->db);
    }

    public function updateOrder() {
        if ($_SERVER['REQUEST_METHOD'] != "POST") {
            return ["message" => "Phương thức không được phép.", "success" => false, "status" => 405];
        }

        $input_data = json_decode(file_get_contents("php://input"), true);
        if (!$input_data) {
            return ["message" => "Dữ liệu đầu vào không hợp lệ.", "success" => false, "status" => 400];
        }

        if (empty($input_data['order_id']) || empty($input_data['status'])) {
            return ["message" => "Vui lòng cung cấp order_id và status.", "success" => false, "status" => 400];
        }

        $order_id = htmlspecialchars(strip_tags($input_data['order_id']));
        $status = htmlspecialchars(strip_tags($input_data['status']));
        $account_id = isset($input_data['account_id']) ? htmlspecialchars(strip_tags($input_data['account_id'])) : null;
        $total_price = isset($input_data['total_price']) ? floatval($input_data['total_price']) : null;
        $voucher_id = isset($input_data['voucher_id']) ? htmlspecialchars(strip_tags($input_data['voucher_id'])) : null;
        $points_earned = isset($input_data['points_earned']) ? intval($input_data['points_earned']) : 0;

        // Bắt đầu giao dịch
        $this->db->beginTransaction();

        try {
            // Cập nhật đơn hàng trong bảng orders
            $query = "UPDATE orders SET status = :status, account_id = :account_id, totalPrice = :total_price, voucher_id = :voucher_id WHERE order_id = :order_id";
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(":status", $status);
            $stmt->bindParam(":account_id", $account_id, PDO::PARAM_INT);
            $stmt->bindParam(":total_price", $total_price);
            $stmt->bindParam(":voucher_id", $voucher_id, PDO::PARAM_INT);
            $stmt->bindParam(":order_id", $order_id, PDO::PARAM_INT);

            if (!$stmt->execute()) {
                $this->db->rollBack();
                return ["message" => "Không thể cập nhật đơn hàng.", "success" => false, "status" => 400];
            }

            if ($account_id) {
                // Kiểm tra khách hàng
                if (!$this->customer->existsByAccountId($account_id)) {
                    $this->db->rollBack();
                    return ["message" => "Không tìm thấy khách hàng với account_id này.", "success" => false, "status" => 404];
                }

                $customer_data = $this->customer->getByAccountId($account_id);
                if (!$customer_data) {
                    $this->db->rollBack();
                    return ["message" => "Lỗi khi lấy thông tin khách hàng.", "success" => false, "status" => 500];
                }

                $customer_id = $customer_data['customer_id'];

                // Xử lý tích điểm nếu không sử dụng voucher và có total_price
                if (!$voucher_id && $total_price !== null) {
                    // Nếu client không gửi points_earned, tự tính từ point_rules
                    if ($points_earned === 0) {
                        $query = "SELECT points_earned FROM point_rules WHERE :total_price >= min_amount AND (:total_price <= max_amount OR max_amount IS NULL)";
                        $stmt = $this->db->prepare($query);
                        $stmt->bindParam(":total_price", $total_price);
                        $stmt->execute();
                        $rule = $stmt->fetch(PDO::FETCH_ASSOC);

                        if ($rule) {
                            $points_earned = intval($rule['points_earned']);
                        }
                    }

                    // Cập nhật điểm và lịch sử nếu có điểm tích lũy
                    if ($points_earned > 0) {
                        $current_points = $customer_data['points'] ?? 0;
                        $new_points = $current_points + $points_earned;

                        // Cập nhật điểm trong customers
                        $query = "UPDATE customers SET points = :points WHERE customer_id = :customer_id";
                        $stmt = $this->db->prepare($query);
                        $stmt->bindParam(":points", $new_points, PDO::PARAM_INT);
                        $stmt->bindParam(":customer_id", $customer_id, PDO::PARAM_INT);

                        if (!$stmt->execute()) {
                            $this->db->rollBack();
                            return ["message" => "Không thể cập nhật điểm.", "success" => false, "status" => 400];
                        }

                        // Ghi lịch sử tích điểm
                        $query = "INSERT INTO points_history (customer_id, order_id, change_type, points_changed) 
                                  VALUES (:customer_id, :order_id, 'earn', :points_changed)";
                        $stmt = $this->db->prepare($query);
                        $stmt->bindParam(":customer_id", $customer_id, PDO::PARAM_INT);
                        $stmt->bindParam(":order_id", $order_id, PDO::PARAM_INT);
                        $stmt->bindParam(":points_changed", $points_earned, PDO::PARAM_INT);

                        if (!$stmt->execute()) {
                            $this->db->rollBack();
                            return ["message" => "Không thể ghi lịch sử tích điểm.", "success" => false, "status" => 400];
                        }
                    }
                }
            }

            // Commit giao dịch
            $this->db->commit();
            $message = "Cập nhật đơn hàng thành công.";
            if ($points_earned > 0) {
                $message .= " Đã tích $points_earned điểm.";
            }
            return ["message" => $message, "success" => true, "status" => 200];
        } catch (Exception $e) {
            $this->db->rollBack();
            return ["message" => "Lỗi: " . $e->getMessage(), "success" => false, "status" => 500];
        }
    }

    public function getCustomerInfo() {
        if ($_SERVER['REQUEST_METHOD'] != "GET") {
            return ["message" => "Phương thức không được phép.", "success" => false, "status" => 405];
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

    public function redeemVoucher() {
        if ($_SERVER['REQUEST_METHOD'] != "POST") {
            return ["message" => "Phương thức không được phép.", "success" => false, "status" => 405];
        }

        $input_data = json_decode(file_get_contents("php://input"), true);
        if (!$input_data) {
            return ["message" => "Dữ liệu đầu vào không hợp lệ.", "success" => false, "status" => 400];
        }

        if (empty($input_data['account_id']) || empty($input_data['voucher_id']) || !isset($input_data['order_id'])) {
            return ["message" => "Vui lòng cung cấp account_id, voucher_id và order_id.", "success" => false, "status" => 400];
        }

        $account_id = $input_data['account_id'];
        $voucher_id = $input_data['voucher_id'];
        $order_id = $input_data['order_id'];

        // Kiểm tra khách hàng
        $customer_data = $this->customer->getByAccountId($account_id);
        if (!$customer_data) {
            return ["message" => "Không tìm thấy khách hàng.", "success" => false, "status" => 404];
        }

        $customer_id = $customer_data['customer_id'];
        $points = $customer_data['points'];

        // Kiểm tra voucher
        $vouchers = $this->customer->getAvailableVouchers($points);
        $selected_voucher = null;
        foreach ($vouchers as $voucher) {
            if ($voucher['voucher_id'] == $voucher_id) {
                $selected_voucher = $voucher;
                break;
            }
        }

        if (!$selected_voucher) {
            return ["message" => "Voucher không hợp lệ hoặc không đủ điểm để đổi.", "success" => false, "status" => 400];
        }

        // Trừ điểm và ghi lịch sử
        if ($this->customer->redeemPoints($customer_id, $selected_voucher['points_require'], $order_id)) {
            return [
                "message" => "Đổi voucher thành công.",
                "success" => true,
                "status" => 200,
                "data" => [
                    "new_points" => $points - $selected_voucher['points_require'],
                    "voucher" => $selected_voucher
                ]
            ];
        } else {
            return ["message" => "Lỗi khi đổi voucher.", "success" => false, "status" => 500];
        }
    }
}
?>