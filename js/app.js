

const PulseUtils = (function () {
  function formatCurrency(amount) {
    const n = Math.round(Number(amount) || 0);
    return "Rp" + n.toLocaleString("id-ID");
  }
  function formatCurrencySigned(amount) {
    const n = Math.round(Number(amount) || 0);
    const sign = n < 0 ? "-" : "";
    return sign + Math.abs(n).toLocaleString("id-ID");
  }

  function formatCurrencyCompact(amount) {
    const n = Number(amount) || 0;
    if (Math.abs(n) >= 1000000000) return "Rp" + (n / 1000000000).toFixed(1) + "M";
    if (Math.abs(n) >= 1000000) return "Rp" + (n / 1000000).toFixed(1) + "jt";
    if (Math.abs(n) >= 1000) return "Rp" + Math.round(n / 1000) + "rb";
    return formatCurrency(n);
  }

  function formatDate(dateStr) {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const bulan = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
    return d.getDate() + " " + bulan[d.getMonth()] + " " + d.getFullYear();
  }

  function todayISO() {
    return new Date().toISOString().slice(0, 10);
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str == null ? "" : String(str);
    return div.innerHTML;
  }

  function toast(message, tone) {
    let container = document.getElementById("toast-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "toast-container";
      container.className = "toast-container";
      container.setAttribute("aria-live", "polite");
      document.body.appendChild(container);
    }
    const el = document.createElement("div");
    el.className = "toast toast-" + (tone || "default");
    el.textContent = message;
    container.appendChild(el);
    requestAnimationFrame(() => el.classList.add("toast-visible"));
    setTimeout(() => {
      el.classList.remove("toast-visible");
      setTimeout(() => el.remove(), 300);
    }, 3200);
  }

  function animateNumber(el, from, to, opts) {
    opts = opts || {};
    const duration = opts.duration || 900;
    const format = opts.format || ((v) => Math.round(v).toLocaleString("id-ID"));
    const start = performance.now();

    function step(now) {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = from + (to - from) * eased;
      el.textContent = format(value);
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function initNav() {
    const toggle = document.querySelector(".nav-toggle");
    const menu = document.querySelector(".nav-links");
    if (toggle && menu) {
      if (!menu.id) menu.id = "primary-navigation";
      toggle.setAttribute("aria-controls", menu.id);
      toggle.addEventListener("click", () => {
        const isOpen = menu.classList.toggle("nav-links-open");
        toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
        if (isOpen) {
          const firstLink = menu.querySelector("a");
          if (firstLink) firstLink.focus();
        } else {
          toggle.focus();
        }
      });
    }

    const path = window.location.pathname.split("/").pop() || "dashboard.html";
    document.querySelectorAll(".nav-links a").forEach((a) => {
      const href = a.getAttribute("href");
      if (href === path) a.classList.add("nav-active");
    });
  }

  function initScrollReveal() {
    const items = document.querySelectorAll("[data-reveal]");
    if (!items.length) return;
    if (!("IntersectionObserver" in window)) {
      items.forEach((el) => el.classList.add("reveal-visible"));
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("reveal-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    items.forEach((el) => observer.observe(el));
  }

  function requiresOnboarding() {
    const state = PulseStorage.getOnboardingState();
    return !state;
  }

  function redirectIfNeedsOnboarding() {
    if (requiresOnboarding()) {
      window.location.href = "index.html#onboarding";
      return true;
    }
    return false;
  }

  document.addEventListener("DOMContentLoaded", () => {
    initNav();
    initScrollReveal();
  });

  return {
    formatCurrency,
    formatCurrencySigned,
    formatCurrencyCompact,
    formatDate,
    todayISO,
    escapeHtml,
    toast,
    animateNumber,
    initNav,
    initScrollReveal,
    requiresOnboarding,
    redirectIfNeedsOnboarding,
  };
})();