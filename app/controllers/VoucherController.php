<?php
require_once __DIR__ . "/../../config/connect.php";
require_once __DIR__ . "/../models/vouchers.php";

class VoucherController {
    private $conn;
    private $voucherRule;

    public function __construct($db) {
        $this->conn = $db;
        $this->voucherRule = new VoucherRule($db);
    }

    public function create() {
        if ($_SERVER['REQUEST_METHOD'] != "POST") {
            return ["message" => "Method not allowed.", "success" => false, "status" => 405];
        }

        $input_data = json_decode(file_get_contents("php://input"), true);
        if (!$input_data) {
            $input_data = [
                "voucher_code" => $_POST['voucher_code'] ?? '',
                "point_require" => $_POST['point_require'] ?? '',
                "discount_percent" => $_POST['discount_percent'] ?? ''
            ];
        }

        if (empty($input_data['voucher_code']) || empty($input_data['point_require']) || empty($input_data['discount_percent'])) {
            return ["message" => "Thiếu dữ liệu bắt buộc.", "success" => false, "status" => 400];
        }

        $this->voucherRule->voucher_code = htmlspecialchars(strip_tags($input_data['voucher_code']));
        $this->voucherRule->point_require = htmlspecialchars(strip_tags($input_data['point_require']));
        $this->voucherRule->discount_percent = htmlspecialchars(strip_tags($input_data['discount_percent']));

        if ($this->voucherRule->create()) {
            return ["message" => "Quy định voucher được thêm thành công.", "success" => true, "status" => 201];
        }
        return ["message" => "Không thể thêm quy định voucher.", "success" => false, "status" => 400];
    }

    public function get() {
        if ($_SERVER['REQUEST_METHOD'] != "GET") {
            return ["message" => "Method not allowed.", "success" => false, "status" => 405];
        }

        $voucher_id = isset($_GET['id']) ? $_GET['id'] : '';
        if (!empty($voucher_id)) {
            $rule = $this->voucherRule->getById($voucher_id);
            if (empty($rule)) {
                return ["message" => "Không tìm thấy quy định voucher.", "success" => false, "status" => 404];
            }
            return ["message" => "Quy định voucher theo ID", "success" => true, "status" => 200, "data" => $rule];
        } else {
            $rules = $this->voucherRule->get();
            return ["message" => "Danh sách quy định voucher", "success" => true, "status" => 200, "data" => $rules];
        }
    }

    public function update() {
        if ($_SERVER['REQUEST_METHOD'] != "PUT") {
            return ["message" => "Method not allowed.", "success" => false, "status" => 405];
        }

        $voucher_id = isset($_GET['id']) ? $_GET['id'] : '';
        if (empty($voucher_id)) {
            return ["message" => "ID voucher không hợp lệ.", "success" => false, "status" => 400];
        }

        $input_data = json_decode(file_get_contents("php://input"), true);
        if (!$input_data) {
            $input_data = [
                "voucher_code" => $_POST['voucher_code'] ?? '',
                "point_require" => $_POST['point_require'] ?? '',
                "discount_percent" => $_POST['discount_percent'] ?? ''
            ];
        }

        if (empty($input_data['voucher_code']) || empty($input_data['point_require']) || empty($input_data['discount_percent'])) {
            return ["message" => "Thiếu dữ liệu bắt buộc.", "success" => false, "status" => 400];
        }

        $this->voucherRule->voucher_id = $voucher_id;
        $this->voucherRule->voucher_code = htmlspecialchars(strip_tags($input_data['voucher_code']));
        $this->voucherRule->point_require = htmlspecialchars(strip_tags($input_data['point_require']));
        $this->voucherRule->discount_percent = htmlspecialchars(strip_tags($input_data['discount_percent']));

        if ($this->voucherRule->update()) {
            return ["message" => "Quy định voucher được cập nhật thành công.", "success" => true, "status" => 200];
        }
        return ["message" => "Không thể cập nhật quy định voucher.", "success" => false, "status" => 400];
    }

    public function delete() {
        if ($_SERVER['REQUEST_METHOD'] != "DELETE") {
            return ["message" => "Method not allowed.", "success" => false, "status" => 405];
        }

        $voucher_id = isset($_GET['id']) ? $_GET['id'] : '';
        if (empty($voucher_id)) {
            return ["message" => "ID voucher không hợp lệ.", "success" => false, "status" => 400];
        }

        if ($this->voucherRule->delete($voucher_id)) {
            return ["message" => "Quy định voucher đã được xóa thành công.", "success" => true, "status" => 200];
        }
        return ["message" => "Không thể xóa quy định voucher.", "success" => false, "status" => 400];
    }
}
?>