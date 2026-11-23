(() => {
  const d = document, root = d.documentElement;
  root.classList.add('js');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');

  /* ---- reveal on scroll ---- */
  const reveals = d.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduce.matches) {
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach((el) => io.observe(el));
  } else reveals.forEach((el) => el.classList.add('in'));
  // hero copy is above the fold: reveal on the next frame for the entrance
  requestAnimationFrame(() => d.querySelectorAll('.hero .reveal').forEach((el) => el.classList.add('in')));

  /* ---- layered, transform-only parallax ---- */
  const layers = [...d.querySelectorAll('[data-depth]')].map((el) => ({
    el, depth: parseFloat(el.dataset.depth) || 0, host: el.closest('section') || el,
  }));
  const heroInner = d.querySelector('.hero-inner');
  let ticking = false, vh = innerHeight;
  const update = () => {
    ticking = false;
    if (reduce.matches) return;
    const y = scrollY;
    for (const l of layers) {
      const r = l.host.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) continue; // offscreen: skip work
      // distance of section centre from viewport centre (hero uses raw scroll)
      const delta = l.host.classList.contains('hero') ? y : (r.top + r.height / 2 - vh / 2);
      const lim = vh < 700 || innerWidth < 820 ? 36 : 90; // keep layered art from drifting into copy
      const t = l.host.classList.contains('hero') ? delta * l.depth : Math.max(-lim, Math.min(lim, -delta * l.depth));
      l.el.style.transform = `translate3d(0, ${t.toFixed(2)}px, 0)`;
    }
    if (heroInner) heroInner.style.opacity = Math.max(0, 1 - y / (vh * 0.75)).toFixed(3);
  };
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', () => { vh = innerHeight; onScroll(); }, { passive: true });
  reduce.addEventListener?.('change', () => { layers.forEach((l) => (l.el.style.transform = '')); if (heroInner) heroInner.style.opacity = ''; onScroll(); syncVideo(); });
  update();

  /* ---- nav + mobile call button state ---- */
  const nav = d.querySelector('.nav'), fab = d.querySelector('.call-fab'), hero = d.querySelector('.hero');
  const visit = d.querySelector('.footer');
  const navState = () => {
    nav.classList.toggle('scrolled', scrollY > 40);
    const pastHero = scrollY > hero.offsetHeight * 0.6;
    const atFooter = visit.getBoundingClientRect().top < innerHeight;
    fab.classList.toggle('show', pastHero && !atFooter);
  };
  addEventListener('scroll', navState, { passive: true }); navState();

  /* ---- hero video: play only when visible, honour reduced motion ---- */
  const video = d.querySelector('.hero-video');
  const syncVideo = () => {
    if (!video) return;
    if (reduce.matches) { video.pause(); video.removeAttribute('autoplay'); return; }
    const r = hero.getBoundingClientRect();
    if (r.bottom > 0 && !d.hidden) video.play().catch(() => {}); else video.pause();
  };
  if (video) {
    video.muted = true;
    addEventListener('scroll', () => requestAnimationFrame(syncVideo), { passive: true });
    d.addEventListener('visibilitychange', syncVideo);
    syncVideo();
  }

  /* ---- open-now status + today's hours (shop time: America/Los_Angeles) ---- */
  const HOURS = { 0: [8, 24], 1: [6, 21], 2: [9, 21], 3: [9, 21], 4: [9, 21], 5: [9, 21], 6: [8, 21] };
  const fmt = (h) => (h === 24 || h === 0 ? 'midnight' : `${((h + 11) % 12) + 1} ${h < 12 ? 'AM' : 'PM'}`);
  try {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Los_Angeles', weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: false }).formatToParts(new Date());
    const get = (t) => parts.find((p) => p.type === t)?.value;
    const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'));
    const now = (parseInt(get('hour'), 10) % 24) + parseInt(get('minute'), 10) / 60;
    d.querySelector(`.hours-table tr[data-day="${day}"]`)?.classList.add('today');
    const [o, c] = HOURS[day];
    const el = d.getElementById('open-status');
    const open = now >= o && now < c;
    let msg;
    if (open) msg = `Open now · until ${fmt(c)}`;
    else if (now < o) msg = `Closed now · opens today at ${fmt(o)}`;
    else { const n = HOURS[(day + 1) % 7]; msg = `Closed now · opens tomorrow at ${fmt(n[0])}`; }
    el.innerHTML = `<span class="pip" aria-hidden="true"></span>${msg}`;
    if (!open) el.classList.add('closed');
  } catch (_) {}

  /* ---- click-to-load map (keeps the page fast) ---- */
  const btn = d.querySelector('.map-load');
  btn?.addEventListener('click', () => {
    const f = d.createElement('iframe');
    f.src = btn.dataset.src; f.title = 'Map: Thunder 6 Barber Shop, 475 College Blvd Suite 6, Oceanside'; f.loading = 'lazy';
    f.referrerPolicy = 'no-referrer-when-downgrade';
    btn.replaceWith(f);
  });

  /* ---- one storm flash as the page lands ---- */
  if (!reduce.matches) setTimeout(() => d.querySelector('.flash')?.classList.add('go'), 900);
  const yr = d.getElementById('yr'); if (yr) yr.textContent = new Date().getFullYear();
})();
