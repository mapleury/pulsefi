

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

  function signUp(name, email, password, monthlyIncome) {
    const accounts = readAccounts();
    const key = email.trim().toLowerCase();

    if (accounts[key]) {
      return { ok: false, error: "Email ini sudah terdaftar. Coba login." };
    }

    accounts[key] = {
      name: name.trim(),
      email: key,
      password,
      monthlyIncome,
      createdAt: Date.now(),
    };
    writeAccounts(accounts);
    setSession(key);
    if (typeof PulseStorage !== "undefined" && PulseStorage.saveProfile) {
      PulseStorage.saveProfile({ name: name.trim(), monthlyIncome });
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
    if (typeof PulseStorage !== "undefined" && PulseStorage.saveProfile && account.name) {
      PulseStorage.saveProfile({ name: account.name });
    }

    return { ok: true };
  }

  function setSession(email) {
    sessionStorage.setItem(SESSION_KEY, email);
  }

  function getSession() {
    return sessionStorage.getItem(SESSION_KEY);
  }

  function getCurrentAccount() {
    const email = getSession();
    if (!email) return null;
    const accounts = readAccounts();
    return accounts[email] || null;
  }

  function logout() {
    sessionStorage.removeItem(SESSION_KEY);
  }

  return { signUp, login, logout, getSession, getCurrentAccount };
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
      const nameInput = document.getElementById("name-input");
      const name = nameInput ? nameInput.value.trim() : "";

      if (!name) {
        notify("Isi nama lengkap terlebih dahulu.", "warning");
        return;
      }

      const incomeInput = document.getElementById("pemasukan-input");
      const monthlyIncome = incomeInput ? Number(incomeInput.value) || 0 : 0;
      result = PulseAuth.signUp(name, email, password, monthlyIncome);
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
    setTimeout(() => {
window.location.href = "/dashboard.html";
    }, 500);
  }

  function notify(message, tone) {
    if (typeof PulseAuthUI !== "undefined" && PulseAuthUI.showMessage) {
      PulseAuthUI.showMessage(message, tone);
    } else if (typeof PulseUtils !== "undefined" && PulseUtils.toast) {
      PulseUtils.toast(message, tone);
    } else {
      alert(message);
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();