const apiUrl = "http://localhost:81/SpicyNoodleProject/api/booking.php";

function loadMyBooking() {
    const info = document.getElementById("myBookingInfo");
    if (!info) return;

    fetch(apiUrl)
        .then(res => res.json())
        .then(data => {
            info.innerHTML = "";

            if (!data || data.length === 0) {
                info.innerHTML = `<div class="alert alert-warning text-center">Bạn chưa có bàn đặt nào.</div>`;
                return;
            }

            const booking = data[0];
            info.innerHTML = `
                <div class="card mt-3">
                    <div class="card-header bg-warning fw-bold text-white">Thông tin bàn của bạn</div>
                    <div class="card-body">
                        <p><strong>Số bàn:</strong> ${booking.table_number}</p>
                        <p><strong>Ngày đặt:</strong> ${booking.booking_date}</p>
                        <p><strong>Giờ đặt:</strong> ${booking.booking_time}</p>
                        <p><strong>Số người:</strong> ${booking.num_people}</p>
                        <p><strong>Ghi chú:</strong> ${booking.note || "Không có"}</p>
                        <p><strong>Trạng thái:</strong> ${booking.status}</p>
                        <button class="btn btn-danger btn-cancel" data-id="${booking.booking_id}">
                            <i class="fa-solid fa-times"></i> Hủy bàn
                        </button>
                    </div>
                </div>`;

            const btn = document.querySelector(".btn-cancel");
            if (btn) {
                btn.addEventListener("click", () => cancelBooking(booking.booking_id));
            }
        })
        .catch(err => console.error("Lỗi loadMyBooking:", err));
}

function addBooking() {
    const data = {
        table_number: document.getElementById("table_number").value,
        booking_date: document.getElementById("booking_date").value,
        booking_time: document.getElementById("booking_time").value,
        num_people: document.getElementById("num_people").value,
        note: document.getElementById("note").value
    };

    fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    })
    .then(res => res.json())
    .then(resp => {
        if (resp.error) {
            alert(resp.error);
        } else {
            alert("Đặt bàn thành công!");
            loadMyBooking();
        }
    })
    .catch(err => console.error("Lỗi addBooking:", err));
}

function cancelBooking(booking_id) {
    fetch(`${apiUrl}?id=${booking_id}`, {
        method: "DELETE"
    })
    .then(res => res.json())
    .then(resp => {
        if (resp.success) {
            alert("Bàn đã được hủy!");
            loadMyBooking();
        } else {
            alert(resp.error || "Xảy ra lỗi khi hủy bàn.");
        }
    })
    .catch(err => console.error("Lỗi cancelBooking:", err));
}

document.addEventListener("DOMContentLoaded", loadMyBooking);
