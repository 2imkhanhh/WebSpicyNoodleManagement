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

            const res = await fetch("http://localhost:81/SpicyNoodleProject/api/register.php", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify(data)
            });
            const result = await res.json();
            alert(result.message);
        });
    }

    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const data = {
                phone: loginForm.phone.value,
                password: loginForm.password.value
            };

            const res = await fetch("http://localhost:81/SpicyNoodleProject/api/login.php", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify(data)
            });
            const result = await res.json();
            alert(result.message);
            if (result.user) {
                window.location.href = "/SpicyNoodleProject/public/views/dashboard.html"; 
            }
        });
    }

});
