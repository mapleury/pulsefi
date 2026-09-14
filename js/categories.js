/*
 categories.js
 -------------
 The one place that lists PulseFi's transaction categories. Both the
 transaction form and the filter bar read from here so the two never
 drift out of sync.
*/

const PulseCategories = (function () {
  const LIST = [
    "Makanan", "Transportasi", "Belanja", "Hiburan",
    "Kesehatan", "Pendidikan", "Tagihan", "Langganan", "Lainnya",
  ];

  // Fills a <select> with every category. When includeAll is true, an
  // extra "Semua kategori" option is added at the top (used by filters,
  // not by the add/edit form).
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
