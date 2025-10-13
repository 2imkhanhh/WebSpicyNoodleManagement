<?php
class Database {
    private $host = "localhost";
    private $db_name = "spicynoodleproject"; 
    private $username = "root";
    private $password = "";
    private $conn;

    public function getConnection() {
        if ($this->conn === null) {
            try {
                $this->conn = new PDO(
                    "mysql:host=" . $this->host . ";dbname=" . $this->db_name,
                    $this->username,
                    $this->password
                );
                $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
                $this->conn->exec("set names utf8");
            } catch (PDOException $exception) {
                echo "Kết nối thất bại: " . $exception->getMessage();
                return null; 
            }
        }
        return $this->conn;
    }
}
?>