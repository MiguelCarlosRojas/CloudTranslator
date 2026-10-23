/**
 * translator.js
 * Módulo de la consola interactiva del Traductor en la Nube.
 */

(function (window, document) {
  "use strict";

  const translatorClientCache = new Map();

  function initTranslatorModule() {
    // 1. Inicialización de Vork
    const apiEndpoint = "/api/translate";
    if (window.Vork && !window.translator) {
      window.translator = new window.Vork({
        endpoint: apiEndpoint,
        useCookies: true,
        batchSize: 500
      });
    }

    const btnEnglish = document.getElementById("btn-english");
    const btnRestore = document.getElementById("btn-restore");
    const selectLang = document.getElementById("select-lang");
    const btnTranslateCustom = document.getElementById("btn-translate-custom");
    const inputCustomLang = document.getElementById("input-custom-lang");

    if (btnEnglish && !btnEnglish._bound) {
      btnEnglish._bound = true;
      btnEnglish.onclick = () => window.translator && window.translator.translateToEnglish();
    }
    if (btnRestore && !btnRestore._bound) {
      btnRestore._bound = true;
      btnRestore.onclick = () => window.translator && window.translator.restoreOriginal();
    }
    if (selectLang && !selectLang._bound) {
      selectLang._bound = true;
      selectLang.onchange = (e) => window.translator && window.translator.translatePage(e.target.value);
    }
    if (btnTranslateCustom && !btnTranslateCustom._bound) {
      btnTranslateCustom._bound = true;
      btnTranslateCustom.onclick = () => {
        const val = (inputCustomLang?.value || "").trim().toLowerCase();
        if (val && window.translator) window.translator.translatePage(val);
      };
    }

    // 2. Consola Interactiva
    const btnRun = document.getElementById("btn-run-translator");
    const btnRunText = document.getElementById("btn-run-translator-text");
    const inputText = document.getElementById("translator-input-text");
    const targetLang = document.getElementById("translator-target-lang");
    const outputText = document.getElementById("translator-output-text");
    const outputJson = document.getElementById("translator-output-json");
    const latencyBadge = document.getElementById("translator-latency-badge");
    const stats = document.getElementById("translator-stats");
    const btnCopy = document.getElementById("btn-copy-result");
    const charCount = document.getElementById("translator-char-count");

    // Contador de caracteres en tiempo real
    if (inputText && charCount && !inputText._boundCount) {
      inputText._boundCount = true;
      const updateCharCount = () => {
        const len = (inputText.value || "").length;
        charCount.textContent = `${len} caracteres`;
      };
      inputText.addEventListener("input", updateCharCount);
      updateCharCount();
    }

    // Bloqueo y control de UI durante la traducción
    function setTranslatorLock(isTranslating) {
      if (inputText) {
        inputText.readOnly = isTranslating;
        inputText.style.cursor = isTranslating ? "not-allowed" : "text";
        inputText.style.opacity = isTranslating ? "0.6" : "1";
      }
      if (targetLang) {
        targetLang.disabled = isTranslating;
        targetLang.style.cursor = isTranslating ? "not-allowed" : "pointer";
        targetLang.style.opacity = isTranslating ? "0.6" : "1";
        if (targetLang.parentElement) {
          targetLang.parentElement.style.pointerEvents = isTranslating ? "none" : "auto";
        }
      }
      if (btnRun) {
        btnRun.disabled = isTranslating;
        btnRun.style.cursor = isTranslating ? "not-allowed" : "pointer";
        btnRun.style.opacity = isTranslating ? "0.75" : "1";
        if (btnRunText) {
          if (isTranslating) {
            btnRunText.innerHTML = '<span class="spinner" style="display:inline-block; width:13px; height:13px; border:2px solid #fff; border-top-color:transparent; border-radius:50%; animation:spin 0.8s linear infinite; margin-right:8px; vertical-align:middle;"></span>Traduciendo...';
          } else {
            btnRunText.textContent = "TRADUCIR TEXTO";
          }
        }
      }
    }

    if (btnRun && !btnRun._bound) {
      btnRun._bound = true;
      btnRun.addEventListener("click", async () => {
        const text = (inputText?.value || "").trim();
        const to = targetLang?.value || "en";
        if (!text) {
          if (inputText) inputText.focus();
          return;
        }

        const cacheKey = `${to}:${text}`;
        if (translatorClientCache.has(cacheKey)) {
          const cached = translatorClientCache.get(cacheKey);
          if (latencyBadge) {
            latencyBadge.textContent = "LATENCIA: 0ms (CACHÉ LOCAL)";
            latencyBadge.style.display = "inline-block";
          }
          if (outputJson) outputJson.textContent = JSON.stringify(cached, null, 2);
          if (outputText) outputText.textContent = cached.translatedText || text;
          if (stats) {
            stats.textContent = `Éxito • ${(cached.translatedText || text).length} caracteres • 0ms (Caché local)`;
            stats.style.color = "#10b981";
          }
          return;
        }

        setTranslatorLock(true);
        if (outputText) outputText.textContent = "Traduciendo a través del microservicio de alto rendimiento...";
        if (stats) {
          stats.textContent = "Conectando al microservicio...";
          stats.style.color = "var(--primary)";
        }
        const t0 = performance.now();

        try {
          const resp = await fetch("/api/translate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text, to })
          });

          const latency = Math.round(performance.now() - t0);
          const data = await resp.json();

          if (latencyBadge) {
            latencyBadge.textContent = "LATENCIA: " + latency + "ms";
            latencyBadge.style.display = "inline-block";
          }
          if (outputJson) outputJson.textContent = JSON.stringify(data, null, 2);

          if (data.translatedText) {
            translatorClientCache.set(cacheKey, data);
            if (outputText) outputText.textContent = data.translatedText;
            if (stats) {
              stats.textContent = `Éxito • ${data.translatedText.length} caracteres • ${latency}ms`;
              stats.style.color = "#10b981";
            }
            if (btnRun && btnRunText) {
              btnRun.classList.add("btn-copied");
              btnRunText.innerHTML = '<svg class="icon" viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg> <span>¡Listo!</span>';
              setTimeout(() => {
                btnRun.classList.remove("btn-copied");
                btnRunText.textContent = "TRADUCIR TEXTO";
                setTranslatorLock(false);
              }, 1800);
              return;
            }
          } else {
            if (outputText) outputText.textContent = "Error al recibir respuesta: " + (data.error || "Formato inválido");
            if (stats) {
              stats.textContent = "Error en respuesta";
              stats.style.color = "#ef4444";
            }
          }
        } catch (err) {
          if (outputText) outputText.textContent = "Error de conexión: " + err.message;
          if (outputJson) outputJson.textContent = JSON.stringify({ error: err.message }, null, 2);
          if (stats) {
            stats.textContent = "Fallo de red";
            stats.style.color = "#ef4444";
          }
        } finally {
          if (!btnRun.classList.contains("btn-copied")) {
            setTranslatorLock(false);
          }
        }
      });
    }

    if (btnCopy && !btnCopy._bound) {
      btnCopy._bound = true;
      btnCopy.addEventListener("click", () => {
        const txt = outputText?.textContent;
        if (txt && !txt.startsWith("Haz clic") && !txt.startsWith("Error") && !txt.startsWith("Traduciendo")) {
          navigator.clipboard.writeText(txt);
          btnCopy.classList.add("btn-copied");
          btnCopy.innerHTML = '<svg class="icon" viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg> <span>¡Copiado!</span>';
          setTimeout(() => {
            btnCopy.classList.remove("btn-copied");
            btnCopy.innerHTML = '<svg class="icon" viewBox="0 0 24 24"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg> <span>Copiar Resultado</span>';
          }, 1800);
        }
      });
    }
  }

  window.initTranslatorModule = initTranslatorModule;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initTranslatorModule);
  } else {
    initTranslatorModule();
  }
})(window, document);
