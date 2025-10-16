document.addEventListener('DOMContentLoaded', () => {
    // Lấy thông tin người dùng
    fetch('http://localhost:81/SpicyNoodleProject/api/get_user.php', {
        method: 'GET',
        credentials: 'include' // Gửi cookie/session
    })
    .then(response => response.json())
    .then(data => {
        if (data.success && data.user.name) {
            document.getElementById('userName').textContent = `Xin chào, ${data.user.name}`;
        } else {
            document.getElementById('userName').textContent = 'Xin chào, Khách';
        }
    })
    .catch(error => {
        console.error('Lỗi khi lấy thông tin người dùng:', error);
        document.getElementById('userName').textContent = 'Xin chào, Khách';
    });

    // Lấy thống kê đơn hàng và doanh thu
    fetch('http://localhost:81/SpicyNoodleProject/api/get_dashboard_stats.php', {
        method: 'GET',
        credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success && data.data) {
            // Cập nhật số đơn hàng hôm nay
            document.querySelector('.dashboard-cards .card:nth-child(1) .card-value').textContent = data.data.order_count;
            // Cập nhật doanh thu 
            document.querySelector('.dashboard-cards .card:nth-child(2) .card-value').textContent = 
                new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(data.data.total_revenue);
            //tổng số món
            document.querySelector('.dashboard-cards .card:nth-child(3) .card-value').textContent = data.data.menu_count;
        } else {
            console.error('Lỗi khi lấy dữ liệu thống kê:', data.message);
            document.querySelector('.dashboard-cards .card:nth-child(1) .card-value').textContent = '0';
            document.querySelector('.dashboard-cards .card:nth-child(2) .card-value').textContent = '0 VNĐ';
            document.querySelector('.dashboard-cards .card:nth-child(3) .card-value').textContent = '0';
        }
    })
    .catch(error => {
        console.error('Lỗi khi lấy thống kê:', error);
        document.querySelector('.dashboard-cards .card:nth-child(1) .card-value').textContent = '0';
        document.querySelector('.dashboard-cards .card:nth-child(2) .card-value').textContent = '0 VNĐ';
        document.querySelector('.dashboard-cards .card:nth-child(3) .card-value').textContent = '0';
    });
});