<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once '../app/controllers/OrderController.php';

$database = new Database();
$db = $database->getConnection();
$controller = new OrderController($db);

$response = $controller->getDetails();

http_response_code($response['status']);
echo json_encode(array("message" => $response['message'], "success" => $response['success'], "data" => $response['data'] ?? []));
?>