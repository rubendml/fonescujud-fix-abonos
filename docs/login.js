// login.js
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.style.display = 'none';

    const usuario = document.getElementById('usuario').value.trim();
    const password = document.getElementById('password').value;

    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario, password })
        });

        const data = await response.json();

        if (response.ok && data.token) {
            // Guardar sesión
            localStorage.setItem('token', data.token);
            localStorage.setItem('rol', data.rol);

            // 🔥 REDIRECCIÓN LIMPIA (sin rutas viejas)
            if (data.rol === 'admin') {
                window.location.href = './admin/';
            } else if (data.rol === 'revisor') {
                window.location.href = './revisor/';
            } else {
                loginError.textContent = 'Rol no autorizado.';
                loginError.style.display = 'block';
            }

        } else {
            loginError.textContent = data.error || 'Credenciales incorrectas';
            loginError.style.display = 'block';
        }

    } catch (err) {
        console.error(err);
        loginError.textContent = 'Error de conexión con el servidor';
        loginError.style.display = 'block';
    }
});