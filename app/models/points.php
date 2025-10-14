<?php
class PointRule {
    private $conn;
    private $table_name = "point_rules";

    public $rule_id;
    public $min_amount;
    public $max_amount;
    public $points_earned;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function create() {
        $query = "INSERT INTO " . $this->table_name . " SET min_amount=:min, max_amount=:max, points_earned=:points";
        $stmt = $this->conn->prepare($query);
        $this->min_amount = htmlspecialchars(strip_tags($this->min_amount));
        $this->max_amount = htmlspecialchars(strip_tags($this->max_amount ?? null));
        $this->points_earned = htmlspecialchars(strip_tags($this->points_earned));

        $stmt->bindParam(":min", $this->min_amount);
        $stmt->bindParam(":max", $this->max_amount, PDO::PARAM_STR);
        $stmt->bindParam(":points", $this->points_earned);

        if ($stmt->execute()) {
            return true;
        }
        return false;
    }

    public function get() {
        $query = "SELECT rule_id, min_amount, max_amount, points_earned FROM " . $this->table_name;
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getById($rule_id) {
        $query = "SELECT rule_id, min_amount, max_amount, points_earned FROM " . $this->table_name . " WHERE rule_id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $rule_id, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function update() {
        $query = "UPDATE " . $this->table_name . " SET min_amount=:min, max_amount=:max, points_earned=:points WHERE rule_id=:id";
        $stmt = $this->conn->prepare($query);
        $this->min_amount = htmlspecialchars(strip_tags($this->min_amount));
        $this->max_amount = htmlspecialchars(strip_tags($this->max_amount ?? null));
        $this->points_earned = htmlspecialchars(strip_tags($this->points_earned));
        $this->rule_id = htmlspecialchars(strip_tags($this->rule_id));

        $stmt->bindParam(":min", $this->min_amount);
        $stmt->bindParam(":max", $this->max_amount, PDO::PARAM_STR);
        $stmt->bindParam(":points", $this->points_earned);
        $stmt->bindParam(":id", $this->rule_id, PDO::PARAM_INT);

        return $stmt->execute();
    }

    public function delete($rule_id) {
        $query = "DELETE FROM " . $this->table_name . " WHERE rule_id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $rule_id, PDO::PARAM_INT);
        return $stmt->execute();
    }
}
?>