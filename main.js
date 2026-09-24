(() => {
  'use strict';

  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const hasGSAP = typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined';
  const hasSplit = hasGSAP && typeof SplitText !== 'undefined';
  if (hasGSAP) gsap.registerPlugin(...[ScrollTrigger, hasSplit && SplitText].filter(Boolean));

  /* ---------------------------------------------------------
     Theme colours (read from CSS tokens so canvases follow theme)
     --------------------------------------------------------- */
  let colors = {};
  const hexToRgb = (hex) => {
    const h = hex.replace('#', '');
    const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
    return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
  };
  const readColors = () => {
    const cs = getComputedStyle(root);
    colors = {
      fg: hexToRgb(cs.getPropertyValue('--fg').trim()),
      accent: hexToRgb(cs.getPropertyValue('--accent-text').trim()),
    };
  };
  readColors();

  const setTheme = (theme, persist) => {
    root.dataset.theme = theme;
    if (persist) { try { localStorage.setItem('theme', theme); } catch (e) {} }
    readColors();
  };

  const toggle = document.querySelector('.theme-toggle');
  toggle.addEventListener('click', () => {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    if (!document.startViewTransition || reduce) { setTheme(next, true); return; }

    const r = toggle.getBoundingClientRect();
    const x = r.left + r.width / 2;
    const y = r.top + r.height / 2;
    const end = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));

    root.classList.add('no-trans');
    const vt = document.startViewTransition(() => setTheme(next, true));
    vt.ready.then(() => {
      root.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${end}px at ${x}px ${y}px)`] },
        { duration: 800, easing: 'cubic-bezier(.7,0,.2,1)', pseudoElement: '::view-transition-new(root)' }
      );
    });
    vt.finished.finally(() => root.classList.remove('no-trans'));
  });

  // Follow the OS setting until the visitor picks one explicitly.
  matchMedia('(prefers-color-scheme: light)').addEventListener('change', (e) => {
    let saved = null;
    try { saved = localStorage.getItem('theme'); } catch (err) {}
    if (!saved) setTheme(e.matches ? 'light' : 'dark', false);
  });

  /* ---------------------------------------------------------
     Small things
     --------------------------------------------------------- */
  document.getElementById('year').textContent = new Date().getFullYear();

  // Film grain: render one small noise tile once and let CSS tile it.
  (() => {
    const s = 160;
    const c = document.createElement('canvas');
    c.width = c.height = s;
    const x = c.getContext('2d');
    const img = x.createImageData(s, s);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = (Math.random() * 255) | 0;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
    x.putImageData(img, 0, 0);
    document.querySelector('.grain').style.backgroundImage = `url(${c.toDataURL()})`;
  })();

  const clock = document.getElementById('clock');
  const fmtTime = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' });
  const tickClock = () => { clock.textContent = fmtTime.format(new Date()); };
  tickClock();
  setInterval(tickClock, 15000);

  const nav = document.querySelector('.nav');
  let lastY = 0;
  addEventListener('scroll', () => {
    const y = scrollY;
    nav.classList.toggle('is-scrolled', y > 20);
    nav.classList.toggle('is-hidden', y > lastY && y > 500);
    lastY = y;
  }, { passive: true });

  /* ---------------------------------------------------------
     Smooth scroll
     --------------------------------------------------------- */
  let lenis = null;
  if (!reduce && typeof Lenis !== 'undefined') {
    lenis = new Lenis({ lerp: 0.14, wheelMultiplier: 1 });
    if (hasGSAP) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((t) => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
  }

  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      const target = id === '#top' ? 0 : document.querySelector(id);
      if (target === null) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(target, { duration: 1.6 });
      else if (target === 0) scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
      else target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
    });
  });

  /* ---------------------------------------------------------
     Custom cursor + magnetic elements
     --------------------------------------------------------- */
  if (finePointer && !reduce && hasGSAP) {
    const cur = document.querySelector('.cursor');
    const label = cur.querySelector('.cursor__label');
    const xTo = gsap.quickTo(cur, 'x', { duration: 0.45, ease: 'power3' });
    const yTo = gsap.quickTo(cur, 'y', { duration: 0.45, ease: 'power3' });
    addEventListener('pointermove', (e) => { xTo(e.clientX); yTo(e.clientY); cur.classList.add('is-visible'); });
    document.addEventListener('mouseleave', () => cur.classList.remove('is-visible'));

    document.querySelectorAll('a, button, .deploys li, #globe').forEach((el) => {
      el.addEventListener('pointerenter', () => {
        cur.classList.add('is-hover');
        const text = el.dataset.cursor || (el.id === 'globe' ? 'drag' : '');
        if (text) { label.textContent = text; cur.classList.add('has-label'); }
      });
      el.addEventListener('pointerleave', () => cur.classList.remove('is-hover', 'has-label'));
    });

    document.querySelectorAll('[data-magnetic]').forEach((el) => {
      const mx = gsap.quickTo(el, 'x', { duration: 0.8, ease: 'elastic.out(1, 0.35)' });
      const my = gsap.quickTo(el, 'y', { duration: 0.8, ease: 'elastic.out(1, 0.35)' });
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        mx((e.clientX - (r.left + r.width / 2)) * 0.35);
        my((e.clientY - (r.top + r.height / 2)) * 0.35);
      });
      el.addEventListener('pointerleave', () => { mx(0); my(0); });
    });
  }

  /* ---------------------------------------------------------
     Hero network: nodes = health workers, packets = synced records
     --------------------------------------------------------- */
  (function network() {
    const c = document.getElementById('network');
    const ctx = c.getContext('2d');
    const LINK = 140;
    let w, h, nodes = [], packets = [], running = false, raf = 0;
    const mouse = { x: -9999, y: -9999 };

    const BUCKETS = 4;
    const LINK2 = LINK * LINK;

    const resize = () => {
      const dpr = Math.min(devicePixelRatio || 1, 1.5);
      w = c.clientWidth; h = c.clientHeight;
      c.width = w * dpr; c.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.min(110, Math.max(36, Math.floor((w * h) / 14000)));
      nodes = Array.from({ length: n }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
        r: Math.random() * 1.5 + 0.7,
      }));
      packets = [];
    };

    const frame = () => {
      ctx.clearRect(0, 0, w, h);
      const fg = colors.fg, ac = colors.accent;

      for (const n of nodes) {
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;
        const dx = n.x - mouse.x, dy = n.y - mouse.y, d = Math.hypot(dx, dy);
        if (d < 120 && d > 0) { n.x += (dx / d) * 1.2; n.y += (dy / d) * 1.2; }
      }

      // Batch lines into a few opacity buckets: a handful of stroke() calls instead of thousands.
      const links = Array.from({ length: BUCKETS }, () => new Path2D());
      const mouseLinks = Array.from({ length: BUCKETS }, () => new Path2D());
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dx = a.x - b.x, dy = a.y - b.y, d2 = dx * dx + dy * dy;
          if (d2 > LINK2) continue;
          const k = Math.min(BUCKETS - 1, Math.floor((1 - Math.sqrt(d2) / LINK) * BUCKETS));
          links[k].moveTo(a.x, a.y); links[k].lineTo(b.x, b.y);
          if (packets.length < 30 && Math.random() < 0.0012) packets.push({ a: i, b: j, t: 0, s: 0.008 + Math.random() * 0.012 });
        }
        const dm = Math.hypot(a.x - mouse.x, a.y - mouse.y);
        if (dm < 220) {
          const k = Math.min(BUCKETS - 1, Math.floor((1 - dm / 220) * BUCKETS));
          mouseLinks[k].moveTo(a.x, a.y); mouseLinks[k].lineTo(mouse.x, mouse.y);
        }
      }
      ctx.lineWidth = 1;
      for (let k = 0; k < BUCKETS; k++) {
        ctx.strokeStyle = `rgba(${fg},${((k + 1) / BUCKETS) * 0.22})`;
        ctx.stroke(links[k]);
        ctx.strokeStyle = `rgba(${ac},${((k + 1) / BUCKETS) * 0.6})`;
        ctx.stroke(mouseLinks[k]);
      }

      const dots = new Path2D();
      for (const n of nodes) { dots.moveTo(n.x + n.r, n.y); dots.arc(n.x, n.y, n.r, 0, Math.PI * 2); }
      ctx.fillStyle = `rgba(${fg},0.55)`;
      ctx.fill(dots);

      // Packets: a soft halo + bright core (cheap stand-in for shadowBlur).
      const halo = new Path2D(), core = new Path2D();
      packets = packets.filter((p) => {
        p.t += p.s;
        const a = nodes[p.a], b = nodes[p.b];
        if (p.t > 1 || Math.hypot(a.x - b.x, a.y - b.y) > LINK * 1.3) return false;
        const x = a.x + (b.x - a.x) * p.t, y = a.y + (b.y - a.y) * p.t;
        halo.moveTo(x + 6, y); halo.arc(x, y, 6, 0, Math.PI * 2);
        core.moveTo(x + 2.2, y); core.arc(x, y, 2.2, 0, Math.PI * 2);
        return true;
      });
      ctx.fillStyle = `rgba(${ac},0.18)`; ctx.fill(halo);
      ctx.fillStyle = `rgb(${ac})`; ctx.fill(core);

      if (running) raf = requestAnimationFrame(frame);
    };

    addEventListener('pointermove', (e) => {
      const r = c.getBoundingClientRect();
      mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
    });
    c.parentElement.addEventListener('pointerleave', () => { mouse.x = mouse.y = -9999; });
    addEventListener('resize', resize);
    resize();

    if (reduce) { frame(); return; }
    new IntersectionObserver(([entry]) => {
      running = entry.isIntersecting;
      cancelAnimationFrame(raf);
      if (running) raf = requestAnimationFrame(frame);
    }).observe(c);
  })();

  /* ---------------------------------------------------------
     Globe
     --------------------------------------------------------- */
  (function globe() {
    const c = document.getElementById('globe');
    if (!c) return;
    const ctx = c.getContext('2d');
    const deg = Math.PI / 180;
    const HQ = { lat: 23.22, lon: 72.65 };
    const hasGeo = typeof d3 !== 'undefined' && d3.geoInterpolate && typeof topojson !== 'undefined';

    // One list row = one deployment ("group"), which can light up several points
    // (data-lat/lon plus optional data-points="lat,lon,Label;...").
    const markers = [];
    const groups = [...document.querySelectorAll('.deploys li')].map((li, i) => {
      const points = [[+li.dataset.lat, +li.dataset.lon, li.dataset.label || li.querySelector('.deploys__where').textContent]];
      (li.dataset.points || '').split(';').filter(Boolean).forEach((s) => {
        const [lat, lon, name] = s.split(',');
        points.push([+lat, +lon, name]);
      });
      const group = {
        li,
        lat: points.reduce((s, p) => s + p[0], 0) / points.length,
        lon: points.reduce((s, p) => s + p[1], 0) / points.length,
      };
      points.forEach(([lat, lon, name], j) => {
        const m = { lat, lon, name, group, offset: (i + j * 0.5) * 0.37 };
        const far = Math.hypot(lat - HQ.lat, lon - HQ.lon) > 3;
        m.arc = far && hasGeo ? d3.geoInterpolate([HQ.lon, HQ.lat], [lon, lat]) : null;
        m.dist = hasGeo ? d3.geoDistance([HQ.lon, HQ.lat], [lon, lat]) : 0;
        markers.push(m);
      });
      return group;
    });

    let size = 0, R = 0, cx = 0, cy = 0, pts = [];
    let centerLon = 72, centerLat = 16, target = null, dragging = false, running = false, raf = 0;
    const wrap = (a) => ((((a + 180) % 360) + 360) % 360) - 180;
    const angleDiff = (a, b) => wrap(a - b);

    const resize = () => {
      const dpr = Math.min(devicePixelRatio || 1, 1.5);
      size = c.clientWidth;
      c.width = c.height = size * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      R = size * 0.4; cx = cy = size / 2;
    };

    const project = (lat, lon, alt = 1) => {
      const p = lat * deg, l = (lon - centerLon) * deg, p0 = centerLat * deg;
      const x0 = Math.cos(p) * Math.sin(l), y0 = Math.sin(p), z0 = Math.cos(p) * Math.cos(l);
      const y1 = y0 * Math.cos(p0) - z0 * Math.sin(p0);
      const z1 = y0 * Math.sin(p0) + z0 * Math.cos(p0);
      return { x: cx + R * alt * x0, y: cy - R * alt * y1, z: z1 };
    };

    const draw = (now) => {
      if (!dragging) {
        if (target) {
          centerLon += angleDiff(target.lon, centerLon) * 0.06;
          centerLat += (target.lat - centerLat) * 0.06;
        } else if (!reduce) {
          centerLon += 0.08;
          centerLat += (16 - centerLat) * 0.02;
        }
      }
      centerLon = wrap(centerLon);

      const fg = colors.fg, ac = colors.accent;
      ctx.clearRect(0, 0, size, size);

      // atmosphere
      const halo = ctx.createRadialGradient(cx, cy, R * 0.9, cx, cy, R * 1.3);
      halo.addColorStop(0, `rgba(${ac},0.12)`);
      halo.addColorStop(1, `rgba(${ac},0)`);
      ctx.fillStyle = halo;
      ctx.beginPath(); ctx.arc(cx, cy, R * 1.3, 0, Math.PI * 2); ctx.fill();

      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${fg},0.03)`; ctx.fill();
      ctx.strokeStyle = `rgba(${fg},0.14)`; ctx.lineWidth = 1; ctx.stroke();

      // land dots
      const p0 = centerLat * deg, s0 = Math.sin(p0), c0 = Math.cos(p0);
      // Dots batched into depth buckets: 5 fills per frame instead of thousands.
      const dot = Math.max(1.2, size / 380);
      const layers = [new Path2D(), new Path2D(), new Path2D(), new Path2D(), new Path2D()];
      for (const p of pts) {
        const l = (p[1] - centerLon) * deg;
        const x0 = p[2] * Math.sin(l), z0 = p[2] * Math.cos(l);
        const z1 = p[3] * s0 + z0 * c0;
        if (z1 <= 0) continue;
        const y1 = p[3] * c0 - z0 * s0;
        const k = Math.min(4, (z1 * 5) | 0);
        const r = dot * (0.6 + (k + 1) * 0.12);
        layers[k].rect(cx + R * x0 - r / 2, cy - R * y1 - r / 2, r, r);
      }
      ctx.fillStyle = `rgb(${fg})`;
      layers.forEach((layer, k) => { ctx.globalAlpha = 0.12 + ((k + 1) / 5) * 0.6; ctx.fill(layer); });
      ctx.globalAlpha = 1;

      // arcs from HQ with travelling packets
      const t = now / 1000;
      const visible = (q) => q.z > 0 || Math.hypot(q.x - cx, q.y - cy) > R;
      for (const m of markers) {
        if (!m.arc) continue;
        const lift = Math.min(0.4, 0.12 + m.dist * 0.22);
        const N = 60, path = [];
        for (let k = 0; k <= N; k++) {
          const [lon, lat] = m.arc(k / N);
          path.push(project(lat, lon, 1 + Math.sin(Math.PI * k / N) * lift));
        }
        const active = target && target.group === m.group;
        ctx.lineWidth = active ? 2 : 1.2;
        ctx.strokeStyle = `rgba(${ac},${active ? 0.9 : 0.45})`;
        ctx.beginPath();
        let pen = false;
        for (const q of path) {
          if (!visible(q)) { pen = false; continue; }
          pen ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y);
          pen = true;
        }
        ctx.stroke();

        const head = ((t * 0.35 + m.offset) % 1);
        const q = path[Math.round(head * N)];
        if (visible(q)) {
          ctx.fillStyle = `rgba(${ac},0.2)`;
          ctx.beginPath(); ctx.arc(q.x, q.y, 7, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = `rgb(${ac})`;
          ctx.beginPath(); ctx.arc(q.x, q.y, 2.6, 0, Math.PI * 2); ctx.fill();
        }
      }

      // markers
      ctx.font = `500 ${Math.max(10, size / 52)}px "Geist Mono", monospace`;
      const all = [{ lat: HQ.lat, lon: HQ.lon, name: 'Gandhinagar · HQ', offset: 0, hq: true }, ...markers];
      for (const m of all) {
        const q = project(m.lat, m.lon);
        if (q.z <= 0.05) continue;
        const ph = ((t + m.offset) % 1.6) / 1.6;
        ctx.strokeStyle = `rgba(${ac},${(1 - ph) * q.z})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.arc(q.x, q.y, 3 + ph * 16, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = m.hq ? `rgb(${fg})` : `rgb(${ac})`;
        ctx.beginPath(); ctx.arc(q.x, q.y, m.hq ? 3 : 3.5, 0, Math.PI * 2); ctx.fill();

        const isActive = target && m.group && target.group === m.group;
        const outside = m.lon < 65 || m.lon > 90;
        if (isActive || m.hq || outside) {
          ctx.globalAlpha = isActive ? 1 : 0.75 * q.z;
          ctx.fillStyle = `rgb(${fg})`;
          ctx.fillText(m.name.toUpperCase(), q.x + 10, q.y - 8);
          ctx.globalAlpha = 1;
        }
      }

      if (running) raf = requestAnimationFrame(draw);
    };

    const start = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(draw); };

    // drag to rotate
    let last = null;
    c.addEventListener('pointerdown', (e) => { dragging = true; target = null; last = { x: e.clientX, y: e.clientY }; c.setPointerCapture(e.pointerId); });
    c.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      centerLon -= (e.clientX - last.x) * 0.35;
      centerLat = Math.max(-60, Math.min(60, centerLat + (e.clientY - last.y) * 0.35));
      last = { x: e.clientX, y: e.clientY };
      if (!running) draw(performance.now());
    });
    const endDrag = () => { dragging = false; };
    c.addEventListener('pointerup', endDrag);
    c.addEventListener('pointercancel', endDrag);

    // hover a deployment → spin to it
    const caption = document.querySelector('.reach__caption');
    const hint = caption.innerHTML;
    const showCaption = (g) => {
      const name = g.li.querySelector('.deploys__name').textContent;
      const p = document.createElement('p');
      p.className = 'reach__desc';
      const strong = document.createElement('strong');
      strong.textContent = name;
      p.append(strong, ' ' + (g.li.dataset.desc || ''));
      caption.replaceChildren(p);
    };

    groups.forEach((g) => {
      const focus = () => {
        target = { lat: g.lat, lon: g.lon, group: g };
        groups.forEach((o) => o.li.classList.toggle('is-active', o === g));
        showCaption(g);
      };
      const blur = () => { target = null; g.li.classList.remove('is-active'); caption.innerHTML = hint; };
      // Mouse only: on touch, pointerleave fires right after a tap and would undo it.
      g.li.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') focus(); });
      g.li.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') blur(); });
      g.li.addEventListener('click', focus);
      g.li.tabIndex = 0;
      g.li.addEventListener('focus', focus);
      g.li.addEventListener('blur', blur);
    });

    addEventListener('resize', resize);
    resize();

    // Sample land into dots. Fetched only when the globe is about to scroll into view.
    const loadLand = async () => {
      if (!hasGeo) return;
      try {
        const topo = await (await fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/land-110m.json')).json();
        const land = topojson.feature(topo, topo.objects.land);
        const W = 720, H = 360;
        const off = document.createElement('canvas');
        off.width = W; off.height = H;
        const o = off.getContext('2d', { willReadFrequently: true });
        const proj = d3.geoEquirectangular().scale(W / (2 * Math.PI)).translate([W / 2, H / 2]);
        o.beginPath(); d3.geoPath(proj, o)(land); o.fill();
        const data = o.getImageData(0, 0, W, H).data;
        const step = 1.6;
        for (let lat = -56; lat <= 78; lat += step) {
          const ls = step / Math.max(Math.cos(lat * deg), 0.2);
          for (let lon = -180; lon < 180; lon += ls) {
            const x = Math.floor(((lon + 180) / 360) * W);
            const y = Math.floor(((90 - lat) / 180) * H);
            if (data[(y * W + x) * 4 + 3] > 100) pts.push([lat, lon, Math.cos(lat * deg), Math.sin(lat * deg)]);
          }
        }
      } catch (e) { /* globe still renders markers without land dots */ }
      if (!running) draw(performance.now());
    };
    const nearby = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      nearby.disconnect();
      loadLand();
    }, { rootMargin: '1200px 0px' });
    nearby.observe(c);

    new IntersectionObserver(([entry]) => {
      running = entry.isIntersecting;
      if (running) start(); else cancelAnimationFrame(raf);
    }).observe(c);
    draw(performance.now());
  })();

  /* ---------------------------------------------------------
     GSAP: loader, intro, scroll choreography
     --------------------------------------------------------- */
  const loader = document.querySelector('.loader');

  if (!hasGSAP || reduce) {
    loader.remove();
    return;
  }

  const fontsReady = Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 2500))]);

  // Always start the story from the top.
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  scrollTo(0, 0);

  // Pre-hide hero so nothing flashes when the loader leaves.
  gsap.set('.hero__inner, .scroll-hint', { autoAlpha: 0 });
  lenis && lenis.stop();

  // Full loader on the first visit of a session; a quick one after that.
  let seen = false;
  try { seen = sessionStorage.getItem('intro-seen') === '1'; sessionStorage.setItem('intro-seen', '1'); } catch (e) {}
  const loadDur = seen ? 0.5 : 1.9;

  const counter = { v: 0 };
  const num = document.getElementById('loader-num');
  const loadTl = gsap.timeline()
    .to(counter, { v: 100, duration: loadDur, ease: 'power2.inOut', onUpdate: () => { num.textContent = Math.round(counter.v); } })
    .to('.loader__bar span', { scaleX: 1, duration: loadDur, ease: 'power2.inOut' }, 0);

  fontsReady.then(() => {
    loadTl.then(() => {
      const tl = gsap.timeline();
      tl.to(loader, { clipPath: 'inset(0 0 100% 0)', duration: 1.1, ease: 'expo.inOut' })
        .add(heroIntro(), '-=0.45')
        .add(() => {
          loader.remove();
          lenis && lenis.start();
        });
    });
    buildScroll();
  });

  function heroIntro() {
    gsap.set('.hero__inner, .scroll-hint', { autoAlpha: 1 });
    const tl = gsap.timeline();
    const words = document.querySelectorAll('.hero__word');
    const chars = hasSplit ? SplitText.create(words, { type: 'chars' }).chars : words;

    tl.from(chars, { yPercent: 115, rotate: 6, duration: 1.4, ease: 'expo.out', stagger: 0.045 })
      .from('.hero__star', { scale: 0, rotate: -270, duration: 1.4, ease: 'back.out(1.8)' }, 0.35)
      .from('.hero__eyebrow', { y: 24, autoAlpha: 0, duration: 0.9, ease: 'power3.out' }, 0.2)
      .from('.hero__bottom', { y: 40, autoAlpha: 0, duration: 1.1, ease: 'power3.out' }, 0.5)
      .from('.nav', { y: -40, autoAlpha: 0, duration: 0.9, ease: 'power3.out', clearProps: 'transform' }, 0.5)
      .from('.hero__canvas', { autoAlpha: 0, duration: 2 }, 0)
      .from('.scroll-hint', { autoAlpha: 0, duration: 1 }, 1);
    return tl;
  }

  function buildScroll() {
    // Hero exits with parallax
    gsap.to('.hero__title', { yPercent: -25, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    gsap.to('.hero__canvas', { yPercent: 20, autoAlpha: 0.2, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

    // Manifesto: words light up as you read
    if (hasSplit) {
      document.querySelectorAll('[data-words]').forEach((el) => {
        const split = SplitText.create(el, { type: 'words' });
        gsap.fromTo(split.words, { opacity: 0.12 }, {
          opacity: 1, ease: 'none', stagger: 0.1,
          scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 50%', scrub: true },
        });
      });
    }

    // Portrait: unveils from the bottom, then drifts with scroll
    gsap.from('.portrait__frame', {
      clipPath: 'inset(100% 0% 0% 0% round 28px)', duration: 1.4, ease: 'expo.inOut',
      scrollTrigger: { trigger: '.portrait', start: 'top 80%' },
    });
    gsap.fromTo('.portrait__frame img', { yPercent: -6 }, {
      yPercent: 6, ease: 'none',
      scrollTrigger: { trigger: '.manifesto', start: 'top bottom', end: 'bottom top', scrub: true },
    });
    gsap.from('.portrait figcaption', { y: 20, autoAlpha: 0, duration: 0.9, delay: 0.6, ease: 'power3.out', scrollTrigger: { trigger: '.portrait', start: 'top 80%' } });

    // 300,000,000 counter: plays on its own once the section comes into view
    const big = document.getElementById('bignum');
    const o = { v: 0 };
    const fmt = (n) => Math.round(n).toLocaleString('en-US');
    big.textContent = '0';
    gsap.timeline({ scrollTrigger: { trigger: '.bignum', start: 'top 65%', once: true } })
      .to(o, { v: 300000000, duration: 2.6, ease: 'power3.inOut', onUpdate: () => { big.textContent = fmt(o.v); } })
      .from('.bignum__stats > div', { y: 60, autoAlpha: 0, stagger: 0.1, duration: 0.9, ease: 'power3.out' }, 1.4);

    // Journey: horizontal scroll on desktop
    const mm = gsap.matchMedia();
    mm.add('(min-width: 900px)', () => {
      const track = document.querySelector('.journey__track');
      const dist = () => track.scrollWidth - innerWidth;
      const move = gsap.to(track, {
        x: () => -dist(), ease: 'none',
        scrollTrigger: { trigger: '.journey', start: 'top top', end: () => '+=' + dist(), pin: true, scrub: 0.4, invalidateOnRefresh: true },
      });
      gsap.to('.journey__progress span', {
        scaleX: 1, ease: 'none',
        scrollTrigger: { trigger: '.journey', start: 'top top', end: () => '+=' + dist(), scrub: true, invalidateOnRefresh: true },
      });
      // Where a panel's left edge ends up when the horizontal scroll finishes.
      // Entrance animations must complete by then, or the last panels stay mid-animation.
      const finalLeft = (panel) => panel.getBoundingClientRect().left - track.getBoundingClientRect().left - dist();
      const endAt = (panel, frac) => () => `left ${Math.max(finalLeft(panel) + 2, innerWidth * frac)}px`;

      gsap.utils.toArray('.panel').forEach((panel) => {
        gsap.from(panel, {
          y: 120, rotate: 5, autoAlpha: 0.2, ease: 'none',
          scrollTrigger: { trigger: panel, containerAnimation: move, start: 'left right', end: endAt(panel, 0.6), scrub: true, invalidateOnRefresh: true },
        });
        gsap.from(panel.querySelector('.panel__year'), {
          xPercent: 45, ease: 'none',
          scrollTrigger: { trigger: panel, containerAnimation: move, start: 'left right', end: endAt(panel, 0.45), scrub: true, invalidateOnRefresh: true },
        });
      });
    });
    mm.add('(max-width: 899px)', () => {
      gsap.utils.toArray('.panel').forEach((panel) => {
        gsap.from(panel, { y: 60, autoAlpha: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: panel, start: 'top 88%' } });
      });
    });

    // Work: cards stack and recede
    const cards = gsap.utils.toArray('.card');
    cards.forEach((card, i) => {
      const next = cards[i + 1];
      gsap.from(card.querySelector('.card__metric'), {
        yPercent: 40, autoAlpha: 0, duration: 1.2, ease: 'expo.out',
        scrollTrigger: { trigger: card, start: 'top 75%' },
      });
      if (!next) return;
      gsap.to(card, {
        scale: 0.88 + i * 0.012, '--dim': 0.65, ease: 'none',
        scrollTrigger: { trigger: next, start: 'top bottom', end: 'top 20%', scrub: true },
      });
    });

    // Expertise pillars rise in one after another
    gsap.from('.pillar', {
      y: 80, autoAlpha: 0, stagger: 0.12, duration: 1.1, ease: 'expo.out',
      scrollTrigger: { trigger: '.pillars', start: 'top 80%' },
    });

    // Principles: each rule slides in with its own line
    gsap.utils.toArray('.rules li').forEach((li) => {
      gsap.from(li.children, {
        y: 40, autoAlpha: 0, stagger: 0.08, duration: 1, ease: 'power3.out',
        scrollTrigger: { trigger: li, start: 'top 85%' },
      });
    });

    gsap.from('.side', { y: 60, autoAlpha: 0, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: '.side', start: 'top 88%' } });
    gsap.from('.contact__roles li', { y: 20, autoAlpha: 0, stagger: 0.06, duration: 0.8, ease: 'power3.out', scrollTrigger: { trigger: '.contact__roles', start: 'top 90%' } });

    // Globe entrance
    gsap.from('#globe', { scale: 0.7, rotate: -20, autoAlpha: 0, duration: 1.6, ease: 'expo.out', scrollTrigger: { trigger: '.reach', start: 'top 70%' } });
    gsap.from('.deploys li', { x: -40, autoAlpha: 0, stagger: 0.06, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: '.deploys', start: 'top 85%' } });

    // Marquees that react to scroll velocity
    const loops = [];
    document.querySelectorAll('.marquee').forEach((m) => {
      const inner = m.querySelector('.marquee__inner');
      inner.innerHTML += inner.innerHTML;
      const dir = Number(m.dataset.dir) || 1;
      loops.push(gsap.fromTo(inner, { xPercent: dir > 0 ? 0 : -50 }, { xPercent: dir > 0 ? -50 : 0, duration: 38, ease: 'none', repeat: -1 }));
    });
    // One shared boost value eased on the ticker (no tweens created per scroll event).
    let boost = 1, marqueeOn = false;
    ScrollTrigger.create({
      trigger: '.toolkit', start: 'top bottom', end: 'bottom top',
      onToggle: (self) => { marqueeOn = self.isActive; loops.forEach((tw) => tw.paused(!marqueeOn)); },
      onUpdate: (self) => { boost = Math.max(boost, 1 + Math.min(Math.abs(self.getVelocity()) / 250, 8)); },
    });
    loops.forEach((tw) => tw.pause());
    gsap.ticker.add(() => {
      if (!marqueeOn) return;
      boost += (1 - boost) * 0.05;
      loops.forEach((tw) => tw.timeScale(boost));
    });

    // Headings reveal line by line
    if (hasSplit) {
      document.querySelectorAll('[data-split]').forEach((el) => {
        SplitText.create(el, {
          type: 'lines', mask: 'lines', autoSplit: true,
          onSplit: (self) => gsap.from(self.lines, {
            yPercent: 110, duration: 1.3, ease: 'expo.out', stagger: 0.1,
            scrollTrigger: { trigger: el, start: 'top 85%', once: true },
          }),
        });
      });
    }

    gsap.from('.contact__btn', { scale: 0, rotate: -90, duration: 1.4, ease: 'elastic.out(1, 0.5)', scrollTrigger: { trigger: '.contact__row', start: 'top 85%' } });
    gsap.from('.contact__links li', { y: 30, autoAlpha: 0, stagger: 0.08, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: '.contact__row', start: 'top 85%' } });

    // Active nav link
    const links = [...document.querySelectorAll('.nav__links a')];
    ['about', 'expertise', 'work', 'journey', 'contact'].forEach((id) => {
      ScrollTrigger.create({
        trigger: '#' + id, start: 'top center', end: 'bottom center',
        onToggle: (self) => { if (self.isActive) links.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === '#' + id)); },
      });
    });

    ScrollTrigger.refresh();
  }
})();
