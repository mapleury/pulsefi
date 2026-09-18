
document.addEventListener('DOMContentLoaded', () => {
  const section = document.querySelector('.stats-section');
  if (!section) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          section.classList.add('in-view');
          observer.unobserve(section);
        }
      });
    },
    { threshold: 0.25 }
  );

  observer.observe(section);
});