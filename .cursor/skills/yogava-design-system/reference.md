# Yogava — copy-paste snippets

All snippets consume existing template CSS/JS hooks. Do not rename classes.

## New section shell

```html
<!-- start news-section -->
<section class="news-section fix section-padding">
  <div class="outer-box">
    <div class="shape-1 float-horizontal"><img src="images/icons/shape-2.png" alt=""></div>
    <div class="auto-container">
      <div class="sec-title mb-50">
        <div class="h2 title char-animation">Fresh headline <br>second line</div>
      </div>
      <div class="row gx-4 gsap-stagger-parent">
        <div class="news-block col-xl-4 col-md-6 gsap-stagger-item">
          <div class="inner-block">
            <div class="h4 title">Card title here</div>
            <div class="text">Muted gray body copy lives in .text.</div>
            <a href="#" class="theme-btn btn-style-one">Read More <span><img src="images/icons/arrow.png" alt=""></span></a>
          </div>
        </div>
        <!-- repeat -block / gsap-stagger-item ... -->
      </div>
    </div>
  </div>
</section>
<!-- end news-section -->
```

Column recipe: 3-up `col-xl-4 col-md-6`, 2-up `col-lg-6`, hero splits `col-xl-7 col-lg-6` / `col-xl-5 col-lg-6`.

## Dark/teal band section (like services-section-two)

```html
<section class="feature-band-section">
  <div class="outer-box fix section-padding" style="background-color: var(--theme-color1);">
    <div class="auto-container">
      <div class="sec-title text-center light mb-50">
        <div class="h2 title char-animation">Light heading on teal</div>
      </div>
      <!-- cards: .inner-block with white-0.1 border/bg, two stacked <img>s for blur hover -->
    </div>
  </div>
</section>
```

Prefer a dedicated stylesheet over inline styles for the band color.

## Light card with hover fill (like pricing/blog blocks)

```css
.news-section .news-block .inner-block {
  position: relative;
  margin-bottom: 30px;
  border-radius: 16px;
  border: 1px solid rgba(var(--theme-color2-rgb), 0.1);
  padding: 40px;
  -webkit-transition: all 300ms ease;
          transition: all 300ms ease;
}
.news-section .news-block .inner-block:hover {
  background-color: var(--bg-color);
}
```

## Hover-active card group (script.js pattern)

```js
const boxes = document.querySelectorAll('.news-block .inner-block');
boxes.forEach(box => {
  box.addEventListener('mouseenter', () => {
    boxes.forEach(item => item.classList.remove('active'));
    box.classList.add('active');
  });
});
// Optionally pin one card active on load (template pins index 2):
boxes[2] && boxes[2].classList.add('active');
```

## Blur-crossfade image hover (two identical stacked images)

```html
<div class="image">
  <img src="images/resource/x.jpg" alt="">
  <img src="images/resource/x.jpg" alt="">
</div>
```

```css
.my-block .image {
  position: relative;
  border-radius: 14px;
  overflow: hidden;
}
.my-block .image img {
  width: 100%; height: 100%; object-fit: cover;
  -webkit-transition: all 500ms ease;
          transition: all 500ms ease;
}
.my-block .inner-block.active .image img:first-child,
.my-block .inner-block:hover .image img:first-child {
  transform: translateX(0) scaleX(1); opacity: 1; filter: blur(0);
}
.my-block .inner-block.active .image img:nth-child(2),
.my-block .inner-block:hover .image img:nth-child(2) {
  transform: translateX(-50%) scaleX(2); opacity: 0; filter: blur(10px);
}
/* default (non-hover) state is the inverse — see .service-block-two in style.css */
```

## Appwrite-driven card render (mirror of services-data.js)

```js
(function () {
  'use strict';
  var aw = window.yogavaAppwrite;

  function esc(v) {
    return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function render(rows) {
    var wrapper = document.querySelector('.news-slider .swiper-wrapper');
    if (!wrapper || !rows || !rows.length) return; // keep static fallback markup
    wrapper.innerHTML = rows.map(function (row) { return cardHtml(row); }).join('');
    rebuildSwiper();
  }

  function cardHtml(r) {
    return '<div class="news-block swiper-slide"><div class="inner-block">' +
      '<div class="h4 title">' + esc(r.title) + '</div>' +
      '<div class="text">' + esc(r.text) + '</div>' +
      '<a href="' + esc(r.link || '#') + '" class="theme-btn btn-style-one">Read More ' +
      '<span><img src="images/icons/arrow.png" alt=""></span></a></div></div>';
  }

  // destroy + recreate so loop/autoplay/breakpoints pick up new slides
  function rebuildSwiper() {
    var el = document.querySelector('.news-slider');
    if (el && el.swiper) el.swiper.destroy(true, true);
    new Swiper('.news-slider', {
      spaceBetween: 30,
      speed: 1500,
      loop: true,
      autoplay: { delay: 1000, disableOnInteraction: false },
      pagination: { el: '.news-slider-dots', clickable: true },
      breakpoints: {
        1400: { slidesPerView: 4 },
        1200: { slidesPerView: 3 },
        768:  { slidesPerView: 2 },
        400:  { slidesPerView: 1 },
      },
    });
  }

  aw.tablesDB.listRows({
    databaseId: aw.databaseId,
    tableId: aw.tables.news,
  }).then(function (res) { render(res.rows); })
    .catch(function () { /* static fallback stays */ });
})();
```

Lines up the same as `js/appwrite/services-data.js`.

## Icon feature block

```html
<div class="wcu-block col-md-6 gsap-stagger-item">
  <div class="inner-block">
    <div class="icon"><i aria-hidden="true" class="flaticon-set-yoga-13"></i></div>
    <div class="h4 title">Feature title</div>
    <div class="text">Short supporting copy.</div>
  </div>
</div>
```

Icon chip: 65px circle (88px in two-col variants), 1px `rgba(var(--theme-color2-rgb), 0.1)` border, ~36px font-size; hover fills `--theme-color1`. Flaticon classes see `css/flaticon-set-yoga.css`, `flaticon-set-medical.css`, `flaticons-common.css`; FA for social `fa-brands fa-...`.

## Counter stat

```html
<div class="h3 count-box"><span class="count-text" data-speed="3000" data-stop="25">5</span>+</div>
```

## Equal-height slider cards (appwrite-services.css pattern)

```css
.{name}-slider .swiper-slide {
  height: auto;
  display: -webkit-box;
  display: -ms-flexbox;
  display: flex;
  padding-bottom: 30px;
}
.{name}-slider .{name}-block .inner-block {
  height: 100%;
  display: -webkit-box;
  display: -ms-flexbox;
  display: flex;
  flex-direction: column;
}
.{name}-slider .{name}-block .inner-block .text { flex: 1 0 auto; }
```

Keeps CTA buttons baseline-aligned regardless of copy length.
