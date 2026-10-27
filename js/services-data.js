/**
 * Services slider — Appwrite-driven rendering
 * -------------------------------------------
 * Loads rows from the Appwrite `services` table (ids resolved from
 * .env via appwrite-config.js / appwrite-init.js) and renders them as
 * `service-block-two` slides in place of the static template cards.
 *
 * Behavior:
 *  - The static template slides stay in index.html as fallback markup;
 *    they are only replaced when rows load successfully.
 *  - The Swiper instance that script.js initialized on the static
 *    markup is destroyed and re-created after the render (the slider
 *    uses loop/autoplay/breakpoints that cannot handle live DOM swaps).
 *  - Single source of markup truth: the generated slide HTML mirrors
 *    the original .service-block-two structure and CSS hooks exactly
 *    (class names, active state, <br> line break inside titles).
 */
(function () {
  'use strict';

  var ROW_LIMIT = 12; // slider is designed for ~5 cards

  // Escape text before injecting into HTML (rows are user-editable data).
  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Template titles break across two lines ("Awaken with <br>Ritual Flow").
  // Reproduce that: split the title roughly in half at a word boundary.
  function titleToHtml(title) {
    var words = String(title || '').trim().split(/\s+/);
    if (words.length < 3) return esc(title);
    var mid = Math.ceil(words.length / 2);
    return (
      esc(words.slice(0, mid).join(' ')) +
      '<br>' +
      esc(words.slice(mid).join(' '))
    );
  }

  function pad2(n) {
    return (n < 10 ? '0' : '') + n;
  }

  // Mirrors the static .service-block-two markup in index.html exactly.
  function cardHtml(item, isActive) {
    var img = esc(item.image);
    return (
      '<div class="service-block-two swiper-slide">' +
        '<div class="inner-block' + (isActive ? ' active' : '') + '">' +
          '<div class="upper-box">' +
            '<div class="title-outer">' +
              '<div class="h5 number">' + esc(item.number) + '</div>' +
              '<div class="h4 title">' + titleToHtml(item.title) + '</div>' +
            '</div>' +
            '<div class="image">' +
              '<img src="' + img + '" alt="">' +
              '<img src="' + img + '" alt="">' +
            '</div>' +
          '</div>' +
          '<div class="text">' + esc(item.text) + '</div>' +
          '<a href="' + esc(item.link || '#') + '" class="theme-btn btn-style-one">Read More ' +
            '<span><img src="images/icons/arrow.png" alt=""></span>' +
          '</a>' +
        '</div>' +
      '</div>'
    );
  }

  // script.js already created a Swiper on the static markup — tear it
  // down (cleanStyles: true) before re-creating it on the new slides.
  function destroyExistingSwiper() {
    var el = document.querySelector('.service-slider');
    if (el && el.swiper && typeof el.swiper.destroy === 'function') {
      el.swiper.destroy(true, true);
    }
  }

  function initSwiper() {
    if (typeof window.Swiper === 'undefined') return;
    destroyExistingSwiper();
    // Same options as the original .service-slider init in script.js.
    new Swiper('.service-slider', {
      spaceBetween: 30,
      speed: 1500,
      loop: true,
      autoplay: { delay: 1000, disableOnInteraction: false },
      pagination: { el: '.service-slider-dots', clickable: true },
      breakpoints: {
        1400: { slidesPerView: 4 },
        1200: { slidesPerView: 3 },
        768: { slidesPerView: 2 },
        400: { slidesPerView: 1 },
      },
    });
  }

  function render(rows) {
    var wrapper = document.querySelector('.service-slider .swiper-wrapper');
    if (!wrapper || !rows || !rows.length) return; // keep static fallback

    var activeIndex = Math.min(2, Math.floor(rows.length / 2));
    var html = '';
    rows.forEach(function (row, i) {
      html += cardHtml(
        {
          number: row.number || pad2(i + 1),
          title: row.title || '',
          image: row.image || '',
          text: row.text || '',
          link: row.link || '#',
        },
        i === activeIndex
      );
    });

    wrapper.innerHTML = html;
    initSwiper();
  }

  function fetchRows(services) {
    return services.tablesDB.listRows({
      databaseId: services.databaseId,
      tableId: services.tables.services,
      queries: [
        window.Appwrite.Query.orderAsc('number'),
        window.Appwrite.Query.limit(ROW_LIMIT),
      ],
    });
  }

  function load() {
    var services = window.yogavaAppwrite;
    var ready =
      services &&
      services.tablesDB &&
      services.databaseId &&
      services.tables &&
      services.tables.services;

    if (!ready) {
      console.warn(
        '[Services] Appwrite services table not configured — ' +
        'set APPWRITE_DATABASE_ID / table IDs (.env) and re-run ' +
        '_tools/sync-appwrite-env.py. Keeping static cards.'
      );
      return;
    }

    fetchRows(services)
      .then(function (res) {
        render(res.rows || []);
      })
      .catch(function (err) {
        console.warn(
          '[Services] Could not load services from Appwrite — ' +
          'keeping static cards.',
          err && (err.code + ' ' + err.message || err)
        );
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', load);
  } else {
    load();
  }
})();
