/* =============================================================
   YourSong / ТвояПесня — theme.js
   ============================================================= */

(function () {
  'use strict';

  /* ----------------------------------------------------------
     HELPERS
  ---------------------------------------------------------- */
  function fmt(s) {
    if (!isFinite(s) || isNaN(s)) return '0:00';
    var m = Math.floor(s / 60), sec = Math.floor(s % 60);
    return m + ':' + (sec < 10 ? '0' : '') + sec;
  }
  function money(cents, currency) {
    var code   = currency || (window.shopifyTheme && window.shopifyTheme.currencyCode) || 'EUR';
    var amount = cents / 100;
    try {
      return new Intl.NumberFormat(undefined, {
        style:                 'currency',
        currency:              code,
        minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
        maximumFractionDigits: 2
      }).format(amount);
    } catch (e) {
      var sym = (window.shopifyTheme && window.shopifyTheme.currencySymbol) || '€';
      return sym + (amount % 1 === 0 ? amount : amount.toFixed(2));
    }
  }

  /* ----------------------------------------------------------
     1. FADE-IN ON SCROLL
  ---------------------------------------------------------- */
  function initFadeIn() {
    var els = document.querySelectorAll('.fade-in');
    if (!els.length) return;
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
      });
    }, { threshold: 0.1 });
    els.forEach(function (el) { obs.observe(el); });
  }

  /* ----------------------------------------------------------
     2. FAQ ACCORDION
  ---------------------------------------------------------- */
  function initFAQ() {
    document.querySelectorAll('.faq__item').forEach(function (item) {
      var btn = item.querySelector('.faq__question');
      if (!btn) return;
      btn.addEventListener('click', function () {
        var open = item.classList.contains('open');
        document.querySelectorAll('.faq__item').forEach(function (i) { i.classList.remove('open'); });
        if (!open) item.classList.add('open');
      });
    });
  }

  /* ----------------------------------------------------------
     3. MUSIC PLAYER
  ---------------------------------------------------------- */
  function initMusicPlayer() {
    var section = document.querySelector('.music-player');
    if (!section) return;
    var cfg = window.shopifyTheme || {};
    var songs = [
      { title: 'Маша и кофе',            sub: 'День рождения · Поп-баллада',   src: cfg.song1Url || '' },
      { title: 'Настя, ты моя вселенная', sub: 'День рождения · Романтическая', src: cfg.song2Url || '' }
    ];
    var curIdx = 0, playing = false, audio = null;
    var vinyl  = section.querySelector('.vinyl');
    var titleEl= section.querySelector('.player-card__title');
    var subEl  = section.querySelector('.player-card__sub');
    var fillEl = section.querySelector('.progress-bar-fill');
    var wrap   = section.querySelector('.progress-bar-wrap');
    var timeEl = section.querySelector('.player-time-cur');
    var durEl  = section.querySelector('.player-time-dur');
    var playBtn= section.querySelector('.player-btn-play');
    var prevBtn= section.querySelector('.player-btn-prev');
    var nextBtn= section.querySelector('.player-btn-next');
    var dots   = section.querySelectorAll('.player-dot');
    var tracks = section.querySelectorAll('.track-item');

    function renderPlayBtn() {
      playBtn.innerHTML = playing
        ? '<span class="pause-bars"><span class="pause-bar"></span><span class="pause-bar"></span></span>'
        : '<span class="play-icon"></span>';
    }
    function updateUI() {
      var s = songs[curIdx];
      if (titleEl) titleEl.textContent = s.title;
      if (subEl)   subEl.textContent   = s.sub;
      dots.forEach(function (d, i)  { d.classList.toggle('active', i === curIdx); });
      tracks.forEach(function (t, i) { t.classList.toggle('active', i === curIdx); });
    }
    function loadSong(idx) {
      if (audio) { audio.pause(); audio.src = ''; }
      playing = false;
      if (fillEl) fillEl.style.width = '0%';
      if (timeEl) timeEl.textContent = '0:00';
      if (durEl)  durEl.textContent  = '0:00';
      if (vinyl)  vinyl.classList.remove('spinning');
      renderPlayBtn();
      curIdx = (idx + songs.length) % songs.length;
      updateUI();
      if (!songs[curIdx].src) return;
      audio = new Audio(songs[curIdx].src);
      audio.addEventListener('timeupdate', function () {
        var pct = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
        if (fillEl) fillEl.style.width = pct + '%';
        if (timeEl) timeEl.textContent = fmt(audio.currentTime);
      });
      audio.addEventListener('loadedmetadata', function () {
        if (durEl) durEl.textContent = fmt(audio.duration);
      });
      audio.addEventListener('ended', function () {
        playing = false;
        if (vinyl) vinyl.classList.remove('spinning');
        renderPlayBtn();
        if (fillEl) fillEl.style.width = '0%';
        if (timeEl) timeEl.textContent = '0:00';
      });
    }
    function togglePlay() {
      if (!songs[curIdx].src) { alert('🎵 Аудиофайл ещё не загружен.'); return; }
      if (!audio) loadSong(curIdx);
      if (playing) {
        audio.pause(); playing = false;
        if (vinyl) vinyl.classList.remove('spinning');
      } else {
        audio.play(); playing = true;
        if (vinyl) vinyl.classList.add('spinning');
      }
      renderPlayBtn();
    }
    if (playBtn) playBtn.addEventListener('click', togglePlay);
    if (prevBtn) prevBtn.addEventListener('click', function () { loadSong(curIdx - 1); });
    if (nextBtn) nextBtn.addEventListener('click', function () { loadSong(curIdx + 1); });
    dots.forEach(function (d, i)  { d.addEventListener('click', function () { loadSong(i); }); });
    tracks.forEach(function (t, i){ t.addEventListener('click', function () { loadSong(i); }); });
    if (wrap) {
      wrap.addEventListener('click', function (e) {
        if (!audio || !audio.duration) return;
        var r = wrap.getBoundingClientRect();
        audio.currentTime = ((e.clientX - r.left) / r.width) * audio.duration;
      });
    }
    loadSong(0); renderPlayBtn();
  }

  /* ----------------------------------------------------------
     4. DISCOUNT CODE MANAGER
  ---------------------------------------------------------- */
  var Discount = {
    STORAGE_KEY: 'ys_discount_code',
    code: '',

    load: function () {
      this.code = localStorage.getItem(this.STORAGE_KEY) || '';
    },
    save: function (code) {
      this.code = code.toUpperCase().trim();
      if (this.code) localStorage.setItem(this.STORAGE_KEY, this.code);
      else           localStorage.removeItem(this.STORAGE_KEY);
    },
    clear: function () { this.code = ''; localStorage.removeItem(this.STORAGE_KEY); },

    checkoutUrl: function () {
      return this.code ? '/checkout?discount=' + encodeURIComponent(this.code) : '/checkout';
    },

    // Render "applied" state into a feedback element and input
    renderApplied: function (inputEl, feedbackEl, removeBtn) {
      if (!feedbackEl) return;
      if (this.code) {
        if (inputEl) { inputEl.value = this.code; inputEl.disabled = true; }
        feedbackEl.innerHTML =
          '<span class="discount-applied-tag">' +
          '✓ ' + this.code + ' применён' +
          (removeBtn ? ' <button class="discount-remove-btn" aria-label="Убрать">×</button>' : '') +
          '</span>';
        feedbackEl.className = 'discount-feedback success';
      } else {
        if (inputEl) { inputEl.value = ''; inputEl.disabled = false; }
        feedbackEl.innerHTML = '';
        feedbackEl.className = 'discount-feedback';
      }
    },

    // Wire up an input + apply button + feedback element
    wire: function (inputId, btnId, feedbackId, onApply) {
      var self   = this;
      var input  = document.getElementById(inputId);
      var btn    = document.getElementById(btnId);
      var fb     = document.getElementById(feedbackId);
      if (!input || !btn) return;

      // Restore saved state
      this.renderApplied(input, fb, true);

      // Remove button inside feedback (event delegation)
      if (fb) {
        fb.addEventListener('click', function (e) {
          if (e.target.classList.contains('discount-remove-btn')) {
            self.clear();
            self.renderApplied(input, fb, true);
            if (onApply) onApply();
          }
        });
      }

      btn.addEventListener('click', function () {
        var code = input.value.toUpperCase().trim();
        if (!code) {
          if (fb) { fb.textContent = 'Введите промокод'; fb.className = 'discount-feedback error'; }
          return;
        }
        // Validate against configured codes
        var raw = window.shopifyTheme && window.shopifyTheme.discountCodes ? window.shopifyTheme.discountCodes : '';
        var validCodes = raw.split(',').map(function (c) { return c.trim().toUpperCase(); }).filter(Boolean);
        if (validCodes.length > 0 && validCodes.indexOf(code) === -1) {
          if (fb) { fb.textContent = 'Промокод не найден'; fb.className = 'discount-feedback error'; }
          return;
        }
        self.save(code);
        self.renderApplied(input, fb, true);
        if (onApply) onApply();
      });

      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') btn.click();
      });
    }
  };

  /* ----------------------------------------------------------
     5. CART DRAWER
  ---------------------------------------------------------- */
  var CartDrawer = {
    drawer: null, badge: null, body: null,
    footer: null, empty: null, total: null,
    count:  null, returnBar: null,
    subtotalEl: null, discountLine: null, codeLabel: null, discSaving: null,
    _lastTotal: 0,

    init: function () {
      this.drawer      = document.getElementById('cart-drawer');
      this.badge       = document.getElementById('cart-badge');
      this.body        = document.getElementById('cart-drawer-body');
      this.footer      = document.getElementById('cart-drawer-footer');
      this.empty       = document.getElementById('cart-drawer-empty');
      this.total       = document.getElementById('cart-drawer-total');
      this.count       = document.getElementById('drawer-item-count');
      this.returnBar   = document.getElementById('cart-return-bar');
      this.subtotalEl  = document.getElementById('cart-drawer-subtotal');
      this.discountLine= document.getElementById('drawer-discount-line');
      this.codeLabel   = document.getElementById('drawer-code-label');
      this.discSaving  = document.getElementById('drawer-discount-saving');
      if (!this.drawer) return;

      var self = this;

      // Open triggers
      document.querySelectorAll('[data-open-cart]').forEach(function (b) {
        b.addEventListener('click', function () { self.open(); });
      });
      // Close triggers
      this.drawer.querySelectorAll('[data-close-cart]').forEach(function (el) {
        el.addEventListener('click', function () { self.close(); });
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && self.drawer.classList.contains('open')) self.close();
      });

      // Global open event
      window.addEventListener('open-cart-drawer', function () { self.open(); });

      // Qty / remove delegation
      this.body.addEventListener('click', function (e) {
        var inc = e.target.closest('.qty-btn[data-action="inc"]');
        var dec = e.target.closest('.qty-btn[data-action="dec"]');
        var rem = e.target.closest('.cart-item__remove');
        if (inc) {
          var item = inc.closest('.cart-item');
          var qty  = parseInt(item.querySelector('.qty-value').textContent, 10);
          self.updateItem(item.dataset.key, qty + 1, item);
        }
        if (dec) {
          var item = dec.closest('.cart-item');
          var qty  = parseInt(item.querySelector('.qty-value').textContent, 10);
          self.updateItem(item.dataset.key, Math.max(0, qty - 1), item);
        }
        if (rem) {
          var item = rem.closest('.cart-item');
          self.updateItem(item.dataset.key, 0, item);
        }
      });

      // Discount code
      Discount.wire('drawer-discount-input', 'drawer-discount-btn', 'drawer-discount-feedback', function () {
        self.updateCheckoutUrl();
        self.updateTotals(self._lastTotal);
      });

      // Checkout button
      var checkoutBtn = document.getElementById('cart-checkout-btn');
      if (checkoutBtn) {
        checkoutBtn.addEventListener('click', function () {
          sessionStorage.setItem('ys_went_checkout', '1');
          window.location.href = Discount.checkoutUrl();
        });
      }

      // Return bar: show if user came back from checkout
      if (sessionStorage.getItem('ys_went_checkout')) {
        sessionStorage.removeItem('ys_went_checkout');
        if (this.returnBar) this.returnBar.style.display = 'flex';
      }

      // Return bar open-cart btn
      if (this.returnBar) {
        this.returnBar.querySelectorAll('[data-open-cart]').forEach(function (b) {
          b.addEventListener('click', function () { self.open(); });
        });
      }

      // Initial badge
      this.fetchCart(false);
    },

    open: function () {
      if (!this.drawer) return;
      this.drawer.classList.add('open');
      this.drawer.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      this.fetchCart(true);
    },

    close: function () {
      if (!this.drawer) return;
      this.drawer.classList.remove('open');
      this.drawer.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    },

    updateCheckoutUrl: function () {
      var btn = document.getElementById('cart-checkout-btn');
      // URL is built dynamically on click — nothing to update in DOM
    },

    fetchCart: function (renderItems) {
      var self = this;
      fetch('/cart.js', { headers: { Accept: 'application/json' } })
        .then(function (r) { return r.json(); })
        .then(function (cart) {
          self.updateBadge(cart.item_count);
          if (renderItems) self.render(cart);
        }).catch(function () {});
    },

    updateBadge: function (n) {
      if (!this.badge) return;
      this.badge.textContent = n;
      this.badge.classList.toggle('visible', n > 0);
    },

    render: function (cart) {
      if (!this.body) return;
      var self = this;
      if (this.count) this.count.textContent = cart.item_count > 0 ? '(' + cart.item_count + ')' : '';

      if (cart.item_count === 0) {
        // Clear saved discount when cart is emptied
        if (Discount.code) {
          Discount.clear();
          Discount.renderApplied(
            document.getElementById('drawer-discount-input'),
            document.getElementById('drawer-discount-feedback'),
            true
          );
        }
        if (this.empty)  this.empty.style.display  = 'flex';
        if (this.footer) this.footer.style.display = 'none';
        this.body.querySelectorAll('.cart-item').forEach(function (el) { el.remove(); });
        return;
      }

      if (this.empty)  this.empty.style.display  = 'none';
      if (this.footer) this.footer.style.display = 'block';
      this._lastTotal = cart.total_price;
      this.updateTotals(cart.total_price);

      var html = '';
      cart.items.forEach(function (item) {
        var skip = ['История', 'Email'];
        var propRows = '';
        var storyBlock = '';
        if (item.properties) {
          Object.keys(item.properties).forEach(function (k) {
            if (!item.properties[k]) return;
            if (k === 'Email') return;
            if (k === 'История') {
              storyBlock = '<div class="cart-item__story">'
                + '<div class="cart-item__story-label">✍️ История</div>'
                + '<div class="cart-item__story-text">' + item.properties[k] + '</div>'
                + '</div>';
              return;
            }
            propRows += '<div class="cart-item__prop-row">'
              + '<span class="cart-item__prop-key">' + k + '</span>'
              + '<span class="cart-item__prop-val">' + item.properties[k] + '</span>'
              + '</div>';
          });
        }
        html += '<div class="cart-item" data-key="' + item.key + '">'
          + '<div class="cart-item__header">'
          + '<div class="cart-item__icon">🎵</div>'
          + '<div class="cart-item__header-info">'
          + '<div class="cart-item__title">' + item.product_title + '</div>'
          + '<div class="cart-item__price">' + money(item.final_line_price) + '</div>'
          + '</div>'
          + '</div>'
          + (propRows ? '<div class="cart-item__props">' + propRows + '</div>' : '')
          + storyBlock
          + '<div class="cart-item__footer">'
          + '<div class="qty-control">'
          + '<button class="qty-btn" data-action="dec">−</button>'
          + '<span class="qty-value">' + item.quantity + '</span>'
          + '<button class="qty-btn" data-action="inc">+</button>'
          + '</div>'
          + '<button class="cart-item__remove">🗑 Удалить</button>'
          + '</div>'
          + '</div>';
      });

      this.body.querySelectorAll('.cart-item').forEach(function (el) { el.remove(); });
      this.body.insertAdjacentHTML('afterbegin', html);
    },

    updateTotals: function (rawCents) {
      var cfg = window.shopifyTheme || {};
      var pct = cfg.discountPct || 0;
      var discounted = Discount.code && pct > 0
        ? Math.round(rawCents * (1 - pct / 100))
        : rawCents;
      var saving = rawCents - discounted;

      if (this.subtotalEl) this.subtotalEl.textContent = money(rawCents);

      if (Discount.code && saving > 0) {
        if (this.discountLine) this.discountLine.style.display = 'flex';
        if (this.codeLabel)    this.codeLabel.textContent      = Discount.code;
        if (this.discSaving)   this.discSaving.textContent     = '−' + money(saving);
      } else {
        if (this.discountLine) this.discountLine.style.display = 'none';
      }

      if (this.total) this.total.textContent = money(discounted);
    },

    updateItem: function (key, qty, itemEl) {
      var self = this;
      if (itemEl) itemEl.classList.add('loading');
      fetch('/cart/change.js', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body:    JSON.stringify({ id: key, quantity: qty })
      })
        .then(function (r) { return r.json(); })
        .then(function (cart) { self.updateBadge(cart.item_count); self.render(cart); })
        .catch(function () { if (itemEl) itemEl.classList.remove('loading'); });
    }
  };

  /* ----------------------------------------------------------
     6. CART PAGE (/cart)
  ---------------------------------------------------------- */
  var CartPage = {
    init: function () {
      var self = this;
      var itemsEl = document.getElementById('cart-page-items');
      if (!itemsEl) return;

      // Qty / remove delegation
      itemsEl.addEventListener('click', function (e) {
        var inc = e.target.closest('.qty-btn[data-action="inc"]');
        var dec = e.target.closest('.qty-btn[data-action="dec"]');
        var rem = e.target.closest('.cart-item__remove');
        if (inc) {
          var row = inc.closest('.cart-page-item');
          self.updateItem(row.dataset.key, parseInt(row.querySelector('.qty-value').textContent, 10) + 1, row);
        }
        if (dec) {
          var row = dec.closest('.cart-page-item');
          var qty = parseInt(row.querySelector('.qty-value').textContent, 10);
          self.updateItem(row.dataset.key, Math.max(0, qty - 1), row);
        }
        if (rem) {
          var row = rem.closest('.cart-page-item');
          self.updateItem(row.dataset.key, 0, row);
        }
      });

      // Discount code
      Discount.wire('cart-page-discount-input', 'cart-page-discount-btn', 'cart-page-discount-feedback', function () {
        self.updateSummary();
      });
      this.updateSummary();

      // Checkout button
      var checkoutBtn = document.getElementById('cart-page-checkout-btn');
      if (checkoutBtn) {
        checkoutBtn.addEventListener('click', function () {
          sessionStorage.setItem('ys_went_checkout', '1');
          window.location.href = Discount.checkoutUrl();
        });
      }
    },

    updateItem: function (key, qty, rowEl) {
      var self = this;
      if (rowEl) rowEl.classList.add('loading');
      fetch('/cart/change.js', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body:    JSON.stringify({ id: key, quantity: qty })
      })
        .then(function (r) { return r.json(); })
        .then(function (cart) {
          // Update badge
          CartDrawer.updateBadge(cart.item_count);
          // Reload page to re-render items (simplest reliable approach for cart page)
          window.location.reload();
        })
        .catch(function () { if (rowEl) rowEl.classList.remove('loading'); });
    },

    updateSummary: function () {
      var subtotalEl   = document.getElementById('cart-page-subtotal');
      var totalEl      = document.getElementById('cart-page-total');
      var discountLine = document.getElementById('cart-page-discount-line');
      var codeLabel    = document.getElementById('cart-page-code-label');
      var discAmt      = document.getElementById('cart-page-discount-amount');
      if (!subtotalEl) return;

      var rawCents = parseInt(subtotalEl.getAttribute('data-cents') || '0', 10);
      var cfg = window.shopifyTheme || {};
      var pct = cfg.discountPct || 0;

      if (Discount.code && pct > 0) {
        var saving      = Math.round(rawCents * pct / 100);
        var discounted  = rawCents - saving;
        discountLine.style.display = 'flex';
        if (codeLabel) codeLabel.textContent = Discount.code;
        if (discAmt)   discAmt.textContent   = '−' + money(saving);
        if (totalEl)   totalEl.textContent   = money(discounted);
      } else {
        if (discountLine) discountLine.style.display = 'none';
        if (totalEl)      totalEl.textContent = money(rawCents);
      }
    }
  };

  /* ----------------------------------------------------------
     7. ORDER MODAL
  ---------------------------------------------------------- */
  function initOrderModal() {
    var overlay = document.getElementById('order-modal-overlay');
    if (!overlay) return;

    var closeBtn     = overlay.querySelector('.modal-close');
    var progressFill = overlay.querySelector('.modal-progress-fill');
    var stepLabel    = overlay.querySelector('.modal-step-label');
    var modalTitle   = overlay.querySelector('.modal-title');
    var stepPanels   = overlay.querySelectorAll('.modal-step');
    var TOTAL        = 6, cur = 0;
    var data         = { occasion:'', genre:'', mood:'', voice:'', recipientName:'', story:'', email:'', express: false };

    var titles = [
      'Какой повод? 🎉', 'Какой жанр? 🎸', 'Настроение и голос 🎤',
      'Для кого эта песня? 💝', 'Расскажите историю ✍️', 'Почти готово! 🎵'
    ];

    function openModal()  { overlay.classList.add('open');    document.body.style.overflow = 'hidden'; goTo(0); }
    function closeModal() {
      overlay.classList.remove('open');
      document.body.style.overflow = '';
      setTimeout(function () {
        cur = 0;
        data = { occasion:'', genre:'', mood:'', voice:'', recipientName:'', story:'', email:'', express: false };
        render(0);
      }, 300);
    }

    function goTo(n) { cur = n; render(n); }

    function render(n) {
      if (progressFill) progressFill.style.width = ((n + 1) / TOTAL * 100) + '%';
      if (stepLabel)    stepLabel.textContent  = 'Шаг ' + (n + 1) + ' из ' + TOTAL;
      if (modalTitle)   modalTitle.textContent = titles[n];
      stepPanels.forEach(function (p, i) { p.style.display = i === n ? 'block' : 'none'; });
      refreshChips(n); refreshInputs(n); updateBtns(n);
    }

    function refreshChips(n) {
      var p = stepPanels[n]; if (!p) return;
      p.querySelectorAll('.chip[data-field]').forEach(function (c) {
        c.classList.toggle('selected', data[c.dataset.field] === c.dataset.value);
      });
    }
    function refreshInputs(n) {
      var p = stepPanels[n]; if (!p) return;
      p.querySelectorAll('[data-bind]').forEach(function (el) {
        if (el.value !== data[el.dataset.bind]) el.value = data[el.dataset.bind] || '';
      });
      // Sync express toggle and prices when entering step 6
      if (n === 5) {
        var cb = document.getElementById('express-checkbox');
        if (cb) cb.checked = data.express;
        updateExpressUI(data.express); // also sets correct prices from shopifyTheme
      }
    }
    function updateBtns(n) {
      var p = stepPanels[n]; if (!p) return;
      var nb = p.querySelector('.btn-next'), sb = p.querySelector('.btn-submit');
      if (n === 2 && nb) nb.disabled = !(data.mood && data.voice);
      if (n === 3 && nb) nb.disabled = !data.recipientName.trim();
      var emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim());
      var emailHint  = stepPanels[4] && stepPanels[4].querySelector('.modal-email-hint');
      if (emailHint) emailHint.style.display = (data.email.trim() && !emailValid) ? 'block' : 'none';
      if (n === 4 && nb) nb.disabled = !(data.story.trim() && emailValid);
      // Step 6 submit always enabled — no required choice
    }
    function updateExpressUI(checked) {
      var cfg          = window.shopifyTheme || {};
      var basePrice    = cfg.standardPrice        || 19;
      var fullPrice    = cfg.premiumPrice         || 24;
      var compareBase  = cfg.standardComparePrice || 0;
      var compareFull  = cfg.premiumComparePrice  || 0;
      var fee          = fullPrice - basePrice;
      var currentPrice = checked ? fullPrice   : basePrice;
      var comparePrice = checked ? compareFull : compareBase;
      var savings      = comparePrice > 0 ? comparePrice - currentPrice : 0;
      var savingsPct   = comparePrice > 0 ? Math.round(savings / comparePrice * 100) : 0;

      var totalEl    = document.getElementById('modal-total-price');
      var compareEl  = document.getElementById('modal-compare-price');
      var savingsEl  = document.getElementById('modal-savings-badge');
      var deliveryEl = document.getElementById('modal-delivery-line');
      var toggleEl   = document.querySelector('.express-toggle');
      var plusEl     = document.querySelector('.express-toggle__plus');

      if (plusEl)     plusEl.textContent     = '+' + money(fee * 100);
      if (totalEl)    totalEl.textContent    = money(currentPrice * 100);
      if (deliveryEl) deliveryEl.textContent = checked ? 'Доставка за 24ч' : 'Доставка за 72ч';
      if (toggleEl)   toggleEl.classList.toggle('active', checked);

      if (compareEl) {
        compareEl.textContent   = comparePrice > 0 ? money(comparePrice * 100) : '';
        compareEl.style.display = comparePrice > 0 ? 'inline' : 'none';
      }
      if (savingsEl) {
        if (savings > 0) {
          savingsEl.textContent   = '−' + savingsPct + '%';
          savingsEl.style.display = 'inline-flex';
        } else {
          savingsEl.style.display = 'none';
        }
      }
    }

    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) { closeModal(); return; }
      var chip = e.target.closest('.chip[data-field]');
      if (chip) {
        data[chip.dataset.field] = chip.dataset.value;
        refreshChips(cur); updateBtns(cur);
        if (chip.dataset.autonext === 'true') setTimeout(function () { goTo(cur + 1); }, 280);
        return;
      }
      var nb = e.target.closest('.btn-next[data-next]');
      if (nb) { goTo(parseInt(nb.dataset.next, 10)); return; }
      var bb = e.target.closest('.btn-back[data-back]');
      if (bb) { goTo(parseInt(bb.dataset.back, 10)); return; }
      var sb = e.target.closest('.btn-submit');
      if (sb) { handleSubmit(); return; }
    });

    overlay.addEventListener('input', function (e) {
      var f = e.target.dataset.bind; if (!f) return;
      data[f] = e.target.value; updateBtns(cur);
    });

    overlay.addEventListener('change', function (e) {
      if (e.target.id === 'express-checkbox') {
        data.express = e.target.checked;
        updateExpressUI(data.express);
      }
    });

    async function handleSubmit() {
      var cfg  = window.shopifyTheme || {};
      var vid  = data.express ? cfg.premiumVariantId : cfg.standardVariantId;
      if (!vid || vid === 0) { showError('Продукт не настроен. Пожалуйста, обратитесь в поддержку.'); return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
        showError('Введите корректный email-адрес — на него придёт ваша песня.');
        return;
      }

      var sb = document.querySelector('.btn-submit');
      var eb = document.querySelector('.modal-error');
      if (sb) { sb.disabled = true; sb.textContent = 'Обработка...'; }
      if (eb) eb.textContent = '';

      try {
        var res = await fetch('/cart/add.js', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({
            id: vid, quantity: 1,
            properties: {
              'Повод': data.occasion, 'Жанр': data.genre,
              'Настроение': data.mood, 'Голос': data.voice,
              'Имя получателя': data.recipientName,
              'История': data.story, 'Email': data.email,
              'Доставка': data.express ? 'Экспресс (24ч)' : 'Стандарт (72ч)'
            }
          })
        });
        if (!res.ok) { var err = await res.json(); throw new Error(err.description || 'Ошибка'); }
        closeModal();
        sessionStorage.setItem('ys_went_checkout', '1');
        window.location.href = Discount.checkoutUrl();
      } catch (err) {
        showError(err.message || 'Что-то пошло не так.');
        if (sb) { sb.disabled = !data.package; sb.textContent = '🎵 Создать мою песню'; }
      }
    }

    function showError(msg) { var e = document.querySelector('.modal-error'); if (e) e.textContent = msg; }

    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    window.addEventListener('open-order-modal', openModal);
    document.querySelectorAll('[data-open-modal]').forEach(function (b) { b.addEventListener('click', openModal); });
    render(0);
  }

  /* ----------------------------------------------------------
     8. ACCESSIBILITY WIDGET
  ---------------------------------------------------------- */
  function initA11yWidget() {
    var widget  = document.getElementById('a11y-widget');
    if (!widget) return;
    var toggle  = document.getElementById('a11y-toggle');
    var panel   = document.getElementById('a11y-panel');
    var html    = document.documentElement;

    // Restore saved preferences
    var prefs = {};
    try { prefs = JSON.parse(localStorage.getItem('ys_a11y') || '{}'); } catch (e) {}
    if (prefs.contrast) html.classList.add('high-contrast');
    if (prefs.motion)   html.classList.add('reduce-motion');
    if (prefs.font)     html.classList.add(prefs.font);
    syncPressed();

    function save() {
      try { localStorage.setItem('ys_a11y', JSON.stringify(prefs)); } catch (e) {}
    }

    function syncPressed() {
      var smBtn     = document.getElementById('a11y-font-sm');
      var resetBtn  = document.getElementById('a11y-font-reset');
      var lgBtn     = document.getElementById('a11y-font-lg');
      var contrastB = document.getElementById('a11y-contrast');
      var motionB   = document.getElementById('a11y-motion');
      if (smBtn)    smBtn.setAttribute('aria-pressed',    prefs.font === 'font-sm' ? 'true' : 'false');
      if (resetBtn) resetBtn.setAttribute('aria-pressed', !prefs.font ? 'true' : 'false');
      if (lgBtn)    lgBtn.setAttribute('aria-pressed',    prefs.font === 'font-lg' ? 'true' : 'false');
      if (contrastB) contrastB.setAttribute('aria-pressed', prefs.contrast ? 'true' : 'false');
      if (motionB)   motionB.setAttribute('aria-pressed',   prefs.motion   ? 'true' : 'false');
    }

    function setFont(cls) {
      html.classList.remove('font-sm', 'font-lg');
      if (cls) html.classList.add(cls);
      prefs.font = cls || '';
      save(); syncPressed();
    }

    // Toggle panel open/close
    if (toggle && panel) {
      toggle.addEventListener('click', function () {
        var open = panel.hasAttribute('hidden');
        if (open) { panel.removeAttribute('hidden'); toggle.setAttribute('aria-expanded', 'true'); }
        else       { panel.setAttribute('hidden', ''); toggle.setAttribute('aria-expanded', 'false'); }
      });

      // Close on Escape or outside click
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && !panel.hasAttribute('hidden')) {
          panel.setAttribute('hidden', '');
          toggle.setAttribute('aria-expanded', 'false');
          toggle.focus();
        }
      });
      document.addEventListener('click', function (e) {
        if (!widget.contains(e.target)) {
          panel.setAttribute('hidden', '');
          toggle.setAttribute('aria-expanded', 'false');
        }
      });
    }

    // Button handlers
    var fontSm    = document.getElementById('a11y-font-sm');
    var fontReset = document.getElementById('a11y-font-reset');
    var fontLg    = document.getElementById('a11y-font-lg');
    var contrastB = document.getElementById('a11y-contrast');
    var motionB   = document.getElementById('a11y-motion');

    if (fontSm)    fontSm.addEventListener('click',    function () { setFont('font-sm'); });
    if (fontReset) fontReset.addEventListener('click', function () { setFont(''); });
    if (fontLg)    fontLg.addEventListener('click',    function () { setFont('font-lg'); });
    if (contrastB) contrastB.addEventListener('click', function () {
      prefs.contrast = !prefs.contrast;
      html.classList.toggle('high-contrast', prefs.contrast);
      save(); syncPressed();
    });
    if (motionB) motionB.addEventListener('click', function () {
      prefs.motion = !prefs.motion;
      html.classList.toggle('reduce-motion', prefs.motion);
      document.querySelectorAll('.video-teaser__video').forEach(function (vid) {
        if (prefs.motion) {
          vid.pause();
        } else {
          var playPromise = vid.play();
          if (playPromise && typeof playPromise.catch === 'function') {
            playPromise.catch(function () {});
          }
        }
      });
      document.dispatchEvent(new CustomEvent('video-teaser:motionchange', {
        detail: { reducedMotion: prefs.motion }
      }));
      save(); syncPressed();
    });
  }

  /* ----------------------------------------------------------
     9. LEGAL PAGES
  ---------------------------------------------------------- */
  function initLegalPages() {
    var rootUrl = document.body.getAttribute('data-root-url') || '/';
    var privacyUrl = document.body.getAttribute('data-privacy-url') || '/pages/privacy';
    var termsUrl = document.body.getAttribute('data-terms-url') || '/pages/terms';
    var accessibilityUrl = document.body.getAttribute('data-accessibility-url') || '/pages/accessibility';
    var path = window.location.pathname.toLowerCase();

    function goBackOrHome() {
      try {
        if (document.referrer) {
          var referrer = new URL(document.referrer);
          if (referrer.origin === window.location.origin && window.history.length > 1) {
            window.history.back();
            return;
          }
        }
      } catch (e) {}

      window.location.href = rootUrl;
    }

    function bindBackButtons(scope) {
      (scope || document).querySelectorAll('[data-legal-back]').forEach(function (btn) {
        if (btn.dataset.bound === 'true') return;
        btn.dataset.bound = 'true';
        btn.addEventListener('click', goBackOrHome);
      });
    }

    var policyContainer = document.querySelector('.shopify-policy__container');
    if (policyContainer && !policyContainer.querySelector('.legal-policy__nav')) {
      var nav = document.createElement('div');
      nav.className = 'legal-policy__nav';
      nav.innerHTML =
        '<button type="button" class="legal-card__back legal-card__back--button" data-legal-back>\u2190 \u041d\u0430\u0437\u0430\u0434</button>' +
        '<a href="' + rootUrl + '" class="legal-card__home">\u041d\u0430 \u0433\u043b\u0430\u0432\u043d\u0443\u044e</a>';
      policyContainer.insertBefore(nav, policyContainer.firstChild);
    }

    if (policyContainer && !policyContainer.querySelector('.legal-card__footer')) {
      var footer = document.createElement('nav');
      footer.className = 'legal-card__footer';
      footer.setAttribute('aria-label', '\u042e\u0440\u0438\u0434\u0438\u0447\u0435\u0441\u043a\u0438\u0435 \u0441\u0442\u0440\u0430\u043d\u0438\u0446\u044b');
      footer.innerHTML =
        '<a href="' + rootUrl + '">\u2190 \u041d\u0430 \u0433\u043b\u0430\u0432\u043d\u0443\u044e</a>' +
        '<a href="' + privacyUrl + '"' + (path.indexOf('/policies/privacy-policy') !== -1 || path.indexOf('/pages/privacy') !== -1 ? ' aria-current="page"' : '') + '>\u041f\u043e\u043b\u0438\u0442\u0438\u043a\u0430 \u043a\u043e\u043d\u0444\u0438\u0434\u0435\u043d\u0446\u0438\u0430\u043b\u044c\u043d\u043e\u0441\u0442\u0438</a>' +
        '<a href="' + termsUrl + '"' + (path.indexOf('/policies/terms-of-service') !== -1 || path.indexOf('/pages/terms') !== -1 ? ' aria-current="page"' : '') + '>\u0423\u0441\u043b\u043e\u0432\u0438\u044f \u0438\u0441\u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u043d\u0438\u044f</a>' +
        '<a href="' + accessibilityUrl + '"' + (path.indexOf('/pages/accessibility') !== -1 ? ' aria-current="page"' : '') + '>\u0414\u043e\u0441\u0442\u0443\u043f\u043d\u043e\u0441\u0442\u044c</a>';
      policyContainer.appendChild(footer);
    }

    bindBackButtons(document);
  }

  /* ----------------------------------------------------------
     10. REVIEWS CAROUSEL
  ---------------------------------------------------------- */
  function initReviewsCarousel() {
    var carousel = document.querySelector('.reviews__carousel');
    if (!carousel) return;
    var track   = carousel.querySelector('.reviews__track');
    var cards   = carousel.querySelectorAll('.review-card');
    var prevBtn = carousel.querySelector('.carousel-btn--prev');
    var nextBtn = carousel.querySelector('.carousel-btn--next');
    var viewport = carousel.querySelector('.reviews__viewport');
    var dots    = document.querySelectorAll('.carousel-dot');
    var status  = document.querySelector('.carousel-status');
    if (!track || !cards.length) return;

    var cur   = 0;
    var total = cards.length;

    function cardWidth() {
      return cards[0].offsetWidth + 20; // card + gap
    }

    function visibleCards() {
      if (!viewport || !cards[0]) return 1;
      return Math.max(1, Math.floor((viewport.offsetWidth + 20) / cardWidth()));
    }

    function maxIndex() {
      return Math.max(0, total - visibleCards());
    }

    function goTo(idx) {
      if (idx < 0) idx = 0;
      if (idx > maxIndex()) idx = maxIndex();
      cur = idx;
      track.style.transform = 'translateX(-' + (cur * cardWidth()) + 'px)';
      dots.forEach(function (d, i) {
        d.classList.toggle('active', i === cur);
        d.setAttribute('aria-selected', i === cur ? 'true' : 'false');
      });
      if (prevBtn) prevBtn.disabled = cur === 0;
      if (nextBtn) nextBtn.disabled = cur >= maxIndex();
      if (status) status.textContent = 'Отзыв ' + (cur + 1) + ' из ' + total;
    }

    if (prevBtn) prevBtn.addEventListener('click', function () { goTo(cur - 1); });
    if (nextBtn) nextBtn.addEventListener('click', function () { goTo(cur + 1); });

    dots.forEach(function (d) {
      d.addEventListener('click', function () { goTo(parseInt(d.dataset.index, 10)); });
    });

    // Keyboard: left/right arrows when carousel has focus
    carousel.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft')  { goTo(cur - 1); e.preventDefault(); }
      if (e.key === 'ArrowRight') { goTo(cur + 1); e.preventDefault(); }
    });

    // Touch / pointer swipe
    var startX = null;
    track.addEventListener('pointerdown', function (e) { startX = e.clientX; });
    track.addEventListener('pointerup',   function (e) {
      if (startX === null) return;
      var delta = startX - e.clientX;
      if (Math.abs(delta) > 50) goTo(delta > 0 ? cur + 1 : cur - 1);
      startX = null;
    });
    track.addEventListener('pointercancel', function () { startX = null; });

    // Recalculate on resize
    window.addEventListener('resize', function () { goTo(cur); });

    goTo(0);
  }

  /* ----------------------------------------------------------
     11. PRICING CTA
  ---------------------------------------------------------- */
  function initPricingCTA() {
    document.querySelectorAll('.btn-plan[data-package]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('open-order-modal'));
      });
    });
  }

  /* ----------------------------------------------------------
     INIT
  ---------------------------------------------------------- */
  document.addEventListener('DOMContentLoaded', function () {
    Discount.load();
    initFadeIn();
    initFAQ();
    initMusicPlayer();
    CartDrawer.init();
    initA11yWidget();
    initLegalPages();
    initOrderModal();
    initPricingCTA();
    initReviewsCarousel();
    // Cart page (only runs if on /cart)
    if (document.getElementById('cart-page-items')) CartPage.init();
  });

  // Expose CartPage globally for inline script in cart template
  window.CartPage = CartPage;

})();
