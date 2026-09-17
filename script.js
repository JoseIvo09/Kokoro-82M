/* ============================================================
   COMPLETE A PALAVRA — Versão KOKORO (voz 100% no navegador)
   ============================================================
   Sistema de fala HÍBRIDO:
   - Kokoro (voz neural local, sem servidor) → primário
   - speechSynthesis (voz do dispositivo) → fallback automático
   Sem chaves, sem custos, funciona offline após 1º carregamento.
   ============================================================ */
(() => {
  'use strict';

  // ==========================================================
  // BANCO DE PALAVRAS (fallback embutido — 42 itens)
  // ==========================================================
  const FALLBACK_ITEMS = [
    { word: 'PATO', syllables: ['PA', 'TO'], emoji: '🦆', category: 'Animal' },
    { word: 'GATO', syllables: ['GA', 'TO'], emoji: '🐱', category: 'Animal' },
    { word: 'CACHORRO', syllables: ['CA', 'CHO', 'RRO'], emoji: '🐶', category: 'Animal' },
    { word: 'PÁSSARO', syllables: ['PÁS', 'SA', 'RO'], emoji: '🐦', category: 'Animal' },
    { word: 'PEIXE', syllables: ['PEI', 'XE'], emoji: '🐟', category: 'Animal' },
    { word: 'COELHO', syllables: ['CO', 'E', 'LHO'], emoji: '🐰', category: 'Animal' },
    { word: 'CAVALO', syllables: ['CA', 'VA', 'LO'], emoji: '🐴', category: 'Animal' },
    { word: 'VACA', syllables: ['VA', 'CA'], emoji: '🐮', category: 'Animal' },
    { word: 'CASA', syllables: ['CA', 'SA'], emoji: '🏠', category: 'Lugar' },
    { word: 'ESCOLA', syllables: ['ES', 'CO', 'LA'], emoji: '🏫', category: 'Lugar' },
    { word: 'PARQUE', syllables: ['PAR', 'QUE'], emoji: '🎡', category: 'Lugar' },
    { word: 'BOLA', syllables: ['BO', 'LA'], emoji: '⚽', category: 'Brinquedo' },
    { word: 'BONECO', syllables: ['BO', 'NE', 'CO'], emoji: '🧸', category: 'Brinquedo' },
    { word: 'CARRO', syllables: ['CA', 'RRO'], emoji: '🚗', category: 'Transporte' },
    { word: 'AVIÃO', syllables: ['A', 'VI', 'ÃO'], emoji: '✈️', category: 'Transporte' },
    { word: 'BICICLETA', syllables: ['BI', 'CI', 'CLE', 'TA'], emoji: '🚲', category: 'Transporte' },
    { word: 'MAÇÃ', syllables: ['MA', 'ÇÃ'], emoji: '🍎', category: 'Fruta' },
    { word: 'BANANA', syllables: ['BA', 'NA', 'NA'], emoji: '🍌', category: 'Fruta' },
    { word: 'MELANCIA', syllables: ['ME', 'LAN', 'CIA'], emoji: '🍉', category: 'Fruta' },
    { word: 'UVA', syllables: ['U', 'VA'], emoji: '🍇', category: 'Fruta' },
    { word: 'LARANJA', syllables: ['LA', 'RAN', 'JA'], emoji: '🍊', category: 'Fruta' },
    { word: 'SOL', syllables: ['SOL'], emoji: '☀️', category: 'Natureza' },
    { word: 'LUA', syllables: ['LU', 'A'], emoji: '🌙', category: 'Natureza' },
    { word: 'FLOR', syllables: ['FLOR'], emoji: '🌸', category: 'Natureza' },
    { word: 'ÁRVORE', syllables: ['ÁR', 'VO', 'RE'], emoji: '🌳', category: 'Natureza' },
    { word: 'CHUVA', syllables: ['CHU', 'VA'], emoji: '🌧️', category: 'Natureza' },
    { word: 'LIVRO', syllables: ['LI', 'VRO'], emoji: '📖', category: 'Objeto' },
    { word: 'TELEFONE', syllables: ['TE', 'LE', 'FO', 'NE'], emoji: '☎️', category: 'Objeto' },
    { word: 'CANETA', syllables: ['CA', 'NE', 'TA'], emoji: '🖊️', category: 'Objeto' },
    { word: 'SAPATO', syllables: ['SA', 'PA', 'TO'], emoji: '👟', category: 'Vestuário' },
    { word: 'CHAPÉU', syllables: ['CHA', 'PÉU'], emoji: '🎩', category: 'Vestuário' },
    { word: 'REFRIGERANTE', syllables: ['RE', 'FRI', 'GE', 'RAN', 'TE'], emoji: '🥤', category: 'Bebida' },
    { word: 'SUCO', syllables: ['SU', 'CO'], emoji: '🧃', category: 'Bebida' },
    { word: 'QUEIJO', syllables: ['QUEI', 'JO'], emoji: '🧀', category: 'Alimento' },
    { word: 'SORVETE', syllables: ['SOR', 'VE', 'TE'], emoji: '🍦', category: 'Alimento' },
    { word: 'PÃO', syllables: ['PÃO'], emoji: '🍞', category: 'Alimento' },
    { word: 'BOLACHA', syllables: ['BO', 'LA', 'CHA'], emoji: '🍪', category: 'Alimento' },
    { word: 'MÃE', syllables: ['MÃE'], emoji: '👩', category: 'Pessoa' },
    { word: 'PAI', syllables: ['PAI'], emoji: '👨', category: 'Pessoa' },
    { word: 'AMIGO', syllables: ['A', 'MI', 'GO'], emoji: '🧑‍🤝‍🧑', category: 'Pessoa' },
    { word: 'MÚSICA', syllables: ['MÚ', 'SI', 'CA'], emoji: '🎵', category: 'Arte' },
    { word: 'FUTEBOL', syllables: ['FU', 'TE', 'BOL'], emoji: '⚽', category: 'Esporte' }
  ];

  const ABC = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'];

  const letterNames = {
    A: 'á', B: 'bê', C: 'cê', D: 'dê', E: 'é', F: 'efe', G: 'gê', H: 'agá',
    I: 'i', J: 'jota', K: 'cá', L: 'ele', M: 'eme', N: 'ene', O: 'ó', P: 'pê',
    Q: 'quê', R: 'erre', S: 'esse', T: 'tê', U: 'u', V: 'vê', W: 'dáblio',
    X: 'xis', Y: 'ípsilon', Z: 'zê',
    Ç: 'cê cedilha', Ã: 'a com til', Õ: 'o com til',
    Á: 'a com acento agudo', É: 'e com acento agudo', Í: 'i com acento agudo',
    Ó: 'o com acento agudo', Ú: 'u com acento agudo',
    Â: 'a com circunflexo', Ê: 'e com circunflexo', Ô: 'o com circunflexo', À: 'a com crase'
  };

  const STORAGE_KEY = 'complete-a-palavra-v3';
  const VOICE_KEY = 'complete-a-palavra-voice';
  const MUTE_KEY = 'complete-a-palavra-muted';
  const DIFFICULTY_KEY = 'complete-a-palavra-difficulty';
  const SPEECH_MODE_KEY = 'complete-a-palavra-speech-mode';

  const DIFFICULTY_RATIO = { easy: 0.3, medium: 0.5, hard: 0.75 };

  // ==========================================================
  // ESTADO CENTRALIZADO
  // ==========================================================
  const state = {
    items: [...FALLBACK_ITEMS],
    deck: [],
    current: null,
    hidden: [],
    filled: new Map(),
    round: 0,
    score: 0,
    errors: 0,
    streak: 0,
    gameStarted: false,
    acceptingInput: false,
    muted: false,
    difficulty: 'medium',
    speechMode: 'auto',           // auto | kokoro | browser
    kokoroVoice: 'af_heart',
    browserVoiceIndex: -1,
    totalAttempts: 0,
    totalCorrect: 0,
    timers: { autoSpeak: null, reset: null, wrong: null, hint: null }
  };

  // ==========================================================
  // CACHE DE ELEMENTOS DOM
  // ==========================================================
  const EL = {};
  function cacheElements() {
    const ids = [
      'intro', 'game', 'score', 'bestScore', 'message', 'next', 'picture',
      'category', 'round', 'syllables', 'word', 'choices', 'progress',
      'attempts', 'hint', 'repeat', 'restart', 'readWord', 'confetti',
      'listenDemo', 'beginGame', 'audioStatus', 'introMsg', 'demoT', 'demoO',
      'voiceSelect', 'voiceStatus', 'rate', 'rateValue', 'pitch', 'pitchValue',
      'testVoice', 'introVoiceSelect', 'introVoiceStatus', 'introRate',
      'introRateValue', 'introPitch', 'introPitchValue', 'introTestVoice',
      'muteBtn', 'speechMode', 'introSpeechMode', 'kokoroStatus', 'kokoroStatusGame'
    ];
    ids.forEach(id => { EL[id] = document.getElementById(id); });
  }

  // ==========================================================
  // UTILITÁRIOS
  // ==========================================================
  function shuffle(array) {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  function normalizeLetter(ch) {
    return ch.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
  }

  function letterName(letter) {
    return letterNames[letter] || letter;
  }

  function clearTimers() {
    Object.keys(state.timers).forEach(key => {
      clearTimeout(state.timers[key]);
      state.timers[key] = null;
    });
  }

  // ==========================================================
  // ARMAZENAMENTO LOCAL
  // ==========================================================
  function storageGet(key, fallback = '') {
    try { return localStorage.getItem(key) ?? fallback; }
    catch { return fallback; }
  }

  function storageSet(key, value) {
    try { localStorage.setItem(key, String(value)); return true; }
    catch {
      if (EL.message && !EL.message.dataset.storageWarned) {
        EL.message.dataset.storageWarned = '1';
        EL.message.textContent = 'Não foi possível salvar seu recorde neste dispositivo.';
        EL.message.className = 'message hint';
      }
      return false;
    }
  }

  function getBestScore() { return Number(storageGet(STORAGE_KEY, '0')) || 0; }

  function updateBestScore() {
    const best = Math.max(getBestScore(), state.score);
    storageSet(STORAGE_KEY, best);
    if (EL.bestScore) EL.bestScore.textContent = String(best);
  }

  // ==========================================================
  // SISTEMA DE FALA HÍBRIDO (Kokoro + fallback dispositivo)
  // ==========================================================
  let availableBrowserVoices = [];
  let browserVoicesLoaded = false;

  const VOICE_CONFIG = {
    lang: 'pt-BR',
    rate: 0.82,
    pitch: 1.06,
    volume: 1.0,
    preferredNames: [
      'Google português do Brasil', 'Google Português do Brasil',
      'Microsoft Maria', 'Microsoft Francisca',
      'Luciana', 'Camila', 'Fernanda', 'Daniela'
    ]
  };

  function findBestBrowserVoice() {
    if (!availableBrowserVoices.length) return null;
    const br = availableBrowserVoices.filter(v => /^pt-BR$/i.test(v.lang));
    for (const preferred of VOICE_CONFIG.preferredNames) {
      const match = br.find(v => v.name.toLowerCase().includes(preferred.toLowerCase()));
      if (match) return match;
    }
    if (br.length) return br[0];
    return availableBrowserVoices[0];
  }

  function loadBrowserVoices() {
    if (!('speechSynthesis' in window)) {
      availableBrowserVoices = [];
      renderAllVoiceUI();
      return;
    }
    availableBrowserVoices = speechSynthesis.getVoices()
      .filter(voice => /^pt(-|_)/i.test(voice.lang))
      .sort((a, b) => {
        const aBR = /^pt-BR$/i.test(a.lang) ? 0 : 1;
        const bBR = /^pt-BR$/i.test(b.lang) ? 0 : 1;
        return aBR - bBR || a.name.localeCompare(b.name);
      });
    browserVoicesLoaded = true;
    renderAllVoiceUI();
  }

  function stopSpeaking() {
    if (typeof KOKORO !== 'undefined') { try { KOKORO.stop(); } catch {} }
    if ('speechSynthesis' in window) { try { speechSynthesis.cancel(); } catch {} }
    document.body.classList.remove('speaking');
  }

  function setVoiceStatus(text, source) {
    [EL.voiceStatus, EL.introVoiceStatus].forEach(el => {
      if (!el) return;
      el.textContent = text;
      el.className = `voice-status${source ? ` source-${source}` : ''}`;
      if (el.id === 'introVoiceStatus') el.classList.add('intro-voice-status');
    });
    if (source !== 'browser') {
      [EL.kokoroStatus, EL.kokoroStatusGame].forEach(el => {
        if (el) el.textContent = text;
      });
    }
  }

  // Fala via voz do dispositivo (fallback)
  function speakBrowser(text) {
    if (!('speechSynthesis' in window)) return false;
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = VOICE_CONFIG.lang;
    utterance.rate = VOICE_CONFIG.rate;
    utterance.pitch = VOICE_CONFIG.pitch;
    utterance.volume = VOICE_CONFIG.volume;

    let voice = null;
    if (state.browserVoiceIndex >= 0 && availableBrowserVoices[state.browserVoiceIndex]) {
      voice = availableBrowserVoices[state.browserVoiceIndex];
    } else {
      voice = findBestBrowserVoice();
    }
    if (voice) utterance.voice = voice;

    utterance.onstart = () => {
      document.body.classList.add('speaking');
      setVoiceStatus(`📱 Falando: ${voice ? voice.name : 'Voz do dispositivo'}`, 'browser');
    };
    utterance.onend = () => {
      document.body.classList.remove('speaking');
      if (browserVoicesLoaded) renderAllVoiceUI();
    };
    utterance.onerror = () => document.body.classList.remove('speaking');
    speechSynthesis.speak(utterance);
    return true;
  }

  // Função principal de fala — híbrida
  async function speakText(text, options = {}) {
    if (state.muted) return true;
    if (!text || !text.trim()) return false;
    stopSpeaking();

    const mode = options.mode || state.speechMode;
    const tryKokoro = mode !== 'browser' && typeof KOKORO !== 'undefined';
    const tryBrowser = mode !== 'kokoro';

    if (tryKokoro) {
      try {
        const ok = await KOKORO.speak(text, {
          voice: state.kokoroVoice,
          rate: 1.0, // Kokoro speed ~1.0; ajustamos via playback
          playbackRate: VOICE_CONFIG.rate,
          onEnded: () => {}
        });
        if (ok) {
          setVoiceStatus(`🧠 Kokoro: ${getKokoroVoiceName(state.kokoroVoice)}`, 'api');
          return true;
        }
        // Kokoro falhou → cai no fallback (se modo auto)
        if (mode === 'kokoro') {
          setVoiceStatus('⚠️ Kokoro indisponível. Verifique a conexão na primeira vez.', 'fallback');
          return false;
        }
        setVoiceStatus('📱 Usando voz do dispositivo (Kokoro carregando...)', 'fallback');
      } catch (err) {
        if (mode === 'kokoro') {
          setVoiceStatus(`⚠️ Kokoro falhou: ${err.message}`, 'fallback');
          return false;
        }
        setVoiceStatus('📱 Usando voz do dispositivo', 'fallback');
      }
    }

    if (tryBrowser) return speakBrowser(text);
    return false;
  }

  function getKokoroVoiceName(id) {
    if (typeof KOKORO === 'undefined') return id;
    const v = KOKORO.getVoices().find(v => v.id === id);
    return v ? v.name : id;
  }

  function initVoiceLoading() {
    // Conecta o status do Kokoro à UI
    if (typeof KOKORO !== 'undefined') {
      KOKORO.setStatusCallback((msg, pct) => {
        [EL.kokoroStatus, EL.kokoroStatusGame].forEach(el => {
          if (!el) return;
          el.textContent = msg;
          el.classList.toggle('loading', pct !== 100 && !/indisponível|erro/i.test(msg));
          if (pct !== null) el.dataset.progress = String(pct);
        });
      });
    }

    if (!('speechSynthesis' in window)) { renderAllVoiceUI(); return; }
    loadBrowserVoices();
    speechSynthesis.addEventListener('voiceschanged', () => {
      if (!browserVoicesLoaded || availableBrowserVoices.length === 0) loadBrowserVoices();
    });
    setTimeout(() => { if (!browserVoicesLoaded) loadBrowserVoices(); }, 600);
  }

  // ==========================================================
  // UI DE VOZ — renderização unificada
  // ==========================================================
  function renderVoiceSelect(selectEl) {
    if (!selectEl) return;
    const currentValue = selectEl.value;
    selectEl.innerHTML = '';

    // Grupo 1: vozes Kokoro
    const kokoroGroup = document.createElement('optgroup');
    kokoroGroup.label = '🧠 Kokoro — Voz neural local';
    const kokoroVoices = (typeof KOKORO !== 'undefined') ? KOKORO.getVoices() : [
      { id: 'af_heart', name: 'Coração — suave' },
      { id: 'af_bella', name: 'Bella — feminina' },
      { id: 'am_adam', name: 'Adam — masculino' }
    ];
    kokoroVoices.forEach(v => {
      const opt = document.createElement('option');
      opt.value = `kokoro:${v.id}`;
      opt.textContent = v.name;
      kokoroGroup.appendChild(opt);
    });
    selectEl.appendChild(kokoroGroup);

    // Grupo 2: vozes do dispositivo
    const browserGroup = document.createElement('optgroup');
    browserGroup.label = '📱 Vozes do dispositivo';
    const autoOpt = document.createElement('option');
    autoOpt.value = 'browser:-1';
    autoOpt.textContent = 'Automática do dispositivo';
    browserGroup.appendChild(autoOpt);
    availableBrowserVoices.forEach((voice, index) => {
      const opt = document.createElement('option');
      opt.value = `browser:${index}`;
      opt.textContent = `${voice.name} — ${voice.lang}`;
      browserGroup.appendChild(opt);
    });
    selectEl.appendChild(browserGroup);

    const expected = currentValue || `kokoro:${state.kokoroVoice}`;
    if ([...selectEl.options].some(o => o.value === expected)) {
      selectEl.value = expected;
    } else {
      selectEl.value = 'kokoro:af_heart';
    }
  }

  function renderAllVoiceUI() {
    renderVoiceSelect(EL.voiceSelect);
    renderVoiceSelect(EL.introVoiceSelect);
    if (EL.speechMode) EL.speechMode.value = state.speechMode;
    if (EL.introSpeechMode) EL.introSpeechMode.value = state.speechMode;
  }

  function applyVoiceSelection(value) {
    if (!value) return;
    const [type, payload] = value.split(':');
    if (type === 'kokoro') {
      state.kokoroVoice = payload;
      storageSet(VOICE_KEY, `kokoro:${payload}`);
      if (typeof KOKORO !== 'undefined') KOKORO.clearCache();
    } else if (type === 'browser') {
      state.browserVoiceIndex = Number(payload);
      storageSet(VOICE_KEY, `browser:${payload}`);
    }
    renderAllVoiceUI();
    speakText('Esta é a voz selecionada.', { rate: 0.84 });
  }

  function setVoiceRate(value) {
    const rate = Number(value);
    if (!Number.isFinite(rate)) return;
    VOICE_CONFIG.rate = Math.min(1.2, Math.max(0.55, rate));
    if (EL.rateValue) EL.rateValue.textContent = `${VOICE_CONFIG.rate.toFixed(2)}×`;
    if (EL.introRateValue) EL.introRateValue.textContent = `${VOICE_CONFIG.rate.toFixed(2)}×`;
  }

  function setVoicePitch(value) {
    const pitch = Number(value);
    if (!Number.isFinite(pitch)) return;
    VOICE_CONFIG.pitch = Math.min(1.5, Math.max(0.6, pitch));
    if (EL.pitchValue) EL.pitchValue.textContent = VOICE_CONFIG.pitch.toFixed(2);
    if (EL.introPitchValue) EL.introPitchValue.textContent = VOICE_CONFIG.pitch.toFixed(2);
  }

  function setSpeechMode(mode) {
    if (!['auto', 'kokoro', 'browser'].includes(mode)) return;
    state.speechMode = mode;
    storageSet(SPEECH_MODE_KEY, mode);
    if (EL.speechMode) EL.speechMode.value = mode;
    if (EL.introSpeechMode) EL.introSpeechMode.value = mode;
  }

  // ==========================================================
  // MUDO
  // ==========================================================
  function toggleMute() {
    state.muted = !state.muted;
    storageSet(MUTE_KEY, state.muted ? '1' : '0');
    if (state.muted) stopSpeaking();
    if (EL.muteBtn) {
      EL.muteBtn.setAttribute('aria-pressed', String(state.muted));
      EL.muteBtn.setAttribute('aria-label', state.muted ? 'Ativar áudio' : 'Silenciar áudio');
      EL.muteBtn.title = state.muted ? 'Ativar áudio' : 'Silenciar';
      const span = EL.muteBtn.querySelector('span');
      if (span) span.textContent = state.muted ? '🔇' : '🔊';
    }
  }

  // ==========================================================
  // DIFICULDADE
  // ==========================================================
  function getDifficulty() {
    const checked = document.querySelector('input[name="difficulty"]:checked');
    return checked ? checked.value : 'medium';
  }

  function hiddenCountFor(wordLength) {
    const ratio = DIFFICULTY_RATIO[state.difficulty] || 0.5;
    return Math.max(1, Math.min(wordLength - 1, Math.ceil(wordLength * ratio)));
  }

  // ==========================================================
  // MOTOR DO JOGO
  // ==========================================================
  function start() {
    clearTimers();
    stopSpeaking();
    state.difficulty = getDifficulty();
    storageSet(DIFFICULTY_KEY, state.difficulty);
    state.deck = shuffle(state.items);
    state.round = 0;
    state.score = 0;
    state.streak = 0;
    state.totalAttempts = 0;
    state.totalCorrect = 0;
    state.gameStarted = true;
    if (EL.score) EL.score.textContent = '0';
    updateBestScore();
    load();
  }

  function load() {
    clearTimers();
    if (!state.deck.length || state.round >= state.deck.length) return;
    state.current = state.deck[state.round];
    state.filled.clear();
    state.errors = 0;
    state.acceptingInput = true;

    if (EL.message) { EL.message.textContent = ''; EL.message.className = 'message'; }
    if (EL.next) EL.next.classList.remove('show');
    if (EL.picture) {
      EL.picture.textContent = state.current.emoji;
      EL.picture.setAttribute('aria-label', `Imagem: ${state.current.word.toLowerCase()}`);
    }
    if (EL.category) EL.category.textContent = state.current.category;
    if (EL.round) EL.round.textContent = `Palavra ${state.round + 1} de ${state.deck.length}`;
    if (EL.syllables) EL.syllables.textContent = state.current.syllables.join(' • ');

    const chars = [...state.current.word];
    const possible = chars.map((_, index) => index);
    const count = hiddenCountFor(chars.length);
    state.hidden = shuffle(possible).slice(0, count).sort((a, b) => a - b);

    renderWord();
    renderChoices();
    updateProgress();
    updateAttempts();

    state.timers.autoSpeak = setTimeout(() => {
      if (state.gameStarted && state.acceptingInput) speakCurrent();
    }, 350);
  }

  function updateProgress() {
    const percent = state.deck.length ? Math.round((state.round / state.deck.length) * 100) : 0;
    if (EL.progress) {
      EL.progress.style.width = `${percent}%`;
      const bar = EL.progress.parentElement;
      if (bar) {
        bar.setAttribute('aria-valuenow', String(percent));
        bar.setAttribute('aria-valuetext', `${percent}% concluído`);
      }
    }
  }

  function updateAttempts() {
    const symbols = Array.from({ length: 3 }, (_, i) => i < state.errors ? '✕' : '○');
    if (EL.attempts) EL.attempts.textContent = `Erros: ${symbols.join(' ')}`;
  }

  function renderWord(wrongIndex = -1) {
    if (!EL.word) return;
    EL.word.innerHTML = '';
    [...state.current.word].forEach((ch, index) => {
      const el = document.createElement('div');
      const isHidden = state.hidden.includes(index);
      const value = state.filled.get(index);
      el.className = `letter ${!isHidden ? 'shown' : value ? 'filled' : 'blank'}${index === wrongIndex ? ' wrong' : ''}`;
      el.textContent = !isHidden ? ch : value || '';
      el.setAttribute('aria-label', !isHidden ? `Letra ${ch}` : value ? `Letra preenchida ${value}` : 'Letra faltando');
      EL.word.appendChild(el);
    });
  }

  function renderChoices() {
    if (!EL.choices) return;
    EL.choices.innerHTML = '';
    const needed = state.hidden.map(index => [...state.current.word][index]);
    const uniqueNeeded = [...new Set(needed)];
    const extraCount = Math.max(3, 7 - uniqueNeeded.length);
    const extras = shuffle(ABC.filter(letter => !uniqueNeeded.includes(letter))).slice(0, extraCount);
    const letters = shuffle([...needed, ...extras]);

    letters.forEach((letter) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'choice';
      btn.textContent = letter;
      btn.dataset.letter = letter;
      btn.setAttribute('aria-label', `Escolher letra ${letterName(letter)}`);
      btn.addEventListener('click', () => choose(letter, btn));
      EL.choices.appendChild(btn);
    });
    updateGuide();
  }

  function updateGuide() {
    document.querySelectorAll('.choice').forEach(btn => {
      btn.classList.remove('guided');
      btn.removeAttribute('aria-current');
    });
    if (state.round >= 5 || !state.acceptingInput) return;
    const target = state.hidden.find(index => !state.filled.has(index));
    if (target === undefined) return;
    const expected = [...state.current.word][target];
    const button = [...document.querySelectorAll('.choice')]
      .find(btn => !btn.disabled && btn.dataset.letter === expected);
    if (button) {
      button.classList.add('guided');
      button.setAttribute('aria-current', 'true');
      button.setAttribute('aria-label', `Letra correta destacada: ${letterName(expected)}`);
      button.focus({ preventScroll: true });
    }
  }

  function choose(letter, button) {
    if (!state.acceptingInput || button.disabled) return;
    const target = state.hidden.find(index => !state.filled.has(index));
    if (target === undefined) return;
    const expected = [...state.current.word][target];
    state.totalAttempts++;

    if (letter === expected) {
      state.totalCorrect++;
      state.filled.set(target, letter);
      button.disabled = true;
      state.score += 10;
      state.streak += 1;
      if (state.streak > 1) state.score += 5;
      if (EL.score) EL.score.textContent = String(state.score);
      updateBestScore();
      renderWord();
      updateGuide();

      if (state.filled.size === state.hidden.length) {
        win(letter);
      } else {
        speakText(`Letra ${letterName(letter)}. Muito bem!`);
        if (EL.message) {
          EL.message.textContent = state.streak > 1
            ? `Muito bem! Sequência de ${state.streak} acertos! ⭐`
            : 'Muito bem! Continue assim! 👏';
          EL.message.className = 'message success';
        }
      }
    } else {
      state.errors++;
      state.streak = 0;
      updateAttempts();
      renderWord(target);
      button.classList.add('wrong');
      state.timers.wrong = setTimeout(() => {
        renderWord();
        button.classList.remove('wrong');
      }, 400);

      if (state.errors >= 3) {
        state.acceptingInput = false;
        document.querySelectorAll('.choice').forEach(btn => btn.disabled = true);
        if (EL.message) {
          EL.message.textContent = 'Vamos tentar novamente! A palavra será mostrada outra vez. ↻';
          EL.message.className = 'message error';
        }
        speakText('Essa letra está errada. Você chegou a três erros. Vamos tentar a palavra novamente.');
        state.timers.reset = setTimeout(() => load(), 3200);
      } else {
        const left = 3 - state.errors;
        if (EL.message) {
          EL.message.textContent = `Quase! Restam ${left} ${left === 1 ? 'tentativa' : 'tentativas'}.`;
          EL.message.className = 'message error';
        }
        speakText(`Letra ${letterName(letter)}. Essa letra está errada. Você ainda tem ${left} ${left === 1 ? 'tentativa' : 'tentativas'}.`);
      }
    }
  }

  function win(lastLetter) {
    state.acceptingInput = false;
    const bonus = Math.max(0, (3 - state.errors) * 5);
    state.score += bonus;
    if (EL.score) EL.score.textContent = String(state.score);
    updateBestScore();

    if (EL.message) {
      EL.message.textContent = bonus
        ? `Muito bem! Você completou ${state.current.word}! 🎉 +${bonus} de bônus`
        : `Muito bem! Você completou ${state.current.word}! 🎉`;
      EL.message.className = 'message success';
    }

    const percent = Math.round(((state.round + 1) / state.deck.length) * 100);
    if (EL.progress) {
      EL.progress.style.width = `${percent}%`;
      const bar = EL.progress.parentElement;
      if (bar) bar.setAttribute('aria-valuenow', String(percent));
    }

    document.querySelectorAll('.choice').forEach(btn => btn.disabled = true);
    confetti();
    speakText(`Letra ${letterName(lastLetter)}. Muito bem! Você completou a palavra ${state.current.word.toLowerCase()}.`, { rate: 0.8 });

    if (EL.next) {
      EL.next.textContent = state.round === state.deck.length - 1 ? 'Jogar novamente ↻' : 'Próxima palavra →';
      EL.next.classList.add('show');
    }
  }

  function nextWord() {
    if (state.acceptingInput) return;
    state.round++;
    if (state.round >= state.deck.length) showFinal();
    else load();
  }

  function showFinal() {
    clearTimers();
    state.acceptingInput = false;
    const best = getBestScore();
    const accuracy = state.totalAttempts ? Math.round((state.totalCorrect / state.totalAttempts) * 100) : 0;
    if (EL.message) {
      EL.message.textContent =
        `🎊 Parabéns! Você terminou! Pontuação: ${state.score} pontos. ` +
        `Recorde: ${best}. Acerto: ${accuracy}% (${state.totalCorrect}/${state.totalAttempts}).`;
      EL.message.className = 'message success final-message';
    }
    if (EL.next) { EL.next.textContent = 'Jogar novamente ↻'; EL.next.classList.add('show'); }
    confetti(70);
    speakText(`Parabéns! Você terminou o jogo com ${state.score} pontos. Sua taxa de acerto foi de ${accuracy} por cento. Você pode jogar novamente.`, { rate: 0.78 });
  }

  function giveHint() {
    if (!state.acceptingInput || !state.current) return;
    const target = state.hidden.find(index => !state.filled.has(index));
    if (target === undefined) return;
    const expected = [...state.current.word][target];
    const button = [...document.querySelectorAll('.choice')].find(btn => !btn.disabled && btn.dataset.letter === expected);
    if (button) {
      button.classList.add('hinted');
      state.timers.hint = setTimeout(() => button.classList.remove('hinted'), 1200);
    }
    if (EL.message) {
      EL.message.textContent = `💡 A próxima letra é ${letterName(expected)}.`;
      EL.message.className = 'message hint';
    }
    speakText(`Dica: a próxima letra é ${letterName(expected)}.`);
  }

  function speakCurrent() {
    if (!state.current) return;
    const parts = state.current.syllables.join('. ');
    const spelling = [...state.current.word].map(letterName).join('. ');
    speakText(
      `Observe a imagem. A palavra é ${state.current.word.toLowerCase()}. ` +
      `Vamos ler por sílabas. ${parts}. ` +
      `Agora vamos soletrar. ${spelling}. ` +
      `A palavra inteira é ${state.current.word.toLowerCase()}. Repita: ${state.current.word.toLowerCase()}.`,
      { rate: 0.76 }
    );
  }

  function confetti(amount = 38) {
    if (!EL.confetti) return;
    EL.confetti.innerHTML = '';
    const colors = ['#ffd34e', '#6546d7', '#20b486', '#ef476f'];
    for (let i = 0; i < amount; i++) {
      const piece = document.createElement('i');
      piece.style.left = `${Math.random() * 100}%`;
      piece.style.background = colors[i % 4];
      piece.style.animationDelay = `${Math.random() * 0.35}s`;
      EL.confetti.appendChild(piece);
    }
  }

  // ==========================================================
  // DEMONSTRAÇÃO
  // ==========================================================
  let demoStep = 0;

  function resetDemo() {
    demoStep = 0;
    ['demoT', 'demoO'].forEach(id => {
      const el = EL[id];
      if (!el) return;
      el.textContent = '?';
      el.className = 'demo-letter gap';
    });
    document.querySelectorAll('.demo-choice').forEach(btn => {
      btn.disabled = false;
      btn.classList.toggle('guided', btn.dataset.demo === 'T');
    });
    if (EL.audioStatus) EL.audioStatus.textContent = 'Ouça e clique na letra destacada.';
  }

  function speakDemo() {
    resetDemo();
    const ok = speakText(
      'Observe a imagem. É um pato. A palavra já mostra as letras P e A. ' +
      'Toque primeiro na letra T, que está destacada. Depois escolha a letra O.',
      { rate: 0.88 }
    );
    if (!ok && EL.audioStatus) EL.audioStatus.textContent = 'O áudio não está disponível neste navegador.';
  }

  function chooseDemo(button) {
    const expected = demoStep === 0 ? 'T' : demoStep === 1 ? 'O' : null;
    if (!expected) return;
    if (button.dataset.demo !== expected) {
      button.classList.add('wrong');
      if (EL.audioStatus) EL.audioStatus.textContent = 'Tente a letra destacada.';
      speakText(`Letra ${letterName(button.dataset.demo)}. Essa letra está errada. Tente a letra destacada.`);
      setTimeout(() => button.classList.remove('wrong'), 400);
      return;
    }
    button.disabled = true;
    button.classList.remove('guided');
    const targetId = demoStep === 0 ? 'demoT' : 'demoO';
    if (EL[targetId]) { EL[targetId].textContent = expected; EL[targetId].className = 'demo-letter done'; }
    demoStep++;
    if (demoStep === 1) {
      const next = [...document.querySelectorAll('.demo-choice')].find(btn => btn.dataset.demo === 'O');
      if (next) next.classList.add('guided');
      if (EL.audioStatus) EL.audioStatus.textContent = 'Muito bem! Agora clique na letra O.';
      speakText('Letra tê. Muito bem! Agora clique na letra ó.');
    } else {
      if (EL.audioStatus) EL.audioStatus.textContent = 'Parabéns! Você completou PATO. Agora comece o jogo! 🎉';
      speakText('Letra ó. Parabéns! Você completou a palavra pato. Agora comece o jogo!');
    }
  }

  function syncIntroVoiceUI() {
    if (EL.introRate) EL.introRate.value = String(VOICE_CONFIG.rate);
    if (EL.introPitch) EL.introPitch.value = String(VOICE_CONFIG.pitch);
    if (EL.introRateValue) EL.introRateValue.textContent = `${VOICE_CONFIG.rate.toFixed(2)}×`;
    if (EL.introPitchValue) EL.introPitchValue.textContent = VOICE_CONFIG.pitch.toFixed(2);
    renderAllVoiceUI();
  }

  async function loadWordBank() {
    try {
      const response = await fetch('palavras.json', { cache: 'no-cache' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0 && data.every(item => item.word && item.emoji)) {
        state.items = data;
      }
    } catch {}
  }

  // ==========================================================
  // EVENTOS
  // ==========================================================
  function bindEvents() {
    document.querySelectorAll('.demo-choice').forEach(btn => btn.addEventListener('click', () => chooseDemo(btn)));
    if (EL.listenDemo) EL.listenDemo.addEventListener('click', speakDemo);

    if (EL.beginGame) {
      EL.beginGame.addEventListener('click', () => {
        stopSpeaking();
        if (EL.intro) EL.intro.classList.add('hide');
        if (EL.game) { EL.game.removeAttribute('aria-hidden'); EL.game.removeAttribute('inert'); }
        state.gameStarted = true;
        start();
        setTimeout(() => EL.readWord && EL.readWord.focus(), 50);
      });
    }

    if (EL.readWord) EL.readWord.addEventListener('click', speakCurrent);
    if (EL.repeat) EL.repeat.addEventListener('click', speakCurrent);
    if (EL.hint) EL.hint.addEventListener('click', giveHint);
    if (EL.restart) EL.restart.addEventListener('click', start);
    if (EL.next) {
      EL.next.addEventListener('click', () => {
        if (state.round >= state.deck.length - 1 && !state.acceptingInput) start();
        else nextWord();
      });
    }

    if (EL.muteBtn) EL.muteBtn.addEventListener('click', toggleMute);

    if (EL.voiceSelect) EL.voiceSelect.addEventListener('change', e => applyVoiceSelection(e.target.value));
    if (EL.speechMode) EL.speechMode.addEventListener('change', e => setSpeechMode(e.target.value));
    if (EL.rate) EL.rate.addEventListener('input', e => { setVoiceRate(e.target.value); syncIntroVoiceUI(); });
    if (EL.pitch) EL.pitch.addEventListener('input', e => { setVoicePitch(e.target.value); syncIntroVoiceUI(); });
    if (EL.testVoice) {
      EL.testVoice.addEventListener('click', () => {
        speakText('Olá! Esta é a voz configurada para o jogo Complete a Palavra.', { rate: VOICE_CONFIG.rate, pitch: VOICE_CONFIG.pitch });
      });
    }

    if (EL.introVoiceSelect) EL.introVoiceSelect.addEventListener('change', e => applyVoiceSelection(e.target.value));
    if (EL.introSpeechMode) EL.introSpeechMode.addEventListener('change', e => setSpeechMode(e.target.value));
    if (EL.introRate) EL.introRate.addEventListener('input', e => { setVoiceRate(e.target.value); syncIntroVoiceUI(); });
    if (EL.introPitch) EL.introPitch.addEventListener('input', e => { setVoicePitch(e.target.value); syncIntroVoiceUI(); });
    if (EL.introTestVoice) {
      EL.introTestVoice.addEventListener('click', () => {
        speakText('Olá! Esta é a voz configurada para o jogo Complete a Palavra.', { rate: VOICE_CONFIG.rate, pitch: VOICE_CONFIG.pitch });
      });
    }

    document.querySelectorAll('input[name="difficulty"]').forEach(radio => {
      radio.addEventListener('change', () => storageSet(DIFFICULTY_KEY, getDifficulty()));
    });

    document.addEventListener('keydown', event => {
      if (event.ctrlKey || event.altKey || event.metaKey) return;
      if (event.key === 'Enter' && EL.next && EL.next.classList.contains('show')) {
        event.preventDefault(); EL.next.click(); return;
      }
      if (!state.gameStarted || !state.acceptingInput) return;
      if (event.key.length !== 1) return;
      const pressed = event.key.toUpperCase();
      if (!/^[A-ZÇÃÁÂÊÎÔÛÚÍÓÉÀÕÔÂÊ]{1}$/u.test(pressed)) return;
      const normalizedPressed = normalizeLetter(pressed);
      const buttons = [...document.querySelectorAll('.choice')].filter(btn => !btn.disabled);
      let button = buttons.find(btn => btn.dataset.letter === pressed);
      if (!button) button = buttons.find(btn => normalizeLetter(btn.dataset.letter) === normalizedPressed);
      if (button) { event.preventDefault(); choose(button.dataset.letter, button); }
    });
  }

  // ==========================================================
  // RESTAURA PREFERÊNCIAS
  // ==========================================================
  function restorePreferences() {
    if (storageGet(MUTE_KEY, '0') === '1') {
      state.muted = true;
      if (EL.muteBtn) {
        EL.muteBtn.setAttribute('aria-pressed', 'true');
        EL.muteBtn.setAttribute('aria-label', 'Ativar áudio');
        EL.muteBtn.title = 'Ativar áudio';
        const span = EL.muteBtn.querySelector('span');
        if (span) span.textContent = '🔇';
      }
    }
    const savedDiff = storageGet(DIFFICULTY_KEY, 'medium');
    const radio = document.querySelector(`input[name="difficulty"][value="${savedDiff}"]`);
    if (radio) radio.checked = true;
    state.difficulty = savedDiff;

    const savedMode = storageGet(SPEECH_MODE_KEY, 'auto');
    if (['auto', 'kokoro', 'browser'].includes(savedMode)) state.speechMode = savedMode;

    const savedVoice = storageGet(VOICE_KEY, '');
    if (savedVoice.startsWith('kokoro:')) state.kokoroVoice = savedVoice.slice(7);
    else if (savedVoice.startsWith('browser:')) state.browserVoiceIndex = Number(savedVoice.slice(8));
  }

  function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').catch(() => {});
      });
    }
  }

  // ==========================================================
  // INICIALIZAÇÃO
  // ==========================================================
  async function init() {
    cacheElements();
    restorePreferences();
    bindEvents();
    initVoiceLoading();
    syncIntroVoiceUI();
    await loadWordBank();
    if (EL.bestScore) EL.bestScore.textContent = String(getBestScore());
    resetDemo();
    registerServiceWorker();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
