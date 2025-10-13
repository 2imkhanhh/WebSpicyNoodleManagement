<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: DELETE");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once __DIR__ . '/../app/controllers/MenuController.php';

$database = new Database();
$db = $database->getConnection();
$controller = new MenuController($db);

$food_id = isset($_GET['id']) ? $_GET['id'] : '';

if (empty($food_id)) {
    http_response_code(400);
    echo json_encode(array("success" => false, "message" => "ID món không hợp lệ."));
    exit;
}

$response = $controller->delete($food_id);

http_response_code($response['status']);
echo json_encode(array("message" => $response['message'] ?? '', "success" => $response['success'], "data" => $response['data'] ?? []));
?>