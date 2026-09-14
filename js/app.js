/*
  app.js
  ------
  Shared utilities used across every page: currency formatting, toast
  notifications, active-nav highlighting, mobile menu toggle, and the
  first-time-user onboarding guard.
*/

const PulseUtils = (function () {
  function formatCurrency(amount) {
    const n = Math.round(Number(amount) || 0);
    return "Rp" + n.toLocaleString("id-ID");
  }

  // Signed variant used by cards that need to show a leading minus for
  // net-negative windows (e.g. "Rata Rata Transaksi": -Rp300.000).
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
// OLD
// /*
//   app.js
//   ------
//   Shared utilities used across every page: currency formatting, toast
//   notifications, active-nav highlighting, mobile menu toggle, and the
//   first-time-user onboarding flow.
// */

// const PulseUtils = (function () {
//   let activeDialog = null;

//   function formatCurrency(amount) {
//     const n = Math.round(Number(amount) || 0);
//     return "Rp" + n.toLocaleString("id-ID");
//   }

//   function formatCurrencyCompact(amount) {
//     const n = Number(amount) || 0;
//     if (Math.abs(n) >= 1000000000) return "Rp" + (n / 1000000000).toFixed(1) + "M";
//     if (Math.abs(n) >= 1000000) return "Rp" + (n / 1000000).toFixed(1) + "jt";
//     if (Math.abs(n) >= 1000) return "Rp" + Math.round(n / 1000) + "rb";
//     return formatCurrency(n);
//   }

//   function formatDate(dateStr) {
//     const d = new Date(dateStr);
//     if (isNaN(d.getTime())) return dateStr;
//     const bulan = [
//       "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
//       "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
//     ];
//     return d.getDate() + " " + bulan[d.getMonth()] + " " + d.getFullYear();
//   }

//   function todayISO() {
//     return new Date().toISOString().slice(0, 10);
//   }

//   function escapeHtml(str) {
//     const div = document.createElement("div");
//     div.textContent = str == null ? "" : String(str);
//     return div.innerHTML;
//   }

//   // ---------- toast notifications ----------

//   function toast(message, tone) {
//     let container = document.getElementById("toast-container");
//     if (!container) {
//       container = document.createElement("div");
//       container.id = "toast-container";
//       container.className = "toast-container";
//       container.setAttribute("aria-live", "polite");
//       document.body.appendChild(container);
//     }
//     const el = document.createElement("div");
//     el.className = "toast toast-" + (tone || "default");
//     el.textContent = message;
//     container.appendChild(el);
//     requestAnimationFrame(() => el.classList.add("toast-visible"));
//     setTimeout(() => {
//       el.classList.remove("toast-visible");
//       setTimeout(() => el.remove(), 300);
//     }, 3200);
//   }

//   // ---------- accessible modal dialogs ----------

//   function confirmDialog(message) {
//     return openDialog({ message, mode: "confirm" });
//   }

//   function promptDialog(message, options) {
//     options = options || {};
//     return openDialog({
//       message,
//       mode: "prompt",
//       label: options.label || "Nilai",
//       type: options.type || "text",
//     });
//   }

//   function openDialog(options) {
//     if (activeDialog) activeDialog.close(null);

//     return new Promise((resolve) => {
//       const restoreFocus = document.activeElement instanceof HTMLElement
//         ? document.activeElement
//         : null;
//       const titleId = "pulse-dialog-title-" + Date.now();
//       const descriptionId = "pulse-dialog-description-" + Date.now();
//       const overlay = document.createElement("div");
//       const dialog = document.createElement("div");
//       const title = document.createElement("h2");
//       const description = document.createElement("p");
//       const actions = document.createElement("div");
//       const cancelButton = document.createElement("button");
//       const confirmButton = document.createElement("button");
//       let input = null;
//       let closed = false;

//       // NEEDS STYLING: minimal modal structure reuses the existing button classes.
//       overlay.setAttribute("data-pulse-dialog", "true");
//       dialog.setAttribute("role", "dialog");
//       dialog.setAttribute("aria-modal", "true");
//       dialog.setAttribute("aria-labelledby", titleId);
//       dialog.setAttribute("aria-describedby", descriptionId);
//       dialog.tabIndex = -1;
//       title.id = titleId;
//       title.textContent = options.mode === "prompt" ? "Masukkan nilai" : "Konfirmasi tindakan";
//       description.id = descriptionId;
//       description.textContent = options.message;
//       actions.append(cancelButton, confirmButton);
//       cancelButton.type = "button";
//       cancelButton.className = "btn btn-ghost";
//       cancelButton.textContent = "Batal";
//       confirmButton.type = "button";
//       confirmButton.className = "btn btn-primary";
//       confirmButton.textContent = options.mode === "prompt" ? "Simpan" : "Konfirmasi";

//       dialog.append(title, description);
//       if (options.mode === "prompt") {
//         const label = document.createElement("label");
//         input = document.createElement("input");
//         const inputId = "pulse-dialog-input-" + Date.now();
//         label.textContent = options.label;
//         label.htmlFor = inputId;
//         input.id = inputId;
//         label.appendChild(input);
//         input.type = options.type;
//         input.required = true;
//         dialog.appendChild(label);
//       }
//       dialog.appendChild(actions);
//       overlay.appendChild(dialog);
//       document.body.appendChild(overlay);

//       function focusableElements() {
//         return Array.from(dialog.querySelectorAll("button, input, select, textarea, [tabindex]:not([tabindex='-1'])"))
//           .filter((element) => !element.disabled && element.getAttribute("aria-hidden") !== "true");
//       }

//       function close(value) {
//         if (closed) return;
//         closed = true;
//         document.removeEventListener("keydown", handleKeydown);
//         overlay.remove();
//         activeDialog = null;
//         if (restoreFocus && restoreFocus.isConnected) restoreFocus.focus();
//         resolve(value);
//       }

//       function handleKeydown(event) {
//         if (event.key === "Escape") {
//           event.preventDefault();
//           close(options.mode === "prompt" ? null : false);
//           return;
//         }
//         if (event.key !== "Tab") return;
//         const focusable = focusableElements();
//         if (focusable.length === 0) {
//           event.preventDefault();
//           dialog.focus();
//           return;
//         }
//         const first = focusable[0];
//         const last = focusable[focusable.length - 1];
//         if (event.shiftKey && document.activeElement === first) {
//           event.preventDefault();
//           last.focus();
//         } else if (!event.shiftKey && document.activeElement === last) {
//           event.preventDefault();
//           first.focus();
//         }
//       }

//       cancelButton.addEventListener("click", () => close(options.mode === "prompt" ? null : false));
//       confirmButton.addEventListener("click", () => {
//         if (options.mode === "prompt") {
//           if (!input.reportValidity()) return;
//           close(input.value);
//         } else {
//           close(true);
//         }
//       });
//       document.addEventListener("keydown", handleKeydown);
//       activeDialog = { close };
//       requestAnimationFrame(() => (input || confirmButton).focus());
//     });
//   }

//   // ---------- animated number counting ----------

//   function animateNumber(el, from, to, opts) {
//     opts = opts || {};
//     const duration = opts.duration || 900;
//     const format = opts.format || ((v) => Math.round(v).toLocaleString("id-ID"));
//     const start = performance.now();

//     function step(now) {
//       const progress = Math.min(1, (now - start) / duration);
//       const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
//       const value = from + (to - from) * eased;
//       el.textContent = format(value);
//       if (progress < 1) requestAnimationFrame(step);
//     }
//     requestAnimationFrame(step);
//   }

//   // ---------- navigation ----------

//   function initNav() {
//     const toggle = document.querySelector(".nav-toggle");
//     const menu = document.querySelector(".nav-links");
//     if (toggle && menu) {
//       if (!menu.id) menu.id = "primary-navigation";
//       toggle.setAttribute("aria-controls", menu.id);
//       toggle.addEventListener("click", () => {
//         const isOpen = menu.classList.toggle("nav-links-open");
//         toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
//         if (isOpen) {
//           const firstLink = menu.querySelector("a");
//           if (firstLink) firstLink.focus();
//         } else {
//           toggle.focus();
//         }
//       });
//     }

//     const path = window.location.pathname.split("/").pop() || "index.html";
//     document.querySelectorAll(".nav-links a").forEach((a) => {
//       const href = a.getAttribute("href");
//       if (href === path) a.classList.add("nav-active");
//     });
//   }

//   function initLabelAssociations() {
//     document.querySelectorAll("label:not([for])").forEach((label) => {
//       const control = label.querySelector("input, select, textarea");
//       if (control && control.id) label.htmlFor = control.id;
//     });
//   }

//   // ---------- scroll reveal ----------

//   function initScrollReveal() {
//     const items = document.querySelectorAll("[data-reveal]");
//     if (!items.length) return;
//     if (!("IntersectionObserver" in window)) {
//       items.forEach((el) => el.classList.add("reveal-visible"));
//       return;
//     }
//     const observer = new IntersectionObserver(
//       (entries) => {
//         entries.forEach((entry) => {
//           if (entry.isIntersecting) {
//             entry.target.classList.add("reveal-visible");
//             observer.unobserve(entry.target);
//           }
//         });
//       },
//       { threshold: 0.15 }
//     );
//     items.forEach((el) => observer.observe(el));
//   }

//   // ---------- onboarding ----------

//   function requiresOnboarding() {
//     const state = PulseStorage.getOnboardingState();
//     return !state;
//   }

//   function redirectIfNeedsOnboarding() {
//     if (requiresOnboarding()) {
//       window.location.href = "index.html#onboarding";
//       return true;
//     }
//     return false;
//   }

//   document.addEventListener("DOMContentLoaded", () => {
//     initNav();
//     initLabelAssociations();
//     initScrollReveal();
//   });

//   return {
//     formatCurrency,
//     formatCurrencyCompact,
//     formatDate,
//     todayISO,
//     escapeHtml,
//     toast,
//     confirmDialog,
//     promptDialog,
//     animateNumber,
//     initNav,
//     initLabelAssociations,
//     initScrollReveal,
//     requiresOnboarding,
//     redirectIfNeedsOnboarding,
//   };
// })();