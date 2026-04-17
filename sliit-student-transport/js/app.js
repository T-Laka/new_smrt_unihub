// app.js — component loading and shared navbar behavior

document.addEventListener('DOMContentLoaded', () => {
    loadComponent('components/navbar.html', 'nav-placeholder', initNavbar);
    loadComponent('components/footer.html', 'footer-placeholder');
});

/** Fetch an HTML snippet and inject it into a placeholder element */
function loadComponent(path, placeholderId, onLoaded) {
    fetch(path)
        .then(resp => resp.text())
        .then(html => {
            const el = document.getElementById(placeholderId);
            if (!el) return;

            el.innerHTML = html;

            if (typeof onLoaded === 'function') {
                onLoaded(el);
            }
        })
        .catch(err => console.error('Component load error:', err));
}

function getStoredUser() {
    const rawUser = localStorage.getItem('user');
    if (!rawUser) return null;

    try {
        return JSON.parse(rawUser);
    } catch (error) {
        localStorage.removeItem('user');
        localStorage.removeItem('driver');
        return null;
    }
}

function initNavbar() {
    const burger = document.getElementById('burger-btn');
    const navLinks = document.querySelector('.nav-links');

    if (burger && navLinks) {
        burger.addEventListener('click', () => {
            navLinks.classList.toggle('open');
        });

        document.addEventListener('click', (e) => {
            if (!burger.contains(e.target) && !navLinks.contains(e.target)) {
                navLinks.classList.remove('open');
            }
        });
    }

    renderNavbarAuth();
    highlightActiveNavLink();
}

function renderNavbarAuth() {
    const userData = getStoredUser();
    const navAuth = document.getElementById('navAuth');

    if (!navAuth || !userData) return;

    const firstName = (userData.name || 'User').split(' ')[0];

    navAuth.innerHTML = `
        <div class="nav-user-menu">
            <button class="nav-user-btn" id="userMenuBtn">
                <span class="nav-avatar">👤</span>
                <span class="nav-username">${firstName}</span>
                <span class="nav-dropdown-icon">▼</span>
            </button>
            <div class="nav-dropdown" id="userDropdown">
                ${userData.role === 'admin' ? '<a href="admin.html">⚙️ Admin Panel</a>' : ''}
                ${userData.role === 'driver' ? '<a href="driver-dashboard.html">📊 Dashboard</a>' : ''}
                ${userData.role === 'rider' ? '<a href="rider-dashboard.html">📊 Dashboard</a>' : ''}
                <a href="chat.html">💬 Messages</a>
                <hr>
                <a href="#" onclick="logout(); return false;" class="nav-logout-btn">🚪 Logout</a>
            </div>
        </div>
    `;

    const userMenuBtn = document.getElementById('userMenuBtn');
    const userDropdown = document.getElementById('userDropdown');

    if (userMenuBtn && userDropdown) {
        userMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            userDropdown.classList.toggle('show');
        });

        document.addEventListener('click', () => {
            userDropdown.classList.remove('show');
        });
    }
}

function highlightActiveNavLink() {
    const current = location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-links a').forEach(link => {
        if (link.getAttribute('href') === current) {
            link.classList.add('active');
        }
    });
}

function logout() {
    localStorage.removeItem('user');
    localStorage.removeItem('driver');
    localStorage.removeItem('currentRide');
    localStorage.removeItem('rememberedEmail');
    window.location.href = 'login.html?logout=true';
}

window.logout = logout;
