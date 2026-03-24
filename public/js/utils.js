/* ==========================================
   UTILITY FUNCTIONS
   Shared across all pages
   ========================================== */

// ==================== PAGE LOADER ====================
window.addEventListener('load', () => {
  setTimeout(() => {
    const loader = document.getElementById('pageLoader');
    if (loader) loader.classList.add('loaded');
  }, 800);
});

// ==================== NAVBAR SCROLL EFFECT ====================
window.addEventListener('scroll', () => {
  const navbar = document.getElementById('navbar');
  if (navbar) {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
  }
});

// ==================== HAMBURGER MENU ====================
document.addEventListener('DOMContentLoaded', () => {
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('navLinks');
  
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      navLinks.classList.toggle('open');
      hamburger.classList.toggle('active');
    });
  }
});

// ==================== TOAST NOTIFICATIONS ====================
function showToast(message, type = 'info', duration = 3500) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
  
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || icons.info}</span>
    <span class="toast-message">${message}</span>
    <button class="toast-close" onclick="this.parentElement.remove()">×</button>
  `;
  
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ==================== LAZY LOADING / INTERSECTION OBSERVER ====================
function observeElements() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  });

  document.querySelectorAll('.lazy-load').forEach(el => {
    observer.observe(el);
  });
}

document.addEventListener('DOMContentLoaded', observeElements);

// ==================== API HELPER ====================
async function apiRequest(url, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers
  };

  const response = await fetch(url, { ...options, headers });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }

  return data;
}

// ==================== FORMAT DATE ====================
function formatDate(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

// ==================== FORMAT TIME ====================
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// ==================== SCORE BADGE ====================
function getScoreBadge(percentage) {
  if (percentage >= 80) return '<span class="score-badge excellent">Excellent</span>';
  if (percentage >= 60) return '<span class="score-badge good">Good</span>';
  if (percentage >= 40) return '<span class="score-badge average">Average</span>';
  return '<span class="score-badge poor">Needs Work</span>';
}

// ==================== SCORE COLOR ====================
function getScoreColor(percentage) {
  if (percentage >= 80) return 'var(--secondary)';
  if (percentage >= 60) return 'var(--info)';
  if (percentage >= 40) return 'var(--warning)';
  return 'var(--accent)';
}

// ==================== SMOOTH SCROLL ====================
document.addEventListener('click', (e) => {
  const anchor = e.target.closest('a[href^="#"]');
  if (anchor) {
    e.preventDefault();
    const target = document.querySelector(anchor.getAttribute('href'));
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
});

// ==================== SKELETON LOADER ====================
function createSkeletonCards(count, container) {
  let html = '';
  for (let i = 0; i < count; i++) {
    html += `
      <div class="skeleton-card">
        <div class="skeleton skeleton-circle"></div>
        <div class="skeleton skeleton-line w-75"></div>
        <div class="skeleton skeleton-line w-full"></div>
        <div class="skeleton skeleton-line w-50"></div>
      </div>
    `;
  }
  if (container) container.innerHTML = html;
  return html;
}

// ==================== PARTICLE EFFECTS ====================
function createParticles(container, count = 20) {
  if (!container) return;
  for (let i = 0; i < count; i++) {
    const particle = document.createElement('div');
    particle.style.cssText = `
      position: absolute;
      width: ${Math.random() * 6 + 2}px;
      height: ${Math.random() * 6 + 2}px;
      background: ${['#6C63FF', '#06D6A0', '#FF6B6B', '#4CC9F0'][Math.floor(Math.random() * 4)]};
      border-radius: 50%;
      top: ${Math.random() * 100}%;
      left: ${Math.random() * 100}%;
      opacity: ${Math.random() * 0.5 + 0.1};
      animation: float ${Math.random() * 6 + 4}s ease-in-out infinite;
      animation-delay: ${Math.random() * 5}s;
      pointer-events: none;
    `;
    container.appendChild(particle);
  }
}

// ==================== COUNTER ANIMATION ====================
function animateCounter(element, target, duration = 1500) {
  let start = 0;
  const increment = target / (duration / 16);
  const timer = setInterval(() => {
    start += increment;
    if (start >= target) {
      element.textContent = target;
      clearInterval(timer);
    } else {
      element.textContent = Math.floor(start);
    }
  }, 16);
}
