"use strict";

(() => {
  const $ = selector => document.querySelector(selector);
  const $$ = selector => Array.from(document.querySelectorAll(selector));
  const storageKey = "cyber72.preferences.v2";
  const previousStorageKey = "cyber72.preferences.v1";
  const defaults = { name: "Rakib", language: "en", music: true, effects: true, ambience: true, musicVolume: 20, effectsVolume: 50, ambienceVolume: 35 };
  const copy = {
    en: {
      skip: "Skip to game", playerOne: "PLAYER 01", welcomeBadge: "WELCOME",
      adventure: "A BANGLADESH CYBER ADVENTURE", tagline: "Spot the scam. Protect your city.",
      start: "Start game", startHint: "OLD DHAKA / FREE ROAM", settings: "Settings", locationLabel: "DISTRICT 01", location: "Islampur, Old Dhaka",
      level: "LV. 01", rookie: "Cyber Rookie",
      mainMenu: "Main menu", console: "PLAYER CONSOLE", identity: "PLAYER IDENTITY", playerName: "Character name",
      nameHelp: "Use up to 24 characters. Bangla names are welcome.", language: "Language", audio: "AUDIO",
      music: "Background music", track: "Riverlight · title theme", musicVolume: "Music volume", effects: "Menu sound effects", effectsVolume: "Menu click volume", ambience: "Street ambience", ambienceVolume: "Street volume",
      autoSave: "Saves on this device", sessionOnly: "Settings last for this visit", done: "Done",
      startKey: "Start", musicKey: "Music", edition: "MADE IN BANGLADESH", backCity: "Back to game",
      on: "On", off: "Off", turnOn: "Turn music on", turnOff: "Turn music off", startMusic: "Tap for music",
      expand: "Enter fullscreen", contract: "Exit fullscreen", fullscreenError: "This window can’t enter fullscreen.",
      musicError: "The soundtrack couldn’t start. Try switching music on again."
    },
    bn: {
      skip: "গেমে যাও", playerOne: "প্লেয়ার ০১", welcomeBadge: "স্বাগতম",
      adventure: "বাংলাদেশে সাইবার অভিযান", tagline: "ফাঁদ চিনে নাও। নিজের পাড়া সুরক্ষিত রাখো।",
      start: "খেলা শুরু", startHint: "পুরান ঢাকা / মুক্ত ভ্রমণ", settings: "সেটিংস", locationLabel: "এলাকা ০১", location: "ইসলামপুর, পুরান ঢাকা",
      level: "লেভেল ০১", rookie: "নবীন সাইবারযোদ্ধা",
      mainMenu: "মূল মেনু", console: "প্লেয়ার কনসোল", identity: "প্লেয়ার পরিচয়", playerName: "চরিত্রের নাম",
      nameHelp: "সর্বোচ্চ ২৪টি অক্ষর ব্যবহার করো। বাংলাতেও নাম লেখা যাবে।", language: "ভাষা", audio: "অডিও",
      music: "আবহসংগীত", track: "রিভারলাইট · গেমের সুর", musicVolume: "সংগীতের মাত্রা", effects: "মেনুর শব্দ", effectsVolume: "মেনু ক্লিকের শব্দের মাত্রা", ambience: "রাস্তার আবহ", ambienceVolume: "রাস্তার শব্দের মাত্রা",
      autoSave: "এই ডিভাইসে সেভ হয়", sessionOnly: "সেটিংস শুধু এবারই থাকবে", done: "হয়ে গেছে",
      startKey: "শুরু", musicKey: "সংগীত", edition: "বাংলাদেশ সংস্করণ", backCity: "খেলায় ফিরো",
      on: "চালু", off: "বন্ধ", turnOn: "সংগীত চালু করো", turnOff: "সংগীত বন্ধ করো", startMusic: "সংগীত শুনতে চাপ দাও",
      expand: "পূর্ণ পর্দায় দেখো", contract: "পূর্ণ পর্দা থেকে বের হও", fullscreenError: "এই উইন্ডোতে পূর্ণ পর্দা চালু করা যাচ্ছে না।",
      musicError: "সংগীত চালু হয়নি। আবার চালু করে দেখো।"
    }
  };

  const segmenter = typeof Intl.Segmenter === "function" ? new Intl.Segmenter("bn", { granularity: "grapheme" }) : null;
  function cleanName(value) {
    if (typeof value !== "string") return "";
    const clean = value.trim().replace(/[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/g, "");
    const letters = segmenter ? Array.from(segmenter.segment(clean), unit => unit.segment) : Array.from(clean);
    return letters.slice(0, 24).join("").trim();
  }
  function volumeOr(value, fallback) {
    return Number.isFinite(value) ? Math.min(100, Math.max(0, Math.round(value))) : fallback;
  }
  function readPreferences() {
    try {
      let saved = JSON.parse(localStorage.getItem(storageKey));
      if (!saved) {
        const previous = JSON.parse(localStorage.getItem(previousStorageKey)) || {};
        // The old version wrote its factory mix even when only the name changed.
        const customVolume = Number.isFinite(previous.volume) && previous.volume !== 45;
        saved = {
          ...previous,
          music: customVolume || previous.effects === false ? previous.music : defaults.music,
          musicVolume: customVolume ? previous.volume : defaults.musicVolume
        };
      }
      return {
        name: cleanName(saved.name) || defaults.name, language: saved.language === "bn" ? "bn" : "en",
        music: typeof saved.music === "boolean" ? saved.music : defaults.music,
        effects: typeof saved.effects === "boolean" ? saved.effects : defaults.effects,
        musicVolume: volumeOr(saved.musicVolume, defaults.musicVolume),
        effectsVolume: volumeOr(saved.effectsVolume, defaults.effectsVolume),
        ambience: typeof saved.ambience === "boolean" ? saved.ambience : defaults.ambience,
        ambienceVolume: volumeOr(saved.ambienceVolume, defaults.ambienceVolume)
      };
    } catch {
      return { ...defaults };
    }
  }
  let prefs = readPreferences();
  let storageAvailable = true;
  let activeView = "";
  let musicNeedsGesture = false;
  let soundContext;
  const track = $("#soundtrack");
  const nameField = $("#player-name");
  const fullscreenButton = $("#fullscreen-toggle");
  const t = () => copy[prefs.language];
  const number = value => prefs.language === "bn" ? String(value).replace(/\d/g, n => "০১২৩৪৫৬৭৮৯"[Number(n)]) : String(value);

  function save() {
    try {
      localStorage.setItem(storageKey, JSON.stringify(prefs));
      storageAvailable = true;
    } catch {
      storageAvailable = false;
    }
    $("#save-status").textContent = storageAvailable ? t().autoSave : t().sessionOnly;
  }
  function label(control, value) {
    control.setAttribute("aria-label", value);
    control.title = value;
  }
  function showNames(name = prefs.name) {
    $$("[data-player]").forEach(el => { el.textContent = name; });
  }
  function commitName() {
    const name = cleanName(nameField.value);
    if (name && name !== prefs.name) {
      prefs.name = name;
      save();
    }
    nameField.value = prefs.name;
    showNames();
  }
  function renderMusicButton() {
    const quick = $("#music-quick");
    const waiting = prefs.music && musicNeedsGesture;
    const active = prefs.music && !waiting;
    quick.setAttribute("aria-pressed", String(active));
    quick.querySelector("use").setAttribute("href", active ? "#i-sound" : "#i-mute");
    $("#sound-prompt").hidden = !waiting;
    label(quick, waiting ? t().startMusic : active ? t().turnOff : t().turnOn);
  }
  function renderSound() {
    renderMusicButton();
    for (const key of ["music", "effects", "ambience"]) {
      const button = $("#" + key + "-switch");
      button.setAttribute("aria-checked", String(prefs[key]));
      button.querySelector("[data-switch-text]").textContent = prefs[key] ? t().on : t().off;
      const level = prefs[key + "Volume"];
      const range = $("#" + key + "-volume");
      range.value = String(level);
      range.style.setProperty("--volume", level + "%");
      range.setAttribute("aria-valuetext", number(level) + "%");
      $("#" + key + "-readout").textContent = number(level) + "%";
    }
    track.volume = prefs.musicVolume / 100;
    C72Ambience.setVolume(prefs.ambience ? prefs.ambienceVolume : 0);
  }
  function renderFullscreenButton() {
    fullscreenButton.hidden = !document.fullscreenEnabled;
    const expanded = Boolean(document.fullscreenElement);
    fullscreenButton.setAttribute("aria-pressed", String(expanded));
    fullscreenButton.querySelector("use").setAttribute("href", expanded ? "#i-contract" : "#i-expand");
    label(fullscreenButton, expanded ? t().contract : t().expand);
  }
  function renderCopy() {
    document.documentElement.lang = prefs.language;
    $$("[data-t]").forEach(el => { el.textContent = t()[el.dataset.t]; });
    $$("[data-language]").forEach(el => el.setAttribute("aria-pressed", String(el.dataset.language === prefs.language)));
    $("#save-status").textContent = storageAvailable ? t().autoSave : t().sessionOnly;
    showNames();
    renderSound();
    renderFullscreenButton();
    updateNavigation();
  }
  function showNotice(text) {
    const message = $("#status-message");
    message.textContent = text;
    message.className = "audio-notice";
    setTimeout(() => { message.className = "sr-only"; }, 3500);
  }
  function syncMusic() {
    if (!prefs.music || document.hidden) {
      track.pause();
      musicNeedsGesture = false;
      renderMusicButton();
      return;
    }
    if (!track.paused) return;
    track.play().then(() => {
      musicNeedsGesture = false;
      renderMusicButton();
    }).catch(error => {
      if (!prefs.music || document.hidden || error.name === "AbortError") return;
      if (error.name === "NotAllowedError") {
        musicNeedsGesture = track.paused;
        renderMusicButton();
        return;
      }
      musicNeedsGesture = false;
      prefs.music = false;
      renderSound();
      showNotice(t().musicError);
    });
  }
  function toggleMusic() {
    prefs.music = !prefs.music;
    save();
    renderSound();
    syncMusic();
  }
  function chirp(up = false) {
    if (!prefs.effects || !prefs.effectsVolume || document.hidden) return;
    const Context = window.AudioContext || window.webkitAudioContext;
    if (!Context) return;
    try {
      soundContext ||= new Context();
      if (soundContext.state === "suspended") soundContext.resume().catch(() => {});
      const time = soundContext.currentTime;
      const oscillator = soundContext.createOscillator();
      const gain = soundContext.createGain();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(up ? 523.25 : 392, time);
      oscillator.frequency.setValueAtTime(up ? 783.99 : 523.25, time + .045);
      gain.gain.setValueAtTime(.0001, time);
      gain.gain.exponentialRampToValueAtTime(.085 * prefs.effectsVolume / 100, time + .008);
      gain.gain.exponentialRampToValueAtTime(.0001, time + .105);
      oscillator.connect(gain);
      gain.connect(soundContext.destination);
      oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
      oscillator.start(time);
      oscillator.stop(time + .11);
    } catch { /* The menu also works on devices without audio output. */ }
  }
  function changeLanguage(language) {
    if (language === prefs.language) return;
    if (activeView === "settings") commitName();
    prefs.language = language;
    save();
    renderCopy();
    chirp();
  }
  function startGame() {
    chirp(true);
    location.hash = "city";
  }
  const settingsReturn = () => location.hash === "#city-settings" ? "#city" : "#menu";
  function updateNavigation() {
    const inGameSettings = location.hash === "#city-settings";
    $(".back-link").href = settingsReturn();
    $(".back-link span").textContent = $(".settings-keys [data-t]").textContent = inGameSettings ? t().backCity : t().mainMenu;
    document.title = "Cyber 72 | " + (activeView === "settings" ? t().settings : activeView === "city" ? (prefs.language === "bn" ? "পুরান ঢাকা" : "Old Dhaka") : t().mainMenu);
    if(activeView === "city") C72Game.setPreferences(prefs);
  }
  function route(initial = false) {
    const next = ["#settings","#city-settings"].includes(location.hash) ? "settings" : location.hash === "#city" ? "city" : "menu";
    if (next === activeView) { updateNavigation(); return; }
    const previous = activeView;
    if (activeView === "settings") commitName();
    if (activeView === "city") C72Game.leave();
    activeView = next;
    const inSettings = next === "settings";
    $("#menu-view").hidden = next !== "menu";
    $("#settings-view").hidden = !inSettings;
    $("#city-view").hidden = next !== "city";
    window.C72Presentation?.show(next);
    nameField.value = prefs.name;
    updateNavigation();
    if (next === "city") {
      C72Game.enter({prefs,reset:previous==="menu",sound:chirp});
      return;
    }
    if (!initial) {
      window.scrollTo(0, 0);
      (inSettings ? $("#settings-title") : $("#open-settings")).focus({ preventScroll: true });
    }
  }

  $("#start-game").addEventListener("click", startGame);
  $("#open-settings").addEventListener("click", () => chirp());
  $(".back-link").addEventListener("click", () => chirp());
  $$("[data-language]").forEach(el => el.addEventListener("click", () => changeLanguage(el.dataset.language)));
  $("#music-quick").addEventListener("click", () => {
    if (prefs.music && musicNeedsGesture) syncMusic();
    else toggleMusic();
  });
  fullscreenButton.addEventListener("click", async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      showNotice(t().fullscreenError);
    }
  });
  document.addEventListener("fullscreenchange", renderFullscreenButton);
  $("#music-switch").addEventListener("click", toggleMusic);
  for (const key of ["effects","ambience"]) $("#" + key + "-switch").addEventListener("click", () => {
    prefs[key] = !prefs[key];
    save();
    renderSound();
    chirp();
  });
  $$(".volume-slider").forEach(range => {
    range.addEventListener("input", () => {
      prefs[range.name] = range.valueAsNumber;
      renderSound();
      save();
    });
  });
  $("#effects-volume").addEventListener("change", () => chirp());
  nameField.addEventListener("input", event => {
    if (!event.isComposing) showNames(cleanName(nameField.value) || prefs.name);
  });
  nameField.addEventListener("change", commitName);
  nameField.addEventListener("blur", commitName);
  $("#settings-form").addEventListener("submit", event => {
    event.preventDefault();
    commitName();
    chirp(true);
    location.hash = settingsReturn();
  });
  $(".skip-link").addEventListener("click", event => { event.preventDefault(); $("#main-content").focus(); });
  document.addEventListener("keydown", event => {
    if (activeView === "city" || event.altKey || event.ctrlKey || event.metaKey || event.repeat || event.isComposing) return;
    if (event.key === "Escape" && activeView === "settings") {
      commitName();
      location.hash = settingsReturn();
      return;
    }
    if (event.target.closest("input, textarea, select, [contenteditable=true]")) return;
    const key = event.key.toLowerCase();
    if (key === "m") toggleMusic();
    if (key === "s" && activeView === "menu") location.hash = "settings";
    if (key === "enter" && activeView === "menu" && !event.target.closest("a, button")) {
      event.preventDefault();
      startGame();
    }
  });
  function resumeMusicOnGesture(event) {
    if (event.target.closest("#music-quick, #music-switch")) return;
    if (event.type === "keydown" && event.key.toLowerCase() === "m") return;
    if (prefs.music && track.paused) syncMusic();
  }
  document.addEventListener("keydown", resumeMusicOnGesture, true);
  document.addEventListener("click", resumeMusicOnGesture, true);
  document.addEventListener("visibilitychange", syncMusic);
  window.addEventListener("hashchange", () => route());
  window.addEventListener("pagehide", () => { if (activeView === "settings") commitName(); track.pause(); });
  window.addEventListener("pageshow", syncMusic);
  window.addEventListener("storage", event => {
    if (event.key !== storageKey && event.key !== null) return;
    prefs = readPreferences();
    if (document.activeElement !== nameField) nameField.value = prefs.name;
    renderCopy();
    syncMusic();
  });
  nameField.value = prefs.name;
  renderCopy();
  route(true);
  syncMusic();
})();
