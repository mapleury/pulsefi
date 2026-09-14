/*
 tx-form.js
 ----------
 Controller for the "Catat Transaksi" panel: the income/expense
 segmented toggle, category/amount/date/description fields, and
 add vs. edit submission. Every successful write fires a
 "pulsefi:tx-changed" event on window so the list, chart, and insight
 modules can refresh themselves without this file knowing they exist.
*/

const PulseTxForm = (function () {
  let editingId = null;
  let formEl = null;

  function notifyChanged() {
    window.dispatchEvent(new CustomEvent("pulsefi:tx-changed"));
  }

  function updateToggleUI() {
    formEl.querySelectorAll(".type-toggle label").forEach((label) => {
      const input = label.querySelector("input");
      label.classList.toggle("is-active", input.checked);
    });
  }

  function resetForm() {
    formEl.reset();
    document.getElementById("tx-date").value = PulseUtils.todayISO();
    document.querySelector('input[name="tx-type"][value="expense"]').checked = true;
    updateToggleUI();
  }

  function exitEditMode() {
    editingId = null;
    formEl.querySelector("button[type=submit]").textContent = "+ Catat Transaksi";
    const cancelBtn = document.getElementById("tx-cancel-edit");
    if (cancelBtn) cancelBtn.hidden = true;
    const titleEl = document.getElementById("tx-form-title");
    if (titleEl) titleEl.textContent = "Catat Transaksi";
  }

  function enterEditMode(tx) {
    editingId = tx.id;
    document.querySelector(`input[name="tx-type"][value="${tx.type}"]`).checked = true;
    updateToggleUI();
    document.getElementById("tx-category").value = tx.category;
    document.getElementById("tx-amount").value = tx.amount;
    document.getElementById("tx-date").value = tx.date;
    document.getElementById("tx-description").value = tx.description || "";
    formEl.querySelector("button[type=submit]").textContent = "Simpan Perubahan";
    const cancelBtn = document.getElementById("tx-cancel-edit");
    if (cancelBtn) cancelBtn.hidden = false;
    const titleEl = document.getElementById("tx-form-title");
    if (titleEl) titleEl.textContent = "Edit Transaksi";
    formEl.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function handleSubmit(e) {
    e.preventDefault();
    const type = formEl.querySelector('input[name="tx-type"]:checked').value;
    const category = document.getElementById("tx-category").value;
    const amount = Number(document.getElementById("tx-amount").value);
    const date = document.getElementById("tx-date").value;
    const description = document.getElementById("tx-description").value.trim();

    if (!amount || amount <= 0) {
      PulseUtils.toast("Masukkan nominal yang valid.", "warning");
      return;
    }
    if (!date) {
      PulseUtils.toast("Pilih tanggal transaksi.", "warning");
      return;
    }

    if (editingId) {
      PulseStorage.updateTransaction(editingId, { type, category, amount, date, description });
      PulseUtils.toast("Transaksi diperbarui.", "success");
      exitEditMode();
    } else {
      PulseStorage.addTransaction({ type, category, amount, date, description });
      PulseUtils.toast("Transaksi ditambahkan.", "success");
    }

    resetForm();
    notifyChanged();
  }

  function init() {
    formEl = document.getElementById("tx-form");
    if (!formEl) return;

    PulseCategories.populateSelect(document.getElementById("tx-category"), false);

    const dateInput = document.getElementById("tx-date");
    if (dateInput && !dateInput.value) dateInput.value = PulseUtils.todayISO();

    updateToggleUI();
    formEl.querySelectorAll('input[name="tx-type"]').forEach((radio) => {
      radio.addEventListener("change", updateToggleUI);
    });

    formEl.addEventListener("submit", handleSubmit);

    const cancelBtn = document.getElementById("tx-cancel-edit");
    if (cancelBtn) {
      cancelBtn.addEventListener("click", () => {
        resetForm();
        exitEditMode();
      });
    }
  }

  document.addEventListener("DOMContentLoaded", init);

  return { init, enterEditMode };
})();
