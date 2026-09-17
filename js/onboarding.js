// PulseFi — sticky navbar: frosted dark-on-light look once scrolled past
// the hero. Drives both the desktop floating pill (#floatingNav) and the
// mobile sticky bar (#siteNavbar) off the same scroll threshold.

document.addEventListener('DOMContentLoaded', () => {
  const floatingNav = document.getElementById('floatingNav');
  const siteNavbar = document.getElementById('siteNavbar');
  const heroWrap = document.querySelector('.hero-scroll-wrap');
  if (!heroWrap || (!floatingNav && !siteNavbar)) return;

  const THRESHOLD = 80; // px buffer before switching, avoids flicker right at the boundary

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