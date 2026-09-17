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
  const MOBILE_BREAKPOINT = 900;
  const COLLAPSE_STORAGE_KEY = "pulsefi-sidebar-collapsed";

  function getStoredCollapsed() {
    try {
      return localStorage.getItem(COLLAPSE_STORAGE_KEY) === "true";
    } catch (e) {
      return false;
    }
  }

  function setStoredCollapsed(collapsed) {
    try {
      localStorage.setItem(COLLAPSE_STORAGE_KEY, collapsed ? "true" : "false");
    } catch (e) {
      // localStorage unavailable (private mode, etc.) — state just won't persist.
    }
  }

  // Injects the mobile off-canvas behavior as its own stylesheet, once,
  // so no page needs matching CSS in style.css for this to work. Uses
  // an #sidebar ID selector so it reliably overrides the Tailwind
  // width/height utility classes some pages (like dashboard.html) put
  // directly on the sidebar markup.
  function injectMobileStyles() {
    if (document.getElementById("pulse-sidebar-mobile-styles")) return;
    const style = document.createElement("style");
    style.id = "pulse-sidebar-mobile-styles";
    style.textContent = `
      .pulse-sidebar-toggle-btn {
        display: none;
        position: fixed;
        top: 18px;
        left: 18px;
        z-index: 40;
        width: 42px;
        height: 42px;
        border-radius: 50%;
        background: #191729;
        color: #fff;
        border: none;
        align-items: center;
        justify-content: center;
        box-shadow: 0 1px 2px rgba(21,19,28,0.03), 0 10px 24px -18px rgba(21,19,28,0.18);
        cursor: pointer;
      }
      .pulse-sidebar-backdrop {
        display: none;
        position: fixed;
        inset: 0;
        background: rgba(21, 19, 28, 0.4);
        z-index: 29;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.25s ease;
      }
      .pulse-sidebar-backdrop.is-visible { opacity: 1; pointer-events: auto; }

      @media (max-width: ${MOBILE_BREAKPOINT}px) {
        #sidebar {
          position: fixed !important;
          top: 16px;
          left: 16px;
          bottom: 16px;
          height: auto !important;
          width: 260px !important;
          z-index: 30;
          transform: translateX(-120%);
          transition: transform 0.3s ease;
        }
        #sidebar.sidebar-open { transform: translateX(0); }
        #sidebar #collapse-btn { display: none; }
        .pulse-sidebar-toggle-btn { display: flex; }
        .pulse-sidebar-backdrop { display: block; }
      }
    `;
    document.head.appendChild(style);
  }

  // Reuses a page's own #sidebar-toggle / #sidebar-backdrop if present
  // (e.g. transactions.html already has them), otherwise builds them,
  // so the drawer works even on pages that never added this markup.
  function ensureMobileControls() {
    let toggle = document.getElementById("sidebar-toggle");
    if (!toggle) {
      toggle = document.createElement("button");
      toggle.id = "sidebar-toggle";
      toggle.type = "button";
      toggle.setAttribute("aria-label", "Buka menu");
      toggle.innerHTML =
        '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>';
      document.body.appendChild(toggle);
    }
    toggle.classList.add("pulse-sidebar-toggle-btn");

    let backdrop = document.getElementById("sidebar-backdrop");
    if (!backdrop) {
      backdrop = document.createElement("div");
      backdrop.id = "sidebar-backdrop";
      document.body.appendChild(backdrop);
    }
    backdrop.classList.add("pulse-sidebar-backdrop");

    return { toggle, backdrop };
  }

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

    injectMobileStyles();

     // Restore last collapse state immediately, before the user sees
    // anything, so navigating between pages doesn't flash expanded
    // then snap collapsed.
    if (getStoredCollapsed()) sidebar.classList.add("collapsed");

    const collapseBtn = document.getElementById("collapse-btn");
    if (collapseBtn) {
      collapseBtn.addEventListener("click", () => {
        const isCollapsed = sidebar.classList.toggle("collapsed");
        setStoredCollapsed(isCollapsed);
      });
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

    const { toggle: mobileToggle, backdrop } = ensureMobileControls();
    const closeDrawer = () => {
      sidebar.classList.remove("sidebar-open");
      backdrop.classList.remove("is-visible");
    };
    mobileToggle.addEventListener("click", () => {
      sidebar.classList.toggle("sidebar-open");
      backdrop.classList.toggle("is-visible");
    });
    backdrop.addEventListener("click", closeDrawer);
    sidebar.querySelectorAll(".nav-item").forEach((item) => item.addEventListener("click", closeDrawer));

    // If the viewport crosses back to desktop while the drawer is open,
    // or the desktop collapse state is stale, don't leave it stuck.
    window.addEventListener("resize", () => {
      if (window.innerWidth > MOBILE_BREAKPOINT) closeDrawer();
    });
  }
  document.addEventListener("DOMContentLoaded", init);

  return { init };
})();

