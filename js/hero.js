// PulseFi — Hero interactions
// Vanilla JS, no dependencies.

document.addEventListener('DOMContentLoaded', () => {
  const burger = document.querySelector('.nav-burger');
  const mobileMenu = document.querySelector('.mobile-menu');

  if (!burger || !mobileMenu) return;

  const closeMenu = () => {
    mobileMenu.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
  };

  burger.addEventListener('click', () => {
    const isOpen = mobileMenu.classList.toggle('is-open');
    burger.setAttribute('aria-expanded', String(isOpen));
  });

  // Close the mobile menu after a link is tapped.
  mobileMenu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', closeMenu);
  });

  // Close on resize back to desktop width.
  window.addEventListener('resize', () => {
    if (window.innerWidth > 768) closeMenu();
  });

    const scrollWrap = document.querySelector('.hero-scroll-wrap');
  const shell = document.querySelector('.hero-shell');

  if (scrollWrap && shell) {
    const onHeroScroll = () => {
      const rect = scrollWrap.getBoundingClientRect();
      const scrollable = scrollWrap.offsetHeight - window.innerHeight;
      const progress = scrollable > 0
        ? Math.min(Math.max(-rect.top / scrollable, 0), 1)
        : 0;
      const scale = 1 - progress * 0.18; // shrinks up to 18%
      shell.style.transform = `scale(${scale})`;
    };
    window.addEventListener('scroll', onHeroScroll, { passive: true });
    onHeroScroll();
  }

    const sections = document.querySelectorAll('#home, #tentang, #tujuan, #testimoni');
  const navLinks = document.querySelectorAll('.navbar-glass a:not(.nav-cta)');

  if (sections.length && navLinks.length) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          navLinks.forEach((link) => {
            link.classList.toggle('is-active', link.getAttribute('href') === `#${entry.target.id}`);
          });
        }
      });
    }, { threshold: 0.5 });

    sections.forEach((section) => observer.observe(section));
  }
});