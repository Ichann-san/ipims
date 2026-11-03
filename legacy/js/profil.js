(function () {
  "use strict";
  function initProfil() {
    var editBtn = document.querySelector('.profile-actions .btn-dark');
    if (editBtn) {
      editBtn.addEventListener("click", function () {
        var infoValues = document.querySelectorAll(".info-value");
        var isEditing = editBtn.textContent.indexOf("Simpan") !== -1;

        if (isEditing) {
          infoValues.forEach(function (el) {
            el.contentEditable = "false";
            el.style.outline = "";
            el.style.background = "";
            el.style.padding = "";
            el.style.borderRadius = "";
          });
          editBtn.textContent = "✎ Edit Profil";
          window.ipimsShared && window.ipimsShared.showToast("Profil berhasil diperbarui");
        } else {
          infoValues.forEach(function (el) {
            el.contentEditable = "true";
            el.style.outline = "1px solid var(--color-accent)";
            el.style.background = "#fff";
            el.style.padding = "4px 8px";
            el.style.borderRadius = "4px";
          });
          editBtn.textContent = "✓ Simpan Profil";
          window.ipimsShared && window.ipimsShared.showToast("Mode edit aktif — klik pada field untuk mengubah");
        }
      });
    }

    var shareBtn = document.querySelector('.profile-actions .btn-outline');
    if (shareBtn) {
      shareBtn.addEventListener("click", function () {
        var shareData = {
          title: "Kontak IPIMS — Budi Setiawan, M.T.",
          text: "Kepala Dinas Pekerjaan Umum\nbudi.setiawan@ipims.go.id\n+62 812-3456-7890",
          url: window.location.href
        };
        if (navigator.share) {
          navigator.share(shareData).catch(function () { /* cancelled */ });
        } else if (navigator.clipboard) {
          navigator.clipboard.writeText(shareData.text);
          shareBtn.textContent = "✓ Kontak disalin!";
          window.ipimsShared && window.ipimsShared.showToast("Informasi kontak disalin ke clipboard");
          setTimeout(function () { shareBtn.textContent = "↗ Bagikan Kontak"; }, 1500);
        }
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initProfil);
  } else {
    initProfil();
  }
})();
