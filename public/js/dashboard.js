document.addEventListener('DOMContentLoaded', () => {
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

    function logout() {
        alert("Đăng xuất thành công!");
        window.location.href = "/SpicyNoodleProject/public/views/login.html";
    }
});