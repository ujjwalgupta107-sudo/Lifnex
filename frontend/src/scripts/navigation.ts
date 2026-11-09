/**
 * LIFNEX NAVIGATION & MOBILE INTERACTIONS
 */
export function initNavigation(): void {
  const toggleBtn = document.getElementById('mobileNavToggle');
  const navLinks = document.getElementById('navLinks');

  if (toggleBtn && navLinks) {
    toggleBtn.addEventListener('click', () => {
      navLinks.classList.toggle('active');
      const isExpanded = navLinks.classList.contains('active');
      toggleBtn.setAttribute('aria-expanded', String(isExpanded));
    });
  }

  // Active page link detection
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  const links = document.querySelectorAll<HTMLAnchorElement>('.nav-link');
  links.forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPath || (currentPath === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });
}

