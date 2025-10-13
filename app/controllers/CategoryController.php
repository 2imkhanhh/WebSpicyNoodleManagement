<?php
require_once __DIR__ . "/../../config/connect.php";
require_once __DIR__ . "/../models/category.php";

class CategoryController {
    private $conn;
    private $category;

    public function __construct($db) {
        $this->conn = $db;
        $this->category = new Category($db);
    }

    public function create() {
        if ($_SERVER['REQUEST_METHOD'] != "POST") {
            return array("message" => "Method not allowed.", "success" => false, "status" => 405);
        }

        $input_data = json_decode(file_get_contents("php://input"), true);
        if (!$input_data) {
            $input_data = array(
                "name" => $_POST['name'] ?? ''
            );
        }

        if (empty($input_data['name'])) {
            return array("message" => "Tên danh mục không được để trống.", "success" => false, "status" => 400);
        }

        $this->category->name = htmlspecialchars(strip_tags($input_data['name']));

        if ($this->category->create()) {
            return array("message" => "Danh mục được thêm thành công.", "success" => true, "status" => 201);
        } else {
            return array("message" => "Không thể thêm danh mục.", "success" => false, "status" => 400);
        }
    }

    public function get() {
        if ($_SERVER['REQUEST_METHOD'] != "GET") {
            return array("message" => "Method not allowed.", "success" => false, "status" => 405);
        }

        $category_id = isset($_GET['id']) ? $_GET['id'] : '';

        if (!empty($category_id)) {
            $categories = $this->category->getById($category_id);
            if (empty($categories)) {
                return array("message" => "Không tìm thấy danh mục.", "success" => false, "status" => 404);
            }
            return array("message" => "Danh mục theo ID", "success" => true, "status" => 200, "data" => $categories);
        } else {
            $categories = $this->category->get();
            return array("message" => "Danh sách danh mục", "success" => true, "status" => 200, "data" => $categories);
        }
    }

    public function update() {
        if ($_SERVER['REQUEST_METHOD'] != "POST") {
            return array("message" => "Method not allowed.", "success" => false, "status" => 405);
        }

        $category_id = isset($_GET['id']) ? $_GET['id'] : '';
        if (empty($category_id)) {
            return array("message" => "ID danh mục không hợp lệ.", "success" => false, "status" => 400);
        }

        $input_data = json_decode(file_get_contents("php://input"), true);
        if (!$input_data) {
            $input_data = array(
                "name" => $_POST['name'] ?? ''
            );
        }

        if (empty($input_data['name'])) {
            return array("message" => "Tên danh mục không được để trống.", "success" => false, "status" => 400);
        }

        $this->category->id = $category_id;
        $this->category->name = htmlspecialchars(strip_tags($input_data['name']));

        if ($this->category->update()) {
            return array("message" => "Danh mục được cập nhật thành công.", "success" => true, "status" => 200);
        } else {
            return array("message" => "Không thể cập nhật danh mục.", "success" => false, "status" => 400);
        }
    }

    public function delete() {
        if ($_SERVER['REQUEST_METHOD'] != "DELETE") {
            return array("message" => "Method not allowed.", "success" => false, "status" => 405);
        }

        $category_id = isset($_GET['id']) ? $_GET['id'] : '';
        if (empty($category_id)) {
            return array("message" => "ID danh mục không hợp lệ.", "success" => false, "status" => 400);
        }

        if ($this->category->delete($category_id)) {
            return array("message" => "Danh mục đã được xóa thành công.", "success" => true, "status" => 200);
        } else {
            return array("message" => "Không thể xóa danh mục.", "success" => false, "status" => 400);
        }
    }
}
?>