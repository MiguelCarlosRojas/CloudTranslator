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
      const response = await fetch(url, { signal: abortController.signal });
      if (!response.ok) {
        window.location.href = url;
        return;
      }

      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");

      // Actualizar título de la página
      document.title = doc.title;

      // Actualizar favicon si está definido en el nuevo documento
      const currentFavicon = document.querySelector("link[rel*='icon']");
      const newFavicon = doc.querySelector("link[rel*='icon']");
      if (currentFavicon && newFavicon) {
        currentFavicon.href = newFavicon.href;
      }

      // Pre-traducción en memoria antes de pintar en pantalla:
      // Elimina completamente el parpadeo de texto original en navegación SPA
      try {
        const savedLang = window.translator ? window.translator.getSavedLanguage() : null;
        if (window.translator && savedLang && savedLang !== "original" && savedLang !== "es") {
          window.translator.preTranslateDomTree(doc.body, savedLang);
        }
      } catch (transErr) {
        console.warn("[SPA Router] Advertencia en pre-traducción:", transErr);
      }

      // Reemplazar contenido de la página ya con el idioma correspondiente
      document.body.innerHTML = doc.body.innerHTML;
      document.body.classList.remove("spa-transitioning");

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
      if (targetElement) {
        e.preventDefault();
        targetElement.scrollIntoView({ behavior: "smooth" });
        window.history.pushState(null, "", href);
      }
      return;
    }

    // Resolver URL destino
    const targetUrl = new URL(anchor.href, window.location.href);

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

  // Exponer API opcional
  window.SPARouter = {
    navigate: navigate
  };
})();
