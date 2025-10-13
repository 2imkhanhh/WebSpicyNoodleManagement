<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once __DIR__ . '/../app/controllers/CategoryController.php'; 
require_once __DIR__ . '/../config/connect.php';

$database = new Database();
$db = $database->getConnection();
$controller = new CategoryController($db);

$response = $controller->update();

http_response_code($response['status']);
echo json_encode(array("message" => $response['message'], "success" => $response['success']));
?>