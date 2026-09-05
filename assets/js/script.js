/* Header shadow on scroll */
const header = document.querySelector('.site-header');
const navLinks = document.querySelector('.nav-links');
const menuToggle = document.querySelector('.menu-toggle');
const backToTop = document.getElementById('backToTop');

function onScroll() {
  const y = window.scrollY;
  if (header) header.classList.toggle('scrolled', y > 10);
  if (backToTop) backToTop.classList.toggle('visible', y > 500);
}

window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

/* Mobile nav toggle */
if (menuToggle && navLinks) {
  menuToggle.addEventListener('click', () => {
    const open = navLinks.classList.toggle('open');
    menuToggle.classList.toggle('open', open);
    menuToggle.setAttribute('aria-expanded', String(open));
  });

  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
      menuToggle.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
    });
  });
}

/* Back to top */
if (backToTop) {
  backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}