/**
 * dj.js
 * Lógica modular del front-end para dj.html
 */

(function (window, document) {
  "use strict";

document.addEventListener("DOMContentLoaded", () => {
      const audioA = document.getElementById("audio-deck-a");
      const audioB = document.getElementById("audio-deck-b");

      // Web Audio API Context para Ecualizadores, Filtros, Analizadores y Sintetizadores DJ
      let audioCtx = null;
      let sourceA, sourceB;
      let gainA, gainB;
      let eqHiA, eqMidA, eqLowA;
      let eqHiB, eqMidB, eqLowB;
      let filterA, filterB;
      let analyserA, analyserB;

      // Estado BPM & Tempo Base (Default 128 BPM club standard)
      let baseBpmA = 128.0;
      let baseBpmB = 128.0;
      let currentBpmA = 128.0;
      let currentBpmB = 128.0;
      let tapTimesA = [];
      let tapTimesB = [];

      // Estado Hot Cues (4 pads por deck: timestamps en segundos o null)
      const hotCuesA = [null, null, null, null];
      const hotCuesB = [null, null, null, null];

      // Estado Beat Looping
      let activeLoopA = null; // { beats: 4, loopStart: sec, loopEnd: sec }
      let activeLoopB = null;

      function initWebAudio() {
        if (audioCtx) return;
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioContext();

        // Nodos Deck A
        sourceA = audioCtx.createMediaElementSource(audioA);
        gainA = audioCtx.createGain();
        eqHiA = audioCtx.createBiquadFilter();
        eqHiA.type = "highshelf";
        eqHiA.frequency.value = 3500;
        eqMidA = audioCtx.createBiquadFilter();
        eqMidA.type = "peaking";
        eqMidA.frequency.value = 1500;
        eqLowA = audioCtx.createBiquadFilter();
        eqLowA.type = "lowshelf";
        eqLowA.frequency.value = 250;

        // Sound Color Filter Deck A (LPF / HPF Biquad)
        filterA = audioCtx.createBiquadFilter();
        filterA.type = "lowpass";
        filterA.frequency.value = 22050;
        filterA.Q.value = 0.7;

        // Analizador de Espectro / VU Deck A
        analyserA = audioCtx.createAnalyser();
        analyserA.fftSize = 64;

        sourceA.connect(eqLowA);
        eqLowA.connect(eqMidA);
        eqMidA.connect(eqHiA);
        eqHiA.connect(filterA);
        filterA.connect(gainA);
        gainA.connect(analyserA);
        gainA.connect(audioCtx.destination);

        // Nodos Deck B
        sourceB = audioCtx.createMediaElementSource(audioB);
        gainB = audioCtx.createGain();
        eqHiB = audioCtx.createBiquadFilter();
        eqHiB.type = "highshelf";
        eqHiB.frequency.value = 3500;
        eqMidB = audioCtx.createBiquadFilter();
        eqMidB.type = "peaking";
        eqMidB.frequency.value = 1500;
        eqLowB = audioCtx.createBiquadFilter();
        eqLowB.type = "lowshelf";
        eqLowB.frequency.value = 250;

        // Sound Color Filter Deck B (LPF / HPF Biquad)
        filterB = audioCtx.createBiquadFilter();
        filterB.type = "lowpass";
        filterB.frequency.value = 22050;
        filterB.Q.value = 0.7;

        // Analizador de Espectro / VU Deck B
        analyserB = audioCtx.createAnalyser();
        analyserB.fftSize = 64;

        sourceB.connect(eqLowB);
        eqLowB.connect(eqMidB);
        eqMidB.connect(eqHiB);
        eqHiB.connect(filterB);
        filterB.connect(gainB);
        gainB.connect(analyserB);
        gainB.connect(audioCtx.destination);

        updateCrossfader(document.getElementById("crossfader").value);
        startVisualizerLoop();
      }

      // =========================================================================
      // COLA DE REPRODUCCIÓN EN MEMORIA DE SESIÓN (SIN COOKIES NI LOCALSTORAGE)
      // =========================================================================
      try {
        // Limpieza de rastros anteriores en cookies o localStorage
        document.cookie = "dj_queue=; Path=/; Max-Age=0;";
        localStorage.removeItem("vork_dj_queue");
      } catch (e) {}

      let djQueue = [];
      let currentQueueTrackIndex = -1;

      function updateQueueCounter() {
        const counterEl = document.getElementById("queue-counter");
        if (counterEl) {
          const count = djQueue.length;
          counterEl.textContent = `${count} ${count === 1 ? 'pista en lista' : 'pistas en lista'}`;
        }
      }

      function renderQueue() {
        const container = document.getElementById("queue-list-container");
        if (!container) return;
        container.innerHTML = "";
        updateQueueCounter();

        if (djQueue.length === 0) {
          container.innerHTML = `<div style="text-align: center; padding: 36px 20px; color: var(--text-muted); font-size: 0.95rem;">No hay canciones en la cola. Pega un enlace multimedia arriba y pulsa "Añadir a la Cola" para preparar tus mezclas.</div>`;
          return;
        }

        djQueue.forEach((item, index) => {
          const el = document.createElement("div");
          el.className = "queue-item";
          el.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px; min-width: 0; flex: 1;">
              <span style="font-weight: 800; font-size: 0.95rem; color: var(--primary); width: 24px;">#${index + 1}</span>
              <div style="min-width: 0;">
                <div style="font-weight: 700; font-size: 0.95rem; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${item.title}">${item.title}</div>
                <div style="font-size: 0.78rem; color: var(--text-muted);">${item.artist} &bull; ${item.platform} &bull; <span style="color: var(--primary);">${item.duration}</span></div>
              </div>
            </div>

            <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
              <button class="btn-queue-deck-a" onclick="loadQueueItemToDeck('${item.id}', 'A')" title="Cargar a Deck A">
                <svg class="icon" viewBox="0 0 24 24" style="width: 13px; height: 13px;"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                <span>Deck A</span>
              </button>
              <button class="btn-queue-deck-b" onclick="loadQueueItemToDeck('${item.id}', 'B')" title="Cargar a Deck B">
                <svg class="icon" viewBox="0 0 24 24" style="width: 13px; height: 13px;"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                <span>Deck B</span>
              </button>
              <button class="btn-queue-nav" onclick="moveQueueItem(${index}, -1)" title="Mover arriba">
                <svg class="icon" viewBox="0 0 24 24" style="width: 15px; height: 15px;"><polyline points="18 15 12 9 6 15"/></svg>
              </button>
              <button class="btn-queue-nav" onclick="moveQueueItem(${index}, 1)" title="Mover abajo">
                <svg class="icon" viewBox="0 0 24 24" style="width: 15px; height: 15px;"><polyline points="6 9 12 15 18 9"/></svg>
              </button>
              <button class="btn-queue-delete" onclick="removeQueueItem('${item.id}')" title="Eliminar de la cola">
                <svg class="icon" viewBox="0 0 24 24" style="width: 15px; height: 15px;"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          `;
          container.appendChild(el);
        });
      }

      window.moveQueueItem = (index, dir) => {
        const target = index + dir;
        if (target < 0 || target >= djQueue.length) return;
        const temp = djQueue[index];
        djQueue[index] = djQueue[target];
        djQueue[target] = temp;
        renderQueue();
      };

      window.removeQueueItem = (id) => {
        djQueue = djQueue.filter(i => i.id !== id);
        renderQueue();
      };

      const btnClearQueue = document.getElementById("btn-clear-queue");
      if (btnClearQueue) {
        btnClearQueue.addEventListener("click", () => {
          djQueue = [];
          renderQueue();
        });
      }

      // Añadir pista desde campo "Colocar Pista Siguiente"
      const inputUpNext = document.getElementById("input-up-next-url");
      const btnAddQueue = document.getElementById("btn-add-to-queue");
      const btnClearUpNext = document.getElementById("btn-clear-up-next");
      const platformHoverLabel = document.getElementById("platform-hover-label");
      const detectedPlatformBadge = document.getElementById("detected-platform-badge");

      const platformNames = {
        youtube: "YouTube",
        tiktok: "TikTok",
        instagram: "Instagram",
        facebook: "Facebook",
        twitter: "Twitter / X",
        pinterest: "Pinterest",
        direct: "Enlace Directo"
      };

      function detectPlatformFromUrl(url) {
        const u = (url || "").trim().toLowerCase();
        if (!u) return null;
        if (u.includes("youtube.com") || u.includes("youtu.be")) return "youtube";
        if (u.includes("tiktok.com")) return "tiktok";
        if (u.includes("instagram.com")) return "instagram";
        if (u.includes("facebook.com") || u.includes("fb.watch")) return "facebook";
        if (u.includes("twitter.com") || u.includes("x.com")) return "twitter";
        if (u.includes("pinterest.com") || u.includes("pin.it")) return "pinterest";
        if (u.startsWith("http://") || u.startsWith("https://")) return "direct";
        return null;
      }

      function syncDetectedPlatform(url) {
        const detected = detectPlatformFromUrl(url);
        document.querySelectorAll(".platform-chip").forEach(c => {
          if (detected && c.getAttribute("data-platform") === detected) {
            c.classList.add("active");
          } else {
            c.classList.remove("active");
          }
        });

        if (detected && platformNames[detected]) {
          if (detectedPlatformBadge) detectedPlatformBadge.textContent = `${platformNames[detected]} DETECTADO`;
          if (platformHoverLabel) platformHoverLabel.textContent = platformNames[detected];
        } else {
          if (detectedPlatformBadge) detectedPlatformBadge.textContent = "DETECCIÓN AUTOMÁTICA";
          if (platformHoverLabel) platformHoverLabel.textContent = "7 PLATAFORMAS";
        }
      }

      if (inputUpNext) {
        inputUpNext.addEventListener("input", () => {
          syncDetectedPlatform(inputUpNext.value);
        });
        inputUpNext.addEventListener("keydown", (e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            const u = inputUpNext.value.trim();
            if (u) addTrackInstant(u);
          }
        });
      }

      if (btnClearUpNext) {
        btnClearUpNext.addEventListener("click", () => {
          inputUpNext.value = "";
          syncDetectedPlatform("");
          inputUpNext.focus();
        });
      }

      document.querySelectorAll(".platform-chip").forEach(chip => {
        chip.addEventListener("click", () => {
          inputUpNext.focus();
        });
      });

      // Añadido flash instantáneo en memoria
      function addTrackInstant(url) {
        if (!url || !url.trim()) {
          alert("Por favor ingresa una URL válida de YouTube, TikTok u otra plataforma soportada.");
          return;
        }

        const cleanUrl = url.trim();
        const detected = detectPlatformFromUrl(cleanUrl) || "direct";
        const platformName = platformNames[detected] || "Multimedia";

        // Título Inteligente Instantáneo (0 milisegundos)
        let smartTitle = `${platformName} Audio Track`;
        if (detected === "youtube") {
          const ytMatch = cleanUrl.match(/(?:v=|\/shorts\/|\/live\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
          smartTitle = ytMatch ? `YouTube Track [${ytMatch[1]}]` : "Pista de YouTube";
        } else if (detected === "tiktok") {
          const ttMatch = cleanUrl.match(/\/video\/(\d+)/);
          smartTitle = ttMatch ? `TikTok Viral [${ttMatch[1].slice(-6)}]` : "TikTok Audio";
        } else if (detected === "instagram") {
          const igMatch = cleanUrl.match(/\/(?:reel|reels|p)\/([a-zA-Z0-9_-]+)/);
          smartTitle = igMatch ? `Instagram Reel [${igMatch[1]}]` : "Instagram Audio";
        } else if (detected === "direct") {
          const fname = cleanUrl.split("/").pop().split("?")[0];
          smartTitle = fname ? decodeURIComponent(fname) : "Pista de Audio Directo";
        }

        const trackId = "q_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6);
        const newItem = {
          id: trackId,
          title: smartTitle,
          artist: platformName,
          platform: platformName,
          duration: "Listo",
          url: cleanUrl,
          streamUrl: null
        };

        // INSERCIÓN FLASH EN MEMORIA
        djQueue.push(newItem);
        renderQueue();

        // Limpiar entrada de inmediato
        if (inputUpNext) {
          inputUpNext.value = "";
          syncDetectedPlatform("");
        }

        // Enriquecer metadatos reales en segundo plano (asíncrono sin bloquear)
        fetch("/api/media/info", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: cleanUrl })
        })
        .then(r => r.json())
        .then(data => {
          if (data && data.status === "success" && data.title) {
            newItem.title = data.title;
            if (data.author) newItem.artist = data.author;
            if (data.duration) newItem.duration = data.duration;
            renderQueue();
          }
        })
        .catch(() => {});
      }

      if (btnAddQueue) {
        btnAddQueue.addEventListener("click", () => {
          const u = inputUpNext.value.trim();
          if (u) {
            addTrackInstant(u);
            btnAddQueue.classList.add("btn-copied");
            const originalHTML = btnAddQueue.innerHTML;
            btnAddQueue.innerHTML = '<svg class="icon" viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg> <span>¡Pista Añadida!</span>';
            setTimeout(() => {
              btnAddQueue.classList.remove("btn-copied");
              btnAddQueue.innerHTML = originalHTML;
            }, 1800);
          } else {
            alert("Pega un enlace antes de pulsar Añadir a la Cola");
          }
        });
      }

      window.loadQueueItemToDeck = (id, deck) => {
        const item = djQueue.find(i => i.id === id);
        if (!item) return;
        const idx = djQueue.findIndex(i => i.id === id);
        if (idx !== -1) currentQueueTrackIndex = idx;
        loadTrackToDeck(item, deck);
      };

      async function loadTrackToDeck(item, deck) {
        initWebAudio();
        const titleEl = document.getElementById(`deck-${deck.toLowerCase()}-title`);
        const artistEl = document.getElementById(`deck-${deck.toLowerCase()}-artist`);
        const durEl = document.getElementById(`deck-${deck.toLowerCase()}-dur`);
        const audio = deck === "A" ? audioA : audioB;

        if (titleEl) titleEl.textContent = item.title;
        if (artistEl) artistEl.textContent = `${item.artist} (${item.platform})`;
        if (durEl) durEl.textContent = item.duration;

        // Si ya tiene URL de streaming lista
        if (item.streamUrl) {
          audio.src = item.streamUrl;
          audio.load();
          return;
        }

        // Si es enlace directo de audio mp3/wav
        if (item.url && item.url.match(/\.(mp3|wav|ogg|m4a|aac)(\?.*)?$/i)) {
          item.streamUrl = item.url;
          audio.src = item.url;
          audio.load();
          return;
        }

        // Transcodificación bajo demanda al cargarse en el deck
        if (titleEl) titleEl.textContent = `Cargando audio: ${item.title}...`;
        try {
          const res = await fetch("/api/media/convert", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: item.url, format: "mp3", quality: "320k" })
          });
          const data = await res.json();
          if (data && data.status === "success" && data.streamUrl) {
            item.streamUrl = data.streamUrl;
            if (data.title) item.title = data.title;
            if (data.duration) item.duration = data.duration;
            renderQueue();

            if (titleEl) titleEl.textContent = item.title;
            if (artistEl) artistEl.textContent = `${item.artist} (${item.platform})`;
            if (durEl) durEl.textContent = item.duration;
            audio.src = data.streamUrl;
            audio.load();
          } else {
            if (titleEl) titleEl.textContent = item.title;
            alert(data.error || "No se pudo transcodificar el audio de esta pista.");
          }
        } catch (err) {
          if (titleEl) titleEl.textContent = item.title;
          console.warn("Error cargando pista al deck:", err);
        }
      }

      // =========================================================================
      // INTERACCIÓN DE SCRATCH ANALÓGICO PARA TORNAMESAS
      // =========================================================================
      function setupScratch(turntableId, audioEl, platterEl) {
        const turntable = document.getElementById(turntableId);
        if (!turntable) return;
        let isScratching = false;
        let lastX = 0;
        let rotationDeg = 0;
        let wasPlayingBeforeScratch = false;

        const onStart = (clientX) => {
          initWebAudio();
          isScratching = true;
          lastX = clientX;
          wasPlayingBeforeScratch = !audioEl.paused;
          if (wasPlayingBeforeScratch) {
            audioEl.pause();
          }
        };

        const onMove = (clientX) => {
          if (!isScratching) return;
          const deltaX = clientX - lastX;
          lastX = clientX;
          rotationDeg += deltaX * 1.6;
          platterEl.style.transform = `rotate(${rotationDeg}deg)`;
          if (audioEl.duration) {
            const scrubAmount = (deltaX / 180) * (Math.min(audioEl.duration, 120) * 0.015);
            audioEl.currentTime = Math.max(0, Math.min(audioEl.duration, audioEl.currentTime + scrubAmount));
          }
        };

        const onEnd = () => {
          if (!isScratching) return;
          isScratching = false;
          if (wasPlayingBeforeScratch) {
            audioEl.play().catch(console.warn);
          }
        };

        turntable.addEventListener("mousedown", (e) => onStart(e.clientX));
        window.addEventListener("mousemove", (e) => onMove(e.clientX));
        window.addEventListener("mouseup", onEnd);

        turntable.addEventListener("touchstart", (e) => {
          if (e.touches.length > 0) onStart(e.touches[0].clientX);
        }, { passive: true });
        window.addEventListener("touchmove", (e) => {
          if (e.touches.length > 0) onMove(e.touches[0].clientX);
        }, { passive: true });
        window.addEventListener("touchend", onEnd);
      }

      // =========================================================================
      // CONTROLES DECK A
      // =========================================================================
      const btnPlayA = document.getElementById("btn-play-a");
      const btnCueA = document.getElementById("btn-cue-a");
      const btnSyncA = document.getElementById("btn-sync-a");
      const platterA = document.getElementById("platter-a");
      const scrubberA = document.getElementById("scrubber-a");
      const pitchA = document.getElementById("pitch-a");
      const pitchAText = document.getElementById("pitch-a-text");
      const curTimeA = document.getElementById("deck-a-cur-time");
      const remTimeA = document.getElementById("deck-a-rem-time");
      const bpmAEl = document.getElementById("deck-a-bpm");
      const btnTapA = document.getElementById("btn-tap-a");
      const btnResetPitchA = document.getElementById("btn-reset-pitch-a");
      const loopABadge = document.getElementById("loop-a-badge");

      function updatePlayAState(playing) {
        if (playing) {
          btnPlayA.classList.add("active");
          platterA.classList.add("spinning");
          btnPlayA.innerHTML = `<svg class="icon play-icon" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg><span class="deck-tooltip-text" id="tooltip-play-a">Pausar</span>`;
        } else {
          btnPlayA.classList.remove("active");
          platterA.classList.remove("spinning");
          btnPlayA.innerHTML = `<svg class="icon play-icon" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg><span class="deck-tooltip-text" id="tooltip-play-a">Reproducir</span>`;
        }
      }

      btnPlayA.addEventListener("click", () => {
        initWebAudio();
        if (audioA.paused) {
          audioA.play().then(() => {
            updatePlayAState(true);
          }).catch(console.warn);
        } else {
          audioA.pause();
          updatePlayAState(false);
        }
      });

      btnCueA.addEventListener("click", () => {
        audioA.pause();
        audioA.currentTime = 0;
        updatePlayAState(false);
      });

      function updateBpmDisplayA() {
        const p = parseFloat(pitchA.value);
        currentBpmA = (baseBpmA * (1 + (p / 100))).toFixed(1);
        if (bpmAEl) bpmAEl.textContent = `${currentBpmA} BPM`;
      }

      // SYNC Deck A -> Empata con Deck B
      btnSyncA.addEventListener("click", () => {
        initWebAudio();
        pitchA.value = pitchB.value;
        const p = parseFloat(pitchA.value);
        pitchAText.textContent = `${p > 0 ? "+" : ""}${p.toFixed(1)}%`;
        audioA.playbackRate = Math.max(0.25, Math.min(2.0, 1 + (p / 100)));
        baseBpmA = baseBpmB;
        updateBpmDisplayA();
        if (!audioB.paused && audioB.duration && audioA.duration) {
          audioA.currentTime = audioB.currentTime % audioA.duration;
        }
        btnSyncA.classList.add("active-sync");
        setTimeout(() => btnSyncA.classList.remove("active-sync"), 1800);
      });

      pitchA.addEventListener("input", () => {
        const p = parseFloat(pitchA.value);
        pitchAText.textContent = `${p > 0 ? "+" : ""}${p.toFixed(1)}%`;
        audioA.playbackRate = Math.max(0.25, Math.min(2.0, 1 + (p / 100)));
        updateBpmDisplayA();
      });

      if (btnResetPitchA) {
        btnResetPitchA.addEventListener("click", () => {
          pitchA.value = 0;
          pitchAText.textContent = "0.0%";
          audioA.playbackRate = 1.0;
          updateBpmDisplayA();
        });
      }

      // TAP Tempo Deck A
      if (btnTapA) {
        btnTapA.addEventListener("click", () => {
          const now = performance.now();
          tapTimesA.push(now);
          if (tapTimesA.length > 5) tapTimesA.shift();
          if (tapTimesA.length >= 2) {
            const first = tapTimesA[0];
            const last = tapTimesA[tapTimesA.length - 1];
            if ((last - tapTimesA[tapTimesA.length - 2]) > 2200) {
              tapTimesA = [now];
              return;
            }
            const avgInterval = (last - first) / (tapTimesA.length - 1);
            const calculatedBpm = Math.round(60000 / avgInterval);
            if (calculatedBpm >= 60 && calculatedBpm <= 190) {
              baseBpmA = calculatedBpm;
              updateBpmDisplayA();
            }
          }
        });
      }

      // Hot Cues Deck A (Pads 1 - 4)
      for (let i = 0; i < 4; i++) {
        const pad = document.getElementById(`cue-a-${i + 1}`);
        if (pad) {
          pad.addEventListener("click", () => {
            initWebAudio();
            if (hotCuesA[i] === null) {
              // Asignar CUE en posición actual
              hotCuesA[i] = audioA.currentTime;
              const m = Math.floor(hotCuesA[i] / 60);
              const s = Math.floor(hotCuesA[i] % 60);
              pad.querySelector(".hot-cue-time").textContent = `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
              pad.classList.add("pad-set");
            } else {
              // Saltar instantáneamente al CUE
              audioA.currentTime = hotCuesA[i];
              if (audioA.paused) {
                audioA.play().then(() => updatePlayAState(true)).catch(console.warn);
              }
            }
          });

          // Clic derecho para borrar CUE
          pad.addEventListener("contextmenu", (e) => {
            e.preventDefault();
            hotCuesA[i] = null;
            pad.querySelector(".hot-cue-time").textContent = "--:--";
            pad.classList.remove("pad-set");
          });
        }
      }

      // Beat Looping Deck A
      document.querySelectorAll(".btn-loop-a").forEach(btn => {
        btn.addEventListener("click", () => {
          initWebAudio();
          const beats = parseFloat(btn.getAttribute("data-beats"));
          document.querySelectorAll(".btn-loop-a").forEach(b => b.classList.remove("active-loop"));
          btn.classList.add("active-loop");

          const secondsPerBeat = 60 / parseFloat(currentBpmA);
          const loopDuration = beats * secondsPerBeat;
          activeLoopA = {
            beats,
            loopStart: audioA.currentTime,
            loopEnd: audioA.currentTime + loopDuration
          };
          if (loopABadge) {
            loopABadge.textContent = `${beats} BEAT${beats === 1 ? '' : 'S'}`;
            loopABadge.style.color = "#10b981";
          }
        });
      });

      const btnLoopAExit = document.getElementById("btn-loop-a-exit");
      if (btnLoopAExit) {
        btnLoopAExit.addEventListener("click", () => {
          activeLoopA = null;
          document.querySelectorAll(".btn-loop-a").forEach(b => b.classList.remove("active-loop"));
          if (loopABadge) {
            loopABadge.textContent = "OFF";
            loopABadge.style.color = "var(--text-muted)";
          }
        });
      }

      // Bucle infinito Auto-DJ: Alternancia Deck A -> Deck B
      let autoTransitioningToB = false;
      let autoTransitioningToA = false;

      audioA.addEventListener("timeupdate", () => {
        if (!audioA.duration) return;

        // Gestión Beat Loop Activo
        if (activeLoopA && audioA.currentTime >= activeLoopA.loopEnd) {
          audioA.currentTime = activeLoopA.loopStart;
        }

        scrubberA.value = (audioA.currentTime / audioA.duration) * 100;
        const curM = Math.floor(audioA.currentTime / 60);
        const curS = Math.floor(audioA.currentTime % 60);
        curTimeA.textContent = `${String(curM).padStart(2, "0")}:${String(curS).padStart(2, "0")}`;

        const rem = audioA.duration - audioA.currentTime;
        const remM = Math.floor(rem / 60);
        const remS = Math.floor(rem % 60);
        remTimeA.textContent = `-${String(remM).padStart(2, "0")}:${String(remS).padStart(2, "0")}`;

        // Auto-DJ: A los 8 segundos restantes, iniciar Deck B y crossfade suave
        if (isAutoDJ && rem <= 8 && !autoTransitioningToB) {
          autoTransitioningToB = true;
          if (audioB.src && audioB.paused) {
            audioB.play().then(() => updatePlayBState(true)).catch(console.warn);
          }
          triggerAutoCrossfade("B");
        }
      });

      audioA.addEventListener("ended", () => {
        updatePlayAState(false);
        autoTransitioningToB = false;

        // Auto-DJ Infinito: Cargar siguiente pista de la cola en Deck A sin eliminarla
        if (isAutoDJ && djQueue.length > 0) {
          currentQueueTrackIndex = (currentQueueTrackIndex + 1) % djQueue.length;
          const nextTrack = djQueue[currentQueueTrackIndex];
          loadTrackToDeck(nextTrack, "A");
        }
      });

      scrubberA.addEventListener("input", () => {
        if (!audioA.duration) return;
        audioA.currentTime = (scrubberA.value / 100) * audioA.duration;
      });

      // =========================================================================
      // CONTROLES DECK B
      // =========================================================================
      const btnPlayB = document.getElementById("btn-play-b");
      const btnCueB = document.getElementById("btn-cue-b");
      const btnSyncB = document.getElementById("btn-sync-b");
      const platterB = document.getElementById("platter-b");
      const scrubberB = document.getElementById("scrubber-b");
      const pitchB = document.getElementById("pitch-b");
      const pitchBText = document.getElementById("pitch-b-text");
      const curTimeB = document.getElementById("deck-b-cur-time");
      const remTimeB = document.getElementById("deck-b-rem-time");
      const bpmBEl = document.getElementById("deck-b-bpm");
      const btnTapB = document.getElementById("btn-tap-b");
      const btnResetPitchB = document.getElementById("btn-reset-pitch-b");
      const loopBBadge = document.getElementById("loop-b-badge");

      function updatePlayBState(playing) {
        if (playing) {
          btnPlayB.classList.add("active");
          platterB.classList.add("spinning");
          btnPlayB.innerHTML = `<svg class="icon play-icon" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg><span class="deck-tooltip-text" id="tooltip-play-b">Pausar</span>`;
        } else {
          btnPlayB.classList.remove("active");
          platterB.classList.remove("spinning");
          btnPlayB.innerHTML = `<svg class="icon play-icon" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg><span class="deck-tooltip-text" id="tooltip-play-b">Reproducir</span>`;
        }
      }

      btnPlayB.addEventListener("click", () => {
        initWebAudio();
        if (audioB.paused) {
          audioB.play().then(() => {
            updatePlayBState(true);
          }).catch(console.warn);
        } else {
          audioB.pause();
          updatePlayBState(false);
        }
      });

      btnCueB.addEventListener("click", () => {
        audioB.pause();
        audioB.currentTime = 0;
        updatePlayBState(false);
      });

      function updateBpmDisplayB() {
        const p = parseFloat(pitchB.value);
        currentBpmB = (baseBpmB * (1 + (p / 100))).toFixed(1);
        if (bpmBEl) bpmBEl.textContent = `${currentBpmB} BPM`;
      }

      // SYNC Deck B -> Empata con Deck A
      btnSyncB.addEventListener("click", () => {
        initWebAudio();
        pitchB.value = pitchA.value;
        const p = parseFloat(pitchB.value);
        pitchBText.textContent = `${p > 0 ? "+" : ""}${p.toFixed(1)}%`;
        audioB.playbackRate = Math.max(0.25, Math.min(2.0, 1 + (p / 100)));
        baseBpmB = baseBpmA;
        updateBpmDisplayB();
        if (!audioA.paused && audioA.duration && audioB.duration) {
          audioB.currentTime = audioA.currentTime % audioB.duration;
        }
        btnSyncB.classList.add("active-sync");
        setTimeout(() => btnSyncB.classList.remove("active-sync"), 1800);
      });

      pitchB.addEventListener("input", () => {
        const p = parseFloat(pitchB.value);
        pitchBText.textContent = `${p > 0 ? "+" : ""}${p.toFixed(1)}%`;
        audioB.playbackRate = Math.max(0.25, Math.min(2.0, 1 + (p / 100)));
        updateBpmDisplayB();
      });

      if (btnResetPitchB) {
        btnResetPitchB.addEventListener("click", () => {
          pitchB.value = 0;
          pitchBText.textContent = "0.0%";
          audioB.playbackRate = 1.0;
          updateBpmDisplayB();
        });
      }

      // TAP Tempo Deck B
      if (btnTapB) {
        btnTapB.addEventListener("click", () => {
          const now = performance.now();
          tapTimesB.push(now);
          if (tapTimesB.length > 5) tapTimesB.shift();
          if (tapTimesB.length >= 2) {
            const first = tapTimesB[0];
            const last = tapTimesB[tapTimesB.length - 1];
            if ((last - tapTimesB[tapTimesB.length - 2]) > 2200) {
              tapTimesB = [now];
              return;
            }
            const avgInterval = (last - first) / (tapTimesB.length - 1);
            const calculatedBpm = Math.round(60000 / avgInterval);
            if (calculatedBpm >= 60 && calculatedBpm <= 190) {
              baseBpmB = calculatedBpm;
              updateBpmDisplayB();
            }
          }
        });
      }

      // Hot Cues Deck B (Pads 1 - 4)
      for (let i = 0; i < 4; i++) {
        const pad = document.getElementById(`cue-b-${i + 1}`);
        if (pad) {
          pad.addEventListener("click", () => {
            initWebAudio();
            if (hotCuesB[i] === null) {
              // Asignar CUE en posición actual
              hotCuesB[i] = audioB.currentTime;
              const m = Math.floor(hotCuesB[i] / 60);
              const s = Math.floor(hotCuesB[i] % 60);
              pad.querySelector(".hot-cue-time").textContent = `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
              pad.classList.add("pad-set");
            } else {
              // Saltar instantáneamente al CUE
              audioB.currentTime = hotCuesB[i];
              if (audioB.paused) {
                audioB.play().then(() => updatePlayBState(true)).catch(console.warn);
              }
            }
          });

          // Clic derecho para borrar CUE
          pad.addEventListener("contextmenu", (e) => {
            e.preventDefault();
            hotCuesB[i] = null;
            pad.querySelector(".hot-cue-time").textContent = "--:--";
            pad.classList.remove("pad-set");
          });
        }
      }

      // Beat Looping Deck B
      document.querySelectorAll(".btn-loop-b").forEach(btn => {
        btn.addEventListener("click", () => {
          initWebAudio();
          const beats = parseFloat(btn.getAttribute("data-beats"));
          document.querySelectorAll(".btn-loop-b").forEach(b => b.classList.remove("active-loop"));
          btn.classList.add("active-loop");

          const secondsPerBeat = 60 / parseFloat(currentBpmB);
          const loopDuration = beats * secondsPerBeat;
          activeLoopB = {
            beats,
            loopStart: audioB.currentTime,
            loopEnd: audioB.currentTime + loopDuration
          };
          if (loopBBadge) {
            loopBBadge.textContent = `${beats} BEAT${beats === 1 ? '' : 'S'}`;
            loopBBadge.style.color = "#ff007b";
          }
        });
      });

      const btnLoopBExit = document.getElementById("btn-loop-b-exit");
      if (btnLoopBExit) {
        btnLoopBExit.addEventListener("click", () => {
          activeLoopB = null;
          document.querySelectorAll(".btn-loop-b").forEach(b => b.classList.remove("active-loop"));
          if (loopBBadge) {
            loopBBadge.textContent = "OFF";
            loopBBadge.style.color = "var(--text-muted)";
          }
        });
      }

      // Bucle infinito Auto-DJ: Alternancia Deck B -> Deck A
      audioB.addEventListener("timeupdate", () => {
        if (!audioB.duration) return;

        // Gestión Beat Loop Activo
        if (activeLoopB && audioB.currentTime >= activeLoopB.loopEnd) {
          audioB.currentTime = activeLoopB.loopStart;
        }

        scrubberB.value = (audioB.currentTime / audioB.duration) * 100;
        const curM = Math.floor(audioB.currentTime / 60);
        const curS = Math.floor(audioB.currentTime % 60);
        curTimeB.textContent = `${String(curM).padStart(2, "0")}:${String(curS).padStart(2, "0")}`;

        const rem = audioB.duration - audioB.currentTime;
        const remM = Math.floor(rem / 60);
        const remS = Math.floor(rem % 60);
        remTimeB.textContent = `-${String(remM).padStart(2, "0")}:${String(remS).padStart(2, "0")}`;

        // Auto-DJ: A los 8 segundos restantes, iniciar Deck A y crossfade suave
        if (isAutoDJ && rem <= 8 && !autoTransitioningToA) {
          autoTransitioningToA = true;
          if (audioA.src && audioA.paused) {
            audioA.play().then(() => updatePlayAState(true)).catch(console.warn);
          }
          triggerAutoCrossfade("A");
        }
      });

      audioB.addEventListener("ended", () => {
        updatePlayBState(false);
        autoTransitioningToA = false;

        // Auto-DJ Infinito: Cargar siguiente pista de la cola en Deck B sin eliminarla
        if (isAutoDJ && djQueue.length > 0) {
          currentQueueTrackIndex = (currentQueueTrackIndex + 1) % djQueue.length;
          const nextTrack = djQueue[currentQueueTrackIndex];
          loadTrackToDeck(nextTrack, "B");
        }
      });

      scrubberB.addEventListener("input", () => {
        if (!audioB.duration) return;
        audioB.currentTime = (scrubberB.value / 100) * audioB.duration;
      });

      // =========================================================================
      // CROSSFADER, VOLUMEN & SOUND COLOR FX FILTERS
      // =========================================================================
      const crossfader = document.getElementById("crossfader");
      let isAutoDJ = true;
      let channelVolA = 1.0;
      let channelVolB = 1.0;

      function updateCrossfader(val) {
        const x = val / 100; // 0 = solo A, 1 = solo B, 0.5 = centro
        const gainValA = Math.cos(x * 0.5 * Math.PI) * channelVolA;
        const gainValB = Math.cos((1 - x) * 0.5 * Math.PI) * channelVolB;

        if (gainA) gainA.gain.value = gainValA;
        if (gainB) gainB.gain.value = gainValB;

        if (!audioCtx) {
          audioA.volume = Math.max(0, Math.min(1, gainValA));
          audioB.volume = Math.max(0, Math.min(1, gainValB));
        }
      }

      const sliderVolA = document.getElementById("vol-a");
      const sliderVolB = document.getElementById("vol-b");
      if (sliderVolA) {
        sliderVolA.addEventListener("input", () => {
          initWebAudio();
          channelVolA = parseFloat(sliderVolA.value);
          updateCrossfader(crossfader.value);
        });
      }
      if (sliderVolB) {
        sliderVolB.addEventListener("input", () => {
          initWebAudio();
          channelVolB = parseFloat(sliderVolB.value);
          updateCrossfader(crossfader.value);
        });
      }

      crossfader.addEventListener("input", () => {
        initWebAudio();
        updateCrossfader(crossfader.value);
      });

      document.getElementById("btn-fade-left").addEventListener("click", () => triggerAutoCrossfade("A"));
      document.getElementById("btn-fade-center").addEventListener("click", () => {
        crossfader.value = 50;
        updateCrossfader(50);
      });
      document.getElementById("btn-fade-right").addEventListener("click", () => triggerAutoCrossfade("B"));

      function triggerAutoCrossfade(target) {
        initWebAudio();
        const startVal = parseFloat(crossfader.value);
        const endVal = target === "A" ? 0 : 100;
        const steps = 30;
        const intervalTime = 50;
        let step = 0;

        const timer = setInterval(() => {
          step++;
          const curVal = startVal + ((endVal - startVal) * (step / steps));
          crossfader.value = curVal;
          updateCrossfader(curVal);
          if (step >= steps) clearInterval(timer);
        }, intervalTime);
      }

      const btnAutoDJ = document.getElementById("btn-auto-dj");
      btnAutoDJ.addEventListener("click", () => {
        isAutoDJ = !isAutoDJ;
        btnAutoDJ.innerHTML = `<svg class="icon" viewBox="0 0 24 24" style="width: 15px; height: 15px;"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> <span>Auto-DJ: ${isAutoDJ ? "ACTIVADO" : "DESACTIVADO"}</span>`;
        if (isAutoDJ) {
          btnAutoDJ.className = "btn btn-primary";
          btnAutoDJ.style.background = "";
          btnAutoDJ.style.color = "";
          btnAutoDJ.style.boxShadow = "";
        } else {
          btnAutoDJ.className = "btn";
          btnAutoDJ.style.background = "rgba(255, 255, 255, 0.08)";
          btnAutoDJ.style.color = "var(--text-secondary)";
          btnAutoDJ.style.boxShadow = "none";
        }
      });

      // Controles Color FX Filter (Deck A y Deck B)
      const sliderFilterA = document.getElementById("filter-a");
      const filterAValText = document.getElementById("filter-a-val");
      const sliderFilterB = document.getElementById("filter-b");
      const filterBValText = document.getElementById("filter-b-val");

      function applyColorFilter(val, filterNode, textEl) {
        if (!filterNode) return;
        const v = parseFloat(val);
        if (Math.abs(v) < 3) {
          filterNode.type = "lowpass";
          filterNode.frequency.value = 22050;
          filterNode.Q.value = 0.5;
          if (textEl) textEl.textContent = "FLAT";
        } else if (v < 0) {
          // Low Pass Filter sweep hacia abajo (corta agudos)
          filterNode.type = "lowpass";
          filterNode.Q.value = 2.4;
          const ratio = -v / 100;
          const freq = 20000 * Math.pow(160 / 20000, ratio);
          filterNode.frequency.value = freq;
          if (textEl) textEl.textContent = `LPF ${Math.round(freq)}Hz`;
        } else {
          // High Pass Filter sweep hacia arriba (corta graves)
          filterNode.type = "highpass";
          filterNode.Q.value = 2.4;
          const ratio = v / 100;
          const freq = 25 * Math.pow(8500 / 25, ratio);
          filterNode.frequency.value = freq;
          if (textEl) textEl.textContent = `HPF ${Math.round(freq)}Hz`;
        }
      }

      if (sliderFilterA) {
        sliderFilterA.addEventListener("input", () => {
          initWebAudio();
          applyColorFilter(sliderFilterA.value, filterA, filterAValText);
        });
        sliderFilterA.addEventListener("dblclick", () => {
          sliderFilterA.value = 0;
          applyColorFilter(0, filterA, filterAValText);
        });
      }

      if (sliderFilterB) {
        sliderFilterB.addEventListener("input", () => {
          initWebAudio();
          applyColorFilter(sliderFilterB.value, filterB, filterBValText);
        });
        sliderFilterB.addEventListener("dblclick", () => {
          sliderFilterB.value = 0;
          applyColorFilter(0, filterB, filterBValText);
        });
      }

      // Ecualizadores Dinámicos (EQ de 3 Bandas)
      const eqMap = {
        "eq-hi-a": () => eqHiA,
        "eq-mid-a": () => eqMidA,
        "eq-low-a": () => eqLowA,
        "eq-low-b": () => eqLowB,
        "eq-mid-b": () => eqMidB,
        "eq-hi-b": () => eqHiB
      };

      Object.keys(eqMap).forEach(sliderId => {
        const slider = document.getElementById(sliderId);
        if (slider) {
          slider.addEventListener("input", () => {
            initWebAudio();
            const filterNode = eqMap[sliderId]();
            if (filterNode && filterNode.gain) {
              filterNode.gain.value = parseFloat(slider.value);
            }
          });
        }
      });

      // =========================================================================
      // DJ SAMPLER FX PADS (SINTETIZADOS CON WEB AUDIO API)
      // =========================================================================
      function playAirHorn() {
        initWebAudio();
        const now = audioCtx.currentTime;
        const notes = [
          { time: 0.00, dur: 0.12, freq: 880 },
          { time: 0.14, dur: 0.12, freq: 880 },
          { time: 0.28, dur: 0.38, freq: 932 }
        ];
        notes.forEach(n => {
          const osc = audioCtx.createOscillator();
          const g = audioCtx.createGain();
          const bpf = audioCtx.createBiquadFilter();
          bpf.type = "bandpass";
          bpf.frequency.value = n.freq * 1.4;
          bpf.Q.value = 2.8;

          osc.type = "sawtooth";
          osc.frequency.setValueAtTime(n.freq, now + n.time);
          osc.frequency.exponentialRampToValueAtTime(n.freq * 0.94, now + n.time + n.dur);

          g.gain.setValueAtTime(0.001, now + n.time);
          g.gain.linearRampToValueAtTime(0.4, now + n.time + 0.02);
          g.gain.exponentialRampToValueAtTime(0.001, now + n.time + n.dur);

          osc.connect(bpf);
          bpf.connect(g);
          g.connect(audioCtx.destination);

          osc.start(now + n.time);
          osc.stop(now + n.time + n.dur);
        });
      }

      function playDubSiren() {
        initWebAudio();
        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const lfo = audioCtx.createOscillator();
        const lfoGain = audioCtx.createGain();
        const mainGain = audioCtx.createGain();

        osc.type = "square";
        lfo.type = "sawtooth";
        lfo.frequency.value = 5.5; // modulación 5.5 Hz
        lfoGain.gain.value = 420;

        osc.frequency.setValueAtTime(780, now);
        lfo.connect(osc.frequency);

        mainGain.gain.setValueAtTime(0.001, now);
        mainGain.gain.linearRampToValueAtTime(0.32, now + 0.04);
        mainGain.gain.exponentialRampToValueAtTime(0.001, now + 1.25);

        osc.connect(mainGain);
        mainGain.connect(audioCtx.destination);

        lfo.start(now);
        osc.start(now);
        lfo.stop(now + 1.25);
        osc.stop(now + 1.25);
      }

      function play808Drop() {
        initWebAudio();
        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(145, now);
        osc.frequency.exponentialRampToValueAtTime(32, now + 1.1);

        gain.gain.setValueAtTime(0.65, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.25);

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start(now);
        osc.stop(now + 1.25);
      }

      function triggerVinylBrake() {
        const decksToBrake = [];
        if (!audioA.paused) decksToBrake.push({ audio: audioA, update: updatePlayAState });
        if (!audioB.paused) decksToBrake.push({ audio: audioB, update: updatePlayBState });
        if (decksToBrake.length === 0) return;

        decksToBrake.forEach(({ audio, update }) => {
          const startRate = audio.playbackRate || 1.0;
          const duration = 750; // ms
          const startTime = performance.now();
          const step = (now) => {
            const elapsed = now - startTime;
            const progress = Math.min(1, elapsed / duration);
            if (progress < 1) {
              audio.playbackRate = Math.max(0.05, startRate * (1 - progress));
              requestAnimationFrame(step);
            } else {
              audio.playbackRate = 1.0;
              audio.pause();
              update(false);
            }
          };
          requestAnimationFrame(step);
        });
      }

      // Eventos Sampler Pads
      const btnFxHorn = document.getElementById("btn-fx-horn");
      const btnFxSiren = document.getElementById("btn-fx-siren");
      const btnFxDrop = document.getElementById("btn-fx-drop");
      const btnFxBrake = document.getElementById("btn-fx-brake");

      function triggerPadVisual(el) {
        if (!el) return;
        el.classList.add("fired");
        setTimeout(() => el.classList.remove("fired"), 250);
      }

      if (btnFxHorn) {
        btnFxHorn.addEventListener("click", () => {
          triggerPadVisual(btnFxHorn);
          playAirHorn();
        });
      }
      if (btnFxSiren) {
        btnFxSiren.addEventListener("click", () => {
          triggerPadVisual(btnFxSiren);
          playDubSiren();
        });
      }
      if (btnFxDrop) {
        btnFxDrop.addEventListener("click", () => {
          triggerPadVisual(btnFxDrop);
          play808Drop();
        });
      }
      if (btnFxBrake) {
        btnFxBrake.addEventListener("click", () => {
          triggerPadVisual(btnFxBrake);
          triggerVinylBrake();
        });
      }

      // =========================================================================
      // VISUALIZADOR DE ONDAS SONORAS EN VIVO & MEDIDORES STEREO LED VU
      // =========================================================================
      const canvasA = document.getElementById("waveform-a");
      const ctxA = canvasA ? canvasA.getContext("2d") : null;
      const canvasB = document.getElementById("waveform-b");
      const ctxB = canvasB ? canvasB.getContext("2d") : null;

      const vuLedsA = document.querySelectorAll("#vu-leds-a .vu-led");
      const vuLedsB = document.querySelectorAll("#vu-leds-b .vu-led");

      function updateVuMeter(leds, level) {
        // level: 0.0 - 1.0
        const activeCount = Math.min(5, Math.floor(level * 5.8));
        leds.forEach((led, i) => {
          led.className = "vu-led";
          if (i < activeCount) {
            if (i < 3) led.classList.add("active-green");
            else if (i < 4) led.classList.add("active-yellow");
            else led.classList.add("active-red");
          }
        });
      }

      function drawWaveform(canvas, ctx, analyser, audioEl, colorHex) {
        if (!canvas || !ctx) return;
        const w = canvas.width;
        const h = canvas.height;
        ctx.clearRect(0, 0, w, h);

        // Fondo oscuro con rejilla sutil
        ctx.fillStyle = "rgba(6, 8, 14, 0.9)";
        ctx.fillRect(0, 0, w, h);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, h / 2);
        ctx.lineTo(w, h / 2);
        ctx.stroke();

        let avgLevel = 0;

        if (analyser && !audioEl.paused) {
          const bufferLength = analyser.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);
          analyser.getByteFrequencyData(dataArray);

          const barWidth = (w / bufferLength) * 1.5;
          let x = 0;
          let sum = 0;

          for (let i = 0; i < bufferLength; i++) {
            const v = dataArray[i];
            sum += v;
            const barHeight = (v / 255) * (h * 0.85);

            ctx.fillStyle = colorHex;
            ctx.shadowColor = colorHex;
            ctx.shadowBlur = 6;
            ctx.fillRect(x, (h - barHeight) / 2, Math.max(2, barWidth - 2), barHeight);

            x += barWidth;
          }
          ctx.shadowBlur = 0;
          avgLevel = (sum / bufferLength) / 255;
        } else {
          // Línea de reposo sutil
          ctx.strokeStyle = colorHex;
          ctx.lineWidth = 1.5;
          ctx.globalAlpha = 0.35;
          ctx.beginPath();
          ctx.moveTo(0, h / 2);
          ctx.lineTo(w, h / 2);
          ctx.stroke();
          ctx.globalAlpha = 1.0;
        }

        // Cabeza lectora de posición (playhead)
        if (audioEl.duration) {
          const playheadX = (audioEl.currentTime / audioEl.duration) * w;
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(playheadX, 0);
          ctx.lineTo(playheadX, h);
          ctx.stroke();
        }

        return avgLevel;
      }

      function startVisualizerLoop() {
        function renderFrame() {
          const levelA = drawWaveform(canvasA, ctxA, analyserA, audioA, "#00f0ff");
          const levelB = drawWaveform(canvasB, ctxB, analyserB, audioB, "#ff007b");

          updateVuMeter(vuLedsA, levelA || 0);
          updateVuMeter(vuLedsB, levelB || 0);

          requestAnimationFrame(renderFrame);
        }
        renderFrame();
      }

      // Scratch interactivo en ambas tornamesas
      setupScratch("turntable-a", audioA, platterA);
      setupScratch("turntable-b", audioB, platterB);

      // Render inicial de la cola
      renderQueue();

      // Deck A y B inician en espera de pistas del usuario
    });

})(window, document);
