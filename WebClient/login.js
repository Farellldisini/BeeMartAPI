const API_BASE_URL = 'http://localhost:5129/api/v1';

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form') || document.querySelector('form');

    if (!loginForm) return;

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const usernameInput = loginForm.querySelector('[name="username"]');
        const passwordInput = loginForm.querySelector('[name="password"]');
        const roleSelect = loginForm.querySelector('[name="role"]');

        const username = usernameInput ? usernameInput.value.trim() : '';
        const password = passwordInput ? passwordInput.value : '';
        const role = roleSelect ? roleSelect.value : '';

        if (!username || !password) {
            alert('Username dan Password wajib diisi.');
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/users/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username: username,
                    password: password,
                    role: role
                })
            });

            if (!response.ok) {
        
                const errData = await response.json().catch(() => ({}));
                const errMsg = errData.message || 'Invalid login';
                alert(errMsg);
                return;
            }

            const user = await response.json();

           
            sessionStorage.setItem('bee_user', JSON.stringify({
                idUser: user.idUser,
                username: user.username,
                fullName: user.fullName || user.username,
                role: user.role
            }));

          
            window.location.href = 'newTransaction.html';

        } catch (error) {
            console.error('Login error:', error);
            alert('Gagal terhubung ke Backend API (' + API_BASE_URL + '). Pastikan BeeMart.API sedang berjalan!');
        }
    });
});
