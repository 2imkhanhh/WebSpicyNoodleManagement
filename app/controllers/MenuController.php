<?php
require_once __DIR__ . "/../../config/connect.php";
require_once __DIR__ . "/../models/menu.php";

class MenuController {
    private $conn;
    private $menu;

    public function __construct($db) {
        $this->conn = $db;
        $this->menu = new Menu($db);
    }

    public function create() {
        if ($_SERVER['REQUEST_METHOD'] != "POST") {
            return array("message" => "Method not allowed.", "success" => false, "status" => 405);
        }

        $image_path = null;
        if (isset($_FILES['image']) && $_FILES['image']['error'] == 0) {
            $target_dir = "../public/uploads/"; 
            $original_filename = basename($_FILES['image']['name']); 
            $target_file = $target_dir . $original_filename;

            if (move_uploaded_file($_FILES['image']['tmp_name'], $target_file)) {
                $image_path = "uploads/" . $original_filename; 
            } else {
                return array("message" => "Lỗi upload ảnh.", "success" => false, "status" => 400);
            }
        } else {
            return array("message" => "Không có ảnh upload.", "success" => false, "status" => 400);
        }

        $input_data = json_decode(file_get_contents("php://input"), true);
        if (!$input_data) {
            $input_data = array(
                "name" => $_POST['name'] ?? '',
                "category_id" => $_POST['category_id'] ?? '',
                "price" => $_POST['price'] ?? ''
            );
        }

        $input_data['image'] = $image_path;

        if (empty($input_data['name']) || empty($input_data['category_id']) || empty($input_data['price']) || empty($image_path)) {
            return array("message" => "Dữ liệu không hợp lệ.", "success" => false, "status" => 400);
        }

        if ($input_data['category_id'] == 0 || $input_data['category_id'] == '') {
            return array("message" => "Danh mục không hợp lệ.", "success" => false, "status" => 400);
        }

        $this->menu->name = htmlspecialchars(strip_tags($input_data['name']));
        $this->menu->category_id = htmlspecialchars(strip_tags($input_data['category_id']));
        $this->menu->image = $image_path;
        $this->menu->price = htmlspecialchars(strip_tags($input_data['price']));

        if ($this->menu->create()) {
            return array("message" => "Món mới được thêm thành công.", "success" => true, "status" => 201);
        } else {
            return array("message" => "Không thể thêm món. Kiểm tra category_id.", "success" => false, "status" => 400);
        }
    }

    public function get() {
        if ($_SERVER['REQUEST_METHOD'] != 'GET') {
            return array("message" => "Method not allowed.", "success" => false, "status" => 405);
        }

        $category_id = isset($_GET['category_id']) ? $_GET['category_id'] : '';
        $food_id = isset($_GET['id']) ? $_GET['id'] : ''; 

        if (!empty($food_id)) {
            // Lấy thông tin món theo food_id
            $result = $this->menu->getById($food_id);
        } else {
            // Lấy danh sách món theo category_id 
            $result = $this->menu->get($category_id);
        }

        return array("success" => true, "data" => $result, "status" => 200);
    }

    public function update() {
        if ($_SERVER['REQUEST_METHOD'] != "POST") { 
            return array("message" => "Method not allowed.", "success" => false, "status" => 405);
        }

        $food_id = isset($_GET['id']) ? $_GET['id'] : '';
        if (empty($food_id)) {
            return array("message" => "ID món không hợp lệ.", "success" => false, "status" => 400);
        }

        $image_path = null;
        if (isset($_FILES['image']) && $_FILES['image']['error'] == 0) {
            $target_dir = "../public/uploads/";
            $original_filename = basename($_FILES['image']['name']);
            $target_file = $target_dir . $original_filename;

            if (move_uploaded_file($_FILES['image']['tmp_name'], $target_file)) {
                $image_path = "uploads/" . $original_filename;
            } else {
                return array("message" => "Lỗi upload ảnh.", "success" => false, "status" => 400);
            }
        }

        // Lấy dữ liệu từ POST
        $input_data = array(
            "name" => $_POST['name'] ?? '',
            "category_id" => $_POST['category_id'] ?? '',
            "price" => $_POST['price'] ?? ''
        );

        // Nếu không có ảnh mới, giữ nguyên ảnh cũ
        if (!$image_path) {
            $query = "SELECT image FROM menu WHERE food_id = :food_id";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(":food_id", $food_id, PDO::PARAM_INT);
            $stmt->execute();
            $current_image = $stmt->fetchColumn();
            $image_path = $current_image ?: null;
        }

        // Validate dữ liệu
        if (empty($input_data['name']) || empty($input_data['category_id']) || empty($input_data['price'])) {
            return array("message" => "Dữ liệu không hợp lệ.", "success" => false, "status" => 400);
        }

        if ($input_data['category_id'] == 0 || $input_data['category_id'] == '') {
            return array("message" => "Danh mục không hợp lệ.", "success" => false, "status" => 400);
        }

        // Gán dữ liệu vào model
        $this->menu->food_id = $food_id;
        $this->menu->name = htmlspecialchars(strip_tags($input_data['name']));
        $this->menu->category_id = htmlspecialchars(strip_tags($input_data['category_id']));
        $this->menu->image = $image_path;
        $this->menu->price = htmlspecialchars(strip_tags($input_data['price']));

        // Cập nhật vào DB
        if ($this->menu->update()) {
            return array("message" => "Món được cập nhật thành công.", "success" => true, "status" => 200);
        } else {
            return array("message" => "Không thể cập nhật món.", "success" => false, "status" => 400);
        }
    }

    public function delete($food_id) {
        if ($_SERVER['REQUEST_METHOD'] != 'DELETE') {
            return array("message" => "Method not allowed.", "success" => false, "status" => 405);
        }

        if (empty($food_id)) {
            return array("message" => "ID món không hợp lệ.", "success" => false, "status" => 400);
        }

        // Gán food_id vào model để xóa
        $this->menu->food_id = $food_id;

        // Thực hiện xóa trong model 
        if ($this->menu->delete()) {
            return array("message" => "Món đã được xóa thành công.", "success" => true, "status" => 200);
        } else {
            return array("message" => "Không thể xóa món.", "success" => false, "status" => 400);
        }
    }
}
?>