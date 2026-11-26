(() => {
  const PAGE_SIZE = 12;
  let siteData = null;
  let activeCategory = 'All';
  let visibleCount = PAGE_SIZE;
  let filteredProjects = [];
  let currentLbIndex = 0;

  const esc = (str = '') =>
    String(str).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));

  async function init() {
    document.getElementById('year').textContent = new Date().getFullYear();
    setupScrollEffects();
    setupMobileNav();
    setupBeforeAfterControls();
    setupLightbox();
    mountHeroVideo();

    // Load live data/site.json (works on web server), fall back to embedded JSON (works via file:// double-click!)
    try {
      const res = await fetch('data/site.json', { cache: 'no-cache' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      siteData = await res.json();
    } catch {
      const embedded = document.getElementById('embeddedSiteData');
      if (embedded) {
        siteData = JSON.parse(embedded.textContent);
      }
    }

    if (siteData) {
      hydrateSite(siteData);
    }
    setupKoalendarLazy();
    setupQuoteForm();
    setupCounters();
    setupRevealObserver();
  }

  function mountHeroVideo() {
    const vid = document.getElementById('heroBgVideo');
    if (!vid) return;
    // Start streaming smoothly right after first paint so LCP is never blocked
    requestAnimationFrame(() => {
      const src = vid.dataset.src || 'assets/videos/Main_Video_Handyman.mp4';
      vid.src = src;
      vid.addEventListener('canplay', () => vid.classList.add('ready'), { once: true });
      vid.play().catch(() => {});
    });
  }

  function setupScrollEffects() {
    const header = document.querySelector('header.site-header');
    const bar = document.getElementById('scrollProgress');
    const onScroll = () => {
      const y = window.scrollY || window.pageYOffset;
      if (header) header.classList.toggle('scrolled', y > 40);
      if (bar) {
        const docH = document.documentElement.scrollHeight - window.innerHeight;
        bar.style.width = docH > 0 ? `${Math.min(100, (y / docH) * 100)}%` : '0%';
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  function hydrateSite(data) {
    document.querySelectorAll('[data-bind]').forEach(el => {
      const val = el.dataset.bind.split('.').reduce((obj, k) => obj?.[k], data);
      if (typeof val === 'string' && val.trim() !== '') el.textContent = val;
    });

    if (data.brand?.phoneE164) {
      document.querySelectorAll('[data-phone-link]').forEach(a => { a.href = `tel:${data.brand.phoneE164}`; });
    }
    if (data.brand?.email) {
      document.querySelectorAll('[data-email-link]').forEach(a => { a.href = `mailto:${data.brand.email}`; });
    }
    if (data.brand?.formspreeEndpoint) {
      const form = document.getElementById('quoteForm');
      if (form) form.action = data.brand.formspreeEndpoint;
    }
    if (data.brand?.googleReviewUrl) {
      document.querySelectorAll('[data-google-review-link]').forEach(a => { a.href = data.brand.googleReviewUrl; });
    }
    if (data.brand?.yelpReviewUrl) {
      document.querySelectorAll('[data-yelp-review-link]').forEach(a => { a.href = data.brand.yelpReviewUrl; });
    }
    if (data.brand?.googleMapsUrl) {
      document.querySelectorAll('[data-google-maps-link]').forEach(a => { a.href = data.brand.googleMapsUrl; });
    }

    const aboutWrap = document.getElementById('aboutParagraphs');
    if (aboutWrap && Array.isArray(data.about?.paragraphs)) {
      aboutWrap.innerHTML = data.about.paragraphs.map(p => `<p>${esc(p)}</p>`).join('');
    }

    renderServices(data.services || []);
    renderBeforeAfterTabs(data.beforeAfter || []);
    renderVideos(data.videos || []);
    renderPortfolioFilters(data.projects || []);
    renderPortfolio(data.projects || []);
    renderAreas(data.areas || []);
    renderReviews(data.testimonials || []);
    renderFaqs(data.faqs || []);
  }

  function renderServices(services) {
    const grid = document.getElementById('servicesGrid');
    const select = document.getElementById('quoteServiceSelect');
    if (!grid) return;

    grid.innerHTML = services.map(s => `
      <article class="service-card reveal">
        <div class="service-image-container">
          <img src="${esc(s.image)}" alt="${esc(s.title)} NYC" width="640" height="400" loading="lazy" decoding="async">
          ${s.badge ? `<span class="popular-tag">${esc(s.badge)}</span>` : ''}
        </div>
        <div class="service-content">
          <h3>${esc(s.title)}</h3>
          <p>${esc(s.description)}</p>
          <div class="service-footer">
            <span class="price-badge">${esc(s.priceNote || 'Free Quote')}</span>
            <button type="button" class="service-link" data-select-service="${esc(s.title)}">Book Service &rarr;</button>
          </div>
        </div>
      </article>
    `).join('');

    if (select && services.length) {
      select.innerHTML = services.map(s => `<option value="${esc(s.title)}">${esc(s.title)}</option>`).join('') +
        '<option value="Other Handyman Request">Other Handyman Request</option>';
    }

    grid.querySelectorAll('[data-select-service]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (select) select.value = btn.dataset.selectService;
        document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' });
      });
    });
  }

  function renderBeforeAfterTabs(pairs) {
    const tabs = document.getElementById('baTabs');
    if (!tabs || !pairs.length) return;

    const showPair = pair => {
      document.getElementById('baBeforeImg').src = pair.beforeImage;
      document.getElementById('baAfterImg').src = pair.afterImage;
      document.getElementById('baCat').textContent = pair.category;
      document.getElementById('baTitle').textContent = pair.title;
      document.getElementById('baLoc').textContent = pair.location;
      document.getElementById('baCaption').textContent = pair.caption;
    };

    tabs.innerHTML = pairs.map((p, idx) =>
      `<button type="button" class="ba-tab ${idx === 0 ? 'active' : ''}" data-ba-idx="${idx}">${esc(p.title)}</button>`
    ).join('');

    tabs.querySelectorAll('.ba-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        tabs.querySelectorAll('.ba-tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        showPair(pairs[Number(btn.dataset.baIdx)]);
      });
    });
    showPair(pairs[0]);
  }

  function setupBeforeAfterControls() {
    const range = document.getElementById('baRange');
    const clip = document.getElementById('baBeforeClip');
    const divider = document.getElementById('baDivider');
    if (!range || !clip || !divider) return;

    const update = val => {
      const pct = Math.min(95, Math.max(5, Number(val)));
      clip.style.clipPath = `inset(0 ${100 - pct}% 0 0)`;
      divider.style.left = `${pct}%`;
    };
    range.addEventListener('input', e => update(e.target.value));
    update(50);
  }

  function renderVideos(videos) {
    const grid = document.getElementById('videosGrid');
    if (!grid) return;

    grid.innerHTML = videos.map((v, idx) => `
      <article class="video-reel-card reveal">
        <div class="video-player-box">
          <video class="inline-video" src="${esc(v.src)}" poster="${esc(v.poster)}" controls playsinline preload="metadata" muted loop></video>
        </div>
        <div class="video-reel-meta">
          <strong>${esc(v.title)}</strong>
          <button type="button" class="video-play-btn" data-vid-idx="${idx}">Play / Pause</button>
        </div>
      </article>
    `).join('');

    const players = grid.querySelectorAll('.inline-video');
    grid.querySelectorAll('.video-play-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const target = players[Number(btn.dataset.vidIdx)];
        if (!target) return;
        players.forEach(p => { if (p !== target) p.pause(); });
        if (target.paused) {
          target.muted = false;
          target.play().catch(() => { target.muted = true; target.play().catch(() => {}); });
        } else {
          target.pause();
        }
      });
    });
  }

  function renderPortfolioFilters(projects) {
    const bar = document.getElementById('portfolioFilters');
    if (!bar) return;

    const counts = projects.reduce((acc, p) => {
      acc[p.category] = (acc[p.category] || 0) + 1;
      return acc;
    }, {});
    const categories = ['All', ...Object.keys(counts)];

    bar.innerHTML = categories.map(cat => {
      const n = cat === 'All' ? projects.length : counts[cat];
      return `<button type="button" class="filter-btn ${cat === activeCategory ? 'active' : ''}" data-cat="${esc(cat)}">${esc(cat)} (${n})</button>`;
    }).join('');

    bar.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        activeCategory = btn.dataset.cat;
        visibleCount = PAGE_SIZE;
        bar.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderPortfolio(siteData.projects || []);
      });
    });
  }

  function renderPortfolio(projects) {
    const grid = document.getElementById('portfolioGrid');
    const countEl = document.getElementById('portfolioCount');
    const moreBtn = document.getElementById('loadMoreBtn');
    if (!grid) return;

    filteredProjects = activeCategory === 'All'
      ? projects
      : projects.filter(p => p.category === activeCategory);

    const slice = filteredProjects.slice(0, visibleCount);
    grid.innerHTML = slice.map((p, idx) => `
      <button type="button" class="project-tile" data-proj-idx="${idx}" aria-label="View ${esc(p.title)}">
        <img src="${esc(p.thumb)}" alt="${esc(p.title)} - ${esc(p.location)}" width="480" height="360" loading="lazy" decoding="async">
        <span class="project-caption">
          <small>${esc(p.category)} · ${esc(p.location)}</small>
          <strong>${esc(p.title)}</strong>
        </span>
      </button>
    `).join('');

    grid.querySelectorAll('.project-tile').forEach(tile => {
      tile.addEventListener('click', () => openLightbox(Number(tile.dataset.projIdx)));
    });

    if (countEl) countEl.textContent = `Showing ${slice.length} of ${filteredProjects.length} real NYC projects`;
    if (moreBtn) {
      moreBtn.hidden = slice.length >= filteredProjects.length;
      moreBtn.onclick = () => {
        visibleCount += PAGE_SIZE;
        renderPortfolio(siteData.projects || []);
      };
    }
  }

  function renderAreas(areas) {
    const grid = document.getElementById('areasGrid');
    if (!grid) return;
    grid.innerHTML = areas.map(a => `
      <article class="location-card reveal">
        <h3>${esc(a.name)}</h3>
        <p class="hoods">${esc(a.neighborhoods)}</p>
        <p>${esc(a.note)}</p>
      </article>
    `).join('');
  }

  function renderReviews(reviews) {
    const grid = document.getElementById('reviewsGrid');
    if (!grid) return;
    grid.innerHTML = reviews.map(r => `
      <article class="testimonial-card reveal in-view">
        <div class="review-top">
          <div class="stars" aria-label="${r.rating || 5} stars">${'★'.repeat(r.rating || 5)}</div>
          <span class="review-badge">✓ ${esc(r.source || 'Verified Review')}${r.date ? ` · ${esc(r.date)}` : ''}</span>
        </div>
        <p class="testimonial-text">"${esc(r.text)}"</p>
        <div class="user-info">
          <div class="user-avatar">${esc((r.name || 'C').charAt(0).toUpperCase())}</div>
          <div class="user-details">
            <h5>${esc(r.name)}</h5>
            <span>${esc(r.location)}</span>
          </div>
        </div>
      </article>
    `).join('');
  }

  function setupQuoteForm() {
    const form = document.getElementById('quoteForm');
    const status = document.getElementById('quoteFormStatus');
    if (!form) return;
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const btn = form.querySelector('button[type="submit"]');
      const orig = btn ? btn.textContent : '';
      if (btn) { btn.disabled = true; btn.textContent = 'Sending Request...'; }
      try {
        const res = await fetch(form.action, {
          method: 'POST',
          body: new FormData(form),
          headers: { Accept: 'application/json' }
        });
        if (!res.ok) throw new Error('Submission failed');
        form.reset();
        if (status) {
          status.hidden = false;
          status.className = 'form-status ok';
          status.textContent = 'Request received! TJ will call or text you shortly from (718) 600-6278.';
        }
        if (typeof gtag === 'function') gtag('event', 'generate_lead', { method: 'quote_form' });
      } catch {
        if (status) {
          status.hidden = false;
          status.className = 'form-status err';
          status.textContent = 'Could not send right now — please call or text (718) 600-6278 directly.';
        }
      } finally {
        if (btn) { btn.disabled = false; btn.textContent = orig; }
      }
    });
  }

  function renderFaqs(faqs) {
    const list = document.getElementById('faqList');
    if (!list) return;
    list.innerHTML = faqs.map((f, i) => `
      <details class="faq-item" ${i === 0 ? 'open' : ''}>
        <summary>${esc(f.q)}</summary>
        <div class="faq-answer">${esc(f.a)}</div>
      </details>
    `).join('');
  }

  function setupMobileNav() {
    const toggle = document.getElementById('navToggle');
    const drawer = document.getElementById('mobileDrawer');
    if (!toggle || !drawer) return;

    toggle.addEventListener('click', () => {
      const open = drawer.hidden;
      drawer.hidden = !open;
      toggle.setAttribute('aria-expanded', String(open));
    });
    drawer.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        drawer.hidden = true;
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  function setupKoalendarLazy() {
    const wrap = document.getElementById('koalendarWrap');
    const btn = document.getElementById('loadKoalendarBtn');
    const section = document.getElementById('booking');
    if (!wrap) return;

    let mounted = false;
    const mount = () => {
      if (mounted) return;
      mounted = true;
      const url = siteData?.brand?.koalendarUrl || 'https://koalendar.com/e/meet-with-handyman-tj';
      wrap.innerHTML = `<iframe src="${esc(url)}" title="Book Handyman TJ Online"></iframe>`;
    };
    if (btn) btn.addEventListener('click', mount);

    if ('IntersectionObserver' in window && section) {
      const io = new IntersectionObserver(entries => {
        if (entries.some(e => e.isIntersecting)) {
          mount();
          io.disconnect();
        }
      }, { rootMargin: '400px 0px' });
      io.observe(section);
    }
  }

  function setupCounters() {
    const nums = document.querySelectorAll('[data-count-to]');
    if (!nums.length || !('IntersectionObserver' in window)) return;

    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const target = parseInt(el.dataset.countTo, 10);
        const suffix = el.dataset.countSuffix || '';
        if (Number.isNaN(target)) return;
        let start = null;
        const step = ts => {
          if (!start) start = ts;
          const prog = Math.min(1, (ts - start) / 900);
          const eased = 1 - Math.pow(1 - prog, 3);
          el.textContent = `${Math.round(target * eased)}${suffix}`;
          if (prog < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
        io.unobserve(el);
      });
    }, { threshold: 0.4 });
    nums.forEach(n => io.observe(n));
  }

  function setupRevealObserver() {
    const els = document.querySelectorAll('.reveal');
    if (!els.length || !('IntersectionObserver' in window)) return;

    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.remove('pre-reveal');
          entry.target.classList.add('in-view');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -20px 0px' });

    els.forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.95) {
        // Already in viewport on load — reveal immediately, no observer
        el.classList.add('in-view');
      } else {
        el.classList.add('pre-reveal');
        io.observe(el);
      }
    });
  }

  function setupLightbox() {
    const lb = document.getElementById('lightbox');
    if (!lb) return;
    document.getElementById('lbClose')?.addEventListener('click', () => { lb.hidden = true; });
    document.getElementById('lbPrev')?.addEventListener('click', () => stepLightbox(-1));
    document.getElementById('lbNext')?.addEventListener('click', () => stepLightbox(1));
    lb.addEventListener('click', e => { if (e.target === lb) lb.hidden = true; });

    document.addEventListener('keydown', e => {
      if (lb.hidden) return;
      if (e.key === 'Escape') lb.hidden = true;
      if (e.key === 'ArrowRight') stepLightbox(1);
      if (e.key === 'ArrowLeft') stepLightbox(-1);
    });
  }

  function openLightbox(idx) {
    currentLbIndex = idx;
    updateLightbox();
    document.getElementById('lightbox').hidden = false;
  }

  function stepLightbox(delta) {
    if (!filteredProjects.length) return;
    currentLbIndex = (currentLbIndex + delta + filteredProjects.length) % filteredProjects.length;
    updateLightbox();
  }

  function updateLightbox() {
    const p = filteredProjects[currentLbIndex];
    if (!p) return;
    document.getElementById('lbImg').src = p.full;
    document.getElementById('lbImg').alt = p.title;
    document.getElementById('lbCap').textContent = `${p.title} · ${p.category} (${p.location})`;
  }

  init();
})();
