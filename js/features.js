// PulseFi — feature accordion: hover-to-expand on desktop, tap-to-toggle on touch.

document.addEventListener('DOMContentLoaded', () => {
  const items = document.querySelectorAll('.feature-item');
  if (!items.length) return;

  // Blur-in reveal, staggered one by one, plays once per item as it scrolls into view.
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const item = entry.target;
        const index = Number(item.dataset.index) || 1;
        item.style.transitionDelay = `${(index - 1) * 0.12}s`;
        item.classList.add('in-view');
        revealObserver.unobserve(item);
      });
    },
    { threshold: 0.2 }
  );

  items.forEach((item) => revealObserver.observe(item));

  const supportsHover = window.matchMedia('(hover: hover)').matches;

  const setActive = (target) => {
    items.forEach((item) => {
      const isTarget = item === target;
      item.classList.toggle('active', isTarget);
      item.querySelector('.feature-header')?.setAttribute('aria-expanded', String(isTarget));
    });
  };

  const clearActive = () => {
    items.forEach((item) => {
      item.classList.remove('active');
      item.querySelector('.feature-header')?.setAttribute('aria-expanded', 'false');
    });
  };

  items.forEach((item) => {
    const header = item.querySelector('.feature-header');
    if (!header) return;

    if (supportsHover) {
      item.addEventListener('mouseenter', () => setActive(item));
      item.addEventListener('mouseleave', () => item.classList.remove('active'));
    }

    // click/tap toggles regardless of hover support, so keyboard + touch users can open it too
    header.addEventListener('click', () => {
      const isActive = item.classList.contains('active');
      if (isActive) {
        clearActive();
      } else {
        setActive(item);
      }
    });

    header.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        header.click();
      }
    });
  });
});