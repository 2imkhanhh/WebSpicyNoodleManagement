<?php
require_once "../app/controllers/AccountController.php";

$data = json_decode(file_get_contents("php://input"));
$controller = new AccountController();
$controller->login($data);
?>
