<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once '../app/controllers/PointController.php';

$database = new Database();
$db = $database->getConnection();
$controller = new PointController($db);

$method = $_SERVER['REQUEST_METHOD'];
$id = isset($_GET['id']) ? $_GET['id'] : '';

switch ($method) {
    case 'GET':
        $response = $controller->get();
        break;
    case 'POST':
        $response = $controller->create();
        break;
    case 'PUT':
        $response = $controller->update();
        break;
    case 'DELETE':
        $response = $controller->delete();
        break;
    default:
        $response = ["message" => "Method not allowed.", "success" => false, "status" => 405];
        break;
}

http_response_code($response['status']);
echo json_encode(["message" => $response['message'], "success" => $response['success'], "data" => $response['data'] ?? null]);
?>