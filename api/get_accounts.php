<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once '../app/controllers/AccountController.php';

$database = new Database();
$db = $database->getConnection();
$controller = new AccountController();
$role_filter = isset($_GET['role']) ? $_GET['role'] : null;
$account_id = isset($_GET['id']) ? $_GET['id'] : '';

if (!empty($account_id)) {
    // Lấy theo account_id
    $response = $controller->get();
} else if ($role_filter === '0') {
    // Lấy customers
    $response = $controller->getCustomers();
} else {
    // Lấy tất cả accounts
    $response = $controller->get();
}

http_response_code($response['status']);
echo json_encode(array("message" => $response['message'], "success" => $response['success'], "data" => $response['data']));
?>