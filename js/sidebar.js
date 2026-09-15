/*
 sidebar.js
 ----------
 Controller for the collapsible left sidebar (aside#sidebar). Handles:
   - highlighting the nav item that matches the current page
   - the desktop collapse/expand toggle
   - the mobile off-canvas open/close toggle

 Pure DOM wiring, no PulseStorage/PulseCalc dependency, so it can be
 dropped into any page that includes the sidebar markup.
*/

const PulseSidebar = (function () {
  function setActive(item, active) {
    const dot = item.querySelector(".nav-dot");
    if (active) {
      item.classList.add("active", "bg-pulse-active", "text-pulse-darkText", "font-bold");
      item.classList.remove("text-pulse-inactiveText", "font-medium");
      if (dot) {
        dot.classList.remove("opacity-0", "scale-0");
        dot.classList.add("opacity-100", "scale-100");
      }
    } else {
      item.classList.remove("active", "bg-pulse-active", "text-pulse-darkText", "font-bold");
      item.classList.add("text-pulse-inactiveText", "font-medium");
      if (dot) {
        dot.classList.add("opacity-0", "scale-0");
        dot.classList.remove("opacity-100", "scale-100");
      }
    }
  }

  function init() {
    const sidebar = document.getElementById("sidebar");
    if (!sidebar) return;

    const collapseBtn = document.getElementById("collapse-btn");
    if (collapseBtn) {
      collapseBtn.addEventListener("click", () => sidebar.classList.toggle("collapsed"));
    }

    const current = window.location.pathname.split("/").pop() || "dashboard.html";
    document.querySelectorAll(".nav-item").forEach((item) => {
      setActive(item, item.getAttribute("href") === current);
    });

    const nameEl = document.getElementById("sidebar-user-name");
    if (nameEl && window.PulseStorage) {
      const profile = PulseStorage.getProfile();
      if (profile && profile.name) nameEl.textContent = profile.name;
    }

    const mobileToggle = document.getElementById("sidebar-toggle");
    const backdrop = document.getElementById("sidebar-backdrop");
    const closeDrawer = () => {
      sidebar.classList.remove("sidebar-open");
      if (backdrop) backdrop.classList.remove("is-visible");
    };
    if (mobileToggle) {
      mobileToggle.addEventListener("click", () => {
        sidebar.classList.toggle("sidebar-open");
        if (backdrop) backdrop.classList.toggle("is-visible");
      });
    }
    if (backdrop) backdrop.addEventListener("click", closeDrawer);
    sidebar.querySelectorAll(".nav-item").forEach((item) => item.addEventListener("click", closeDrawer));
  }

  document.addEventListener("DOMContentLoaded", init);

  return { init };
})();

