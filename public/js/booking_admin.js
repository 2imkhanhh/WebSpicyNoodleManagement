const apiUrl = "http://localhost:81/SpicyNoodleProject/api/booking.php";

// --------------------
// Load tất cả booking
// --------------------
async function loadAllBookings() {
    const tbody = document.getElementById("bookingList");
    tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted">Đang tải dữ liệu...</td></tr>`;

    try {
        const response = await fetch(apiUrl, { method: "GET", credentials: "include" });
        const data = await response.json();

        tbody.innerHTML = "";

        if (!data || data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted">Không có dữ liệu</td></tr>`;
            return;
        }

        data.forEach(item => {
            tbody.innerHTML += `
                <tr>
                    <td>${item.booking_id}</td>
                    <td>${item.account_name || "Không rõ"}</td>
                    <td>${item.table_number}</td>
                    <td>${item.booking_date}</td>
                    <td>${item.booking_time}</td>
                    <td>${item.num_people}</td>
                    <td>${item.status}</td>
                    <td>
                        ${item.status !== 'confirmed' ? `<button class="btn btn-success btn-sm me-1" onclick="updateStatus(${item.booking_id}, 'confirmed')">Confirm</button>` : ''}
                        ${item.status !== 'cancelled' ? `<button class="btn btn-warning btn-sm" onclick="updateStatus(${item.booking_id}, 'cancelled')">Cancel</button>` : ''}
                    </td>
                </tr>
            `;
        });

    } catch (error) {
        console.error("Lỗi loadAllBookings:", error);
        tbody.innerHTML = `<tr><td colspan="8" class="text-center text-danger">Lỗi tải dữ liệu</td></tr>`;
    }
}

// --------------------
// Cập nhật trạng thái booking
// --------------------
async function updateStatus(id, status) {
    if (!confirm(`Bạn có chắc muốn chuyển trạng thái sang "${status}"?`)) return;

    try {
        const response = await fetch(apiUrl, {
            method: "PUT",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ booking_id: id, status })
        });
        const result = await response.json();
        alert(result.message || result.error);
        loadAllBookings(); // reload bảng sau khi update
    } catch (error) {
        console.error("Lỗi updateStatus:", error);
        alert("Lỗi cập nhật trạng thái!");
    }
}

// --------------------
// Tìm kiếm booking theo giờ
// --------------------
function searchBookingByTime() {
    const searchTime = document.getElementById("bookingSearch").value;
    if (!searchTime) {
        loadAllBookings();
        return;
    }

    fetch(apiUrl, { method: "GET", credentials: "include" })
        .then(res => res.json())
        .then(data => {
            const filtered = data.filter(item => item.booking_time === searchTime);
            const tbody = document.getElementById("bookingList");
            tbody.innerHTML = "";

            if (filtered.length === 0) {
                tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted">Không có dữ liệu</td></tr>`;
                return;
            }

            filtered.forEach(item => {
                tbody.innerHTML += `
                <tr>
                    <td>${item.booking_id}</td>
                    <td>${item.account_name || "Không rõ"}</td>
                    <td>${item.table_number}</td>
                    <td>${item.booking_date}</td>
                    <td>${item.booking_time}</td>
                    <td>${item.num_people}</td>
                    <td>${item.status}</td>
                    <td>
                        ${item.status !== 'confirmed' ? `<button class="btn btn-success btn-sm me-1" onclick="updateStatus(${item.booking_id}, 'confirmed')">Confirm</button>` : ''}
                        ${item.status !== 'cancelled' ? `<button class="btn btn-warning btn-sm" onclick="updateStatus(${item.booking_id}, 'cancelled')">Cancel</button>` : ''}
                    </td>
                </tr>`;
            });
        })
        .catch(err => {
            console.error("Lỗi searchBookingByTime:", err);
            document.getElementById("bookingList").innerHTML =
                `<tr><td colspan="8" class="text-center text-danger">Lỗi tải dữ liệu</td></tr>`;
        });
}

// --------------------
// DOM load
// --------------------
document.addEventListener("DOMContentLoaded", () => {
    loadAllBookings();
    document.getElementById("searchButton").addEventListener("click", searchBookingByTime);
});

// --------------------
// Logout
// --------------------
function logout() {
    alert("Đăng xuất thành công!");
    window.location.href = "/SpicyNoodleProject/public/views/login.html";
}
