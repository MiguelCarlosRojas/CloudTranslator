/**
 * CloudComponents - Sistema Modular de Componentes Reutilizables
 * Centraliza la estructura de Encabezado (Navbar), Pie de Página (Footer),
 * Selectores de Voz/Idioma y Controles de Interfaz para todo CloudTranslator.
 */

(function (window, document) {
  "use strict";

  const CloudComponents = {
    version: "2.5.0",

    /**
     * Plantilla HTML del Encabezado y Barra Lateral Móvil
     */
    getHeaderHTML(activeNav = "home") {
      return `
<div class="header-inner-full">
  <div class="brand-group">
    <a href="/" class="brand-link" title="CloudTranslator - Inicio">
      <img src="/img/logo.png" alt="CloudTranslator Logo" class="brand-img" width="38" height="38">
      <span class="brand-title">CloudTranslator</span>
    </a>
    <span class="badge badge-brand">v2.5.0</span>
  </div>

  <nav class="nav-links-full" aria-label="Navegación Principal">
    <a href="/" class="${activeNav === "home" ? "active" : ""}">Inicio</a>
    <a href="/docs" class="${activeNav === "docs" ? "active" : ""}">Documentación</a>
    <a href="/support" class="${activeNav === "support" ? "active" : ""}">Soporte</a>
    <a href="/status" class="${activeNav === "status" ? "active" : ""}">Estado</a>
  </nav>

  <div class="translation-controls-full">
    <button id="btn-english" class="btn btn-english" title="Traducir instantáneamente al inglés">
      <svg class="icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20M12 2a14.5 14.5 0 0 1 0 20M2 12h20"/></svg>
      English
    </button>

    <div class="lang-selector-group">
      <div class="select-wrapper">
        <select id="select-lang" aria-label="Seleccionar idioma de traducción" title="Seleccionar idioma">
          <option value="es">Español (es)</option>
          <option value="en">English (en)</option>
          <option value="fr">Français (fr)</option>
          <option value="de">Deutsch (de)</option>
          <option value="it">Italiano (it)</option>
          <option value="pt">Portugués (pt)</option>
          <option value="ja">日本語 (ja)</option>
          <option value="zh-CN">中文 (zh-CN)</option>
          <option value="ru">Русский (ru)</option>
        </select>
      </div>
      <div class="custom-lang-group">
        <input type="text" id="input-custom-lang" placeholder="ISO" maxlength="5" title="Código ISO personalizado">
        <button id="btn-translate-custom" class="btn btn-primary" title="Traducir a código ISO">GO</button>
      </div>
    </div>

    <button id="btn-restore" class="btn btn-outline" title="Restaurar idioma original">
      <svg class="icon" viewBox="0 0 24 24"><path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5"/></svg>
      Original
    </button>

    <div id="status-pill" class="status-pill" title="Estado del microservicio">
      <span class="spinner"></span>
      <span id="status-text">LISTO</span>
    </div>
  </div>

  <button id="menu-toggle-btn" class="menu-toggle-btn" aria-label="Abrir Menú de Navegación Lateral">
    <span class="hamburger-line"></span>
    <span class="hamburger-line"></span>
    <span class="hamburger-line"></span>
  </button>
</div>

<div id="drawer-backdrop"></div>

<aside id="mobile-drawer" class="mobile-drawer no-translate" data-no-translate>
  <div class="drawer-header">
    <a href="/" class="drawer-brand">
      <img src="/img/logo.png" alt="CloudTranslator Logo" class="brand-img" width="34" height="34">
      <span>CloudTranslator</span>
    </a>
    <button id="drawer-close-btn" class="drawer-close-btn" aria-label="Cerrar Menú Lateral"><svg class="icon" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
  </div>

  <div class="drawer-body">
    <div class="drawer-section">
      <span class="drawer-title">NAVEGACIÓN DEL PORTAL</span>
      <ul class="drawer-menu">
        <li><a href="/" class="${activeNav === "home" ? "active" : ""}"><svg class="icon" viewBox="0 0 24 24"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg> Inicio</a></li>
        <li><a href="/docs" class="${activeNav === "docs" ? "active" : ""}"><svg class="icon" viewBox="0 0 24 24"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg> Documentación</a></li>
        <li><a href="/support" class="${activeNav === "support" ? "active" : ""}"><svg class="icon" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> Soporte</a></li>
        <li><a href="/status" class="${activeNav === "status" ? "active" : ""}"><svg class="icon" viewBox="0 0 24 24"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg> Estado Servidor</a></li>
      </ul>
    </div>

    <div class="drawer-section">
      <span class="drawer-title">LOS 3 PILARES</span>
      <ul class="drawer-menu">
        <li><a href="/translator" class="${activeNav === "translator" ? "active" : ""}"><svg class="icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg> Traductor en la Nube</a></li>
        <li><a href="/tts" class="${activeNav === "tts" ? "active" : ""}"><svg class="icon" viewBox="0 0 24 24"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg> Texto a Voz (TTS)</a></li>
        <li><a href="/voice-clone" class="${activeNav === "voice-clone" ? "active" : ""}"><svg class="icon" viewBox="0 0 24 24"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg> Clonación de Voz (IA)</a></li>
        <li><a href="/donate" class="${activeNav === "donate" ? "active" : ""}"><svg class="icon" viewBox="0 0 24 24"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg> Donaciones</a></li>
      </ul>
    </div>

    <div class="drawer-section">
      <span class="drawer-title">CENTRO DE TRADUCCIÓN</span>
      <div class="drawer-toolbar">
        <button class="btn btn-english w-full" onclick="window.translator && window.translator.translateToEnglish()">
          <svg class="icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20M12 2a14.5 14.5 0 0 1 0 20M2 12h20"/></svg> Traducir a English
        </button>
        <div class="drawer-select-group">
          <select class="drawer-select" onchange="if(window.translator){ if(this.value==='es') window.translator.restoreOriginal(); else window.translator.translatePage(this.value); }">
            <option value="es">Español (es) - Original</option>
            <option value="en">English (en)</option>
            <option value="fr">Français (fr)</option>
            <option value="de">Deutsch (de)</option>
            <option value="it">Italiano (it)</option>
            <option value="pt">Portugués (pt)</option>
            <option value="ja">日本語 (ja)</option>
            <option value="zh-CN">中文 (zh-CN)</option>
            <option value="ru">Русский (ru)</option>
          </select>
        </div>
        <button class="btn btn-outline w-full" onclick="window.translator && window.translator.restoreOriginal()">
          <svg class="icon" viewBox="0 0 24 24"><path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5"/></svg> Restaurar Original
        </button>
      </div>
    </div>
  </div>
</aside>
`;
    },

    /**
     * Plantilla HTML del Pie de Página Horizontal
     */
    getFooterHTML(activePage = "") {
      return `
<div class="footer-inner-full">
  <div class="footer-col footer-col-brand">
    <h4>
      <img src="/img/logo.png" alt="CloudTranslator Logo" class="brand-img" width="30" height="30">
      CloudTranslator
    </h4>
    <p>Ecosistema cloud de procesamiento lingüístico y síntesis vocal de alto rendimiento: traducción neuronal distribuida, Texto a Voz (TTS) y Clonación de Voz por Inteligencia Artificial.</p>
    <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 8px;">
      Microservicio libre en Render • <span class="badge badge-online">ONLINE</span>
    </p>
  </div>

  <div class="footer-col">
    <h4>Servicios</h4>
    <ul>
      <li><a href="/translator" class="${activePage === "translator" ? "active" : ""}">Traductor en la Nube</a></li>
      <li><a href="/tts" class="${activePage === "tts" ? "active" : ""}">Texto a Voz (TTS)</a></li>
      <li><a href="/voice-clone" class="${activePage === "voice-clone" ? "active" : ""}">Clonación de Voz IA</a></li>
    </ul>
  </div>

  <div class="footer-col">
    <h4>Recursos</h4>
    <ul>
      <li><a href="/api" class="${activePage === "api" ? "active" : ""}">Playground API REST</a></li>
      <li><a href="/learn" class="${activePage === "learn" ? "active" : ""}">Guías de Integración</a></li>
      <li><a href="/help" class="${activePage === "help" ? "active" : ""}">Centro de Ayuda</a></li>
    </ul>
  </div>

  <div class="footer-col">
    <h4>Información Legal</h4>
    <ul>
      <li><a href="/terms" class="${activePage === "terms" ? "active" : ""}">Términos del Servicio</a></li>
      <li><a href="/privacy" class="${activePage === "privacy" ? "active" : ""}">Política de Privacidad</a></li>
      <li><a href="/security" class="${activePage === "security" ? "active" : ""}">Seguridad y Cookies</a></li>
    </ul>
  </div>
</div>

<div class="footer-bottom-full">
  <span>© 2026 CloudTranslator. Todos los derechos reservados.</span>
  <span>Desarrollado por Miguel Angel Carlos Rojas</span>
</div>
`;
    },

    /**
     * Inicializa eventos del drawer móvil con delegación global e idempotencia
     */
    initDrawerEvents() {
      if (window._drawerEventsBound) return;
      window._drawerEventsBound = true;

      document.addEventListener("click", (e) => {
        const toggleBtn = e.target.closest("#menu-toggle-btn");
        const drawer = document.getElementById("mobile-drawer");
        const backdrop = document.getElementById("drawer-backdrop");

        if (toggleBtn) {
          e.preventDefault();
          e.stopPropagation();
          if (!drawer) return;
          const isOpen = drawer.classList.contains("open");
          if (isOpen) {
            drawer.classList.remove("open");
            toggleBtn.classList.remove("active");
            if (backdrop) backdrop.classList.remove("open");
            document.body.classList.remove("drawer-open");
          } else {
            drawer.classList.add("open");
            toggleBtn.classList.add("active");
            if (backdrop) backdrop.classList.add("open");
            document.body.classList.add("drawer-open");
          }
          return;
        }

        const closeBtn = e.target.closest("#drawer-close-btn");
        const backdropClick = e.target.closest("#drawer-backdrop");
        const drawerLink = e.target.closest("#mobile-drawer a");

        if (closeBtn || backdropClick || drawerLink) {
          if (drawer) drawer.classList.remove("open");
          const btn = document.getElementById("menu-toggle-btn");
          if (btn) btn.classList.remove("active");
          if (backdrop) backdrop.classList.remove("open");
          document.body.classList.remove("drawer-open");
        }
      });

      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
          const drawer = document.getElementById("mobile-drawer");
          const backdrop = document.getElementById("drawer-backdrop");
          const btn = document.getElementById("menu-toggle-btn");
          if (drawer && drawer.classList.contains("open")) {
            drawer.classList.remove("open");
            if (btn) btn.classList.remove("active");
            if (backdrop) backdrop.classList.remove("open");
            document.body.classList.remove("drawer-open");
          }
        }
      });
    },

    /**
     * Aplica automáticamente el diseño del componente select-wrapper y form-select-custom a los selects de consolas
     */
    decorateSelects() {
      document.querySelectorAll(".studio-panel select, .voice-selector").forEach(select => {
        if (!select.closest(".select-wrapper")) {
          const wrapper = document.createElement("div");
          wrapper.className = "select-wrapper";
          select.parentNode.insertBefore(wrapper, select);
          wrapper.appendChild(select);
        }
        if (!select.classList.contains("form-select-custom")) {
          select.classList.add("form-select-custom");
        }
      });
    },

    /**
     * Plantilla HTML del Modal QR Reutilizable
     */
    getQrModalHTML() {
      return `
<div id="qr-modal" class="qr-modal-backdrop" aria-hidden="true" role="dialog" aria-modal="true">
  <div class="qr-modal-dialog">
    <div class="qr-modal-header">
      <h3>
        <svg class="icon" viewBox="0 0 24 24" style="color: #d946ef;"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M7 7h.01M17 7h.01M7 17h.01M17 17h.01"/></svg>
        Código QR Yape - Escaneo Directo
      </h3>
      <button id="qr-modal-close" class="btn-modal-close" aria-label="Cerrar ventana emergente">
        <svg class="icon" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
    <div class="qr-modal-body">
      <img src="/img/yape-qr.png" alt="Código QR de Yape Ampliado" class="qr-modal-img">
      <p class="qr-modal-caption">
        Abre tu aplicación Yape en el teléfono celular, pulsa en el botón <strong>"Escanear QR"</strong> y enfoca este código directamente en tu pantalla.
      </p>
      <div style="background: rgba(168, 85, 247, 0.15); border: 1px solid rgba(168, 85, 247, 0.4); border-radius: var(--radius-sm); padding: 8px 16px; margin-top: 6px;">
        <span style="font-size: 0.85rem; color: #ffffff; font-weight: 700;">
          Beneficiario: Miguel Angel Carlos Rojas
        </span>
      </div>
    </div>
  </div>
</div>`;
    },

    openQrModal() {
      let modal = document.getElementById("qr-modal");
      if (!modal) {
        document.body.insertAdjacentHTML("beforeend", this.getQrModalHTML());
        modal = document.getElementById("qr-modal");
      }
      if (modal) {
        modal.classList.add("open");
        modal.style.display = "flex";
        document.body.style.overflow = "hidden";
      }
    },

    closeQrModal() {
      const modal = document.getElementById("qr-modal");
      if (modal) {
        modal.classList.remove("open");
        modal.style.display = "none";
        document.body.style.overflow = "";
      }
    },

    initQrModalEvents() {
      if (window._qrModalEventsBound) return;
      window._qrModalEventsBound = true;

      document.addEventListener("click", (e) => {
        const trigger = e.target.closest("#btn-open-qr-page-modal, [data-open-qr-modal], #qr-box-trigger, .qr-box-full");
        if (trigger) {
          e.preventDefault();
          CloudComponents.openQrModal();
          return;
        }

        const closeBtn = e.target.closest("#qr-modal-close, .btn-modal-close");
        const backdrop = e.target.classList.contains("qr-modal-backdrop") || (e.target.id === "qr-modal");
        if (closeBtn || backdrop) {
          e.preventDefault();
          CloudComponents.closeQrModal();
        }
      });

      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
          CloudComponents.closeQrModal();
        }
      });
    },

    /**
     * Auto-inyecta encabezado, pie de página y decora controles si existen
     */
    init() {
      const headerContainer = document.querySelector("[data-component='header']");
      if (headerContainer) {
        const activeNav = headerContainer.getAttribute("data-active") || "home";
        headerContainer.innerHTML = this.getHeaderHTML(activeNav);
        headerContainer.className = "header-full no-translate";
        headerContainer.setAttribute("data-no-translate", "");
      }

      const footerContainer = document.querySelector("[data-component='footer']");
      if (footerContainer) {
        const activePage = footerContainer.getAttribute("data-active") || "";
        footerContainer.innerHTML = this.getFooterHTML(activePage);
        footerContainer.className = "footer-full";
      }

      this.decorateSelects();
      this.initDrawerEvents();
      this.initQrModalEvents();
    }
  };

  // Exponer a nivel global
  window.CloudComponents = CloudComponents;

  // Auto-inicializar cuando el DOM esté listo
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      CloudComponents.decorateSelects();
      CloudComponents.initDrawerEvents();
      CloudComponents.initQrModalEvents();
    });
  } else {
    CloudComponents.decorateSelects();
    CloudComponents.initDrawerEvents();
    CloudComponents.initQrModalEvents();
  }
})(window, document);
