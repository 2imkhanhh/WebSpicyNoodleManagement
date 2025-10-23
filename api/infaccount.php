<?php
// chỉ start session nếu chưa start
if (session_status() == PHP_SESSION_NONE) {
    session_start();
}

// header JSON
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// require các file cần thiết
require_once __DIR__ . '/../config/connect.php';
require_once __DIR__ . '/../app/models/AccountModel.php';

// khởi tạo database và model
$database = new Database();
$db = $database->getConnection();
$model = new AccountModel($db);

// Xử lý GET
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (!isset($_SESSION['user'])) {
        echo json_encode(["success" => false, "message" => "Chưa đăng nhập"]);
        exit;
    }

    $id = $_SESSION['user']['id']; // chú ý: key trùng với lúc login
    $data = $model->getById($id);

    if ($data) {
        echo json_encode(["success" => true, "user" => $data]);
    } else {
        echo json_encode(["success" => false, "message" => "Không tìm thấy tài khoản"]);
    }
    exit;
}

// Xử lý POST
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!isset($_SESSION['user'])) {
        echo json_encode(["success" => false, "message" => "Chưa đăng nhập"]);
        exit;
    }

    $input = json_decode(file_get_contents("php://input"), true);
    if (!$input) {
        echo json_encode(["success" => false, "message" => "Dữ liệu không hợp lệ"]);
        exit;
    }

    $id = $_SESSION['user']['id'];
    $name = htmlspecialchars($input['name']);
    $phone = htmlspecialchars($input['phone']);
    $password = htmlspecialchars($input['password']);

    $ok = $model->update($id, $name, $phone, $password);

    if ($ok) {
        $_SESSION['user']['name'] = $name;
        $_SESSION['user']['phone'] = $phone;
    }

    echo json_encode([
        "success" => $ok,
        "message" => $ok ? "Cập nhật thành công!" : "Không thể cập nhật!"
    ]);
    exit;
}
?>
