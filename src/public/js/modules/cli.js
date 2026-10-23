/**
 * cli.js
 * Módulo de la consola Vork CLI y gestión de pestañas de terminal.
 */

(function (window, document) {
  "use strict";

  function switchInstallTab(type) {
    const btnPs = document.getElementById("tab-ps-btn");
    const btnCmd = document.getElementById("tab-cmd-btn");
    const panelPs = document.getElementById("panel-ps");
    const panelCmd = document.getElementById("panel-cmd");

    if (!panelPs || !panelCmd) return;

    if (type === "ps") {
      if (btnPs) {
        btnPs.classList.add("active");
        btnPs.setAttribute("aria-selected", "true");
      }
      if (btnCmd) {
        btnCmd.classList.remove("active");
        btnCmd.setAttribute("aria-selected", "false");
      }
      panelPs.classList.add("active");
      panelCmd.classList.remove("active");
      panelPs.style.display = "block";
      panelCmd.style.display = "none";
    } else {
      if (btnCmd) {
        btnCmd.classList.add("active");
        btnCmd.setAttribute("aria-selected", "true");
      }
      if (btnPs) {
        btnPs.classList.remove("active");
        btnPs.setAttribute("aria-selected", "false");
      }
      panelCmd.classList.add("active");
      panelPs.classList.remove("active");
      panelCmd.style.display = "block";
      panelPs.style.display = "none";
    }
  }

  // Exponer globalmente en window de inmediato
  window.switchInstallTab = switchInstallTab;

  function initInstallTabs() {
    const btnPs = document.getElementById("tab-ps-btn");
    const btnCmd = document.getElementById("tab-cmd-btn");

    if (btnPs && !btnPs._tabBound) {
      btnPs._tabBound = true;
      btnPs.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        switchInstallTab("ps");
      });
    }

    if (btnCmd && !btnCmd._tabBound) {
      btnCmd._tabBound = true;
      btnCmd.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        switchInstallTab("cmd");
      });
    }

    // Inicializar traductor Vork si existe
    if (window.Vork && !window.translator) {
      window.translator = new window.Vork({
        endpoint: "/api/translate",
        useCookies: true
      });
    }
  }

  // Ejecución inmediata (para cuando el DOM ya existe al cargar o en navegación SPA)
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initInstallTabs);
  } else {
    initInstallTabs();
  }

  // También escuchar por si SPA Router inserta el contenido dinámicamente
  window.addEventListener("load", initInstallTabs);
  window.initCliModule = initInstallTabs;

})(window, document);
