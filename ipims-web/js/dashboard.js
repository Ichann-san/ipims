(function () {
  "use strict";
  function initDashboard() {
    var WEIGHTS = {
      nasional: [
        { label: "Traffic Volume", value: 40 },
        { label: "Pavement Severity", value: 25 },
        { label: "Impact Score", value: 20 },
        { label: "Population", value: 15 }
      ],
      lingkungan: [
        { label: "Facility Importance", value: 40 },
        { label: "Safety", value: 30 },
        { label: "Severity", value: 20 },
        { label: "Traffic", value: 10 }
      ]
    };

    function renderWeights(mode) {
      var rows = document.querySelectorAll(".weight-row");
      var data = WEIGHTS[mode];
      rows.forEach(function (row, i) {
        if (!data[i]) return;
        row.querySelector(".weight-label span:first-child").textContent = data[i].label;
        row.querySelector(".weight-label span:last-child").textContent = data[i].value + "%";
        row.querySelector(".weight-bar span").style.width = data[i].value + "%";
      });
    }

    document.querySelectorAll(".road-toggle-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        document.querySelectorAll(".road-toggle-btn").forEach(function (b) { b.classList.remove("active"); });
        btn.classList.add("active");
        renderWeights(btn.dataset.weight);
      });
    });

    var queueSearch = document.querySelector(".queue-search");
    if (queueSearch) {
      queueSearch.addEventListener("input", function () {
        var query = queueSearch.value.trim().toLowerCase();
        document.querySelectorAll(".queue-table tbody tr").forEach(function (row) {
          var text = row.textContent.toLowerCase();
          row.style.display = (!query || text.indexOf(query) !== -1) ? "" : "none";
        });
      });
    }

    document.querySelectorAll(".pagination button").forEach(function (btn) {
      btn.addEventListener("click", function () {
        document.querySelectorAll(".pagination button").forEach(function (b) { b.classList.remove("active"); });
        btn.classList.add("active");
        window.ipimsShared && window.ipimsShared.showToast("Halaman " + btn.textContent.trim());
      });
    });

    document.querySelectorAll(".queue-table .btn-dark").forEach(function (btn) {
      if (btn.disabled) return;
      btn.addEventListener("click", function () {
        btn.textContent = "Assigned ✓";
        btn.disabled = true;
        btn.classList.remove("btn-dark");
        btn.classList.add("btn-outline");
        window.ipimsShared && window.ipimsShared.showToast("Tim perbaikan telah ditugaskan");
      });
    });

    document.querySelectorAll(".icon-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        window.location.href = "detail-laporan.html";
      });
    });

    var filterBtn = document.querySelector('.topbar-actions .btn-outline');
    if (filterBtn && filterBtn.textContent.indexOf("Filter") !== -1) {
      filterBtn.addEventListener("click", function () {
        window.ipimsShared && window.ipimsShared.showToast("Filter sedang dalam pengembangan");
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initDashboard);
  } else {
    initDashboard();
  }
})();
