<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");

require_once '../app/controllers/CustomerController.php';

$database = new Database();
$db = $database->getConnection();
$controller = new CustomerController($db);

$response = $controller->getCustomerInfo();

http_response_code($response['status']);
echo json_encode([
    "message" => $response['message'],
    "success" => $response['success'],
    "data" => $response['data'] ?? null
]);
?>