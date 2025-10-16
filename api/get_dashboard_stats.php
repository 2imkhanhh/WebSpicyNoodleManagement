<?php
header("Access-Control-Allow-Origin: http://localhost:81");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once '../app/controllers/DashboardController.php';

$database = new Database();
$db = $database->getConnection();
$controller = new DashboardController($db);
$response = $controller->getStats();

http_response_code($response['success'] ? 200 : 500);
echo json_encode($response);
?>