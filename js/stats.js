// PulseFi — Stats section scroll-triggered entrance
// Vanilla JS, no dependencies.

document.addEventListener('DOMContentLoaded', () => {
  const section = document.querySelector('.stats-section');
  if (!section) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          section.classList.add('in-view');
          observer.unobserve(section); // play once, don't replay on re-scroll
        }
      });
    },
    { threshold: 0.25 }
  );

  observer.observe(section);
});