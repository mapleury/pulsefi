// PulseFi — "Mengapa PulseFi?" feature accordion.
// Renders each item from window.PULSEFI_FEATURES (features-data.js)
// into .features-list, then wires up the accordion open/close and the
// scroll-in entrance animation. No per-feature markup lives in the HTML.

document.addEventListener('DOMContentLoaded', () => {
  const list = document.querySelector('.features-list');
  const items = window.PULSEFI_FEATURES;
  if (!list || !Array.isArray(items)) return;

  list.innerHTML = items.map((item, index) => `
    <div class="feature-item" data-index="${index + 1}">
      <div class="feature-number">${item.number}</div>
      <div class="feature-header" tabindex="0" role="button" aria-expanded="false">
        <span class="feature-eyebrow">${item.eyebrow}</span>
        <span class="feature-category">${item.category}</span>
      </div>
      <div class="feature-expand">
        <div class="feature-expand-inner">
          <div class="feature-image">
            <img src="${item.image}" alt="${item.imageAlt}">
          </div>
          <div class="feature-text">
            <p class="feature-headline">${item.headline}</p>
            <div class="feature-stat">
              <span class="feature-stat-number">${item.statNumber}</span>
              <span class="feature-stat-label">${item.statLabel}</span>
            </div>
            <p class="feature-desc">${item.desc}</p>
          </div>
        </div>
      </div>
    </div>
  `).join('');

  const featureItems = list.querySelectorAll('.feature-item');

  // Real mouse + hover-capable devices get hover-to-open (desktop).
  // Touch devices (mobile/tablet, no hover) get click/tap instead.
  const hoverQuery = window.matchMedia('(hover: hover) and (pointer: fine)');

  // --- accordion: one open at a time ---
  const openItem = (item, header) => {
    featureItems.forEach((other) => {
      other.classList.remove('active');
      const otherHeader = other.querySelector('.feature-header');
      if (otherHeader) otherHeader.setAttribute('aria-expanded', 'false');
    });
    item.classList.add('active');
    header.setAttribute('aria-expanded', 'true');
  };

  featureItems.forEach((item) => {
    const header = item.querySelector('.feature-header');
    if (!header) return;

    const toggleOnClick = () => {
      const isActive = item.classList.contains('active');
      if (isActive) {
        item.classList.remove('active');
        header.setAttribute('aria-expanded', 'false');
      } else {
        openItem(item, header);
      }
    };

    // Click/tap always works (covers touch devices, and desktop users
    // who click instead of hovering).
    header.addEventListener('click', () => {
      if (!hoverQuery.matches) toggleOnClick();
    });

    // Hover only binds on real mouse devices.
    header.addEventListener('mouseenter', () => {
      if (hoverQuery.matches) openItem(item, header);
    });

    // Keyboard access always works, regardless of device.
    header.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleOnClick();
      }
    });
  });

  // open the first item by default
  if (featureItems[0]) {
    featureItems[0].classList.add('active');
    const firstHeader = featureItems[0].querySelector('.feature-header');
    if (firstHeader) firstHeader.setAttribute('aria-expanded', 'true');
  }

  // --- scroll-in entrance, one by one ---
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2 }
  );

  featureItems.forEach((item) => observer.observe(item));
});