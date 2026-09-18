
document.addEventListener('DOMContentLoaded', () => {
  const floatingNav = document.getElementById('floatingNav');
  const siteNavbar = document.getElementById('siteNavbar');
  const heroWrap = document.querySelector('.hero-scroll-wrap');
  if (!heroWrap || (!floatingNav && !siteNavbar)) return;

  const THRESHOLD = 80;

  function update() {
    const heroBottom = heroWrap.getBoundingClientRect().bottom;
    const scrolled = heroBottom <= THRESHOLD;
    if (floatingNav) floatingNav.classList.toggle('scrolled', scrolled);
    if (siteNavbar) siteNavbar.classList.toggle('scrolled', scrolled);
  }

  update();
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
});