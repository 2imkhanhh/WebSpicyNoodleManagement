<?php
require_once __DIR__ . "/../../config/connect.php";
require_once __DIR__ . "/../models/points.php";

class PointController {
    private $conn;
    private $pointRule;

    public function __construct($db) {
        $this->conn = $db;
        $this->pointRule = new PointRule($db);
    }

    public function create() {
        if ($_SERVER['REQUEST_METHOD'] != "POST") {
            return ["message" => "Method not allowed.", "success" => false, "status" => 405];
        }

        $input_data = json_decode(file_get_contents("php://input"), true);
        if (!$input_data) {
            $input_data = [
                "min_amount" => $_POST['min_amount'] ?? '',
                "max_amount" => $_POST['max_amount'] ?? '',
                "points_earned" => $_POST['points_earned'] ?? ''
            ];
        }

        if (empty($input_data['min_amount']) || empty($input_data['points_earned'])) {
            return ["message" => "Thiếu dữ liệu bắt buộc.", "success" => false, "status" => 400];
        }

        $this->pointRule->min_amount = htmlspecialchars(strip_tags($input_data['min_amount']));
        $this->pointRule->max_amount = htmlspecialchars(strip_tags($input_data['max_amount'] ?? null));
        $this->pointRule->points_earned = htmlspecialchars(strip_tags($input_data['points_earned']));

        if ($this->pointRule->create()) {
            return ["message" => "Quy định tích điểm được thêm thành công.", "success" => true, "status" => 201];
        }
        return ["message" => "Không thể thêm quy định.", "success" => false, "status" => 400];
    }

    public function get() {
        if ($_SERVER['REQUEST_METHOD'] != "GET") {
            return ["message" => "Method not allowed.", "success" => false, "status" => 405];
        }

        $rule_id = isset($_GET['id']) ? $_GET['id'] : '';
        if (!empty($rule_id)) {
            $rule = $this->pointRule->getById($rule_id);
            if (empty($rule)) {
                return ["message" => "Không tìm thấy quy định.", "success" => false, "status" => 404];
            }
            return ["message" => "Quy định theo ID", "success" => true, "status" => 200, "data" => $rule];
        } else {
            $rules = $this->pointRule->get();
            return ["message" => "Danh sách quy định", "success" => true, "status" => 200, "data" => $rules];
        }
    }

    public function update() {
        if ($_SERVER['REQUEST_METHOD'] != "PUT") {
            return ["message" => "Method not allowed.", "success" => false, "status" => 405];
        }

        $rule_id = isset($_GET['id']) ? $_GET['id'] : '';
        if (empty($rule_id)) {
            return ["message" => "ID quy định không hợp lệ.", "success" => false, "status" => 400];
        }

        $input_data = json_decode(file_get_contents("php://input"), true);
        if (!$input_data) {
            $input_data = [
                "min_amount" => $_POST['min_amount'] ?? '',
                "max_amount" => $_POST['max_amount'] ?? '',
                "points_earned" => $_POST['points_earned'] ?? ''
            ];
        }

        if (empty($input_data['min_amount']) || empty($input_data['points_earned'])) {
            return ["message" => "Thiếu dữ liệu bắt buộc.", "success" => false, "status" => 400];
        }

        $this->pointRule->rule_id = $rule_id;
        $this->pointRule->min_amount = htmlspecialchars(strip_tags($input_data['min_amount']));
        $this->pointRule->max_amount = htmlspecialchars(strip_tags($input_data['max_amount'] ?? null));
        $this->pointRule->points_earned = htmlspecialchars(strip_tags($input_data['points_earned']));

        if ($this->pointRule->update()) {
            return ["message" => "Quy định được cập nhật thành công.", "success" => true, "status" => 200];
        }
        return ["message" => "Không thể cập nhật quy định.", "success" => false, "status" => 400];
    }

    public function delete() {
        if ($_SERVER['REQUEST_METHOD'] != "DELETE") {
            return ["message" => "Method not allowed.", "success" => false, "status" => 405];
        }

        $rule_id = isset($_GET['id']) ? $_GET['id'] : '';
        if (empty($rule_id)) {
            return ["message" => "ID quy định không hợp lệ.", "success" => false, "status" => 400];
        }

        if ($this->pointRule->delete($rule_id)) {
            return ["message" => "Quy định đã được xóa thành công.", "success" => true, "status" => 200];
        }
        return ["message" => "Không thể xóa quy định.", "success" => false, "status" => 400];
    }
}
?>