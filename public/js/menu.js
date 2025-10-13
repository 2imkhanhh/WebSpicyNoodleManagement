document.addEventListener('DOMContentLoaded', () => {
    const saveMenuBtn = document.getElementById('saveMenuBtn');
    const saveEditMenuBtn = document.getElementById('saveEditMenuBtn');
    if (saveMenuBtn) {
        saveMenuBtn.addEventListener('click', addMenu);
    }
    if (saveEditMenuBtn) {
        saveEditMenuBtn.addEventListener('click', updateMenu);
    }
    loadCategories();
    loadMenus(); 
});

function getOrCreateModal(id) {
    const el = document.getElementById(id);
    if (!el) return null;
    return bootstrap.Modal.getInstance(el) || new bootstrap.Modal(el);
}

async function loadCategories() {
    try {
        const response = await fetch('http://localhost:81/SpicyNoodleProject/api/get_categories.php', { method: 'GET' });
        const data = await response.json();

        if (data.success) {
            const categoryTabs = document.getElementById('categoryTabs');
            const categorySelect = document.getElementById('categoryId');
            const editCategorySelect = document.getElementById('editCategoryId');
            data.data.forEach(category => {
                const li = document.createElement('li');
                li.className = 'nav-item';
                li.innerHTML = `<a class="nav-link" href="#" data-category="${category.category_id}">${category.name}</a>`;
                categoryTabs.appendChild(li);

                const option = document.createElement('option');
                option.value = category.category_id;
                option.textContent = category.name;
                categorySelect.appendChild(option.cloneNode(true));
                editCategorySelect.appendChild(option);
            });

            categoryTabs.querySelectorAll('.nav-link').forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    categoryTabs.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                    link.classList.add('active');
                    const categoryId = link.dataset.category;
                    loadMenus(categoryId);
                });
            });
        } else {
            alert('Lỗi: ' + data.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Lỗi kết nối: ' + error.message);
    }
}

async function addMenu() {
    const form = document.getElementById('addMenuForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const formData = new FormData(form);
    const categoryId = formData.get('category_id');

    if (!categoryId || categoryId === '') {
        alert('Vui lòng chọn danh mục hợp lệ!');
        return;
    }

    try {
        const response = await fetch('http://localhost:81/SpicyNoodleProject/api/add_food.php', {
            method: 'POST',
            body: formData
        });
        const data = await response.json();

        if (data.success) {
            alert(data.message);
            const addModal = getOrCreateModal('addMenuModal');
            if (addModal) addModal.hide();
            form.reset();
            loadMenus(); 
        } else {
            alert('Lỗi: ' + data.message);
        }
    } catch (error) {
        alert('Lỗi kết nối: ' + error);
    }
}

async function updateMenu() {
    const form = document.getElementById('editMenuForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const formData = new FormData(form);
    const foodId = document.getElementById('editFoodId').value;

    try {
        const response = await fetch(`http://localhost:81/SpicyNoodleProject/api/update_food.php?id=${foodId}`, {
            method: 'POST', 
            body: formData
        });
        const data = await response.json();

        if (data.success) {
            alert(data.message);
            const editModal = getOrCreateModal('editMenuModal');
            if (editModal) editModal.hide();
            const categoryId = document.getElementById('editCategoryId').value;
            loadMenus();
        } else {
            alert('Lỗi: ' + data.message);
        }
    } catch (error) {
        alert('Lỗi kết nối: ' + error.message);
    }
}

async function loadMenus(categoryId = '') {
    try {
        const response = await fetch(`http://localhost:81/SpicyNoodleProject/api/get_food.php?category_id=${categoryId}`, {
            method: 'GET'
        });
        const data = await response.json();
        console.log('Menu data:', data); 
        if (data.success) {
            const menuGrid = document.querySelector('.menu-grid');
            menuGrid.innerHTML = ''; 

            data.data.forEach(menu => {
                const menuItem = document.createElement('div');
                menuItem.className = 'menu-item card mb-3';
                const formattedPrice = Number(menu.price).toLocaleString('vi-VN') + ' VND';
                menuItem.innerHTML = `
                    <img src="${menu.image ? '../' + menu.image : '../assets/images/default.png'}" class="card-img-top" alt="${menu.name}">
                    <div class="card-body">
                        <h5 class="card-title">${menu.name}</h5>
                        <p class="card-text">Giá: ${formattedPrice}</p>
                    </div>
                    <div class="menu-actions">
                        <button class="btn btn-warning edit-btn" data-id="${menu.food_id}">Sửa</button>
                        <button class="btn btn-danger delete-btn" data-id="${menu.food_id}">Xóa</button>
                    </div>
                `;
                menuGrid.appendChild(menuItem);
            });

            document.querySelectorAll('.edit-btn').forEach(button => {
                button.addEventListener('click', async () => {
                    const foodId = button.dataset.id;
                    try {
                        const response = await fetch(`http://localhost:81/SpicyNoodleProject/api/get_food.php?id=${foodId}`, {
                            method: 'GET'
                        });
                        const data = await response.json();
                        if (data.success && data.data.length > 0) {
                            const menu = data.data[0];
                            document.getElementById('editFoodId').value = menu.food_id;
                            document.getElementById('editMenuName').value = menu.name;
                            document.getElementById('editCategoryId').value = menu.category_id;
                            document.getElementById('editPrice').value = menu.price;
                            document.getElementById('editImagePreview').src = menu.image ? '../' + menu.image : '../assets/images/default.png';
                            document.getElementById('editImagePreview').style.display = menu.image ? 'block' : 'none';

                            const editModal = getOrCreateModal('editMenuModal');
                            if (editModal) editModal.show();
                        } else {
                            alert('Lỗi: Không tìm thấy món.');
                        }
                    } catch (error) {
                        alert('Lỗi kết nối: ' + error.message);
                    }
                });
            });

            document.querySelectorAll('.delete-btn').forEach(button => {
                button.addEventListener('click', async () => {
                    const foodId = button.dataset.id;
                    if (confirm('Bạn có chắc muốn xóa món này?')) {
                        try {
                            const response = await fetch(`http://localhost:81/SpicyNoodleProject/api/delete_food.php?id=${foodId}`, {
                                method: 'DELETE'
                            });
                            const data = await response.json();
                            if (data.success) {
                                alert(data.message);
                                loadMenus(categoryId); 
                            } else {
                                alert('Lỗi: ' + data.message);
                            }
                        } catch (error) {
                            alert('Lỗi kết nối: ' + error.message);
                        }
                    }
                });
            });
        } else {
            alert('Lỗi: ' + data.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Lỗi: ' + error.message);
    }
}
