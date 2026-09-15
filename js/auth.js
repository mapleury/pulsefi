/*
  auth.js
  -------
  Client-side account handling for the login/signup form. This is a
  no-backend demo, so accounts live in localStorage — swap PulseAuth's
  internals for real API calls whenever a backend exists; nothing
  outside this file needs to change.

  On success, routing hands off to the same onboarding check used
  elsewhere in the app (PulseUtils.requiresOnboarding, from app.js):
  a brand-new signup always needs onboarding; a returning login may or
  may not, depending on whether they finished it last time.
*/

const PulseAuth = (function () {
  const ACCOUNTS_KEY = "pulsefi_accounts_v1";
  const SESSION_KEY = "pulsefi_session_v1";

  function readAccounts() {
    try {
      return JSON.parse(localStorage.getItem(ACCOUNTS_KEY)) || {};
    } catch (e) {
      return {};
    }
  }

  function writeAccounts(accounts) {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
  }

  function signUp(email, password, monthlyIncome) {
    const accounts = readAccounts();
    const key = email.trim().toLowerCase();

    if (accounts[key]) {
      return { ok: false, error: "Email ini sudah terdaftar. Coba login." };
    }

    accounts[key] = { email: key, password, monthlyIncome, createdAt: Date.now() };
    writeAccounts(accounts);
    setSession(key);

    // Hand the stated income to PulseStorage (if that module is loaded
    // on this page) so index.html's onboarding form can pick up where
    // this one left off, instead of asking for it a second time.
    if (typeof PulseStorage !== "undefined" && PulseStorage.saveProfile) {
      PulseStorage.saveProfile({ monthlyIncome });
    }

    return { ok: true };
  }

  function login(email, password) {
    const accounts = readAccounts();
    const key = email.trim().toLowerCase();
    const account = accounts[key];

    if (!account || account.password !== password) {
      return { ok: false, error: "Email atau password salah." };
    }

    setSession(key);
    return { ok: true };
  }

  function setSession(email) {
    sessionStorage.setItem(SESSION_KEY, email);
  }

  function getSession() {
    return sessionStorage.getItem(SESSION_KEY);
  }

  function logout() {
    sessionStorage.removeItem(SESSION_KEY);
  }

  return { signUp, login, logout, getSession };
})();

(function () {
  function init() {
    const form = document.getElementById("auth-form");
    if (!form) return;
    form.addEventListener("submit", handleSubmit);
  }

  function handleSubmit(e) {
    e.preventDefault();

    const email = document.getElementById("email-input").value.trim();
    const password = document.getElementById("password-input").value;
    const mode = typeof PulseAuthUI !== "undefined" ? PulseAuthUI.getMode() : "login";

    if (!email || !password) {
      notify("Isi email dan password terlebih dahulu.", "warning");
      return;
    }

    let result;
    if (mode === "signup") {
      const incomeInput = document.getElementById("pemasukan-input");
      const monthlyIncome = incomeInput ? Number(incomeInput.value) || 0 : 0;
      result = PulseAuth.signUp(email, password, monthlyIncome);
    } else {
      result = PulseAuth.login(email, password);
    }

    if (!result.ok) {
      notify(result.error, "warning");
      return;
    }
    notify(mode === "signup" ? "Akun berhasil dibuat. Mengarahkan ke dashboard..." : "Berhasil masuk.", "success");
    redirectAfterAuth();
  }

  function redirectAfterAuth() {
    // Per current product decision: every login/signup goes straight to
    // the dashboard, regardless of onboarding state. If onboarding gets
    // reintroduced as a gate later, swap this back to check
    // PulseUtils.requiresOnboarding() and branch to index.html.
    setTimeout(() => {
      window.location.href = "dashboard.html";
    }, 500); // short pause so the success toast is actually visible before navigating
  }

  function notify(message, tone) {
    if (typeof PulseAuthUI !== "undefined" && PulseAuthUI.showMessage) {
      PulseAuthUI.showMessage(message, tone);
    } else if (typeof PulseUtils !== "undefined" && PulseUtils.toast) {
      PulseUtils.toast(message, tone); // fallback if auth-ui.js isn't loaded for some reason
    } else {
      alert(message);
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();