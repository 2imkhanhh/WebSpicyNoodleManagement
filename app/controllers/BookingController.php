<?php
// app/controllers/BookingController.php
require_once __DIR__ . '/../models/BookingModel.php';

class BookingController {
    private $model;

    public function __construct() {
        $this->model = new BookingModel();
    }

    public function getAll() {
        return $this->model->getAll();
    }

    public function getByAccount($account_id) {
        return $this->model->getByAccount($account_id);
    }

    public function add($data) {
        return $this->model->add($data);
    }

    // public function cancel($booking_id, $account_id) {
    //     return $this->model->cancel($booking_id, $account_id);
    // }

    public function delete($booking_id) {
        return $this->model->delete($booking_id);
    }

    // public function search($date, $time) {
    //     return $this->model->search($date, $time);
    // }
}
