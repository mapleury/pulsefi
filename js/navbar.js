
document.addEventListener('DOMContentLoaded', () => {
  const nav = document.getElementById('floatingNav');
  const heroWrap = document.querySelector('.hero-scroll-wrap');
  if (!nav || !heroWrap) return;

  const THRESHOLD = 80;

  function update() {
    const heroBottom = heroWrap.getBoundingClientRect().bottom;
    nav.classList.toggle('scrolled', heroBottom <= THRESHOLD);
  }

  update();
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
});