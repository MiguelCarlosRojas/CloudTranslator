/**
 * CloudTranslator SPA Router v1.0.0
 * 
 * Navegación fluida y sin recargas de página completas:
 * - Intercepta clics en enlaces internos de la misma procedencia.
 * - Muestra una barra de progreso sutil y elegante en la parte superior.
 * - Carga el contenido dinámicamente preservando la sesión y estado.
 * - Ejecuta scripts de página limpiamente sin duplicación de listeners.
 * - Maneja historial (pushState/popstate) y desplazamiento suave a anclas.
 */

(function () {
  "use strict";

  // Crear barra de progreso superior si no existe
  let progressBar = document.getElementById("spa-progress-bar");
  if (!progressBar) {
    progressBar = document.createElement("div");
    progressBar.id = "spa-progress-bar";
    document.documentElement.appendChild(progressBar);
  }

  let progressTimer = null;
  function startProgress() {
    if (progressTimer) clearInterval(progressTimer);
    progressBar.style.opacity = "1";
    progressBar.style.width = "20%";
    let width = 20;
    progressTimer = setInterval(() => {
      if (width < 85) {
        width += (85 - width) * 0.2;
        progressBar.style.width = width + "%";
      }
    }, 100);
  }

  function finishProgress() {
    if (progressTimer) clearInterval(progressTimer);
    progressBar.style.width = "100%";
    setTimeout(() => {
      progressBar.style.opacity = "0";
      setTimeout(() => {
        progressBar.style.width = "0%";
      }, 250);
    }, 150);
  }

  window.startSpaProgress = startProgress;
  window.finishSpaProgress = finishProgress;

  let isNavigatingSpa = false;
  let abortController = null;

  // Interceptar addEventListener para invocar inmediatamente callbacks de DOMContentLoaded
  // durante la navegación SPA sin dejar residuos de listeners anteriores.
  const nativeAddEventListener = document.addEventListener.bind(document);
  document.addEventListener = function (type, listener, options) {
    if (type === "DOMContentLoaded" && isNavigatingSpa) {
      try {
        listener(new Event("DOMContentLoaded"));
      } catch (err) {
        console.warn("[SPA Router] Error en callback DOMContentLoaded:", err);
      }
      return;
    }
    return nativeAddEventListener(type, listener, options);
  };

  async function navigate(url, push = true) {
    if (abortController) {
      abortController.abort();
    }
    abortController = new AbortController();

    startProgress();
    document.body.classList.add("spa-transitioning");

    try {
      const response = await fetch(url, {
        signal: abortController.signal,
        headers: { "Accept": "text/html, */*" }
      });
      if (!response.ok) {
        window.location.href = url;
        return;
      }

      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");

      // Actualizar título de la página y pre-traducción fluida en memoria
      const rawTitle = doc.title;
      try {
        const savedLang = window.translator ? window.translator.getSavedLanguage() : null;
        if (window.translator) {
          window.translator.setOriginalTitle(rawTitle);
          if (savedLang && savedLang !== "original" && savedLang !== "es") {
            window.translator.preTranslateDocument(doc, savedLang);
          }
        }
      } catch (transErr) {
        console.warn("[SPA Router] Advertencia en pre-traducción:", transErr);
      }

      document.title = doc.title;

      // Actualizar favicon si está definido en el nuevo documento
      const currentFavicon = document.querySelector("link[rel*='icon']");
      const newFavicon = doc.querySelector("link[rel*='icon']");
      if (currentFavicon && newFavicon) {
        currentFavicon.href = newFavicon.href;
      }

      // Reemplazar contenido de la página ya con el idioma correspondiente
      document.body.innerHTML = doc.body.innerHTML;
      document.body.classList.remove("spa-transitioning");

      // Renderizar componentes modulares (Encabezado / Pie de Página) en la nueva página
      if (window.CloudComponents && typeof window.CloudComponents.init === "function") {
        try {
          window.CloudComponents.init();
        } catch (compErr) {
          console.warn("[SPA Router] Error al inicializar componentes:", compErr);
        }
      }

      // Actualizar historial del navegador
      if (push) {
        window.history.pushState({ spa: true, url: url }, doc.title, url);
      }

      // Re-ejecutar scripts inline de la nueva página con bandera isNavigatingSpa activa
      isNavigatingSpa = true;
      try {
        const scripts = Array.from(document.body.querySelectorAll("script")).filter(s => !s.src);
        scripts.forEach(script => {
          try {
            const runFn = new Function(script.textContent);
            runFn();
          } catch (scriptErr) {
            console.warn("[SPA Router] Error al ejecutar script de página:", scriptErr);
          }
        });
      } finally {
        isNavigatingSpa = false;
      }

      // Asegurar que si hay un idioma activo en cookie, la nueva página complete su traducción y título
      try {
        const activeLang = window.translator ? window.translator.getSavedLanguage() : null;
        if (window.translator && activeLang && activeLang !== "original" && activeLang !== "es") {
          window.translator.translatePage(activeLang);
        }
      } catch (postTransErr) {}

      // Manejar scroll a ancla o al inicio
      const parsedUrl = new URL(url, window.location.href);
      if (parsedUrl.hash) {
        const targetElement = document.querySelector(parsedUrl.hash);
        if (targetElement) {
          setTimeout(() => {
            targetElement.scrollIntoView({ behavior: "smooth" });
          }, 60);
        } else {
          window.scrollTo(0, 0);
        }
      } else {
        window.scrollTo(0, 0);
      }

      // Actualizar meta description y etiquetas OpenGraph
      const currentMetaDesc = document.querySelector('meta[name="description"]');
      const newMetaDesc = doc.querySelector('meta[name="description"]');
      if (currentMetaDesc && newMetaDesc) {
        currentMetaDesc.setAttribute("content", newMetaDesc.getAttribute("content") || "");
      }
      const currentOgDesc = document.querySelector('meta[property="og:description"]');
      const newOgDesc = doc.querySelector('meta[property="og:description"]');
      if (currentOgDesc && newOgDesc) {
        currentOgDesc.setAttribute("content", newOgDesc.getAttribute("content") || "");
      }

      // Actualizar clase active en todos los enlaces de navegación (cabecera, menú lateral y pie de página)
      updateActiveLinks(parsedUrl.pathname);

      // Cerrar drawer lateral si estaba abierto y desbloquear desplazamiento
      const activeDrawer = document.getElementById("mobile-drawer");
      const activeBackdrop = document.getElementById("drawer-backdrop");
      const activeToggle = document.getElementById("menu-toggle-btn");
      if (activeDrawer) activeDrawer.classList.remove("open");
      if (activeBackdrop) activeBackdrop.classList.remove("open");
      if (activeToggle) activeToggle.classList.remove("active");
      document.body.classList.remove("drawer-open");

      // Cerrar modal QR si estaba abierto al cambiar de ruta
      if (window.closeQrModal) {
        window.closeQrModal();
      }

      if (window.CloudComponents) {
        if (window.CloudComponents.decorateSelects) window.CloudComponents.decorateSelects();
        if (window.CloudComponents.initQrModalEvents) window.CloudComponents.initQrModalEvents();
      }

      finishProgress();
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error("[SPA Router] Fallback a navegación tradicional:", err);
        window.location.href = url;
      }
    }
  }

  // Intercepción global de clics en enlaces
  document.addEventListener("click", (e) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.defaultPrevented) {
      return;
    }

    const anchor = e.target.closest("a");
    if (!anchor) return;

    const href = anchor.getAttribute("href");
    if (!href || href.startsWith("javascript:") || href.startsWith("mailto:") || href.startsWith("tel:")) {
      return;
    }

    if (anchor.target && anchor.target !== "_self") {
      return;
    }

    if (anchor.hasAttribute("download")) {
      return;
    }

    // Desplazamiento suave para anclas en la misma página
    if (href.startsWith("#")) {
      const targetElement = document.querySelector(href);
      const docsMain = document.querySelector(".docs-main-content");
      if (docsMain && targetElement && docsMain.contains(targetElement)) {
        e.preventDefault();
        const mainRect = docsMain.getBoundingClientRect();
        const targetRect = targetElement.getBoundingClientRect();
        const offset = targetRect.top - mainRect.top + docsMain.scrollTop - 24;
        docsMain.scrollTo({ top: Math.max(0, offset), behavior: "smooth" });
        window.history.pushState(null, "", href);
        return;
      }
      if (targetElement) {
        e.preventDefault();
        targetElement.scrollIntoView({ behavior: "smooth" });
        window.history.pushState(null, "", href);
      }
      return;
    }

    // Resolver URL destino
    const targetUrl = new URL(anchor.href, window.location.href);

    // Nunca interceptar endpoints de la API REST o descargas multimedia
    if (targetUrl.pathname.startsWith("/api/") || targetUrl.pathname === "/api") {
      return;
    }

    // Verificar mismo origen (evitar interceptar links externos)
    if (targetUrl.origin !== window.location.origin) {
      return;
    }

    // Si es la misma página exacta
    if (targetUrl.pathname === window.location.pathname && targetUrl.search === window.location.search) {
      if (targetUrl.hash) {
        const targetElement = document.querySelector(targetUrl.hash);
        if (targetElement) {
          e.preventDefault();
          targetElement.scrollIntoView({ behavior: "smooth" });
          window.history.pushState(null, "", targetUrl.hash);
          return;
        }
      } else {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
    }

    // Navegar fluidamente sin recargar la página
    e.preventDefault();
    navigate(targetUrl.href, true);
  });

  // Manejar navegación con botones Atrás y Adelante
  window.addEventListener("popstate", () => {
    navigate(window.location.href, false);
  });

  // Actualizar estado 'active' en cabecera, menú lateral y pie de página
  function updateActiveLinks(pathname) {
    try {
      const currentPath = pathname || window.location.pathname;
      const allLinks = document.querySelectorAll(".main-menu a, .drawer-menu a, .footer-col a, .footer-links a");
      allLinks.forEach(link => {
        const linkHref = link.getAttribute("href");
        if (!linkHref || linkHref.startsWith("#") || linkHref.startsWith("http://") || linkHref.startsWith("https://")) return;
        try {
          const linkPath = new URL(linkHref, window.location.href).pathname;
          const isMatch = (linkPath === currentPath) || 
                          ((currentPath === "/" || currentPath === "/index.html") && (linkPath === "/" || linkPath === "/index.html"));
          if (isMatch) {
            link.classList.add("active");
          } else {
            link.classList.remove("active");
          }
        } catch (e) {}
      });
    } catch (e) {}
  }

  // Inicializar estado activo al cargar el documento
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => updateActiveLinks(window.location.pathname), { once: true });
  } else {
    updateActiveLinks(window.location.pathname);
  }

  // Exponer API opcional
  window.SPARouter = {
    navigate: navigate,
    updateActiveLinks: updateActiveLinks
  };
})();
