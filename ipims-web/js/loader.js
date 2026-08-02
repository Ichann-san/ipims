/* =========================================================
   IPIMS — Loader Engine (Shared JS)
   All page logic in one file, cached by browser.
   ========================================================= */

(function () {
  "use strict";

  /* ---------------------------------------------------------
     Utility: Toast notification
     --------------------------------------------------------- */
  function showToast(message, duration) {
    duration = duration || 2000;
    var existing = document.querySelector(".toast");
    if (existing) existing.remove();

    var toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;
    document.body.appendChild(toast);

    requestAnimationFrame(function () {
      toast.classList.add("show");
    });

    setTimeout(function () {
      toast.classList.remove("show");
      setTimeout(function () { toast.remove(); }, 300);
    }, duration);
  }

  /* ---------------------------------------------------------
     Nav: toggle (mobile) + highlight active link
     --------------------------------------------------------- */
  function initNav() {
    var toggle = document.getElementById("navToggle");
    var nav = document.getElementById("mainNav");
    if (!toggle || !nav) return;

    toggle.addEventListener("click", function () {
      var isOpen = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(isOpen));
    });

    // Highlight active nav link
    var current = document.body.getAttribute("data-page");
    if (!current) return;
    var link = document.querySelector('[data-nav="' + current + '"]');
    if (link) link.classList.add("active");
  }

  /* ---------------------------------------------------------
     Admin Sidebar: hamburger toggle (mobile)
     --------------------------------------------------------- */
  function initAdminSidebar() {
    var hamburger = document.getElementById("adminHamburger");
    var sidebar = document.getElementById("adminSidebar");
    var overlay = document.getElementById("adminOverlay");
    if (!hamburger || !sidebar || !overlay) return;

    function openSidebar() {
      sidebar.classList.add("open");
      overlay.classList.add("open");
      hamburger.innerHTML = "✕";
    }

    function closeSidebar() {
      sidebar.classList.remove("open");
      overlay.classList.remove("open");
      hamburger.innerHTML = "☰";
    }

    hamburger.addEventListener("click", function () {
      if (sidebar.classList.contains("open")) {
        closeSidebar();
      } else {
        openSidebar();
      }
    });

    overlay.addEventListener("click", closeSidebar);
  }

  // Auto-init shared stuff
  function initAll() {
    initNav();
    initAdminSidebar();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAll);
  } else {
    initAll();
  }

  // Export shared utilities
  window.ipimsShared = {
    showToast: showToast
  };

})();
