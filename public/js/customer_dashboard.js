document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Lấy thông tin người dùng từ session qua API get_user.php
        const userResponse = await fetch('http://localhost:81/SpicyNoodleProject/api/get_user.php', {
            method: 'GET',
            credentials: 'include'
        });

        if (!userResponse.ok) {
            throw new Error(`HTTP error! status: ${userResponse.status}`);
        }

        const userData = await userResponse.json();
        if (!userData.success || !userData.user.id) {
            console.error('Lỗi lấy thông tin người dùng:', userData.message);
            alert('Vui lòng đăng nhập để xem thông tin!');
            window.location.href = 'login.html';
            return;
        }

        const accountId = userData.user.id;

        // Lấy thông tin khách hàng (chỉ lấy điểm tích lũy)
        const customerResponse = await fetch(`http://localhost:81/SpicyNoodleProject/api/get_customer.php?account_id=${accountId}`, {
            method: 'GET',
            credentials: 'include'
        });

        if (!customerResponse.ok) {
            throw new Error(`HTTP error! status: ${customerResponse.status}`);
        }

        const customerData = await customerResponse.json();

        if (customerData.success) {
            // Cập nhật điểm tích lũy
            document.querySelector('.card:nth-child(1) .card-value').textContent = `${customerData.data.points || 0} điểm`;
        } else {
            console.error('Lỗi lấy thông tin khách hàng:', customerData.message);
            document.querySelector('.card:nth-child(1) .card-value').textContent = '0 điểm';
        }

        // Lấy danh sách đơn hàng
        const ordersResponse = await fetch(`http://localhost:81/SpicyNoodleProject/api/get_orders.php?account_id=${accountId}`, {
            method: 'GET',
            credentials: 'include'
        });

        if (!ordersResponse.ok) {
            throw new Error(`HTTP error! status: ${ordersResponse.status}`);
        }

        const ordersData = await ordersResponse.json();

        if (ordersData.success) {
            // Cập nhật tổng đơn hàng
            document.querySelector('.card:nth-child(2) .card-value').textContent = ordersData.data.length;

            // Cập nhật hoạt động gần đây (chỉ hiển thị ngày và tổng tiền)
            const recentActivityList = document.querySelector('.recent-activity .list-group');
            recentActivityList.innerHTML = ''; // Xóa nội dung tĩnh
            if (ordersData.data.length > 0) {
                ordersData.data.slice(0, 3).forEach(order => {
                    const li = document.createElement('li');
                    li.classList.add('list-group-item');
                    // Chỉ hiển thị ngày (không hiển thị giờ) và tổng tiền
                    const orderDate = new Date(order.orderDate).toLocaleDateString('vi-VN');
                    li.textContent = `Đặt món ngày ${orderDate} - ${parseFloat(order.totalPrice).toLocaleString('vi-VN')} VNĐ`;
                    recentActivityList.appendChild(li);
                });
            } else {
                const li = document.createElement('li');
                li.classList.add('list-group-item', 'text-muted');
                li.textContent = 'Chưa có hoạt động nào';
                recentActivityList.appendChild(li);
            }
        } else {
            console.error('Lỗi lấy đơn hàng:', ordersData.message);
            document.querySelector('.card:nth-child(2) .card-value').textContent = '0';
            document.querySelector('.recent-activity .list-group').innerHTML = '<li class="list-group-item text-muted">Chưa có hoạt động nào</li>';
        }
    } catch (error) {
        console.error('Lỗi kết nối:', error);
        alert('Lỗi kết nối: ' + error.message);
        // Đặt giá trị mặc định khi có lỗi
        document.querySelector('.card:nth-child(1) .card-value').textContent = '0 điểm';
        document.querySelector('.card:nth-child(2) .card-value').textContent = '0';
        document.querySelector('.recent-activity .list-group').innerHTML = '<li class="list-group-item text-muted">Chưa có hoạt động nào</li>';
    }
});

// Hàm đăng xuất
function logout() {
    fetch('http://localhost:81/SpicyNoodleProject/api/logout.php', {
        method: 'POST',
        credentials: 'include'
    })
    .then(() => {
        localStorage.removeItem('account_id');
        window.location.href = 'login.html';
    })
    .catch(error => {
        console.error('Lỗi đăng xuất:', error);
        localStorage.removeItem('account_id');
        window.location.href = 'login.html';
    });
}