/* Админка: услуги, все тексты сайта, настройки. Данные — в localStorage этого браузера. */
(function () {
  var S = window.Store;
  var authBox = document.getElementById("auth");
  var panelBox = document.getElementById("panel");
  var setupBox = document.getElementById("setup");
  var loginBox = document.getElementById("login");
  var lockBtn = document.getElementById("lock-btn");
  var currentId = null;

  function show(el, yes) { if (el) el.hidden = !yes; }

  if (S.unlocked()) {
    startPanel();
  } else if (!S.hasPassword()) {
    show(authBox, true); show(setupBox, true); show(loginBox, false);
  } else {
    show(authBox, true); show(setupBox, false); show(loginBox, true);
  }

  document.getElementById("setup-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var a = document.getElementById("setup-pw").value;
    var b = document.getElementById("setup-pw2").value;
    var err = document.getElementById("setup-err");
    if (a.length < 4) return (err.textContent = "Пароль минимум 4 символа");
    if (a !== b) return (err.textContent = "Пароли не совпадают");
    S.setPassword(a);
    S.unlock();
    err.textContent = "";
    startPanel();
  });

  document.getElementById("login-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var err = document.getElementById("login-err");
    if (!S.checkPassword(document.getElementById("login-pw").value)) return (err.textContent = "Неверный пароль");
    err.textContent = "";
    S.unlock();
    startPanel();
  });

  lockBtn.addEventListener("click", function () {
    S.lock();
    location.reload();
  });

  function startPanel() {
    show(authBox, false);
    show(panelBox, true);
    show(lockBtn, true);
    initPanel();
  }

  /* вкладки */
  var tabs = document.querySelectorAll(".tabs button");
  tabs.forEach(function (btn) {
    btn.addEventListener("click", function () {
      tabs.forEach(function (b) { b.setAttribute("aria-selected", String(b === btn)); });
      document.querySelectorAll("[data-tabpane]").forEach(function (p) {
        p.hidden = p.getAttribute("data-tabpane") !== btn.getAttribute("data-tab");
      });
    });
  });

  function initPanel() {
    document.getElementById("demo-hint").hidden = !S.isDemo();
    renderServices();
    renderStats();
    fillSettings();
    buildContentForm();
    newService();
  }

  /* ---------- услуги ---------- */
  function renderServices() {
    var all = S.get().services.slice();
    var box = document.getElementById("rowlist");
    if (!all.length) {
      box.innerHTML = '<p class="muted" style="padding:10px 0">Услуг нет. Нажмите «+ Новая услуга».</p>';
      return;
    }
    box.innerHTML = all.map(function (s) {
      var st = s.status === "draft" ? "черновик" : s.status === "sold" ? "архив" : "активна";
      return '<button type="button" class="rowitem" data-id="' + s.id + '" aria-current="' + (s.id === currentId) + '">' +
        '<img src="' + UI.esc(UI.cover(s)) + '" alt="">' +
        "<span><b>" + UI.esc(s.title || "Без названия") + "</b><small>" + UI.esc(S.priceLine(s)) + " · " + st + "</small></span>" +
        '<span class="mono muted" style="font-size:11px">' + UI.esc(s.category || "") + "</span>" +
      "</button>";
    }).join("");
  }

  document.getElementById("rowlist").addEventListener("click", function (e) {
    var row = e.target.closest(".rowitem");
    if (row) openService(row.getAttribute("data-id"));
  });

  function renderStats() {
    var all = S.get().services;
    var active = all.filter(function (s) { return s.status === "active"; }).length;
    var draft = all.filter(function (s) { return s.status === "draft"; }).length;
    document.getElementById("stats").innerHTML =
      "<div><b>" + all.length + "</b>всего</div>" +
      "<div><b>" + active + "</b>активных</div>" +
      "<div><b>" + draft + "</b>черновиков</div>" +
      "<div><b>" + Object.keys(S.textAll()).length + "</b>полей текста</div>";
  }

  var F = {
    title: document.getElementById("f-title"),
    price: document.getElementById("f-price"),
    priceNote: document.getElementById("f-pricenote"),
    cat: document.getElementById("f-cat"),
    term: document.getElementById("f-term"),
    status: document.getElementById("f-status"),
    featured: document.getElementById("f-featured"),
    desc: document.getElementById("f-desc"),
    images: document.getElementById("f-images"),
    includes: document.getElementById("f-includes")
  };

  function imgRow(val) {
    var row = document.createElement("div");
    row.className = "image-row";
    row.innerHTML = '<input class="input" type="text" aria-label="Ссылка на фото" placeholder="assets/img/svc-site.jpg или https://…" value="' + UI.esc(val || "") + '">' +
      '<img alt="Превью фото" hidden src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7">' +
      '<button class="btn btn-sm btn-danger" type="button" title="Удалить фото" aria-label="Удалить фото">×</button>';
    var input = row.querySelector("input");
    var img = row.querySelector("img");
    function sync() {
      var v = input.value.trim();
      img.hidden = !v;
      if (v) img.src = v;
    }
    input.addEventListener("input", sync);
    row.querySelector("button").addEventListener("click", function () { row.remove(); });
    sync();
    F.images.appendChild(row);
  }

  function incRow(val) {
    var row = document.createElement("div");
    row.className = "image-row";
    row.innerHTML = '<input class="input" type="text" aria-label="Что входит в услугу" placeholder="Например: адаптив под телефон" value="' + UI.esc(val || "") + '">' +
      '<button class="btn btn-sm btn-danger" type="button" title="Удалить" aria-label="Удалить пункт">×</button>';
    row.querySelector("button").addEventListener("click", function () { row.remove(); });
    F.includes.appendChild(row);
  }

  document.getElementById("add-img").addEventListener("click", function () { imgRow(""); });
  document.getElementById("add-inc").addEventListener("click", function () { incRow(""); });

  function openService(id) {
    var s = S.find(id);
    if (!s) return;
    currentId = s.id;
    F.title.value = s.title || "";
    F.price.value = s.price || "";
    F.priceNote.value = s.priceNote || "от";
    F.cat.value = s.category || "";
    F.term.value = s.term || "";
    F.status.value = s.status || "active";
    F.featured.checked = !!s.featured;
    F.desc.value = s.description || "";
    F.images.innerHTML = "";
    (s.images || []).forEach(imgRow);
    if (!s.images || !s.images.length) imgRow("");
    F.includes.innerHTML = "";
    (s.includes || []).forEach(incRow);
    document.getElementById("editor-title").textContent = "Редактирование услуги";
    document.getElementById("save-note").textContent = "id: " + s.id;
    show(document.getElementById("delete-btn"), true);
    renderServices();
  }

  function newService() {
    currentId = null;
    F.title.value = ""; F.price.value = ""; F.priceNote.value = "от";
    F.cat.value = ""; F.term.value = ""; F.status.value = "active";
    F.featured.checked = false; F.desc.value = "";
    F.images.innerHTML = ""; F.includes.innerHTML = "";
    imgRow(""); incRow("");
    document.getElementById("editor-title").textContent = "Новая услуга";
    document.getElementById("save-note").textContent = "Сохранится в этом браузере";
    show(document.getElementById("delete-btn"), false);
    renderServices();
  }

  document.getElementById("new-btn").addEventListener("click", newService);

  document.getElementById("save-btn").addEventListener("click", function () {
    var err = document.getElementById("save-err");
    if (!F.title.value.trim()) { err.textContent = "Укажите название услуги"; F.title.focus(); return; }
    if (!Number(F.price.value)) { err.textContent = "Укажите цену числом"; F.price.focus(); return; }
    var images = Array.prototype.map.call(F.images.querySelectorAll(".image-row input"), function (i) { return i.value.trim(); }).filter(Boolean);
    var includes = Array.prototype.map.call(F.includes.querySelectorAll(".image-row input"), function (i) { return i.value.trim(); }).filter(Boolean);

    try {
      var saved = S.saveService({
        id: currentId || "",
        title: F.title.value.trim(),
        price: Number(F.price.value),
        priceNote: F.priceNote.value,
        category: F.cat.value.trim() || "Услуги",
        term: F.term.value.trim(),
        status: F.status.value,
        featured: F.featured.checked,
        description: F.desc.value,
        images: images,
        includes: includes
      });
      currentId = saved.id;
      err.textContent = "";
      document.getElementById("save-note").textContent = "Сохранено · id: " + saved.id;
      document.getElementById("editor-title").textContent = "Редактирование услуги";
      show(document.getElementById("delete-btn"), true);
      renderServices();
      renderStats();
    } catch (e) {
      err.textContent = e.message;
    }
  });

  document.getElementById("delete-btn").addEventListener("click", function () {
    if (!currentId) return;
    var s = S.find(currentId);
    if (!confirm("Удалить «" + (s ? s.title : currentId) + "»? Действие необратимо.")) return;
    S.removeService(currentId);
    newService();
    renderStats();
  });

  document.getElementById("upload-img").addEventListener("change", function (e) {
    var files = Array.prototype.slice.call(e.target.files || []);
    e.target.value = "";
    if (!files.length) return;
    var note = document.getElementById("upload-note");
    files.forEach(function (file) {
      if (!/^image\//.test(file.type)) return;
      var reader = new FileReader();
      reader.onload = function () {
        var img = new Image();
        img.onload = function () {
          var max = 1200;
          var scale = Math.min(1, max / Math.max(img.width, img.height));
          var canvas = document.createElement("canvas");
          canvas.width = Math.round(img.width * scale);
          canvas.height = Math.round(img.height * scale);
          canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
          var data = canvas.toDataURL("image/jpeg", 0.72);
          var first = F.images.querySelector(".image-row input");
          if (first && !first.value.trim()) {
            first.value = data;
            first.dispatchEvent(new Event("input"));
          } else {
            imgRow("");
            var inputs = F.images.querySelectorAll(".image-row input");
            inputs[inputs.length - 1].value = data;
            inputs[inputs.length - 1].dispatchEvent(new Event("input"));
          }
          note.textContent = "Фото добавлено. Нажмите «Сохранить», чтобы записать его в услугу.";
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  });

  /* ---------- тексты сайта ---------- */
  var GROUPS = [
    { name: "Главная", fields: [
      ["hero.eyebrow", "Надзаголовок"],
      ["hero.title", "Заголовок, первая часть"],
      ["hero.accent", "Заголовок, выделенная часть"],
      ["hero.lead", "Подзаголовок", "area"],
      ["hero.cta1", "Кнопка 1"],
      ["hero.cta2", "Кнопка 2"],
      ["hero.fact1v", "Факт 1 — значение"],
      ["hero.fact1l", "Факт 1 — подпись"],
      ["hero.fact2v", "Факт 2 — значение"],
      ["hero.fact2l", "Факт 2 — подпись"],
      ["hero.fact3v", "Факт 3 — значение"],
      ["hero.fact3l", "Факт 3 — подпись"]
    ]},
    { name: "Раздел услуг", fields: [
      ["services.title", "Заголовок"],
      ["services.lead", "Подзаголовок", "area"],
      ["services.note", "Примечание под списком", "area"]
    ]},
    { name: "Как работаем", fields: [
      ["process.title", "Заголовок"],
      ["process.lead", "Подзаголовок"],
      ["process.s1t", "Шаг 1 — заголовок"], ["process.s1d", "Шаг 1 — текст", "area"],
      ["process.s2t", "Шаг 2 — заголовок"], ["process.s2d", "Шаг 2 — текст", "area"],
      ["process.s3t", "Шаг 3 — заголовок"], ["process.s3d", "Шаг 3 — текст", "area"]
    ]},
    { name: "Почему со мной удобно", fields: [
      ["why.title", "Заголовок"],
      ["why.i1t", "Пункт 1 — заголовок"], ["why.i1d", "Пункт 1 — текст", "area"],
      ["why.i2t", "Пункт 2 — заголовок"], ["why.i2d", "Пункт 2 — текст", "area"],
      ["why.i3t", "Пункт 3 — заголовок"], ["why.i3d", "Пункт 3 — текст", "area"]
    ]},
    { name: "Блок призыва", fields: [
      ["cta.title", "Заголовок"],
      ["cta.text", "Текст", "area"],
      ["cta.button", "Кнопка"]
    ]},
    { name: "Вопросы и ответы", fields: [
      ["faq.title", "Заголовок раздела"],
      ["faq.q1", "Вопрос 1"], ["faq.a1", "Ответ 1", "area"],
      ["faq.q2", "Вопрос 2"], ["faq.a2", "Ответ 2", "area"],
      ["faq.q3", "Вопрос 3"], ["faq.a3", "Ответ 3", "area"]
    ]},
    { name: "Обо мне", fields: [
      ["about.title", "Заголовок"],
      ["about.text", "Основной текст", "area"],
      ["about.approach", "Как подхожу к работе", "area"],
      ["about.terms", "Условия", "area"]
    ]},
    { name: "Контакты и подвал", fields: [
      ["contacts.title", "Заголовок контактов"],
      ["contacts.lead", "Текст контактов", "area"],
      ["footer.note", "Подпись в подвале"]
    ]}
  ];

  function buildContentForm() {
    var box = document.getElementById("content-form-inner");
    var values = S.textAll();
    var html = "";
    GROUPS.forEach(function (g, gi) {
      html += '<fieldset class="cgroup"><legend>' + UI.esc(g.name) + "</legend><div class=\"form-grid\">";
      g.fields.forEach(function (f) {
        var area = f[2] === "area";
        var fid = "c-" + f[0].replace(/[^a-zA-Z0-9]+/g, "-");
        html += '<div class="field' + (area ? " full" : "") + '">' +
          '<label for="' + fid + '">' + UI.esc(f[1]) + "</label>" +
          (area
            ? '<textarea class="input" id="' + fid + '" data-content="' + f[0] + '">' + UI.esc(values[f[0]] || "") + "</textarea>"
            : '<input class="input" id="' + fid + '" data-content="' + f[0] + '" type="text" value="' + UI.esc(values[f[0]] || "") + '">') +
        "</div>";
      });
      html += "</div></fieldset>";
    });
    box.innerHTML = html;
  }

  document.getElementById("content-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var patch = {};
    document.querySelectorAll("[data-content]").forEach(function (el) {
      patch[el.getAttribute("data-content")] = el.value.trim();
    });
    S.saveContent(patch);
    var note = document.getElementById("content-note");
    note.textContent = "Тексты сохранены. Откройте страницы сайта — значения уже заменены.";
    note.style.color = "var(--ok)";
    renderStats();
  });

  /* ---------- настройки ---------- */
  var SET = { shopName: "s-shop", owner: "s-owner", tg: "s-tg", avito: "s-avito", city: "s-city", email: "s-email", tagline: "s-tagline" };

  function fillSettings() {
    var st = S.settings();
    Object.keys(SET).forEach(function (k) {
      var el = document.getElementById(SET[k]);
      if (el) el.value = st[k] || "";
    });
  }

  document.getElementById("settings-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var patch = {};
    Object.keys(SET).forEach(function (k) { patch[k] = document.getElementById(SET[k]).value.trim(); });
    patch.tg = String(patch.tg || "").replace(/^@/, "");
    S.saveSettings(patch);
    document.getElementById("settings-note").textContent = "Сохранено. Обновите страницы сайта, чтобы увидеть правки.";
  });

  document.getElementById("pw-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var a = document.getElementById("new-pw").value;
    var b = document.getElementById("new-pw2").value;
    var note = document.getElementById("pw-note");
    if (a.length < 4) { note.textContent = "Минимум 4 символа"; return; }
    if (a !== b) { note.textContent = "Пароли не совпадают"; return; }
    S.setPassword(a);
    document.getElementById("new-pw").value = "";
    document.getElementById("new-pw2").value = "";
    note.textContent = "Пароль изменён.";
  });

  /* ---------- публикация ---------- */
  function download(name, text, type) {
    var blob = new Blob([text], { type: type || "text/javascript;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
  }

  document.getElementById("export-btn").addEventListener("click", function () {
    download("data.js", S.exportData());
    document.getElementById("io-note").textContent = "Файл data.js скачан. Замените им site/assets/js/data.js в репозитории и запушьте — правки увидят все.";
  });

  document.getElementById("export-json-btn").addEventListener("click", function () {
    download("site-backup.json", JSON.stringify(S.get(), null, 2), "application/json");
    document.getElementById("io-note").textContent = "Резервная копия скачана: site-backup.json";
  });

  document.getElementById("import-file").addEventListener("change", function (e) {
    var file = e.target.files && e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      var note = document.getElementById("io-note");
      try {
        var n = S.importData(reader.result);
        note.textContent = "Импортировано услуг: " + n;
        initPanel();
      } catch (err) {
        note.textContent = "Не удалось импортировать: " + err.message;
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  });

  document.getElementById("reset-btn").addEventListener("click", function () {
    if (!confirm("Сбросить все правки и вернуть данные из data.js?")) return;
    S.reset();
    document.getElementById("io-note").textContent = "Правки сброшены.";
    initPanel();
  });
})();
