<?php
class Menu {
    private $conn;
    private $table_name = "menu";

    public $food_id;
    public $name;
    public $category_id;
    public $image;
    public $price;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function create() {
        if (empty($this->category_id) || $this->category_id == 0) {
            return false; 
        }

        $query = "INSERT INTO " . $this->table_name . " SET name=:name, category_id=:category_id, image=:image, price=:price";
        $stmt = $this->conn->prepare($query);

        $this->name = htmlspecialchars(strip_tags($this->name));
        $this->category_id = htmlspecialchars(strip_tags($this->category_id));
        $this->image = htmlspecialchars(strip_tags($this->image));
        $this->price = htmlspecialchars(strip_tags($this->price));

        $stmt->bindParam(":name", $this->name);
        $stmt->bindParam(":category_id", $this->category_id);
        $stmt->bindParam(":image", $this->image);
        $stmt->bindParam(":price", $this->price);

        return $stmt->execute();
    }

    public function get($category_id = '') {
        $query = "SELECT m.food_id, m.name, m.price, m.image, c.name AS category_name 
                  FROM " . $this->table_name . " m 
                  LEFT JOIN category c ON m.category_id = c.category_id";
        if (!empty($category_id)) {
            $query .= " WHERE m.category_id = :category_id";
        }
        $stmt = $this->conn->prepare($query);
        if (!empty($category_id)) {
            $stmt->bindParam(":category_id", $category_id, PDO::PARAM_INT);
        }
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getById($food_id) {
        $query = "SELECT m.food_id, m.name, m.price, m.image, c.name AS category_name, m.category_id 
                  FROM " . $this->table_name . " m 
                  LEFT JOIN category c ON m.category_id = c.category_id 
                  WHERE m.food_id = :food_id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":food_id", $food_id, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function update() {
        $query = "UPDATE " . $this->table_name . " SET name=:name, category_id=:category_id, image=:image, price=:price WHERE food_id=:food_id";
        $stmt = $this->conn->prepare($query);

        $this->name = htmlspecialchars(strip_tags($this->name));
        $this->category_id = htmlspecialchars(strip_tags($this->category_id));
        $this->image = htmlspecialchars(strip_tags($this->image));
        $this->price = htmlspecialchars(strip_tags($this->price));
        $this->food_id = htmlspecialchars(strip_tags($this->food_id));

        $stmt->bindParam(":name", $this->name);
        $stmt->bindParam(":category_id", $this->category_id);
        $stmt->bindParam(":image", $this->image);
        $stmt->bindParam(":price", $this->price);
        $stmt->bindParam(":food_id", $this->food_id, PDO::PARAM_INT);

        return $stmt->execute();
    }

    public function delete() {
        $query = "DELETE FROM " . $this->table_name . " WHERE food_id = :food_id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":food_id", $this->food_id, PDO::PARAM_INT);

        return $stmt->execute();
    }
}
?>