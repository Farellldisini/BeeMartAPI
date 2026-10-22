const API_BASE_URL = 'http://localhost:5129/api/v1';

document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('register-form') || document.querySelector('form');

    if (!registerForm) return;

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const usernameInput = registerForm.querySelector('[name="username"]');
        const nameInput = registerForm.querySelector('[name="name"]');
        const passwordInput = registerForm.querySelector('[name="password"]');
        const repasswordInput = registerForm.querySelector('[name="repassword"]');
        const roleSelect = registerForm.querySelector('[name="role"]');

        const username = usernameInput ? usernameInput.value.trim() : '';
        const fullName = nameInput ? nameInput.value.trim() : '';
        const password = passwordInput ? passwordInput.value : '';
        const repassword = repasswordInput ? repasswordInput.value : '';
        const role = roleSelect ? roleSelect.value : 'Cashier';

        
        if (!username || !fullName || !password || !repassword) {
            alert('Username, Full Name, Password & Re-Password wajib diisi.');
            return;
        }

        
        if (password !== repassword) {
            alert('Password dan Re-Password tidak cocok.');
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/users/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username: username,
                    fullName: fullName,
                    password: password,
                    role: role
                })
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                
                const errMsg = errData.message || 'username has already exists';
                alert(errMsg);
                return;
            }

            alert('Registrasi berhasil! Silakan login.');
            window.location.href = 'login.html';

        } catch (error) {
            console.error('Register error:', error);
            alert('Gagal terhubung ke Backend API (' + API_BASE_URL + '). Pastikan BeeMart.API sedang berjalan!');
        }
    });
});
