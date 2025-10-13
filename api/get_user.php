<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

session_start();

require_once '../app/core/Response.php';

if (isset($_SESSION['user'])) {
    Response::json([
        "success" => true,
        "user" => $_SESSION['user']
    ]);
} else {
    Response::json([
        "success" => false,
        "message" => "Người dùng chưa đăng nhập"
    ], 401);
}
?>