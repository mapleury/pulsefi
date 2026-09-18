

const PulseCategories = (function () {
  const LIST = [
    "Makanan", "Transportasi", "Belanja", "Hiburan",
    "Kesehatan", "Pendidikan", "Tagihan", "Langganan", "Lainnya",
  ];
  function populateSelect(selectEl, includeAll) {
    selectEl.innerHTML = "";
    if (includeAll) {
      const allOpt = document.createElement("option");
      allOpt.value = "all";
      allOpt.textContent = "Semua kategori";
      selectEl.appendChild(allOpt);
    }
    LIST.forEach((c) => {
      const opt = document.createElement("option");
      opt.value = c;
      opt.textContent = c;
      selectEl.appendChild(opt);
    });
  }

  return { LIST, populateSelect };
})();
