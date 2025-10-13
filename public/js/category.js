document.addEventListener('DOMContentLoaded', () => {
    const saveCategoryBtn = document.getElementById('saveCategoryBtn');
    const saveEditCategoryBtn = document.getElementById('saveEditCategoryBtn');
    if (saveCategoryBtn) {
        saveCategoryBtn.addEventListener('click', addCategory);
    }
    if (saveEditCategoryBtn) {
        saveEditCategoryBtn.addEventListener('click', updateCategory);
    }
    loadCategories();
});

async function loadCategories() {
    try {
        const response = await fetch('http://localhost:81/SpicyNoodleProject/api/get_categories.php', {
            method: 'GET'
        });
        const data = await response.json();

        if (data.success) {
            const categoryGrid = document.querySelector('.category-grid');
            categoryGrid.innerHTML = ''; 

            data.data.forEach(category => {
                const categoryCard = document.createElement('div');
                categoryCard.className = 'category-card card mb-3';
                categoryCard.innerHTML = `
                    <div class="card-body">
                        <h5 class="card-title">${category.name}</h5>
                    </div>
                    <div class="card-footer">
                        <button class="btn btn-warning btn-sm edit-category-btn" data-id="${category.category_id}">Sửa</button>
                        <button class="btn btn-danger btn-sm delete-category-btn" data-id="${category.category_id}">Xóa</button>
                    </div>
                `;
                categoryGrid.appendChild(categoryCard);
            });

            document.querySelectorAll('.edit-category-btn').forEach(button => {
                button.addEventListener('click', async () => {
                    const categoryId = button.dataset.id;
                    try {
                        const response = await fetch(`http://localhost:81/SpicyNoodleProject/api/get_categories.php?id=${categoryId}`, {
                            method: 'GET'
                        });
                        const data = await response.json();
                        if (data.success && data.data.length > 0) {
                            const category = data.data[0];
                            document.getElementById('editCategoryId').value = category.category_id;
                            document.getElementById('editCategoryName').value = category.name;
                            const modal = new bootstrap.Modal(document.getElementById('editCategoryModal'));
                            modal.show();
                        } else {
                            alert('Lỗi: ' + data.message);
                        }
                    } catch (error) {
                        alert('Lỗi kết nối: ' + error.message);
                    }
                });
            });

            document.querySelectorAll('.delete-category-btn').forEach(button => {
                button.addEventListener('click', async () => {
                    const categoryId = button.dataset.id;
                    if (confirm('Bạn có chắc muốn xóa danh mục này?')) {
                        try {
                            const response = await fetch(`http://localhost:81/SpicyNoodleProject/api/delete_category.php?id=${categoryId}`, {
                                method: 'DELETE'
                            });
                            const data = await response.json();
                            if (data.success) {
                                alert(data.message);
                                loadCategories(); 
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
        alert('Lỗi kết nối: ' + error.message);
    }
}

async function addCategory() {
    const form = document.getElementById('addCategoryForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const formData = new FormData(form);

    try {
        const response = await fetch('http://localhost:81/SpicyNoodleProject/api/add_category.php', {
            method: 'POST',
            body: formData
        });
        const data = await response.json();

        if (data.success) {
            alert(data.message);
            location.reload(); 
            bootstrap.Modal.getInstance(document.getElementById('addCategoryModal')).hide();
            form.reset();
        } else {
            alert('Lỗi: ' + data.message);
        }
    } catch (error) {
        alert('Lỗi kết nối: ' + error);
    }
}

async function updateCategory() {
    const form = document.getElementById('editCategoryForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const formData = new FormData(form);
    const categoryId = document.getElementById('editCategoryId').value;

    try {
        const response = await fetch(`http://localhost:81/SpicyNoodleProject/api/update_category.php?id=${categoryId}`, {
            method: 'POST',
            body: formData
        });
        const data = await response.json();

        if (data.success) {
            alert(data.message);
            bootstrap.Modal.getInstance(document.getElementById('editCategoryModal')).hide();
            loadCategories(); 
        } else {
            alert('Lỗi: ' + data.message);
        }
    } catch (error) {
        alert('Lỗi kết nối: ' + error.message);
    }
}