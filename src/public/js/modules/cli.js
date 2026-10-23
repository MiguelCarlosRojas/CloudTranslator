/**
 * cli.js
 * Módulo de la consola Vork CLI y gestión de pestañas de terminal.
 */

(function (window, document) {
  "use strict";

  function detectUserOS() {
    try {
      const ua = (window.navigator && window.navigator.userAgent) || "";
      const plat = (window.navigator && window.navigator.platform) || "";
      if (/Mac|iPhone|iPad|iPod/i.test(plat) || /Macintosh/i.test(ua)) return "sh";
      if (/Linux/i.test(plat) || /Linux/i.test(ua)) return "sh";
    } catch (e) {}
    return "ps";
  }

  function switchInstallTab(type) {
    const btnPs = document.getElementById("tab-ps-btn");
    const btnSh = document.getElementById("tab-sh-btn");
    const btnCmd = document.getElementById("tab-cmd-btn");
    const panelPs = document.getElementById("panel-ps");
    const panelSh = document.getElementById("panel-sh");
    const panelCmd = document.getElementById("panel-cmd");

    const tabs = [
      { id: "ps", btn: btnPs, panel: panelPs },
      { id: "sh", btn: btnSh, panel: panelSh },
      { id: "cmd", btn: btnCmd, panel: panelCmd }
    ];

    tabs.forEach(t => {
      if (t.btn && t.panel) {
        if (t.id === type) {
          t.btn.classList.add("active");
          t.btn.setAttribute("aria-selected", "true");
          t.panel.classList.add("active");
          t.panel.style.display = "block";
        } else {
          t.btn.classList.remove("active");
          t.btn.setAttribute("aria-selected", "false");
          t.panel.classList.remove("active");
          t.panel.style.display = "none";
        }
      }
    });
  }

  // Exponer globalmente en window de inmediato
  window.switchInstallTab = switchInstallTab;
  window.detectUserOS = detectUserOS;

  function initInstallTabs() {
    const btnPs = document.getElementById("tab-ps-btn");
    const btnSh = document.getElementById("tab-sh-btn");
    const btnCmd = document.getElementById("tab-cmd-btn");

    if (btnPs && !btnPs._tabBound) {
      btnPs._tabBound = true;
      btnPs.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        switchInstallTab("ps");
      });
    }

    if (btnSh && !btnSh._tabBound) {
      btnSh._tabBound = true;
      btnSh.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        switchInstallTab("sh");
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

    // Auto-detectar sistema operativo y activar la pestaña adecuada
    const detected = detectUserOS();
    switchInstallTab(detected);

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
