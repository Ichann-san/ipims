(function () {
  "use strict";

  function escapeHtml(str) {
    var div = document.createElement("div");
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  function initDetailLaporan() {
    var form = document.getElementById("commentForm");
    if (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var input = form.querySelector("input");
        var text = input.value.trim();
        if (!text) return;

        var commentList = document.querySelector(".comment-list");
        if (commentList) {
          var li = document.createElement("li");
          li.className = "comment-item";
          li.innerHTML =
            '<div class="comment-avatar">AN</div>' +
            '<div>' +
              '<p class="comment-meta"><strong>Anda</strong> <span class="text-muted">Baru saja</span></p>' +
              '<p>' + escapeHtml(text) + '</p>' +
            '</div>';
          commentList.appendChild(li);
        }

        input.value = "";
        window.ipimsShared && window.ipimsShared.showToast("Komentar berhasil dikirim");
      });
    }

    var shareBtn = document.getElementById("shareBtn");
    if (shareBtn) {
      shareBtn.addEventListener("click", function () {
        var shareData = {
          title: "IPIMS — Laporan #IP-99210",
          text: "Retakan Struktur Pilar P-04",
          url: window.location.href
        };
        if (navigator.share) {
          navigator.share(shareData).catch(function () { /* cancelled */ });
        } else if (navigator.clipboard) {
          navigator.clipboard.writeText(window.location.href);
          shareBtn.textContent = "✓ Tautan disalin!";
          window.ipimsShared && window.ipimsShared.showToast("Link berhasil disalin ke clipboard");
          setTimeout(function () { shareBtn.textContent = "↗ Bagikan Laporan"; }, 1500);
        }
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initDetailLaporan);
  } else {
    initDetailLaporan();
  }
})();
