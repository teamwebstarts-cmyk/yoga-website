/**
 * Services slider — Appwrite-driven rendering
 * -------------------------------------------
 * Loads rows from the Appwrite `services` table and renders them as
 * `service-block-two` slides in place of the static template cards.
 *
 * Design rules (do not break these):
 *  - The five static cards in index.html are the permanent fallback.
 *    They are only replaced when rows load successfully, so the section
 *    never renders empty, never collapses and never shows a gap while
 *    the request is in flight.
 *  - Generated markup mirrors the static cards class-for-class, so the
 *    layout, hover states and equal-height rules in
 *    css/custom/appwrite-services.css keep working unchanged.
 *
 * Fixes folded in (see PROJECT-AUDIT.md):
 *  A4  numeric sort — `number` is a text column, so "10" sorted before
 *      "2". Rows are now sorted client-side by their numeric value.
 *  A5  the old ROW_LIMIT of 12 silently hid rows 13+; the real ceiling
 *      is Appwrite's page size, and everything is rendered.
 *  A9  results are cached in sessionStorage for 5 minutes.
 *  D6  image paths are validated (relative only) before use.
 *  S1  link URLs are scheme-allowlisted, so a `javascript:` value can
 *      never be rendered as a clickable href.
 *  S2  image src is restricted to local relative paths.
 *  F1  the card list is now driven by event delegation in script.js, so
 *      hover still works after this file replaces the DOM.
 *  F2  this file is the only owner of the Swiper instance — the theme
 *      no longer initialises it, which removes the destroy/recreate jump.
 *  P2  the 655 KB Appwrite SDK is no longer needed on the public page;
 *      this uses the REST endpoint directly.
 */
(function () {
  'use strict';

  var CACHE_TTL_MS = 5 * 60 * 1000;
  var PAGE_SIZE = 100; // Appwrite max per request
  var DEFAULT_IMAGE = 'images/resource/service2-1.jpg';

  var cfg = window.APPWRITE_CONFIG || {};
  var db = (cfg.database && cfg.database.databaseId) || '';
  var tableId = (cfg.database && cfg.database.tables && cfg.database.tables.services) || '';

  /* ---------------------------------------------------------------- */
  /* Text + URL safety                                                 */
  /* ---------------------------------------------------------------- */

  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Only allow links we can reason about: http(s), mailto, tel, and
   * same-origin relative paths. Everything else (javascript:, data:,
   * vbscript:, protocol-relative //evil.com) falls back to '#'.
   */
  function safeHref(value) {
    var url = String(value == null ? '' : value).trim();
    if (!url || url === '#') return '#';
    if (/^https?:\/\//i.test(url)) return url;
    if (/^(mailto:|tel:)/i.test(url)) return url;
    if (url.charAt(0) === '/' && url.charAt(1) !== '/') return url;
    if (/^[a-z0-9._~\-/]+(\?[^#]*)?(#[^ ]*)?$/i.test(url) && url.indexOf(':') === -1) {
      return url; // plain relative path such as index.html#classes
    }
    return '#';
  }

  /**
   * Image paths must stay inside this site. Rejects absolute URLs,
   * protocol-relative URLs and data: URIs, which could otherwise be used
   * to inject tracking pixels into the page.
   */
  function safeImage(value) {
    var src = String(value == null ? '' : value).trim();
    if (!src) return DEFAULT_IMAGE;
    if (/^(https?:)?\/\//i.test(src) || /^data:/i.test(src) || src.indexOf(':') !== -1) {
      return DEFAULT_IMAGE;
    }
    return src.replace(/^\.\//, '');
  }

  /* ---------------------------------------------------------------- */
  /* Card markup                                                       */
  /* ---------------------------------------------------------------- */

  /**
   * Titles in the design break across two lines. An explicit `line2`
   * field wins; otherwise fall back to splitting at a word boundary
   * (finding F3).
   */
  function titleToHtml(title, line2) {
    var second = String(line2 == null ? '' : line2).trim();
    if (second) return esc(title) + '<br>' + esc(second);

    var words = String(title == null ? '' : title).trim().split(/\s+/);
    if (words.length < 3) return esc(title);
    var mid = Math.ceil(words.length / 2);
    return esc(words.slice(0, mid).join(' ')) + '<br>' + esc(words.slice(mid).join(' '));
  }

  function pad2(n) {
    return (n < 10 ? '0' : '') + n;
  }

  function cardHtml(item, isActive) {
    var img = esc(safeImage(item.image));
    return (
      '<div class="service-block-two swiper-slide">' +
        '<div class="inner-block' + (isActive ? ' active' : '') + '">' +
          '<div class="upper-box">' +
            '<div class="title-outer">' +
              '<div class="h5 number">' + esc(item.number) + '</div>' +
              '<div class="h4 title">' + titleToHtml(item.title, item.line2) + '</div>' +
            '</div>' +
            '<div class="image">' +
              '<img src="' + img + '" alt="">' +
              '<img src="' + img + '" alt="">' +
            '</div>' +
          '</div>' +
          '<div class="text">' + esc(item.text) + '</div>' +
          '<a href="' + esc(safeHref(item.link)) + '" class="theme-btn btn-style-one">Read More ' +
            '<span><img src="images/icons/arrow.png" alt=""></span>' +
          '</a>' +
        '</div>' +
      '</div>'
    );
  }

  /* ---------------------------------------------------------------- */
  /* Sorting                                                           */
  /* ---------------------------------------------------------------- */

  function numericValue(row) {
    var match = String(row.number == null ? '' : row.number).match(/-?\d+(\.\d+)?/);
    return match ? parseFloat(match[0]) : Number.MAX_SAFE_INTEGER;
  }

  /**
   * `number` is stored as text, so the database's orderAsc() gives
   * "1, 10, 11, 2". Sort on the leading integer instead; items without
   * a number keep their original relative order at the end.
   */
  function sortRows(rows) {
    return rows
      .map(function (row, index) { return { row: row, index: index }; })
      .sort(function (a, b) {
        var na = numericValue(a.row);
        var nb = numericValue(b.row);
        if (na !== nb) return na - nb;
        return a.index - b.index;
      })
      .map(function (entry) { return entry.row; });
  }

  /* ---------------------------------------------------------------- */
  /* Swiper ownership                                                  */
  /* ---------------------------------------------------------------- */

  function destroySwiper(el) {
    if (el && el.swiper && typeof el.swiper.destroy === 'function') {
      el.swiper.destroy(true, true);
    }
  }

  function initSwiper() {
    if (typeof window.Swiper === 'undefined') return;
    var el = document.querySelector('.service-slider');
    if (!el) return;
    destroySwiper(el);
    new window.Swiper(el, {
      spaceBetween: 30,
      speed: 800,
      loop: true,
      loopedSlides: 4,
      autoplay: {
        delay: 3500,
        disableOnInteraction: false,
        pauseOnMouseEnter: true
      },
      pagination: { el: '.service-slider-dots', clickable: true },
      breakpoints: {
        1400: { slidesPerView: 4 },
        1200: { slidesPerView: 3 },
        768: { slidesPerView: 2 },
        400: { slidesPerView: 1 },
      },
    });
    el.setAttribute('data-swiper-ready', 'true');
  }

  /* ---------------------------------------------------------------- */
  /* Rendering                                                         */
  /* ---------------------------------------------------------------- */

  function render(rows) {
    var wrapper = document.querySelector('.service-slider .swiper-wrapper');
    if (!wrapper || !rows || !rows.length) return false; // keep static cards

    // Swiper 11 loop mode requires at least 8 slides (slidesPerView 4 * 2) to scroll continuously
    var displayRows = rows.slice();
    while (displayRows.length < 8 && rows.length > 0) {
      displayRows = displayRows.concat(rows);
    }

    var activeIndex = Math.min(2, Math.floor(displayRows.length / 2));
    var html = '';
    displayRows.forEach(function (row, i) {
      html += cardHtml(
        {
          number: row.number || pad2((i % rows.length) + 1),
          title: row.title || '',
          line2: row.line2 || '',
          image: row.image || '',
          text: row.text || '',
          link: row.link || '#',
        },
        i === activeIndex
      );
    });

    wrapper.innerHTML = html;
    initSwiper();
    return true;
  }

  /* ---------------------------------------------------------------- */
  /* Data access                                                       */
  /* ---------------------------------------------------------------- */

  function cacheKey() {
    return 'lotusu:services:' + (cfg.projectId || '') + ':' + db + ':' + tableId;
  }

  function readCache() {
    try {
      var raw = window.sessionStorage.getItem(cacheKey());
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      if (!parsed || !parsed.at || Date.now() - parsed.at > CACHE_TTL_MS) return null;
      return parsed.rows;
    } catch (err) {
      return null;
    }
  }

  function writeCache(rows) {
    try {
      window.sessionStorage.setItem(cacheKey(), JSON.stringify({ at: Date.now(), rows: rows }));
    } catch (err) {
      /* Private mode / quota — caching is optional. */
    }
  }

  function endpointUrl() {
    var base = String(cfg.endpoint || '').replace(/\/+$/, '');
    return (
      base +
      '/tablesdb/' + encodeURIComponent(db) +
      '/tables/' + encodeURIComponent(tableId) +
      '/rows?queries[]=' + encodeURIComponent('limit(' + PAGE_SIZE + ')')
    );
  }

  function fetchRows() {
    return window
      .fetch(endpointUrl(), {
        method: 'GET',
        headers: { 'X-Appwrite-Project': cfg.projectId },
        credentials: 'omit',
      })
      .then(function (res) {
        if (!res.ok) {
          return res.json().catch(function () { return {}; }).then(function (body) {
            var error = new Error(body.message || 'Request failed with status ' + res.status);
            error.code = res.status;
            error.type = body.type;
            throw error;
          });
        }
        return res.json();
      })
      .then(function (body) { return (body && body.rows) || []; });
  }

  /* ---------------------------------------------------------------- */
  /* Boot                                                              */
  /* ---------------------------------------------------------------- */

  function ready() {
    return !!(cfg.endpoint && cfg.projectId && db && tableId);
  }

  function load() {
    // The slider must exist even when Appwrite is unavailable — this is
    // now the only place it is initialised (finding F2).
    initSwiper();

    if (!ready()) {
      console.warn('[Services] Appwrite not configured — keeping static cards.');
      return;
    }

    var cached = readCache();
    if (cached && cached.length) {
      render(sortRows(cached));
    }

    fetchRows()
      .then(function (rows) {
        // Treat a missing `published` field as published, so this works
        // with or without the optional draft flag (finding A7).
        var visible = rows.filter(function (row) {
          return row.published !== false && row.published !== 'false';
        });
        writeCache(visible);
        render(sortRows(visible));
      })
      .catch(function (err) {
        console.warn(
          '[Services] Could not load services from Appwrite — keeping static cards.',
          (err && err.code ? err.code + ' ' : '') + (err && err.message ? err.message : err)
        );
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', load);
  } else {
    load();
  }
})();
