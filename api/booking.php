<?php
session_start(); // bắt buộc nếu muốn dùng $_SESSION

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Handle preflight request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include_once "../config/connect.php";

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];

// Lấy account_id từ session
$account_id = $_SESSION['user']['id'] ?? null;
if (!$account_id && $method !== 'GET') { // GET có thể hiển thị tất cả booking
    echo json_encode(["error" => "Bạn chưa đăng nhập"]);
    exit();
}

switch ($method) {
    case 'GET':
        if (isset($_GET['id'])) {
            $id = intval($_GET['id']);
            $query = "SELECT b.booking_id, b.account_id, a.name AS account_name, b.table_number, b.booking_date, b.booking_time, b.num_people, b.note, b.status, b.created_at
                      FROM bookings b
                      LEFT JOIN accounts a ON b.account_id = a.account_id
                      WHERE b.booking_id = ?";
            $stmt = $db->prepare($query);
            $stmt->execute([$id]);
            $data = $stmt->fetch(PDO::FETCH_ASSOC);
            echo json_encode($data ? $data : ["message" => "Không tìm thấy"]);
        } else {
            $query = "SELECT b.booking_id, b.account_id, a.name AS account_name, b.table_number, b.booking_date, b.booking_time, b.num_people, b.note, b.status, b.created_at
                      FROM bookings b
                      LEFT JOIN accounts a ON b.account_id = a.account_id
                      ORDER BY b.booking_date DESC, b.booking_time DESC";
            $stmt = $db->prepare($query);
            $stmt->execute();
            $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode($data);
        }
        break;

    case 'POST':
        $input = json_decode(file_get_contents("php://input"), true);
        if (!$input || !isset($input['table_number'], $input['booking_date'], $input['booking_time'], $input['num_people'])) {
            echo json_encode(["error" => "Thiếu dữ liệu bắt buộc"]);
            exit();
        }

        $query = "INSERT INTO bookings (account_id, table_number, booking_date, booking_time, num_people, note, status)
                  VALUES (?, ?, ?, ?, ?, ?, 'pending')";
        $stmt = $db->prepare($query);
        $stmt->execute([
            $account_id, // lấy từ session
            $input['table_number'],
            $input['booking_date'],
            $input['booking_time'],
            $input['num_people'],
            $input['note'] ?? null
        ]);

        echo json_encode(["success" => true, "booking_id" => $db->lastInsertId()]);
        break;
    case 'PUT':
        // Cập nhật trạng thái booking
        $input = json_decode(file_get_contents("php://input"), true);
        $id = $input['booking_id'] ?? null;
        $status = $input['status'] ?? null;

        if (!$id || !$status) {
            echo json_encode(["error" => "Thiếu dữ liệu booking_id hoặc status"]);
            exit();
        }

        $stmt = $db->prepare("UPDATE bookings SET status = ? WHERE booking_id = ?");
        $stmt->execute([$status, $id]);

        if ($stmt->rowCount() > 0) {
            echo json_encode(["success" => true, "message" => "Cập nhật trạng thái thành công"]);
        } else {
            echo json_encode(["error" => "Không thể cập nhật trạng thái"]);
        }
        break;  
    case 'DELETE':
    if (!$account_id) {
        echo json_encode(["error" => "Bạn chưa đăng nhập"]);
        exit();
    }

    $id = $_GET['id'] ?? null;
    if (!$id) {
        echo json_encode(["error" => "Thiếu id để xóa"]);
        exit();
    }

    $stmt = $db->prepare("DELETE FROM bookings WHERE booking_id = ? AND account_id = ?");
    $stmt->execute([$id, $account_id]);

    if ($stmt->rowCount() > 0) {
        echo json_encode(["success" => true, "message" => "Đã hủy bàn!"]);
    } else {
        echo json_encode(["error" => "Không thể hủy bàn này."]);
    }
    break;





    default:
        echo json_encode(["error" => "Hành động không hợp lệ"]);
        break;
}
