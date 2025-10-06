(() => {
  const gameGrid = document.getElementById('gameGrid');
  const cartToggle = document.getElementById('cartToggle');
  const cartPanel = document.getElementById('cartPanel');
  const closeCart = document.getElementById('closeCart');
  const cartItemsList = document.getElementById('cartItems');
  const cartCount = document.getElementById('cartCount');
  const cartSubtotalEl = document.getElementById('cartSubtotal');
  const searchCartCount = document.getElementById('searchCartCount');
  const checkoutBtn = document.getElementById('checkoutBtn');
  const buyNowTop = document.getElementById('buyNowTop');
  const searchInput = document.getElementById('searchInput');
  const priceRange = document.getElementById('priceRange');
  const priceValue = document.getElementById('priceValue');
  const yearEl = document.getElementById('year');

  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // Currency: show INR (convert from USD data)
  const conversionRateUsdToInr = 83; // approximate rate; adjust as needed
  const inrFormatter = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' });
  const convertUsdToInr = (usd) => usd * conversionRateUsdToInr;
  const formatMoney = (valueInInr) => inrFormatter.format(valueInInr);

  /** In-memory products from global data or DOM */
  function getCatalogProducts() {
    // Prefer global GAMES from data.js
    if (Array.isArray(window.GAMES) && window.GAMES.length) {
      return window.GAMES.map((g) => ({ id: g.id, title: g.title, genre: g.genre, price: g.priceUsd, image: g.image }));
    }
    // Fallback to DOM cards
    return Array.from(document.querySelectorAll('.card')).map((card) => {
      const id = card.querySelector('.add-to-cart')?.getAttribute('data-id') || (window.crypto?.randomUUID?.() || String(Math.random()));
      const title = card.getAttribute('data-title') || card.querySelector('h3')?.textContent || 'Game';
      const genre = card.getAttribute('data-genre') || 'other';
      const price = parseFloat(card.getAttribute('data-price') || '0');
      const image = card.querySelector('img')?.getAttribute('src') || '';
      return { id, title, genre, price, image };
    });
  }

  const products = getCatalogProducts();
  const productById = products.reduce((acc, p) => { acc[p.id] = p; return acc; }, {});

  // ---------- Video teaser modal ----------
  /** @type {HTMLElement | null} */
  let videoModal = null;
  /** @type {HTMLDivElement | null} */
  let videoContainer = null;
  function ensureVideoModal() {
    if (videoModal) return;
    const modal = document.createElement('div');
    modal.className = 'video-modal';
    modal.setAttribute('aria-hidden', 'true');
    modal.innerHTML = `
      <div class="video-backdrop"></div>
      <div class="video-dialog" role="dialog" aria-modal="true" aria-label="Game trailer">
        <button class="video-close" aria-label="Close">✕</button>
        <div class="video-aspect"><div class="video-frame" id="videoFrame"></div></div>
      </div>`;
    document.body.appendChild(modal);
    videoModal = modal;
    videoContainer = /** @type {HTMLDivElement} */(modal.querySelector('#videoFrame'));
    const closeBtn = modal.querySelector('.video-close');
    const backdrop = modal.querySelector('.video-backdrop');
    function close() { closeVideoModal(); }
    closeBtn?.addEventListener('click', close);
    backdrop?.addEventListener('click', close);
    document.addEventListener('keydown', (e) => {
      if (videoModal?.getAttribute('aria-hidden') === 'false' && (e.key === 'Escape' || e.key === 'Esc')) close();
    });
  }
  function openVideoModal(innerHtml) {
    ensureVideoModal();
    if (!videoModal || !videoContainer) return;
    videoContainer.innerHTML = innerHtml;
    videoModal.setAttribute('aria-hidden', 'false');
    document.documentElement.style.overflow = 'hidden';
  }
  function closeVideoModal() {
    if (!videoModal || !videoContainer) return;
    videoModal.setAttribute('aria-hidden', 'true');
    videoContainer.innerHTML = '';
    document.documentElement.style.overflow = '';
  }
  function toYouTubeEmbed(url) {
    try {
      const u = new URL(url);
      if (u.hostname.includes('youtube.com') && u.searchParams.get('v')) {
        return `https://www.youtube.com/embed/${u.searchParams.get('v')}?autoplay=1&rel=0`;
      }
      if (u.hostname === 'youtu.be') {
        const id = u.pathname.replace('/', '');
        if (id) return `https://www.youtube.com/embed/${id}?autoplay=1&rel=0`;
      }
    } catch {}
    return url;
  }
  function openTrailer(productId) {
    const meta = (window.GAMES || []).find((g) => g.id === productId);
    const trailerUrl = meta?.trailer;
    if (trailerUrl) {
      const src = toYouTubeEmbed(trailerUrl);
      openVideoModal(`<iframe src="${src}" title="${meta.title} trailer" frameborder="0" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`);
    } else {
      openVideoModal(`<div class="no-trailer"><p>No trailer available for this game.</p></div>`);
    }
  }

  // Dynamically render catalog from global data if available
  function renderCatalog() {
    if (!Array.isArray(window.GAMES) || !window.GAMES.length || !gameGrid) return;
    gameGrid.innerHTML = '';
    window.GAMES.forEach((g) => {
      const article = document.createElement('article');
      article.className = 'card';
      article.setAttribute('data-title', g.title);
      article.setAttribute('data-genre', g.genre);
      article.setAttribute('data-price', String(g.priceUsd));
      article.innerHTML = `
        <img src="${g.image}" alt="${g.title} cover" />
        <div class="card-body">
          <h3>${g.title}</h3>
          <p class="muted">${g.genre.toUpperCase()} • PC</p>
          <div class="price-row">
            <span class="price">$${Number(g.priceUsd).toFixed(2)}</span>
            <div style="display:flex; gap:8px;">
              <button class="add-to-cart" data-id="${g.id}">Add to Cart</button>
              <button class="buy-now buy-now-card" data-id="${g.id}">Buy Now</button>
            </div>
          </div>
        </div>`;
      gameGrid.appendChild(article);
    });
  }

  /** Simple cart store */
  const cart = {
    items: /** @type {Record<string, {id:string,title:string,price:number,image:string,qty:number}>} */({}),
    save() {
      try { localStorage.setItem('gamified-cart-v1', JSON.stringify(this.items)); } catch {}
    },
    load() {
      try {
        // Prefer v1 (object map). If missing, migrate from legacy keys
        const rawV1 = localStorage.getItem('gamified-cart-v1');
        if (rawV1) {
          const parsed = JSON.parse(rawV1) || {};
          // If the values are numbers, migrate to full objects
          const needsMigration = Object.values(parsed).some((v) => typeof v === 'number');
          if (needsMigration) {
            const migrated = {};
            Object.keys(parsed).forEach((id) => {
              const qty = Number(parsed[id]) || 0;
              const p = productById[id] || products.find((x) => x.id === id);
              if (p && qty > 0) migrated[id] = { id: p.id, title: p.title, price: Number(p.price) || 0, image: p.image, qty };
            });
            this.items = migrated;
            this.save();
          } else {
            this.items = parsed;
          }
        } else {
          // Legacy simple qty map under 'gamified-cart'
          const legacyRaw = localStorage.getItem('gamified-cart');
          if (legacyRaw) {
            const legacy = JSON.parse(legacyRaw) || {};
            const migrated = {};
            Object.keys(legacy).forEach((id) => {
              const qty = Number(legacy[id]) || 0;
              const p = productById[id] || products.find((x) => x.id === id);
              if (p && qty > 0) migrated[id] = { id: p.id, title: p.title, price: Number(p.price) || 0, image: p.image, qty };
            });
            this.items = migrated;
            this.save();
            try { localStorage.removeItem('gamified-cart'); } catch {}
          }
        }
      } catch {}
    },
    add(productId) {
      const product = productById[productId] || products.find((p) => p.id === productId);
      if (!product) return;
      if (!this.items[productId]) {
        this.items[productId] = { id: product.id, title: product.title, price: product.price, image: product.image, qty: 0 };
      }
      this.items[productId].qty += 1;
      renderCart();
      this.save();
    },
    remove(productId) {
      delete this.items[productId];
      renderCart();
      this.save();
    },
    setQty(productId, qty) {
      if (!this.items[productId]) return;
      this.items[productId].qty = Math.max(1, qty);
      renderCart();
      this.save();
    },
    increment(productId) { if (this.items[productId]) { this.items[productId].qty += 1; renderCart(); this.save(); } },
    decrement(productId) { if (this.items[productId]) { this.items[productId].qty = Math.max(1, this.items[productId].qty - 1); renderCart(); this.save(); } },
    count() { return Object.values(this.items).reduce((n, item) => n + item.qty, 0); },
    subtotal() { return Object.values(this.items).reduce((sum, item) => sum + item.qty * item.price, 0); }
  };

  // Render card prices in INR based on data-price (USD)
  function renderCardPricesInInr() {
    document.querySelectorAll('.card').forEach((card) => {
      const priceUsd = parseFloat(card.getAttribute('data-price') || '0');
      const priceEl = card.querySelector('.price');
      if (priceEl) priceEl.textContent = formatMoney(convertUsdToInr(priceUsd));
    });
  }

  function toggleCart(show) {
    const shouldShow = typeof show === 'boolean' ? show : cartPanel.getAttribute('aria-hidden') === 'true';
    cartPanel.setAttribute('aria-hidden', shouldShow ? 'false' : 'true');
    cartToggle?.setAttribute('aria-expanded', shouldShow ? 'true' : 'false');
  }

  function renderCart() {
    cartItemsList.innerHTML = '';
    const items = Object.values(cart.items);
    items.forEach((item) => {
      const li = document.createElement('li');
      li.className = 'cart-item';
      li.innerHTML = `
        <img src="${item.image}" alt="${item.title}" />
        <div>
          <div class="cart-item-title">${item.title}</div>
          <div class="muted">${formatMoney(convertUsdToInr(item.price))}</div>
          <div class="qty" data-id="${item.id}">
            <button class="dec" aria-label="Decrease quantity">−</button>
            <span class="val">${item.qty}</span>
            <button class="inc" aria-label="Increase quantity">+</button>
          </div>
        </div>
        <div>
          <button class="remove" data-id="${item.id}">Remove</button>
        </div>`;
      cartItemsList.appendChild(li);
    });

    const count = cart.count();
    cartCount.textContent = String(count);
    if (searchCartCount) searchCartCount.textContent = String(count);
    cartSubtotalEl.textContent = formatMoney(convertUsdToInr(cart.subtotal()));

    // Bind qty and remove events per item
    cartItemsList.querySelectorAll('.qty').forEach((el) => {
      const id = el.getAttribute('data-id');
      const dec = el.querySelector('.dec');
      const inc = el.querySelector('.inc');
      dec?.addEventListener('click', () => cart.decrement(id));
      inc?.addEventListener('click', () => cart.increment(id));
    });
    cartItemsList.querySelectorAll('.remove').forEach((btn) => {
      const id = btn.getAttribute('data-id');
      btn.addEventListener('click', () => cart.remove(id));
    });
  }

  // Add to cart buttons
  gameGrid?.addEventListener('click', (e) => {
    const target = /** @type {HTMLElement} */(e.target);
    // Open trailer on image click
    if (target && target.tagName === 'IMG' && target.closest('.card')) {
      const card = target.closest('.card');
      const btn = card?.querySelector('.add-to-cart');
      const productId = btn?.getAttribute('data-id');
      if (productId) {
        openTrailer(productId);
        return;
      }
    }
    if (target && target.classList.contains('add-to-cart')) {
      const productId = target.getAttribute('data-id');
      if (productId) {
        cart.add(productId);
        // Expand inline details on the card
        const card = target.closest('.card');
        if (card) {
          const product = productById[productId];
          card.classList.add('expanded');
          let details = card.querySelector('.card-details');
          if (!details) {
            details = document.createElement('div');
            details.className = 'card-details';
            card.appendChild(details);
          }
          const desc = (window.GAMES || []).find(g => g.id === productId)?.desc || 'No description available.';
          const platforms = (window.GAMES || []).find(g => g.id === productId)?.platforms || [];
          details.innerHTML = `
            <p>${desc}</p>
            <div class="detail-meta">
              <span class="badge">Genre: ${product.genre}</span>
              ${platforms.map(p => `<span class=\"badge\">${p}</span>`).join('')}
            </div>`;
          details.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }
    }
    if (target && target.classList.contains('buy-now-card')) {
      const productId = target.getAttribute('data-id');
      if (productId) {
        window.location.href = `buy.html?id=${encodeURIComponent(productId)}`;
      }
    }
  });

  // Cart open/close
  cartToggle?.addEventListener('click', () => { window.location.href = 'cart.html'; });
  closeCart?.addEventListener('click', () => toggleCart(false));

  // Buy Now actions
  function handleCheckout() {
    if (cart.count() === 0) {
      alert('Your cart is empty. Add a game to continue.');
      return;
    }
    const lines = Object.values(cart.items).map((i) => `${i.title} × ${i.qty} — ${formatMoney(convertUsdToInr(i.qty * i.price))}`);
    const message = `Thank you!\n\nOrder summary:\n- ${lines.join('\n- ')}\n\nSubtotal: ${formatMoney(convertUsdToInr(cart.subtotal()))}`;
    alert(message);
  }
  checkoutBtn?.addEventListener('click', handleCheckout);
  buyNowTop?.addEventListener('click', handleCheckout);

  // Search and filters
  function applyFilters() {
    const term = (searchInput?.value || '').toLowerCase();
    const maxPriceInInr = parseFloat(priceRange?.value || '6000');
    const activeGenres = new Set(Array.from(document.querySelectorAll('input[name="genre"]:checked')).map((el) => el.value));
    document.querySelectorAll('.card').forEach((card) => {
      const title = card.getAttribute('data-title')?.toLowerCase() || '';
      const priceUsd = parseFloat(card.getAttribute('data-price') || '0');
      const priceInr = convertUsdToInr(priceUsd);
      const genre = card.getAttribute('data-genre') || '';
      const matchesTerm = title.includes(term);
      const matchesPrice = priceInr <= maxPriceInInr;
      const matchesGenre = activeGenres.size === 0 || activeGenres.has(genre);
      const show = matchesTerm && matchesPrice && matchesGenre;
      card.style.display = show ? '' : 'none';
    });
  }

  searchInput?.addEventListener('input', applyFilters);
  priceRange?.addEventListener('input', () => {
    priceValue.textContent = formatMoney(Number(priceRange.value));
    applyFilters();
  });
  document.querySelectorAll('input[name="genre"]').forEach((el) => el.addEventListener('change', applyFilters));

  // Initial render
  cart.load();
  renderCatalog();
  // Initialize INR filter slider defaults if present
  if (priceRange) {
    if (!priceRange.hasAttribute('data-initialized')) {
      priceRange.max = '6000';
      priceRange.value = priceRange.value && Number(priceRange.value) > 0 ? priceRange.value : '3000';
      priceRange.setAttribute('data-initialized', 'true');
    }
    if (priceValue) priceValue.textContent = formatMoney(Number(priceRange.value));
  }
  renderCardPricesInInr();
  renderCart();

  // Expose a minimal API for other pages (e.g., game.html)
  window.Store = {
    cart,
    products,
    productById,
    addToCart: (id) => cart.add(id),
    convertUsdToInr,
    formatInr: formatMoney
  };
})();


