<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");

require_once '../app/controllers/AccountController.php';

$controller = new AccountController();
$customer_id = isset($_GET['id']) ? $_GET['id'] : '';

if (empty($customer_id)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Thiếu customer_id"]);
    exit;
}

// Lấy customer theo ID
require_once __DIR__ . '/../models/customer.php';
$database = new Database();
$db = $database->getConnection();
$customer = new Customer($db);
$customerData = $customer->getById($customer_id);

if ($customerData) {
    http_response_code(200);
    echo json_encode([
        "success" => true, 
        "message" => "Customer found",
        "data" => $customerData
    ]);
} else {
    http_response_code(404);
    echo json_encode(["success" => false, "message" => "Không tìm thấy khách hàng"]);
}
?>