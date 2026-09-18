

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
    }
  }
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
  function injectProfileMenuStyles() {
    if (document.getElementById("pulse-sidebar-profile-styles")) return;
    const style = document.createElement("style");
    style.id = "pulse-sidebar-profile-styles";
    style.textContent = `
      .user-profile-btn {
        position: relative;
        cursor: pointer;
      }
      .profile-signout-menu {
        position: absolute;
        left: 0;
        right: 0;
        bottom: calc(100% + 10px);
        background: #fff;
        border: 1px solid #13111a56;
        border-radius: 24px;
        box-shadow: 0 12px 32px -10px rgba(16, 16, 16, 0.18), 0 2px 8px -2px rgba(16, 16, 16, 0.08);
        padding: 6px;
        opacity: 0;
        transform: translateY(6px) scale(0.98);
        pointer-events: none;
        transition: opacity 0.16s ease, transform 0.16s ease;
        z-index: 50;
      }
      .user-profile-btn.menu-open .profile-signout-menu {
        opacity: 1;
        transform: translateY(0) scale(1);
        pointer-events: auto;
      }
      #sidebar.collapsed .profile-signout-menu {
        left: 0;
        right: auto;
        width: 160px;
      }
      .profile-signout-item {
        display: flex;
        align-items: center;
        gap: 8px;
        width: 100%;
        padding: 10px 12px;
        border-radius: 18px;
        background: transparent;
        border: none;
        color: #dc2626;
        font-size: 13px;
        font-weight: 600;
        letter-spacing: -0.01em;
        text-align: left;
        cursor: pointer;
        transition: background 0.15s ease;
      }
      .profile-signout-item:hover {
        background: #fef2f2;
      }
      .profile-signout-item svg {
        width: 16px;
        height: 16px;
        flex-shrink: 0;
      }
    `;
    document.head.appendChild(style);
  }
  function handleSignOut() {
    const confirmed = window.confirm("Keluar dari akun ini?");
    if (!confirmed) return;

    const event = new CustomEvent("pulsefi:sign-out", { cancelable: true });
    const notCancelled = window.dispatchEvent(event);

    if (window.PulseStorage && typeof PulseStorage.signOut === "function") {
      PulseStorage.signOut();
    }

    if (notCancelled) {
      window.location.href = "index.html";
    }
  }
  function ensureSignOutOverlay(profileBtn) {
    if (!profileBtn || profileBtn.querySelector(".profile-signout-menu")) return;

    const menu = document.createElement("div");
    menu.className = "profile-signout-menu";
    menu.setAttribute("role", "menu");

    const signOutBtn = document.createElement("button");
    signOutBtn.type = "button";
    signOutBtn.className = "profile-signout-item";
    signOutBtn.setAttribute("role", "menuitem");
    signOutBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"></path>
        <polyline points="16 17 21 12 16 7"></polyline>
        <line x1="21" y1="12" x2="9" y2="12"></line>
      </svg>
      <span>Keluar</span>
    `;

    const closeMenu = () => profileBtn.classList.remove("menu-open");

    signOutBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      closeMenu();
      handleSignOut();
    });

    menu.appendChild(signOutBtn);
    profileBtn.appendChild(menu);
    profileBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      profileBtn.classList.toggle("menu-open");
    });
    document.addEventListener("click", () => closeMenu());
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeMenu();
    });
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
    injectProfileMenuStyles();
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
if (nameEl) {
  const profile = window.PulseStorage ? PulseStorage.getProfile() : null;
  const account = typeof PulseAuth !== "undefined" && PulseAuth.getCurrentAccount
    ? PulseAuth.getCurrentAccount()
    : null;
  const displayName = (profile && profile.name) || (account && account.name);
  if (displayName) nameEl.textContent = displayName;
}

    const profileBtn = sidebar.querySelector(".user-profile-btn");
    ensureSignOutOverlay(profileBtn);

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
    window.addEventListener("resize", () => {
      if (window.innerWidth > MOBILE_BREAKPOINT) closeDrawer();
    });
  }
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

  document.addEventListener("DOMContentLoaded", init);

  return { init };
})();