<?php
require_once __DIR__ . "/../../config/connect.php";
require_once __DIR__ . "/../models/tables.php";

class TableController {
    private $conn;
    private $model;

    public function __construct($db) {
        $this->conn = $db;
        $this->model = new TableModel();
    }

    public function create() {
        if ($_SERVER['REQUEST_METHOD'] != "POST") {
            return array("message" => "Method not allowed.", "success" => false, "status" => 405);
        }

        $input_data = json_decode(file_get_contents("php://input"), true);
        if (!$input_data) {
            return array("message" => "Dữ liệu không hợp lệ.", "success" => false, "status" => 400);
        }

        if (empty($input_data['name']) || !isset($input_data['quantity']) || empty($input_data['status'])) {
            return array("message" => "Tên, sức chứa hoặc trạng thái không được để trống.", "success" => false, "status" => 400);
        }

        $this->model->name = htmlspecialchars(strip_tags($input_data['name']));
        $this->model->quantity = htmlspecialchars(strip_tags($input_data['quantity']));
        $this->model->status = htmlspecialchars(strip_tags($input_data['status']));

        if ($this->model->create()) {
            return array("message" => "Thêm bàn thành công.", "success" => true, "status" => 201);
        } else {
            return array("message" => "Không thể thêm bàn.", "success" => false, "status" => 400);
        }
    }

    public function get() {
        if ($_SERVER['REQUEST_METHOD'] != "GET") {
            return array("message" => "Method not allowed.", "success" => false, "status" => 405);
        }

        $table_id = isset($_GET['id']) ? $_GET['id'] : '';
        $status = isset($_GET['status']) ? $_GET['status'] : '';
        if (!empty($table_id)) {
            $tables = $this->model->getById($table_id);
            if (empty($tables)) {
                return array("message" => "Không tìm thấy bàn.", "success" => false, "status" => 404);
            }
            return array("message" => "Thông tin bàn", "success" => true, "status" => 200, "data" => $tables);
        } elseif (!empty($status)) {
            $tables = $this->model->getByStatus($status);
            if (empty($tables)) {
                return array("message" => "Không tìm thấy bàn theo trạng thái.", "success" => false, "status" => 404, "data" => []);
            }
            return array("message" => "Danh sách bàn theo trạng thái", "success" => true, "status" => 200, "data" => $tables);
        } else {
            $tables = $this->model->get();
            return array("message" => "Danh sách bàn", "success" => true, "status" => 200, "data" => $tables);
        }
    }

    public function update() {
        if ($_SERVER['REQUEST_METHOD'] != "POST") {
            return array("message" => "Method not allowed.", "success" => false, "status" => 405);
        }

        $table_id = isset($_GET['id']) ? $_GET['id'] : '';
        if (empty($table_id)) {
            return array("message" => "ID bàn không hợp lệ.", "success" => false, "status" => 400);
        }

        $input_data = json_decode(file_get_contents("php://input"), true);
        if (!$input_data) {
            return array("message" => "Dữ liệu không hợp lệ.", "success" => false, "status" => 400);
        }

        // Cho phép cập nhật từng trường, không bắt buộc tất cả
        $this->model->table_id = htmlspecialchars(strip_tags($table_id));
        
        // Chỉ gán các trường có trong input_data
        if (isset($input_data['name'])) {
            $this->model->name = htmlspecialchars(strip_tags($input_data['name']));
        }
        if (isset($input_data['quantity'])) {
            $this->model->quantity = htmlspecialchars(strip_tags($input_data['quantity']));
        }
        if (isset($input_data['status'])) {
            $this->model->status = htmlspecialchars(strip_tags($input_data['status']));
        }
        if (isset($input_data['order_id'])) {
            $this->model->order_id = $input_data['order_id'] ? htmlspecialchars(strip_tags($input_data['order_id'])) : null;
        }

        // Phải có ít nhất 1 trường để cập nhật
        if (!isset($input_data['name']) && !isset($input_data['quantity']) && !isset($input_data['status']) && !isset($input_data['order_id'])) {
            return array("message" => "Không có trường nào để cập nhật.", "success" => false, "status" => 400);
        }

        if ($this->model->update()) {
            return array("message" => "Cập nhật bàn thành công.", "success" => true, "status" => 200);
        } else {
            return array("message" => "Không thể cập nhật bàn.", "success" => false, "status" => 400);
        }
    }

    public function delete() {
        if ($_SERVER['REQUEST_METHOD'] != "DELETE") {
            return array("message" => "Method not allowed.", "success" => false, "status" => 405);
        }

        $table_id = isset($_GET['id']) ? $_GET['id'] : '';
        if (empty($table_id)) {
            return array("message" => "ID bàn không hợp lệ.", "success" => false, "status" => 400);
        }

        if ($this->model->delete($table_id)) {
            return array("message" => "Xóa bàn thành công.", "success" => true, "status" => 200);
        } else {
            return array("message" => "Không thể xóa bàn.", "success" => false, "status" => 400);
        }
    }
}
?>