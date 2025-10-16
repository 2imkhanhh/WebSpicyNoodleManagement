document.addEventListener('DOMContentLoaded', () => {
    // Kiểm tra đăng nhập
    fetch('http://localhost:81/SpicyNoodleProject/api/get_user.php', {
        method: 'GET',
        credentials: 'include'
    })
        .then(response => response.json())
        .then(data => {
            if (data.success && data.user.name) {
                document.getElementById('userName').textContent = `Xin chào, ${data.user.name}`;
            } else {
                alert('Vui lòng đăng nhập để xem menu!');
                window.location.href = '/SpicyNoodleProject/public/views/login.html';
            }
        })
        .catch(error => {
            console.error('Lỗi khi kiểm tra đăng nhập:', error);
            alert('Lỗi kết nối. Vui lòng thử lại.');
            window.location.href = '/SpicyNoodleProject/public/views/login.html';
        });

    // Lấy danh mục và hiển thị tabs
    fetch('http://localhost:81/SpicyNoodleProject/api/get_categories.php', {
        method: 'GET'
    })
        .then(response => response.json())
        .then(data => {
            if (data.success && data.data) {
                const categoryTabs = document.getElementById('categoryTabs');
                data.data.forEach(category => {
                    const li = document.createElement('li');
                    li.className = 'nav-item';
                    li.innerHTML = `<a class="nav-link" href="#" data-category="${category.category_id}">${category.name}</a>`;
                    categoryTabs.appendChild(li);
                });

                // Xử lý click tab
                categoryTabs.querySelectorAll('.nav-link').forEach(link => {
                    link.addEventListener('click', (e) => {
                        e.preventDefault();
                        categoryTabs.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                        link.classList.add('active');
                        const categoryId = link.dataset.category;
                        loadMenu(categoryId);
                    });
                });
            }
        })
        .catch(error => console.error('Lỗi khi lấy danh mục:', error));

    // Lấy danh sách món ăn
    let allFoods = [];
    function loadMenu(categoryId = '') {
        const loadingSpinner = document.getElementById('loadingSpinner');
        loadingSpinner.classList.remove('d-none');

        fetch(`http://localhost:81/SpicyNoodleProject/api/get_food.php${categoryId ? `?category_id=${categoryId}` : ''}`, {
            method: 'GET'
        })
            .then(response => response.json())
            .then(data => {
                loadingSpinner.classList.add('d-none');
                const menuGrid = document.getElementById('menuGrid');
                menuGrid.innerHTML = '';

                if (data.success && data.data) {
                    allFoods = data.data;
                    renderMenu(allFoods);
                } else {
                    menuGrid.innerHTML = '<p class="text-center text-muted">Không có món ăn nào.</p>';
                }
            })
            .catch(error => {
                console.error('Lỗi khi lấy menu:', error);
                loadingSpinner.classList.add('d-none');
                menuGrid.innerHTML = '<p class="text-center text-muted">Lỗi khi tải menu.</p>';
            });
    }

    // Hiển thị danh sách món ăn
    function renderMenu(foods) {
        const menuGrid = document.getElementById('menuGrid');
        menuGrid.innerHTML = '';

        foods.forEach(food => {
            const menuItem = document.createElement('div');
            menuItem.className = 'menu-item card mb-3';
            const formattedPrice = Number(food.price).toLocaleString('vi-VN') + ' VND';
            menuItem.innerHTML = `
                <img src="../../public/${food.image}" class="card-img-top" alt="${food.name}" onerror="this.src='../../assets/images/placeholder.png'">
                <div class="card-body">
                    <h5 class="card-title">${food.name}</h5>
                    <p class="card-text">Giá: ${formattedPrice}</p>
                </div>
            `;
            menuGrid.appendChild(menuItem);
        });
    }

    // Xử lý tìm kiếm
    document.getElementById('menuSearch').addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filteredFoods = allFoods.filter(food =>
            food.name.toLowerCase().includes(searchTerm)
        );
        renderMenu(filteredFoods);
    });

    // Hàm thêm vào giỏ hàng
    window.addToCart = function (foodId) {
        alert(`Đã thêm món #${foodId} vào giỏ hàng!`);
        // TODO: Thêm logic lưu vào localStorage hoặc gọi API giỏ hàng
    };

    // Tải menu ban đầu
    loadMenu();
});

/*
<div class="menu-actions">
    <button class="btn btn-add-cart" onclick="addToCart(${food.food_id})">
        <i class="fas fa-cart-plus"></i> Thêm vào giỏ
    </button>
</div>
*/