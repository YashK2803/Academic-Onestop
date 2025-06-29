// Academic OneStop Unified Educational Platform - Main JS

// ========== 1. Responsive Navbar Toggle (for Bootstrap 5) ==========
document.addEventListener('DOMContentLoaded', function () {
    // Highlight active nav link
    const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
    const currentPath = window.location.pathname;
    navLinks.forEach(link => {
      if (link.getAttribute('href') && currentPath.startsWith(link.getAttribute('href'))) {
        link.classList.add('active');
      }
    });
  
    // Optional: Collapse navbar after click (on mobile)
    const navCollapse = document.querySelector('.navbar-collapse');
    if (navCollapse) {
      navLinks.forEach(link => {
        link.addEventListener('click', () => {
          if (window.innerWidth < 992) {
            new bootstrap.Collapse(navCollapse).hide();
          }
        });
      });
    }
  });
  
  // ========== 2. Show Alerts for Form Submission ==========
  function showAlert(message, type = 'info', duration = 3000) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} position-fixed top-0 start-50 translate-middle-x mt-3 shadow`;
    alertDiv.style.zIndex = 9999;
    alertDiv.innerText = message;
    document.body.appendChild(alertDiv);
    setTimeout(() => {
      alertDiv.remove();
    }, duration);
  }
  
  // ========== 3. Confirm Before Deletion ==========
  document.addEventListener('click', function (e) {
    if (e.target.matches('form[action*="delete"], form[action*="remove"] button')) {
      if (!confirm('Are you sure you want to delete this item?')) {
        e.preventDefault();
      }
    }
  });
  
  // ========== 4. File Input Label Update ==========
  document.addEventListener('change', function (e) {
    if (e.target.matches('input[type="file"]')) {
      const label = e.target.closest('form').querySelector('label[for="' + e.target.name + '"]');
      if (label && e.target.files.length > 0) {
        label.textContent = `Selected: ${e.target.files[0].name}`;
      }
    }
  });
  
  // ========== 5. Accessibility: Focus Outline on Keyboard Only ==========
  (function () {
    function handleFirstTab(e) {
      if (e.key === 'Tab') {
        document.body.classList.add('user-is-tabbing');
        window.removeEventListener('keydown', handleFirstTab);
        window.addEventListener('mousedown', handleMouseDownOnce);
      }
    }
    function handleMouseDownOnce() {
      document.body.classList.remove('user-is-tabbing');
      window.removeEventListener('mousedown', handleMouseDownOnce);
      window.addEventListener('keydown', handleFirstTab);
    }
    window.addEventListener('keydown', handleFirstTab);
  })();
  
  // ========== 6. Simple Client-Side Form Validation ==========
  document.addEventListener('submit', function (e) {
    const form = e.target;
    if (form.hasAttribute('novalidate')) return;
    if (!form.checkValidity()) {
      e.preventDefault();
      e.stopPropagation();
      showAlert('Please fill all required fields correctly.', 'danger');
      form.classList.add('was-validated');
    }
  }, true);
  
  // ========== 7. Web Notifications (for important alerts) ==========
  function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
  }
  function showWebNotification(title, options) {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, options);
    }
  }
  // Example: Show notification if attendance below threshold (requires server-side trigger)
  // if (window.showAttendanceWarning) {
  //   showWebNotification('Attendance Alert', { body: 'Your attendance is below the required threshold.' });
  // }
  
  // ========== 8. Scroll to Top Button ==========
  (function () {
    let btn = document.createElement('button');
    btn.className = 'btn btn-primary position-fixed shadow';
    btn.style.display = 'none';
    btn.style.bottom = '30px';
    btn.style.right = '30px';
    btn.style.zIndex = 1000;
    btn.innerHTML = '<i class="bi bi-arrow-up"></i> Top';
    btn.onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });
    document.body.appendChild(btn);
  
    window.addEventListener('scroll', () => {
      btn.style.display = window.scrollY > 300 ? 'block' : 'none';
    });
  })();
  
  // ========== 9. AI Analytics Visualization (Demo) ==========
  window.renderAIGraph = function (grades) {
    // Example: Simple bar chart using Chart.js if available
    if (window.Chart && grades && Array.isArray(grades)) {
      const ctx = document.getElementById('aiAnalyticsChart');
      if (ctx) {
        new Chart(ctx, {
          type: 'bar',
          data: {
            labels: grades.map(g => g.course),
            datasets: [{
              label: 'Grades',
              data: grades.map(g => {
                // Convert grade letters to numbers for demo
                const map = { A: 4, B: 3, C: 2, D: 1, F: 0 };
                return map[g.grade] || 0;
              }),
              backgroundColor: '#1a237e88'
            }]
          },
          options: {
            scales: {
              y: { beginAtZero: true, max: 4 }
            }
          }
        });
      }
    }
  };
  
  // ========== 10. Miscellaneous ==========
  console.log('Academic OneStop Platform JS loaded -', new Date().toLocaleString());
  