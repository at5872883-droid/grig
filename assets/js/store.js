/* Слой данных: правки из админки живут в localStorage и перекрывают data.js */
(function () {
  var KEY = "grig.services.v1";
  var SEED = window.SITE_DATA || { settings: {}, content: {}, services: [] };

  function read() {
    try {
      var raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function write(state) {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
      return true;
    } catch (e) {
      return false;
    }
  }

  function clone(v) {
    return JSON.parse(JSON.stringify(v));
  }

  function defaults() {
    return clone({ settings: SEED.settings || {}, content: SEED.content || {}, services: SEED.services || [] });
  }

  function state() {
    var local = read();
    if (local && Array.isArray(local.services)) {
      if (!local.content) local.content = {};
      if (!local.settings) local.settings = {};
      return local;
    }
    return defaults();
  }

  function hash(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return (h >>> 0).toString(36);
  }

  function money(n) {
    var num = Number(n) || 0;
    return num.toLocaleString("ru-RU").replace(/\u00a0/g, " ") + " ₽";
  }

  function priceLine(s) {
    var note = s.priceNote ? String(s.priceNote).trim() + " " : "";
    return note + money(s.price).replace(" ₽", " ₽");
  }

  function tg(username, text) {
    var u = String(username || "").replace(/^@/, "");
    return "https://t.me/" + u + (text ? "?text=" + encodeURIComponent(text) : "");
  }

  function uid() {
    return "s" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  var Store = {
    get: state,

    /* настройки */
    settings: function () {
      return state().settings || {};
    },
    saveSettings: function (patch) {
      var s = state();
      s.settings = Object.assign({}, s.settings, patch);
      write(s);
    },

    /* тексты: content["hero.title"] с подстановкой значения из data.js */
    text: function (key) {
      var s = state();
      var v = s.content && s.content[key];
      if (v === undefined || v === null || v === "") v = (SEED.content || {})[key];
      return v === undefined ? "" : String(v);
    },
    textAll: function () {
      return Object.assign({}, SEED.content || {}, state().content || {});
    },
    saveContent: function (patch) {
      var s = state();
      s.content = Object.assign({}, s.content, patch);
      write(s);
    },

    /* услуги */
    services: function (opts) {
      var list = (state().services || []).slice();
      if (!opts || !opts.withDrafts) list = list.filter(function (x) { return x.status !== "draft"; });
      return list.sort(function (a, b) { return (!!b.featured - !!a.featured); });
    },
    find: function (id) {
      return (state().services || []).filter(function (s) { return s.id === id; })[0] || null;
    },
    saveService: function (item) {
      var s = state();
      var clean = clone(item);
      if (!clean.id) clean.id = uid();
      clean.price = Number(clean.price) || 0;
      clean.includes = (clean.includes || []).map(function (x) { return String(x).trim(); }).filter(Boolean);
      clean.images = (clean.images || []).filter(Boolean);
      s.services = s.services || [];
      var i = s.services.findIndex(function (x) { return x.id === clean.id; });
      if (i >= 0) s.services[i] = clean; else s.services.unshift(clean);
      if (!write(s)) throw new Error("Не хватает места в браузере. Уменьшите фото или перенесите их файлами.");
      return clean;
    },
    removeService: function (id) {
      var s = state();
      s.services = (s.services || []).filter(function (x) { return x.id !== id; });
      write(s);
    },

    reset: function () {
      try { localStorage.removeItem(KEY); } catch (e) {}
    },
    exportData: function () {
      var s = state();
      return "window.SITE_DATA = " + JSON.stringify({
        settings: s.settings, content: s.content, services: s.services
      }, null, 2) + ";\n";
    },
    importData: function (text) {
      var json = String(text).trim()
        .replace(/^window\.SITE_DATA\s*=\s*/, "")
        .replace(/^window\.AVITO_DATA\s*=\s*/, "")
        .replace(/;\s*$/, "");
      var parsed = JSON.parse(json);
      if (!parsed || !Array.isArray(parsed.services)) throw new Error("В файле нет массива services");
      var next = { settings: parsed.settings || {}, content: parsed.content || {}, services: parsed.services };
      if (!write(next)) throw new Error("Файл слишком большой для localStorage");
      return parsed.services.length;
    },

    /* пароль: экран от случайных глаз, не серверная защита */
    hasPassword: function () {
      return !!state().settings.adminHash;
    },
    setPassword: function (pw) {
      var s = state();
      s.settings.adminHash = hash("grig::" + pw);
      write(s);
    },
    checkPassword: function (pw) {
      var s = state();
      return !!s.settings.adminHash && s.settings.adminHash === hash("grig::" + pw);
    },
    unlock: function () {
      try { sessionStorage.setItem("grig.admin", "1"); } catch (e) {}
    },
    unlocked: function () {
      try { return sessionStorage.getItem("grig.admin") === "1"; } catch (e) { return false; }
    },
    lock: function () {
      try { sessionStorage.removeItem("grig.admin"); } catch (e) {}
    },

    money: money,
    priceLine: priceLine,
    tg: tg,
    uid: uid,
    isDemo: function () { return !read(); }
  };

  window.Store = Store;
})();
