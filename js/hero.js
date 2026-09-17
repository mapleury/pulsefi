// PulseFi — Hero interactions
// Vanilla JS, no dependencies.

document.addEventListener('DOMContentLoaded', () => {
  // Two independent burger/menu pairs can exist on the page: the
  // decorative one inside the hero itself, and the one inside the
  // fixed #siteNavbar mobile sticky bar. Wire up whichever are present.
  const pairs = [
    {
      burger: document.querySelector('.hero-nav-row .nav-burger'),
      menu: document.querySelector('.hero-content > .mobile-menu'),
    },
    {
      burger: document.querySelector('#siteNavbar .nav-burger'),
      menu: document.querySelector('#siteNavbar .mobile-menu'),
    },
  ];

  pairs.forEach(({ burger, menu }) => {
    if (!burger || !menu) return;

    const closeMenu = () => {
      menu.classList.remove('is-open');
      burger.setAttribute('aria-expanded', 'false');
    };

    burger.addEventListener('click', () => {
      const isOpen = menu.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', String(isOpen));
    });

    // Close the mobile menu after a link is tapped.
    menu.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', closeMenu);
    });

    // Close on resize back to desktop width.
    window.addEventListener('resize', () => {
      if (window.innerWidth > 768) closeMenu();
    });
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