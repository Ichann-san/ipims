(function () {
  "use strict";
  function initBeranda() {
    document.querySelectorAll(".recent-card").forEach(function (card) {
      card.style.cursor = "pointer";
      card.addEventListener("click", function () {
        window.location.href = "detail-laporan.html";
      });
    });

    var downloadBtn = document.querySelector('.transparency-actions .btn-primary');
    if (downloadBtn && downloadBtn.textContent.trim().indexOf("Download") !== -1) {
      downloadBtn.addEventListener("click", function (e) {
        e.preventDefault();
        downloadBtn.textContent = "⏳ Menyiapkan file...";
        setTimeout(function () {
          downloadBtn.textContent = "✓ File siap diunduh";
          window.ipimsShared && window.ipimsShared.showToast("Laporan Tahunan IPIMS 2024 berhasil diunduh");
          setTimeout(function () {
            downloadBtn.textContent = "Download Laporan Tahunan";
          }, 2000);
        }, 1500);
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initBeranda);
  } else {
    initBeranda();
  }
})();
