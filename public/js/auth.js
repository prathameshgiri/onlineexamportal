/* ==========================================
   AUTH STATE MANAGEMENT
   Handles login state across all pages
   ========================================== */

document.addEventListener('DOMContentLoaded', () => {
  updateNavAuthState();
});

function updateNavAuthState() {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  const navLogin = document.getElementById('navLogin');
  const navRegister = document.getElementById('navRegister');
  const navDashboard = document.getElementById('navDashboard');
  const navUser = document.getElementById('navUser');
  const navAvatar = document.getElementById('navAvatar');
  const navUsername = document.getElementById('navUsername');
  const navLogout = document.getElementById('navLogout');
  const heroGetStarted = document.getElementById('heroGetStarted');
  const ctaBtn = document.getElementById('ctaBtn');

  if (token && user) {
    // Logged in state
    if (navLogin) navLogin.style.display = 'none';
    if (navRegister) navRegister.style.display = 'none';
    if (navDashboard) navDashboard.style.display = '';
    if (navUser) navUser.style.display = '';
    if (navAvatar) navAvatar.textContent = user.name.charAt(0).toUpperCase();
    if (navUsername) navUsername.textContent = user.name;
    if (heroGetStarted) {
      heroGetStarted.href = '/dashboard.html';
      heroGetStarted.innerHTML = '<span>🎯</span> Go to Dashboard';
    }
    if (ctaBtn) {
      ctaBtn.href = '/dashboard.html';
      ctaBtn.innerHTML = '<span>🚀</span> Go to Dashboard';
    }
  } else {
    // Logged out state
    if (navLogin) navLogin.style.display = '';
    if (navRegister) navRegister.style.display = '';
    if (navDashboard) navDashboard.style.display = 'none';
    if (navUser) navUser.style.display = 'none';
  }

  // Logout handler
  if (navLogout) {
    navLogout.addEventListener('click', () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      showToast('Logged out successfully', 'success');
      setTimeout(() => window.location.href = '/', 1000);
    });
  }
}

function requireAuth() {
  const token = localStorage.getItem('token');
  if (!token) {
    showToast('Please login to continue', 'info');
    setTimeout(() => window.location.href = '/login.html', 1000);
    return false;
  }
  return true;
}
