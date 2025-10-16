document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");

    if (registerForm) {
        registerForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const data = {
                name: registerForm.name.value,
                email: registerForm.email.value,
                phone: registerForm.phone.value,
                password: registerForm.password.value
            };

            try {
                const res = await fetch("http://localhost:81/SpicyNoodleProject/api/register.php", {
                    method: "POST",
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify(data)
                });
                const result = await res.json();
                alert(result.message);
                if (result.success) {
                    window.location.href = "/SpicyNoodleProject/public/views/login.html";
                }
            } catch (err) {
                console.error("Lỗi đăng ký:", err);
                alert("Lỗi kết nối server!");
            }
        });
    }

    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const data = {
                phone: loginForm.phone.value,
                password: loginForm.password.value
            };

            try {
                const res = await fetch("http://localhost:81/SpicyNoodleProject/api/login.php", {
                    method: "POST",
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify(data)
                });
                const result = await res.json();
                
                const loginMessage = document.getElementById("loginMessage");
                loginMessage.style.display = 'block';
                loginMessage.className = `alert ${result.success ? 'alert-success' : 'alert-danger'}`;
                loginMessage.textContent = result.message;

                if (result.success && result.user) {
                    // Lưu thông tin người dùng vào localStorage
                    localStorage.setItem('userId', result.user.id);
                    localStorage.setItem('userName', result.user.name);
                    localStorage.setItem('userRole', result.user.role);
                    localStorage.setItem('userStatus', result.user.status);

                    // Kiểm tra trạng thái tài khoản
                    if (result.user.status == 0) {
                        loginMessage.className = 'alert alert-danger';
                        loginMessage.textContent = 'Tài khoản của bạn tạm thời bị khóa!';
                        localStorage.clear();
                        return;
                    }

                    // Chuyển hướng theo vai trò
                    if (result.user.role == 0) {
                        window.location.href = "/SpicyNoodleProject/public/views/customer_dashboard.html";
                    } else {
                        window.location.href = "/SpicyNoodleProject/public/views/dashboard.html";
                    }
                }
            } catch (err) {
                console.error("Lỗi đăng nhập:", err);
                const loginMessage = document.getElementById("loginMessage");
                loginMessage.style.display = 'block';
                loginMessage.className = 'alert alert-danger';
                loginMessage.textContent = 'Lỗi kết nối server!';
            }
        });
    }

    // Hàm đăng xuất
    window.logout = function() {
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = "/SpicyNoodleProject/public/views/login.html";
    };
});