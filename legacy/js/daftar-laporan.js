(function () {
  "use strict";
  function initDaftarLaporan() {
    var filterToggle = document.getElementById("filterToggle");
    var filterPanel = document.getElementById("filterPanel");

    if (filterToggle && filterPanel) {
      filterToggle.addEventListener("click", function (e) {
        e.stopPropagation();
        filterPanel.classList.toggle("hidden");
      });

      document.addEventListener("click", function (e) {
        if (!filterPanel.classList.contains("hidden") &&
            !filterPanel.contains(e.target) &&
            e.target !== filterToggle) {
          filterPanel.classList.add("hidden");
        }
      });
    }

    var loadMoreBtn = document.getElementById("loadMoreBtn");
    if (loadMoreBtn) {
      loadMoreBtn.addEventListener("click", function () {
        loadMoreBtn.textContent = "Memuat...";
        setTimeout(function () {
          loadMoreBtn.textContent = "Tidak ada laporan lain";
          loadMoreBtn.disabled = true;
        }, 800);
      });
    }

    var searchInput = document.getElementById("searchInput");
    if (searchInput) {
      searchInput.addEventListener("input", function () {
        applyFilters();
      });
    }

    var filterCategory = document.getElementById("filterCategory");
    var filterStatus = document.getElementById("filterStatus");
    var filterSort = document.getElementById("filterSort");

    if (filterCategory) filterCategory.addEventListener("change", applyFilters);
    if (filterStatus) filterStatus.addEventListener("change", applyFilters);
    if (filterSort) filterSort.addEventListener("change", applyFilters);

    function applyFilters() {
      var query = searchInput ? searchInput.value.trim().toLowerCase() : "";
      var catFilter = filterCategory ? filterCategory.value : "";
      var statusFilter = filterStatus ? filterStatus.value : "";
      var cards = Array.from(document.querySelectorAll(".report-card"));

      cards.forEach(function (card) {
        var title = (card.querySelector("h3") || {}).textContent || "";
        var desc = (card.querySelector(".report-desc") || {}).textContent || "";
        var text = (title + " " + desc).toLowerCase();

        var searchMatch = !query || text.indexOf(query) !== -1;

        var categoryTag = card.querySelector(".report-tags .status-reported");
        var categoryText = categoryTag ? categoryTag.textContent.toLowerCase() : "";
        var catMatch = !catFilter ||
          (catFilter === "jalan" && categoryText.indexOf("jalan") !== -1) ||
          (catFilter === "drainase" && categoryText.indexOf("drainase") !== -1) ||
          (catFilter === "fasilitas" && categoryText.indexOf("fasilitas") !== -1);

        var statusTag = card.querySelector(".report-tags .badge-dot");
        var statusText = statusTag ? statusTag.textContent.toLowerCase().trim() : "";
        var statusMatch = !statusFilter ||
          (statusFilter === "baru" && statusText === "baru") ||
          (statusFilter === "diproses" && statusText === "diproses") ||
          (statusFilter === "selesai" && statusText === "selesai");

        card.style.display = (searchMatch && catMatch && statusMatch) ? "" : "none";
      });

      if (filterSort && filterSort.value === "prioritas") {
        var list = document.getElementById("reportList");
        if (list) {
          var sorted = cards.slice().sort(function (a, b) {
            var aUrgency = a.querySelector(".urgency-critical") ? 3 :
                           a.querySelector(".urgency-medium") ? 2 : 1;
            var bUrgency = b.querySelector(".urgency-critical") ? 3 :
                           b.querySelector(".urgency-medium") ? 2 : 1;
            return bUrgency - aUrgency;
          });
          sorted.forEach(function (card) { list.appendChild(card); });
        }
      }
    }

    document.querySelectorAll(".report-card").forEach(function (card) {
      card.addEventListener("click", function () {
        window.location.href = "detail-laporan.html";
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initDaftarLaporan);
  } else {
    initDaftarLaporan();
  }
})();
