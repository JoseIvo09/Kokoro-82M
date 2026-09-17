/* ============================================================
   KOKORO LOADER — Voz neural 100% no navegador
   ============================================================
   - Sem servidor, sem chaves, sem custos
   - Usa a biblioteca kokoro-js (ONNX Runtime Web) via CDN
   - Modelo baixado uma única vez (~220 MB) → cache do navegador
   - Funciona offline após o primeiro carregamento
   - Se falhar por qualquer motivo, retorna false e o jogo
     usa automaticamente a voz do dispositivo (speechSynthesis)
   ============================================================ */
const KOKORO = (() => {
  'use strict';

  const CONFIG = {
    // Biblioteca kokoro-js (CDN jsdelivr — com CORS liberado)
    libUrl: 'https://cdn.jsdelivr.net/npm/kokoro-js@1.2.1/+esm',
    // ONNX Runtime Web (necessário para rodar o modelo)
    onnxBase: 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.19.2/dist/',
    // Modelo Kokoro-82M (HuggingFace — com CORS liberado)
    modelRepo: 'onnx-community/Kokoro-82M-v1.0-ONNX',
    dtype: 'q8',
    sampleRate: 24000,
    defaultVoice: 'af_heart', // Voz multilingue mais natural
    maxCacheEntries: 40
  };

  // Vozes disponíveis no Kokoro (multilingues — leem PT-BR com sotaque natural)
  const VOICES = [
    { id: 'af_heart',    name: 'Coração — suave (multilíngue)' },
    { id: 'af_bella',    name: 'Bella — feminina clara' },
    { id: 'af_nicole',   name: 'Nicole — feminina' },
    { id: 'am_adam',     name: 'Adam — masculino' },
    { id: 'am_michael',  name: 'Michael — masculino profundo' },
    { id: 'bf_emma',     name: 'Emma — British feminina' },
    { id: 'bm_george',   name: 'George — British masculino' }
  ];

  let ttsInstance = null;
  let isLoading = false;
  let loadError = null;
  let audioCtx = null;
  let currentSource = null;
  let currentAudio = null;
  let requestId = 0;
  const audioCache = new Map(); // texto → Blob URL (cache de geração)

  // Callback de status (substituído pelo jogo)
  let statusCallback = (msg, pct) => {
    console.log(`[Kokoro] ${msg} ${pct !== null ? `(${pct}%)` : ''}`);
  };

  function setStatusCallback(fn) {
    if (typeof fn === 'function') statusCallback = fn;
  }

  function status(msg, pct = null) {
    try { statusCallback(msg, pct); } catch {}
  }

  function getAudioContext() {
    if (!audioCtx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) throw new Error('Web Audio API não suportada');
      audioCtx = new AC();
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  }

  // Interrompe qualquer áudio Kokoro tocando
  function stop() {
    requestId++;
    if (currentSource) {
      try { currentSource.stop(); } catch {}
      currentSource = null;
    }
    if (currentAudio) {
      try {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      } catch {}
      currentAudio = null;
    }
    document.body.classList.remove('speaking');
  }

  // Carrega o modelo (lazy — só na primeira fala)
  async function load() {
    if (ttsInstance) return ttsInstance;
    if (loadError) throw loadError;
    if (isLoading) {
      // Espera o carregamento em andamento
      return new Promise((resolve, reject) => {
        const check = setInterval(() => {
          if (ttsInstance) { clearInterval(check); resolve(ttsInstance); }
          if (loadError) { clearInterval(check); reject(loadError); }
        }, 150);
      });
    }

    isLoading = true;
    status('Iniciando Kokoro...', 0);

    try {
      // 1) Importa a biblioteca dinamicamente
      const module = await import(CONFIG.libUrl);
      const KokoroTTS = module.KokoroTTS || module.default?.KokoroTTS;
      if (!KokoroTTS) throw new Error('Biblioteca kokoro-js inválida');

      // 2) Configura o ONNX Runtime e carrega o modelo pela API oficial.
      if (module.env) module.env.wasmPaths = CONFIG.onnxBase;
      status('Carregando modelo neural...', 5);
      ttsInstance = await KokoroTTS.from_pretrained(CONFIG.modelRepo, {
        dtype: CONFIG.dtype,
        device: 'wasm',
        progress_callback: progress => {
          const raw = Number(progress?.progress);
          const pct = Number.isFinite(raw) ? Math.round(raw) : null;
          const file = progress?.file ? ` — ${progress.file}` : '';
          status(pct === null ? `Carregando modelo${file}...` : `Baixando modelo... ${pct}%`, pct);
        }
      });
      status('Kokoro pronto ✅', 100);
      isLoading = false;
      return ttsInstance;
    } catch (err) {
      isLoading = false;
      loadError = err;
      status(`Kokoro indisponível: ${err.message}`, 0);
      throw err;
    }
  }

  // Reproduz um Float32Array via Web Audio API
  function playFloat32(float32Array, sampleRate, onEnded, playbackRate = 1) {
    const ctx = getAudioContext();
    const buffer = ctx.createBuffer(1, float32Array.length, sampleRate);
    buffer.getChannelData(0).set(float32Array);

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = playbackRate;
    source.connect(ctx.destination);
    currentSource = source;

    source.onended = () => {
      if (currentSource === source) currentSource = null;
      document.body.classList.remove('speaking');
      if (onEnded) onEnded();
    };

    source.start(0);
    document.body.classList.add('speaking');
    return source;
  }

  // Fala um texto. Retorna true se conseguiu, false se falhou (para fallback).
  async function speak(text, options = {}) {
    if (!text || !text.trim()) return false;

    const voice = options.voice || CONFIG.defaultVoice;
    const rate = options.rate || 1.0; // Kokoro usa speed ~1.0
    const cacheKey = `${text}|${voice}|${rate.toFixed(2)}`;
    const myRequestId = ++requestId;

    // 1) Tenta cache primeiro (já gerado anteriormente)
    if (audioCache.has(cacheKey)) {
      try {
        const blobUrl = audioCache.get(cacheKey);
        const audio = new Audio(blobUrl);
        audio.playbackRate = options.playbackRate || 1;
        currentAudio = audio;
        currentSource = null;
        document.body.classList.add('speaking');
        audio.onended = () => {
          if (currentAudio === audio) currentAudio = null;
          document.body.classList.remove('speaking');
          if (options.onEnded) options.onEnded();
        };
        audio.onerror = () => {
          if (currentAudio === audio) currentAudio = null;
          audioCache.delete(cacheKey);
          document.body.classList.remove('speaking');
        };
        await audio.play();
        return true;
      } catch {
        audioCache.delete(cacheKey);
      }
    }

    // 2) Garante que o modelo está carregado
    try {
      await load();
    } catch {
      return false; // falhou ao carregar → caller usa fallback
    }
    if (myRequestId !== requestId) return false;

    // 3) Gera o áudio
    try {
      status('Gerando voz...', null);
      let result;

      // API kokoro-js: tts.generate(text, { voice, speed })
      if (typeof ttsInstance.generate === 'function') {
        result = await ttsInstance.generate(text, { voice, speed: rate });
      } else if (typeof ttsInstance.synthesize === 'function') {
        result = await ttsInstance.synthesize(text, { voice, speed: rate });
      } else {
        throw new Error('API desconhecida do kokoro-js');
      }

      if (myRequestId !== requestId) return false;

      // RawAudio usa .audio/.sampling_rate; mantemos compatibilidade com outras versões.
      const audioData = result?.audio || result?.data || result;
      const sr = result?.sampling_rate || result?.sampleRate || CONFIG.sampleRate;

      if (!audioData || audioData.length === 0) {
        throw new Error('Áudio gerado vazio');
      }

      // 4) Cache em Blob para próximas vezes
      try {
        const wavBlob = float32ToWav(audioData, sr);
        const blobUrl = URL.createObjectURL(wavBlob);
        if (audioCache.size >= CONFIG.maxCacheEntries) {
          const firstKey = audioCache.keys().next().value;
          URL.revokeObjectURL(audioCache.get(firstKey));
          audioCache.delete(firstKey);
        }
        audioCache.set(cacheKey, blobUrl);
      } catch {}

      // 5) Reproduz
      playFloat32(audioData, sr, options.onEnded, options.playbackRate || 1);
      return true;
    } catch (err) {
      status(`Erro ao gerar voz: ${err.message}`, 0);
      return false;
    }
  }

  // Converte Float32Array → WAV Blob (para cache)
  function float32ToWav(samples, sampleRate) {
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);
    const writeStr = (offset, str) => {
      for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
    };
    writeStr(0, 'RIFF');
    view.setUint32(4, 36 + samples.length * 2, true);
    writeStr(8, 'WAVE');
    writeStr(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM
    view.setUint16(22, 1, true); // mono
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeStr(36, 'data');
    view.setUint32(40, samples.length * 2, true);
    let offset = 44;
    for (let i = 0; i < samples.length; i++, offset += 2) {
      const s = Math.max(-1, Math.min(1, samples[i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
    return new Blob([buffer], { type: 'audio/wav' });
  }

  function isReady() { return !!ttsInstance; }
  function isLoadingState() { return isLoading; }
  function getVoices() { return [...VOICES]; }
  function getDefaultVoice() { return CONFIG.defaultVoice; }

  // Limpa cache (por exemplo, ao trocar de voz)
  function clearCache() {
    audioCache.forEach(url => { try { URL.revokeObjectURL(url); } catch {} });
    audioCache.clear();
  }

  function retryLoad() {
    loadError = null;
    return load();
  }

  return {
    load,
    speak,
    stop,
    isReady,
    isLoading: isLoadingState,
    getVoices,
    getDefaultVoice,
    clearCache,
    retryLoad,
    setStatusCallback
  };
})();
