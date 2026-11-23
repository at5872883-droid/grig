/* Помощники страниц: тексты из админки, карточки услуг, анимации, контакты */
(function () {
  var S = window.Store;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function esc(str) {
    return String(str == null ? "" : str).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function cover(s) { return (s.images && s.images[0]) || "assets/img/svc-site.jpg"; }

  function serviceCard(s) {
    var sold = s.status === "sold";
    return (
      '<a class="card reveal" href="service.html?id=' + encodeURIComponent(s.id) + '">' +
        '<div class="card-media">' +
          '<img src="' + esc(cover(s)) + '" alt="' + esc(s.title) + '">' +
          (s.featured ? '<span class="badge hot">Хит</span>' : "") +
          (s.term ? '<span class="badge term">' + esc(s.term) + "</span>" : "") +
        "</div>" +
        '<div class="card-body">' +
          '<span class="card-cat">' + esc(s.category || "Услуги") + "</span>" +
          "<h3>" + esc(s.title) + "</h3>" +
          '<div class="price">' + esc(S.priceLine(s)) + "</div>" +
          '<span class="card-note">' + (s.category === "Авито" ? "Упаковка объявлений" : "Срок: " + esc(s.term || "по задаче")) + "</span>" +
        "</div>" +
      "</a>"
    );
  }

  function fill(sel, list, emptyText) {
    var el = document.querySelector(sel);
    if (!el) return;
    if (!list.length) {
      el.innerHTML = '<div class="empty"><h3>Пока пусто</h3><p>' + esc(emptyText || "Услуги появятся здесь.") + "</p></div>";
      return;
    }
    el.innerHTML = list.map(serviceCard).join("");
    revealNow(el);
  }

  /* тексты: любой элемент с data-text="hero.title" получает значение из админки */
  function bindTexts() {
    document.querySelectorAll("[data-text]").forEach(function (el) {
      el.textContent = S.text(el.getAttribute("data-text"));
    });
  }

  function contacts() {
    var st = S.settings();
    return {
      tg: S.tg(st.tg || "grig000jr"),
      avito: st.avito || "https://www.avito.ru/profile",
      tgName: "@" + String(st.tg || "grig000jr").replace(/^@/, ""),
      city: st.city || "",
      shop: st.shopName || "ЕВГЕНИЙ"
    };
  }

  function bindContacts() {
    var c = contacts();
    document.querySelectorAll("[data-avito]").forEach(function (a) { a.href = c.avito; });
    document.querySelectorAll("[data-tg]").forEach(function (a) {
      a.href = S.tg(c.tgName.replace("@", ""), a.getAttribute("data-tg-text") || undefined);
    });
    document.querySelectorAll("[data-shop]").forEach(function (el) { el.textContent = c.shop; });
    document.querySelectorAll("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });
  }

  function initNav() {
    var page = location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll(".nav a").forEach(function (a) {
      var href = a.getAttribute("href");
      if (href === page || (page === "service.html" && href === "services.html")) a.setAttribute("aria-current", "page");
    });
  }

  /* анимации появления */
  var io = null;
  function observe() {
    if (reduce) {
      document.querySelectorAll(".reveal").forEach(function (el) { el.classList.add("is-in"); });
      return;
    }
    if (!("IntersectionObserver" in window)) {
      document.querySelectorAll(".reveal").forEach(function (el) { el.classList.add("is-in"); });
      return;
    }
    if (!io) {
      io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        });
      }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    }
    document.querySelectorAll(".reveal:not(.is-in)").forEach(function (el, i) {
      el.style.transitionDelay = Math.min(i % 6, 5) * 60 + "ms";
      io.observe(el);
    });
  }

  /* страховка: если блок так и не попал в кадр (печать, скриншот, старый браузер) — показываем */
  setTimeout(function () {
    document.querySelectorAll(".reveal:not(.is-in)").forEach(function (el) { el.classList.add("is-in"); });
  }, 900);

  function revealNow(root) {
    root = root || document;
    root.querySelectorAll(".reveal").forEach(function (el, i) {
      el.style.transitionDelay = Math.min(i % 6, 5) * 60 + "ms";
    });
    observe();
  }

  /* плавные переходы между страницами */
  function initTransitions() {
    document.body.classList.add("page-enter");
    if (reduce) return;
    document.addEventListener("click", function (e) {
      var a = e.target.closest("a");
      if (!a) return;
      var href = a.getAttribute("href") || "";
      if (a.target === "_blank" || a.hasAttribute("download")) return;
      if (!href || href.charAt(0) === "#" || /^(https?:|mailto:|tel:)/.test(href)) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      e.preventDefault();
      document.body.classList.add("page-leave");
      setTimeout(function () { location.href = href; }, 170);
    });
    window.addEventListener("pageshow", function () {
      document.body.classList.remove("page-leave");
    });
  }

  function gallery(images, mainId, thumbsId) {
    var list = (images && images.length ? images : ["assets/img/svc-site.jpg"]);
    var main = document.getElementById(mainId || "gal-main");
    var thumbs = document.getElementById(thumbsId || "gal-thumbs");
    if (!main || !thumbs) return;
    main.src = list[0];
    thumbs.innerHTML = list.map(function (src, i) {
      return '<button type="button" aria-pressed="' + (i === 0) + '" data-src="' + esc(src) + '"><img src="' + esc(src) + '" alt="Фото ' + (i + 1) + '"></button>';
    }).join("");
    thumbs.addEventListener("click", function (e) {
      var btn = e.target.closest("button[data-src]");
      if (!btn) return;
      main.src = btn.getAttribute("data-src");
      main.animate ? main.animate([{ opacity: .35 }, { opacity: 1 }], { duration: 220 }) : null;
      thumbs.querySelectorAll("button").forEach(function (b) { b.setAttribute("aria-pressed", String(b === btn)); });
    });
  }

  function query(name) { return new URLSearchParams(location.search).get(name); }

  document.addEventListener("DOMContentLoaded", function () {
    bindTexts();
    bindContacts();
    initNav();
    initTransitions();
    observe();
  });

  window.UI = {
    esc: esc, card: serviceCard, fill: fill, cover: cover, bindTexts: bindTexts,
    bindContacts: bindContacts, initNav: initNav, gallery: gallery, query: query,
    contacts: contacts, reveal: observe, money: function (n) { return S.money(n); },
    text: function (k) { return S.text(k); }
  };
})();
