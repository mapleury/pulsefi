
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
  const hoverQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
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
    header.addEventListener('click', () => {
      if (!hoverQuery.matches) toggleOnClick();
    });
    header.addEventListener('mouseenter', () => {
      if (hoverQuery.matches) openItem(item, header);
    });
    header.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleOnClick();
      }
    });
  });
  if (featureItems[0]) {
    featureItems[0].classList.add('active');
    const firstHeader = featureItems[0].querySelector('.feature-header');
    if (firstHeader) firstHeader.setAttribute('aria-expanded', 'true');
  }
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