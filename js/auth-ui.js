/*
  auth-ui.js
  ----------
  UI-only state for the login/signup form: password visibility toggle,
  and the smooth text-swap between "login" and "signup" copy. Holds no
  business logic — auth.js reads PulseAuthUI.getMode() to decide what
  the submit button should actually do.
*/

const PulseAuthUI = (function () {
  const els = {};
  let mode = "login"; // "login" | "signup"

  const ICON_PATHS = {
    off: `<path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />`,
    on: `<path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.964-7.178z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />`,
  };

  const COPY = {
    login: {
      subheading: "LOGIN KE AKUN",
      heading: "Selamat Datang Kembali!",
      footer: "Buat profil PulseFi baru?",
      submit: "Login",
    },
    signup: {
      subheading: "BUAT PROFIL BARU",
      heading: "Selamat Datang!",
      footer: "Sudah punya akun PulseFi?",
      submit: "Daftar",
    },
  };

  function cacheEls() {
    els.form = document.getElementById("auth-form");
    els.subheading = document.getElementById("subheading");
    els.heading = document.getElementById("heading");
    els.footerText = document.getElementById("footer-text");
    els.submitBtn = document.getElementById("auth-submit-btn");
    els.pemasukanContainer = document.getElementById("pemasukan-container");
        els.nameContainer = document.getElementById("name-container");
    els.togglePasswordBtn = document.getElementById("toggle-password-btn");
    els.passwordInput = document.getElementById("password-input");
    els.eyeIcon = document.getElementById("eye-icon");
    els.toggleFormBtn = document.getElementById("toggle-form-btn");
    els.message = document.getElementById("auth-message");
    els.messageIcon = document.getElementById("auth-message-icon");
    els.messageText = document.getElementById("auth-message-text");
    els.messageClose = document.getElementById("auth-message-close");
  }

  const MESSAGE_TONES = {
    error: {
      classes: "bg-[#FDECEC] text-[#B42318]",
      icon: `<path fill="currentColor" fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-11a.75.75 0 00-1.5 0v4a.75.75 0 001.5 0V7zM10 13.5a.9.9 0 100-1.8.9.9 0 000 1.8z" clip-rule="evenodd"/>`,
    },
      warning: {
      classes: "bg-[#F5D1D1] border border-[#B96C6C] text-[#B96C6C]",
      icon: `<path fill="currentColor" fill-rule="evenodd" d="M8.68 2.87a1.5 1.5 0 012.64 0l7.1 13.02A1.5 1.5 0 0117.1 18H2.9a1.5 1.5 0 01-1.32-2.11l7.1-13.02zM10 7a.75.75 0 00-.75.75v3.5a.75.75 0 001.5 0v-3.5A.75.75 0 0010 7zm0 7.25a.9.9 0 100-1.8.9.9 0 000 1.8z" clip-rule="evenodd"/>`,
    },
    success: {
classes: "bg-[#C9DEBB] text-[#697D5B]",
      icon: `<path fill="currentColor" fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.53-9.47a.75.75 0 00-1.06-1.06L9 10.94 7.53 9.47a.75.75 0 00-1.06 1.06l2 2c.3.3.77.3 1.06 0l4-4z" clip-rule="evenodd"/>`,
    },
  };

  let messageTimer = null;

  function hideMessage() {
    if (!els.message) return;
    clearTimeout(messageTimer);
    els.message.classList.add("opacity-0", "-translate-y-1");
    setTimeout(() => els.message.classList.add("hidden"), 300);
  }

  function showMessage(text, tone) {
    if (!els.message) {
      // Fallback for pages that somehow don't have the markup — better than a silent failure.
      alert(text);
      return;
    }

    const t = MESSAGE_TONES[tone] || MESSAGE_TONES.error;

    els.message.className =
      "flex items-start gap-2.5 rounded-2xl px-4 py-3 mb-5 text-[13px] font-medium leading-snug transition-all duration-300 ease-out " + t.classes;
    els.messageIcon.innerHTML = t.icon;
    els.messageText.textContent = text;

    // force reflow so the transition plays even if a message was already visible
    els.message.classList.add("opacity-0", "-translate-y-1");
    void els.message.offsetWidth;
    requestAnimationFrame(() => {
      els.message.classList.remove("opacity-0", "-translate-y-1");
    });

    clearTimeout(messageTimer);
    if (tone !== "success") {
      // errors/warnings stay a bit longer so they're easy to actually read
      messageTimer = setTimeout(hideMessage, 6000);
    }
  }

  function bindMessageClose() {
    if (!els.messageClose) return;
    els.messageClose.addEventListener("click", hideMessage);
  }

  function bindPasswordToggle() {
    if (!els.togglePasswordBtn) return;
    els.togglePasswordBtn.addEventListener("click", () => {
      const isHidden = els.passwordInput.type === "password";
      els.passwordInput.type = isHidden ? "text" : "password";
      els.eyeIcon.innerHTML = isHidden ? ICON_PATHS.on : ICON_PATHS.off;
    });
  }

  function applyCopy(next) {
    const c = COPY[next];
    els.subheading.textContent = c.subheading;
    els.heading.textContent = c.heading;
    els.footerText.textContent = c.footer;
    if (els.submitBtn) els.submitBtn.textContent = c.submit;
  }

  function setMode(next) {
    if (next === mode || !COPY[next]) return;

    const fadeEls = [els.subheading, els.heading, els.footerText];
    fadeEls.forEach((el) => el && (el.style.opacity = "0"));

    setTimeout(() => {
      mode = next;
      applyCopy(next);
      els.pemasukanContainer.classList.toggle("expanded", next === "signup");
            els.nameContainer.classList.toggle("expanded", next === "signup");
      fadeEls.forEach((el) => el && (el.style.opacity = "1"));
      if (els.form) {
        els.form.dispatchEvent(new CustomEvent("authmodechange", { detail: { mode } }));
      }
    }, 200); // matches the .fade-text CSS transition duration
  }

  function bindModeToggle() {
    if (!els.toggleFormBtn) return;
    els.toggleFormBtn.addEventListener("click", () => {
      setMode(mode === "login" ? "signup" : "login");
    });
  }

  function getMode() {
    return mode;
  }
  function init() {
    cacheEls();
    bindPasswordToggle();
    bindModeToggle();
    bindMessageClose();
    applyCopy(mode); // syncs the submit button label on first load
  }

  document.addEventListener("DOMContentLoaded", init);

  return { getMode, setMode, showMessage, hideMessage, showError: (t) => showMessage(t, "error"), showWarning: (t) => showMessage(t, "warning"), showSuccess: (t) => showMessage(t, "success") };
})();