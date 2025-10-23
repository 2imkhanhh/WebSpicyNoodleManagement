const apiUrl = "http://localhost:81/SpicyNoodleProject/api/infaccount.php";

document.addEventListener("DOMContentLoaded", () => {
  loadAccount();

  // nút hiển thị mật khẩu / thay đổi
  document.getElementById("changePasswordBtn")?.addEventListener("click", toggleChangePassword);
  document.getElementById("toggleViewPassword")?.addEventListener("click", () => toggleEye("password", "toggleViewPassword"));
  document.getElementById("toggleViewNewPassword")?.addEventListener("click", () => toggleEye("newPassword", "toggleViewNewPassword"));
  document.getElementById("toggleViewConfirmPassword")?.addEventListener("click", () => toggleEye("confirmPassword", "toggleViewConfirmPassword"));

  // submit
  document.getElementById("infAccountForm")?.addEventListener("submit", updateAccount);
});

function toggleEye(inputId, btnId) {
  const inp = document.getElementById(inputId);
  const btn = document.getElementById(btnId);
  if (!inp || !btn) return;
  if (inp.type === "password") {
    inp.type = "text";
    btn.textContent = "🙈";
  } else {
    inp.type = "password";
    btn.textContent = "👁️";
  }
}

function toggleChangePassword() {
  const group = document.querySelector(".password-new-group");
  if (!group) return;
  if (group.style.display === "none" || group.style.display === "") {
    group.style.display = "block";
    document.getElementById("newPassword").focus();
  } else {
    group.style.display = "none";
    ["newPassword","confirmPassword"].forEach(id=>{
      const inp = document.getElementById(id);
      const btn = document.getElementById("toggleView"+(id==="newPassword"?"NewPassword":"ConfirmPassword"));
      if(inp) inp.value=""; inp.type="password";
      if(btn) btn.textContent="👁️";
    });
  }
}

function loadAccount() {
  fetch(apiUrl)
    .then(res=>res.json())
    .then(data=>{
      if(data.success){
        const u = data.user;
        document.getElementById("name").value = u.name || "";
        document.getElementById("email").value = u.email || "";
        document.getElementById("phone").value = u.phone || "";
        document.getElementById("password").value = u.password || "";
        document.getElementById("userName").textContent = "Xin chào, " + (u.name||"");
      } else alert("Không thể tải thông tin tài khoản! " + (data.message||""));
    })
    .catch(err=>console.error("Lỗi:", err));
}

function updateAccount(e){
  e.preventDefault();
  const name = document.getElementById("name").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const newPass = document.getElementById("newPassword");
  const confirmPass = document.getElementById("confirmPassword");

  let password = "";
  if(newPass && newPass.value){
    if(newPass.value !== confirmPass.value){
      alert("Mật khẩu mới không khớp!");
      return;
    }
    if(newPass.value.length < 6){
      alert("Mật khẩu mới phải ít nhất 6 ký tự.");
      return;
    }
    password = newPass.value;
  }

  fetch(apiUrl, {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({name, phone, password})
  })
  .then(res=>res.json())
  .then(data=>{
    if(data.success){
      alert("✅ Cập nhật thành công!");
      document.getElementById("password").value = "********";
      toggleChangePassword(); // ẩn group
      document.getElementById("userName").textContent = "Xin chào, "+name;
    } else {
      alert("❌ "+(data.message||"Không thể cập nhật."));
    }
  })
  .catch(err=>console.error("Lỗi:", err));
}

function logout(){ 
  alert("Đăng xuất thành công!");
  window.location.href = "/SpicyNoodleProject/public/views/login.html";
}

function goBack(){
  window.location.href = "dashboard.html";
}

