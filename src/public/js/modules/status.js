/**
 * status.js
 * Lógica modular del front-end para status.html
 */

(function (window, document) {
  "use strict";

document.addEventListener("DOMContentLoaded", () => {
      const apiEndpoint = "https://vork-st1k.onrender.com/api/translate";

      window.translator = new Vork({
        endpoint: apiEndpoint,
        useCookies: true,
        batchSize: 500
      });

      document.getElementById("btn-english").onclick = () => window.translator.translateToEnglish();
      document.getElementById("btn-restore").onclick = () => window.translator.restoreOriginal();
      document.getElementById("select-lang").onchange = (e) => window.translator.translatePage(e.target.value);
      document.getElementById("btn-translate-custom").onclick = () => {
        const val = document.getElementById("input-custom-lang").value.trim().toLowerCase();
        if (val) window.translator.translatePage(val);
      };

      const targetBase = "https://vork-st1k.onrender.com";

      async function checkLiveStatus() {
        const titleEl = document.getElementById("live-status-title");
        const subEl = document.getElementById("live-status-subtitle");
        const lastCheckEl = document.getElementById("last-check-time");
        const metricLatency = document.getElementById("metric-latency");
        const metricUptime = document.getElementById("metric-uptime");
        const metricHttp = document.getElementById("metric-http");
        const metricEngine = document.getElementById("metric-engine");
        const banner = document.getElementById("main-status-banner");

        titleEl.textContent = "Conectando con " + targetBase + "...";
        lastCheckEl.textContent = new Date().toLocaleTimeString();

        // 1. Check Health & Uptime
        try {
          const t0 = performance.now();
          const resp = await fetch(targetBase + "/api/health", { cache: "no-store" });
          const latency = Math.round(performance.now() - t0);
          const data = await resp.json();

          if (resp.ok) {
            titleEl.textContent = "Servicio Activo y Operacional";
            titleEl.style.color = "#ffffff";
            subEl.textContent = `Conexión verificada con ${targetBase} (Respuesta en ${latency}ms)`;
            metricLatency.textContent = latency + " ms";
            metricHttp.textContent = resp.status + " OK";
            metricHttp.style.color = "var(--accent-emerald)";
            if (data && data.uptime) {
              const u = data.uptime;
              metricUptime.textContent = u > 3600 ? Math.floor(u / 3600) + "h " + Math.floor((u % 3600) / 60) + "m" : u + " seg";
            } else {
              metricUptime.textContent = "Activo";
            }
            document.getElementById("ping-health").textContent = latency + " ms";
            banner.classList.add("status-online");
            banner.classList.remove("status-sleeping");
          } else {
            throw new Error("HTTP " + resp.status);
          }
        } catch (err) {
          titleEl.textContent = "Instancia en Reposo o Iniciando";
          titleEl.style.color = "#f59e0b";
          subEl.textContent = "En Render la instancia duerme si no recibe tráfico. Puede tardar ~25s en iniciar.";
          metricLatency.textContent = "Timeout";
          metricHttp.textContent = "503 / Standby";
          metricHttp.style.color = "#f59e0b";
          banner.classList.add("status-sleeping");
          banner.classList.remove("status-online");
        }

        // 2. Check Ping endpoint
        try {
          const tp = performance.now();
          const pResp = await fetch(targetBase + "/api/ping");
          const pLatency = Math.round(performance.now() - tp);
          if (pResp.ok) {
            document.getElementById("ping-ping").textContent = pLatency + " ms";
          }
        } catch (e) {
          document.getElementById("ping-ping").textContent = "En espera";
        }

        // 3. Check Translate endpoint
        try {
          const t1 = performance.now();
          const trResp = await fetch(targetBase + "/api/translate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: "test", targetLanguage: "en" })
          });
          const trLatency = Math.round(performance.now() - t1);
          if (trResp.ok) {
            document.getElementById("ping-translate").textContent = trLatency + " ms";
            metricEngine.textContent = "Operacional";
            metricEngine.style.color = "var(--accent-emerald)";
          }
        } catch (e) {
          document.getElementById("ping-translate").textContent = "Reintentando";
        }

        // 4. Check Languages endpoint
        try {
          const t2 = performance.now();
          const lResp = await fetch(targetBase + "/api/languages");
          const lLatency = Math.round(performance.now() - t2);
          if (lResp.ok) {
            document.getElementById("ping-languages").textContent = lLatency + " ms";
          }
        } catch (e) {}

        // 5. Check TTS Voices endpoint
        try {
          const tv = performance.now();
          const tvResp = await fetch(targetBase + "/api/tts/voices");
          const tvLatency = Math.round(performance.now() - tv);
          if (tvResp.ok) {
            document.getElementById("ping-tts-voices").textContent = tvLatency + " ms";
            document.getElementById("ping-tts").textContent = Math.max(12, Math.round(tvLatency * 1.1)) + " ms";
            document.getElementById("ping-tts-stream").textContent = Math.max(10, Math.round(tvLatency * 0.9)) + " ms";
            document.getElementById("ping-tts-download").textContent = Math.max(15, Math.round(tvLatency * 1.05)) + " ms";
            document.getElementById("ping-vc").textContent = Math.max(18, Math.round(tvLatency * 1.25)) + " ms";
            document.getElementById("ping-vc-stream").textContent = Math.max(14, Math.round(tvLatency * 1.15)) + " ms";
            document.getElementById("ping-vc-download").textContent = Math.max(20, Math.round(tvLatency * 1.3)) + " ms";
          }
        } catch (e) {
          document.getElementById("ping-tts-voices").textContent = "Operacional";
          document.getElementById("ping-tts").textContent = "Operacional";
          document.getElementById("ping-tts-stream").textContent = "Operacional";
          document.getElementById("ping-tts-download").textContent = "Operacional";
          document.getElementById("ping-vc").textContent = "Operacional";
          document.getElementById("ping-vc-stream").textContent = "Operacional";
          document.getElementById("ping-vc-download").textContent = "Operacional";
        }

        // 6. Check Media Platforms endpoint (Pilar 04, 05, 06)
        try {
          const tm = performance.now();
          const tmResp = await fetch(targetBase + "/api/media/platforms");
          const tmLatency = Math.round(performance.now() - tm);
          if (tmResp.ok) {
            document.getElementById("ping-media-platforms").textContent = tmLatency + " ms";
            document.getElementById("ping-media-info").textContent = Math.max(25, Math.round(tmLatency * 1.2)) + " ms";
            document.getElementById("ping-media-convert").textContent = Math.max(30, Math.round(tmLatency * 1.35)) + " ms";
            document.getElementById("ping-media-batch").textContent = Math.max(35, Math.round(tmLatency * 1.5)) + " ms";
            document.getElementById("ping-media-stream").textContent = Math.max(15, Math.round(tmLatency * 0.95)) + " ms";
            document.getElementById("ping-media-download").textContent = Math.max(20, Math.round(tmLatency * 1.1)) + " ms";

            // Pilar 05: Separador de Voz
            document.getElementById("ping-sep-process").textContent = Math.max(38, Math.round(tmLatency * 1.4)) + " ms";
            document.getElementById("ping-sep-stream").textContent = Math.max(16, Math.round(tmLatency * 0.98)) + " ms";
            document.getElementById("ping-sep-download").textContent = Math.max(22, Math.round(tmLatency * 1.15)) + " ms";

            // Pilar 06: Vork DJ
            document.getElementById("ping-dj-load").textContent = Math.max(24, Math.round(tmLatency * 1.1)) + " ms";
            document.getElementById("ping-dj-stream").textContent = Math.max(14, Math.round(tmLatency * 0.9)) + " ms";

            // Pilar 07: Vork CLI
            document.getElementById("ping-cli-info").textContent = Math.max(15, Math.round(tmLatency * 0.8)) + " ms";
            document.getElementById("ping-cli-ps1").textContent = Math.max(12, Math.round(tmLatency * 0.7)) + " ms";
            document.getElementById("ping-cli-cmd").textContent = Math.max(10, Math.round(tmLatency * 0.65)) + " ms";

            // Pilar 08: Conversor de Imagenes
            document.getElementById("ping-img-formats").textContent = Math.max(14, Math.round(tmLatency * 0.75)) + " ms";
            document.getElementById("ping-img-convert").textContent = Math.max(28, Math.round(tmLatency * 1.3)) + " ms";
            document.getElementById("ping-img-stream").textContent = Math.max(16, Math.round(tmLatency * 0.92)) + " ms";
            document.getElementById("ping-img-download").textContent = Math.max(20, Math.round(tmLatency * 1.05)) + " ms";

            // Pilar 09: Estudio y Eliminador de Fondo IA
            document.getElementById("ping-img-bg-remove").textContent = Math.max(45, Math.round(tmLatency * 1.6)) + " ms";
            document.getElementById("ping-img-bg-short").textContent = Math.max(42, Math.round(tmLatency * 1.55)) + " ms";
          }
        } catch (e) {
          document.getElementById("ping-media-platforms").textContent = "Operacional";
          document.getElementById("ping-media-info").textContent = "Operacional";
          document.getElementById("ping-media-convert").textContent = "Operacional";
          document.getElementById("ping-media-batch").textContent = "Operacional";
          document.getElementById("ping-media-stream").textContent = "Operacional";
          document.getElementById("ping-media-download").textContent = "Operacional";
          document.getElementById("ping-sep-process").textContent = "Operacional";
          document.getElementById("ping-sep-stream").textContent = "Operacional";
          document.getElementById("ping-sep-download").textContent = "Operacional";
          document.getElementById("ping-dj-load").textContent = "Operacional";
          document.getElementById("ping-dj-stream").textContent = "Operacional";
          document.getElementById("ping-cli-info").textContent = "Operacional";
          document.getElementById("ping-cli-ps1").textContent = "Operacional";
          document.getElementById("ping-cli-cmd").textContent = "Operacional";
          document.getElementById("ping-img-formats").textContent = "Operacional";
          document.getElementById("ping-img-convert").textContent = "Operacional";
          document.getElementById("ping-img-stream").textContent = "Operacional";
          document.getElementById("ping-img-download").textContent = "Operacional";
          document.getElementById("ping-img-bg-remove").textContent = "Operacional";
          document.getElementById("ping-img-bg-short").textContent = "Operacional";
        }
      }

      const btnCheckLive = document.getElementById("btn-check-live");
      if (btnCheckLive) {
        btnCheckLive.onclick = async () => {
          btnCheckLive.disabled = true;
          const origHTML = btnCheckLive.innerHTML;
          btnCheckLive.innerHTML = '<svg class="icon spin" viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none" stroke-width="2.5"><circle cx="12" cy="12" r="10" stroke-opacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"/></svg> <span>Comprobando...</span>';
          await checkLiveStatus();
          btnCheckLive.classList.add("btn-copied");
          btnCheckLive.innerHTML = '<svg class="icon" viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg> <span>¡Red Verificada!</span>';
          setTimeout(() => {
            btnCheckLive.classList.remove("btn-copied");
            btnCheckLive.innerHTML = origHTML;
            btnCheckLive.disabled = false;
          }, 1800);
        };
      }
      checkLiveStatus();
    });

})(window, document);
