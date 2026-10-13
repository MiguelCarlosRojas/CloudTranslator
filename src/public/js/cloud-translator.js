/**
 * CloudTranslator Client SDK v1.4.0
 * 
 * Librería optimizada para traducción web en segundo plano:
 * - Persistencia del idioma elegido EXCLUSIVAMENTE mediante COOKIES (cloud_translator_lang).
 * - Cero uso de localStorage para máxima privacidad y cumplimiento estricto de cookies.
 * - Envía TODOS los textos en UNA SOLA consulta HTTP (/api/translate con texts: [...])
 *   evitando saturar la red con peticiones repetidas.
 * - Mantiene caché en memoria RAM durante la sesión para cambios instantáneos (0ms).
 */

(function (root, factory) {
  if (typeof define === "function" && define.amd) {
    define([], factory);
  } else if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.CloudTranslator = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  const COOKIE_NAME = "cloud_translator_lang";

  /**
   * Utilidades de Cookies (Estricto - 365 días, SameSite=Lax, Path=/)
   */
  function setCookie(name, value, days = 365) {
    try {
      const d = new Date();
      d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
      const expires = "expires=" + d.toUTCString();
      document.cookie = `${name}=${encodeURIComponent(value)};${expires};path=/;SameSite=Lax`;
    } catch (e) {
      console.warn("[CloudTranslator] Error al guardar cookie:", e);
    }
  }

  function getCookie(name) {
    try {
      const match = document.cookie.match(new RegExp("(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, "\\$1") + "=([^;]*)"));
      return match ? decodeURIComponent(match[1]) : null;
    } catch (e) {
      return null;
    }
  }

  function deleteCookie(name) {
    try {
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;SameSite=Lax`;
    } catch (e) {}
  }

  // Limpieza única de claves heredadas de localStorage para garantizar 100% solo cookies
  try {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith("cloud_translator_")) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
  } catch (e) {}

  class CloudTranslator {
    /**
     * @param {Object} options
     * @param {string} [options.endpoint] - URL del endpoint de traducción
     * @param {string} [options.rootSelector='body'] - Selector del contenedor a traducir
     * @param {string} [options.defaultLanguage='en'] - Idioma por defecto
     * @param {number} [options.batchSize=500] - Tamaño máximo de lote para 1 solo request
     * @param {boolean} [options.useCookies=true] - Guardar y recordar idioma en cookies
     * @param {Function} [options.onStart] - Callback al iniciar traducción
     * @param {Function} [options.onProgress] - Callback durante el progreso
     * @param {Function} [options.onComplete] - Callback al finalizar
     * @param {Function} [options.onError] - Callback en caso de error
     */
    constructor(options = {}) {
      this.endpoint = options.endpoint || "https://cloudtranslator.onrender.com/api/translate";
      this.rootSelector = options.rootSelector || "body";
      this.defaultLanguage = options.defaultLanguage || "en";
      this.batchSize = Math.max(50, options.batchSize || 500);
      this.useCookies = options.useCookies !== false;

      this.onStart = options.onStart || null;
      this.onProgress = options.onProgress || null;
      this.onComplete = options.onComplete || null;
      this.onError = options.onError || null;

      // Nodos y atributos originales en memoria
      this.nodeMap = new Map(); // Node -> originalText
      this.attrMap = new Map(); // Element -> [{ attr, originalText }]

      // Caché en memoria RAM únicamente durante la sesión activa (Cero localStorage)
      this.cache = {};

      this.currentLanguage = "original";
      this.isTranslating = false;

      this.ignoredTags = new Set([
        "SCRIPT", "STYLE", "NOSCRIPT", "CODE", "PRE",
        "SVG", "IFRAME", "TEXTAREA", "INPUT"
      ]);

      if (this.useCookies) {
        this._initCookieLanguage();
      }
    }

    /**
     * Revisa si existe la cookie cloud_translator_lang y traduce automáticamente al cargar
     */
    _initCookieLanguage() {
      const applyFromCookie = () => {
        const savedLang = this.getSavedLanguage();
        if (savedLang && savedLang !== "original" && savedLang !== "es") {
          this.translatePage(savedLang);
        } else {
          document.documentElement.classList.remove("ct-pending");
          this._updateStatusUI("ORIGINAL");
        }
      };

      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", applyFromCookie, { once: true });
      } else {
        applyFromCookie();
      }
    }

    /**
     * Pre-traduce un nodo o fragmento DOM en memoria antes de ser inyectado en pantalla
     * para eliminar el parpadeo de texto original durante navegación SPA.
     */
    preTranslateDomTree(rootElement, targetLanguage) {
      if (!rootElement || !targetLanguage || targetLanguage === "original" || targetLanguage === "es") return;
      const lang = targetLanguage.trim().toLowerCase();
      const langCache = this.cache[lang];
      if (!langCache) return;

      const walker = document.createTreeWalker(
        rootElement,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: (node) => {
            const parent = node.parentElement;
            if (!parent) return NodeFilter.FILTER_REJECT;
            if (this.ignoredTags.has(parent.tagName)) return NodeFilter.FILTER_REJECT;
            if (parent.closest("[data-no-translate]") || parent.closest(".no-translate")) {
              return NodeFilter.FILTER_REJECT;
            }
            const trimmed = node.nodeValue.trim();
            if (!trimmed || /^[\d\s\-_.,:;!?()\[\]{}@#$%&*+=/\\|<>'"~`]+$/.test(trimmed)) {
              return NodeFilter.FILTER_SKIP;
            }
            return NodeFilter.FILTER_ACCEPT;
          }
        },
        false
      );

      let currentNode;
      while ((currentNode = walker.nextNode())) {
        const val = currentNode.nodeValue;
        if (langCache[val]) {
          currentNode.nodeValue = langCache[val];
        }
      }

      const elementsWithAttrs = rootElement.querySelectorAll("input[placeholder], textarea[placeholder]");
      elementsWithAttrs.forEach((el) => {
        if (el.closest("[data-no-translate]") || el.closest(".no-translate")) return;
        const ph = el.getAttribute("placeholder");
        if (ph && langCache[ph]) {
          el.setAttribute("placeholder", langCache[ph]);
        }
      });
    }

    /**
     * Lee el idioma guardado EXCLUSIVAMENTE desde la cookie
     */
    getSavedLanguage() {
      if (this.useCookies) {
        const cookieVal = getCookie(COOKIE_NAME);
        if (cookieVal) return cookieVal;
      }
      return "original";
    }

    setEndpoint(newEndpoint) {
      if (newEndpoint && typeof newEndpoint === "string") {
        this.endpoint = newEndpoint.trim();
      }
    }

    async translateToEnglish() {
      return this.translatePage("en");
    }

    /**
     * Restaura el contenido original y actualiza la cookie a 'original'
     */
    restoreOriginal() {
      if (this.useCookies) {
        setCookie(COOKIE_NAME, "original", 365);
      }

      for (const [node, originalText] of this.nodeMap.entries()) {
        if (node.nodeValue !== originalText) {
          node.nodeValue = originalText;
        }
      }

      for (const [element, attrs] of this.attrMap.entries()) {
        for (const { attr, originalText } of attrs) {
          element.setAttribute(attr, originalText);
        }
      }

      this.currentLanguage = "original";
      document.documentElement.classList.remove("ct-pending");
      this._updateStatusUI("ORIGINAL");

      // Sincronizar select si existe
      const selectEl = document.getElementById("select-lang");
      if (selectEl) selectEl.value = "es";

      if (typeof this.onComplete === "function") {
        this.onComplete({ language: "original", total: this.nodeMap.size, restored: true });
      }
    }

    /**
     * Traduce toda la página en UNA SOLA consulta HTTP y guarda la selección en COOKIES
     * @param {string} targetLanguage - Ej: 'en', 'fr', 'de', 'it', 'pt'
     */
    async translatePage(targetLanguage) {
      if (!targetLanguage || typeof targetLanguage !== "string") {
        throw new Error("Debe especificar un código de idioma válido (ej. 'en', 'es', 'fr').");
      }

      const lang = targetLanguage.trim().toLowerCase();

      // Guardar SIEMPRE en COOKIES para persistencia estricta
      if (this.useCookies) {
        setCookie(COOKIE_NAME, lang, 365);
      }

      // Sincronizar selector visual en barra
      const selectEl = document.getElementById("select-lang");
      if (selectEl) {
        const optionExists = Array.from(selectEl.options).some(o => o.value === lang);
        if (optionExists) selectEl.value = lang;
      }

      if (this.currentLanguage === lang && !this.isTranslating) {
        document.documentElement.classList.remove("ct-pending");
        this._updateStatusUI(`LISTO (${lang.toUpperCase()})`);
        return;
      }

      if (this.isTranslating) return;
      this.isTranslating = true;

      this._updateStatusUI(`TRADUCIENDO (${lang.toUpperCase()})...`);
      if (window.startSpaProgress) window.startSpaProgress();
      document.body.classList.add("ct-translating");

      if (!this.cache[lang]) {
        this.cache[lang] = {};
      }

      this._scanDOM();
      const totalNodes = this.nodeMap.size;

      if (typeof this.onStart === "function") {
        this.onStart({ targetLanguage: lang, total: totalNodes });
      }

      // Aplicar de inmediato cualquier texto disponible en memoria RAM (0ms)
      this._applyCachedTranslations(lang);

      // Extraer textos únicos que faltan por traducir
      const uniqueTextsToTranslate = [];
      const seen = new Set();

      for (const [, originalText] of this.nodeMap.entries()) {
        if (!this.cache[lang][originalText] && !seen.has(originalText)) {
          seen.add(originalText);
          uniqueTextsToTranslate.push(originalText);
        }
      }

      for (const [, attrs] of this.attrMap.entries()) {
        for (const { originalText } of attrs) {
          if (!this.cache[lang][originalText] && !seen.has(originalText)) {
            seen.add(originalText);
            uniqueTextsToTranslate.push(originalText);
          }
        }
      }

      if (uniqueTextsToTranslate.length === 0) {
        this.currentLanguage = lang;
        this.isTranslating = false;
        document.body.classList.remove("ct-translating");
        document.documentElement.classList.remove("ct-pending");
        this._updateStatusUI(`LISTO (${lang.toUpperCase()})`);
        if (window.finishSpaProgress) window.finishSpaProgress();

        if (typeof this.onProgress === "function") {
          this.onProgress({ processed: totalNodes, total: totalNodes, percent: 100, cached: true });
        }
        if (typeof this.onComplete === "function") {
          this.onComplete({ language: lang, total: totalNodes, fromCache: true });
        }
        return;
      }

      // Enviar en UNA SOLA consulta HTTP por lote
      const batches = [];
      for (let i = 0; i < uniqueTextsToTranslate.length; i += this.batchSize) {
        batches.push(uniqueTextsToTranslate.slice(i, i + this.batchSize));
      }

      try {
        for (const batch of batches) {
          await this._fetchTranslationSingleRequest(batch, lang);
          this._applyCachedTranslations(lang);
        }

        this.currentLanguage = lang;
        this._updateStatusUI(`LISTO (${lang.toUpperCase()})`);

        if (typeof this.onComplete === "function") {
          this.onComplete({ language: lang, total: totalNodes, fromCache: false });
        }
      } catch (err) {
        this._updateStatusUI("ERROR");
        if (typeof this.onError === "function") {
          this.onError(err);
        } else {
          console.error("[CloudTranslator] Error durante la traducción:", err);
        }
      } finally {
        this.isTranslating = false;
        document.body.classList.remove("ct-translating");
        document.documentElement.classList.remove("ct-pending");
        if (window.finishSpaProgress) window.finishSpaProgress();
      }
    }

    async _fetchTranslationSingleRequest(textsBatch, targetLanguage) {
      if (!textsBatch || textsBatch.length === 0) return;

      try {
        const response = await fetch(this.endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            texts: textsBatch,
            targetLanguage: targetLanguage
          })
        });

        if (response.ok) {
          const data = await response.json();
          if (data && Array.isArray(data.translatedTexts)) {
            data.translatedTexts.forEach((translatedStr, idx) => {
              this.cache[targetLanguage][textsBatch[idx]] = translatedStr;
            });
            return;
          }
        }
      } catch (e) {
        console.warn("[CloudTranslator] Advertencia en lote de traducción:", e);
      }

      // Fallback
      for (const singleText of textsBatch) {
        if (this.cache[targetLanguage][singleText]) continue;
        try {
          const res = await fetch(this.endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: singleText, targetLanguage: targetLanguage })
          });
          if (res.ok) {
            const d = await res.json();
            this.cache[targetLanguage][singleText] = d.translatedText || singleText;
          }
        } catch (e) {}
      }
    }

    _applyCachedTranslations(targetLanguage) {
      const langCache = this.cache[targetLanguage];
      if (!langCache) return;

      for (const [node, originalText] of this.nodeMap.entries()) {
        if (langCache[originalText] && node.nodeValue !== langCache[originalText]) {
          node.nodeValue = langCache[originalText];
        }
      }

      for (const [element, attrs] of this.attrMap.entries()) {
        for (const { attr, originalText } of attrs) {
          if (langCache[originalText]) {
            element.setAttribute(attr, langCache[originalText]);
          }
        }
      }
    }

    _scanDOM() {
      const root = document.querySelector(this.rootSelector) || document.body;

      const walker = document.createTreeWalker(
        root,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: (node) => {
            const parent = node.parentElement;
            if (!parent) return NodeFilter.FILTER_REJECT;

            if (this.ignoredTags.has(parent.tagName)) return NodeFilter.FILTER_REJECT;
            if (parent.closest("[data-no-translate]") || parent.closest(".no-translate")) {
              return NodeFilter.FILTER_REJECT;
            }

            const trimmed = node.nodeValue.trim();
            if (!trimmed || /^[\d\s\-_.,:;!?()\[\]{}@#$%&*+=/\\|<>'"~`]+$/.test(trimmed)) {
              return NodeFilter.FILTER_SKIP;
            }

            return NodeFilter.FILTER_ACCEPT;
          }
        },
        false
      );

      let currentNode;
      while ((currentNode = walker.nextNode())) {
        if (!this.nodeMap.has(currentNode)) {
          this.nodeMap.set(currentNode, currentNode.nodeValue);
        }
      }

      const elementsWithAttrs = root.querySelectorAll("input[placeholder], textarea[placeholder]");
      elementsWithAttrs.forEach((el) => {
        if (el.closest("[data-no-translate]") || el.closest(".no-translate")) return;
        const placeholder = el.getAttribute("placeholder");
        if (placeholder && placeholder.trim()) {
          let list = this.attrMap.get(el);
          if (!list) {
            list = [];
            this.attrMap.set(el, list);
          }
          if (!list.some(item => item.attr === "placeholder")) {
            list.push({ attr: "placeholder", originalText: placeholder });
          }
        }
      });
    }

    _updateStatusUI(text) {
      const statusText = document.getElementById("status-text");
      const statusPill = document.getElementById("status-pill");
      if (statusText) {
        statusText.textContent = text;
      }
      if (statusPill) {
        if (text.includes("TRADUCIENDO")) {
          statusPill.classList.add("translating");
          statusPill.classList.remove("completed");
        } else {
          statusPill.classList.remove("translating");
          statusPill.classList.add("completed");
        }
      }
    }
  }

  return CloudTranslator;
});
