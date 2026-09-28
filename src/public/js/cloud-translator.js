/**
 * CloudTranslator Client SDK v1.3.0
 * 
 * Librería optimizada para traducción web en segundo plano:
 * - Persistencia del idioma elegido mediante COOKIES (cloud_translator_lang).
 * - Envía TODOS los textos en UNA SOLA consulta HTTP (/api/translate con texts: [...])
 *   evitando saturar la pestaña Network con múltiples peticiones repetidas.
 * - Almacena las traducciones en memoria/caché local para cargas instantáneas (0ms).
 * - Soporte para botón directo a Inglés, selector de idiomas y códigos de caracteres personalizados.
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
  const STORAGE_KEY_CACHE_PREFIX = "cloud_translator_cache_";

  /**
   * Utilidades de Cookies
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

      // Nodos y atributos originales
      this.nodeMap = new Map(); // Node -> originalText
      this.attrMap = new Map(); // Element -> [{ attr, originalText }]

      // Caché global de traducciones: { [langCode]: { [originalText]: translatedText } }
      this.cache = {};
      this._loadCacheFromStorage();

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

    _loadCacheFromStorage() {
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(STORAGE_KEY_CACHE_PREFIX)) {
            const lang = key.replace(STORAGE_KEY_CACHE_PREFIX, "");
            const raw = localStorage.getItem(key);
            if (raw) {
              this.cache[lang] = JSON.parse(raw);
            }
          }
        }
      } catch (e) {}
    }

    _saveCacheToStorage(lang) {
      try {
        if (this.cache[lang]) {
          localStorage.setItem(STORAGE_KEY_CACHE_PREFIX + lang, JSON.stringify(this.cache[lang]));
        }
      } catch (e) {}
    }

    /**
     * Revisa si existe la cookie cloud_translator_lang y traduce automáticamente al cargar
     */
    _initCookieLanguage() {
      const applyFromCookie = () => {
        const savedLang = this.getSavedLanguage();
        if (savedLang && savedLang !== "original" && savedLang !== "es") {
          this.translatePage(savedLang);
        }
      };

      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", applyFromCookie, { once: true });
      } else {
        setTimeout(applyFromCookie, 10);
      }
    }

    /**
     * Lee el idioma guardado en la cookie
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

      if (this.currentLanguage === "original") return;

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

      // Guardar en COOKIES para persistencia global
      if (this.useCookies) {
        setCookie(COOKIE_NAME, lang, 365);
      }

      if (this.currentLanguage === lang && !this.isTranslating) {
        return;
      }

      if (this.isTranslating) return;
      this.isTranslating = true;

      if (!this.cache[lang]) {
        this.cache[lang] = {};
      }

      this._scanDOM();
      const totalNodes = this.nodeMap.size;

      if (typeof this.onStart === "function") {
        this.onStart({ targetLanguage: lang, total: totalNodes });
      }

      // Extraer textos únicos pendientes de traducción
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

      // Aplicar textos ya disponibles en caché (0 peticiones de red)
      this._applyCachedTranslations(lang);

      if (uniqueTextsToTranslate.length === 0) {
        this.currentLanguage = lang;
        this.isTranslating = false;
        if (typeof this.onProgress === "function") {
          this.onProgress({ processed: totalNodes, total: totalNodes, percent: 100, cached: true });
        }
        if (typeof this.onComplete === "function") {
          this.onComplete({ language: lang, total: totalNodes, fromCache: true });
        }
        return;
      }

      // Enviar en UNA SOLA consulta HTTP
      const batches = [];
      for (let i = 0; i < uniqueTextsToTranslate.length; i += this.batchSize) {
        batches.push(uniqueTextsToTranslate.slice(i, i + this.batchSize));
      }

      try {
        for (const batch of batches) {
          await this._fetchTranslationSingleRequest(batch, lang);
          this._applyCachedTranslations(lang);
        }

        this._saveCacheToStorage(lang);
        this.currentLanguage = lang;
        if (typeof this.onComplete === "function") {
          this.onComplete({ language: lang, total: totalNodes, fromCache: false });
        }
      } catch (err) {
        if (typeof this.onError === "function") {
          this.onError(err);
        } else {
          console.error("[CloudTranslator] Error durante la traducción:", err);
        }
      } finally {
        this.isTranslating = false;
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
  }

  return CloudTranslator;
});
