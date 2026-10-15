/* Bumai Ndala · CV — interactions */
(() => {
  'use strict';
  const d = document;
  const root = d.documentElement;
  const $ = (s, el = d) => el.querySelector(s);
  const $$ = (s, el = d) => Array.from(el.querySelectorAll(s));
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  root.classList.add('booted');

  /* ---------- theme ---------- */
  const themeMeta = $('meta[data-theme-color]');
  const switches = $$('[data-theme-switch]');
  const savedTheme = () => { try { return localStorage.getItem('theme'); } catch (e) { return null; } };
  function applyTheme(t, save) {
    root.setAttribute('data-theme', t);
    switches.forEach((s) => s.setAttribute('aria-checked', String(t === 'dark')));
    if (themeMeta) themeMeta.setAttribute('content', t === 'dark' ? '#0E0F14' : '#E6E8EE');
    if (save) { try { localStorage.setItem('theme', t); } catch (e) { /* storage unavailable */ } }
  }
  applyTheme(root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light', false);
  switches.forEach((s) => s.addEventListener('click', () => {
    applyTheme(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark', true);
  }));
  const darkMq = window.matchMedia('(prefers-color-scheme: dark)');
  if (darkMq.addEventListener) {
    darkMq.addEventListener('change', (e) => { if (!savedTheme()) applyTheme(e.matches ? 'dark' : 'light', false); });
  }

  /* ---------- intro: the camera settles into focus ---------- */
  requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add('is-ready')));

  /* ---------- Material ripple ---------- */
  d.addEventListener('pointerdown', (e) => {
    const el = e.target.closest('[data-ripple]');
    if (!el || reduce.matches) return;
    const r = el.getBoundingClientRect();
    const size = Math.max(r.width, r.height);
    const s = d.createElement('span');
    s.className = 'ripple';
    s.style.width = s.style.height = size + 'px';
    s.style.left = (e.clientX - r.left - size / 2) + 'px';
    s.style.top = (e.clientY - r.top - size / 2) + 'px';
    el.appendChild(s);
    setTimeout(() => s.remove(), 700);
  });

  /* ---------- snackbar ---------- */
  const snack = $('[data-snackbar]');
  let snackTimer = 0;
  function toast(msg) {
    if (!snack) return;
    snack.textContent = msg;
    snack.classList.add('is-on');
    clearTimeout(snackTimer);
    snackTimer = setTimeout(() => snack.classList.remove('is-on'), 3200);
  }

  /* ---------- copy + share ---------- */
  $$('[data-copy]').forEach((b) => b.addEventListener('click', async () => {
    const text = b.dataset.copy;
    const label = b.dataset.copyLabel || 'Text';
    try { await navigator.clipboard.writeText(text); toast(label + ' copied'); }
    catch (e) { toast(label + ': ' + text); }
  }));
  $$('[data-share]').forEach((b) => b.addEventListener('click', async () => {
    const data = { title: d.title, url: location.href.split('#')[0] };
    if (navigator.share) { try { await navigator.share(data); } catch (e) { /* dismissed */ } return; }
    try { await navigator.clipboard.writeText(data.url); toast('Link copied'); }
    catch (e) { toast(data.url); }
  }));

  /* ---------- keycaps type into the folder bay ---------- */
  const typed = $('[data-typed]');
  $$('.key').forEach((k) => k.addEventListener('click', () => {
    if (!typed) return;
    const note = typed.parentElement;
    typed.textContent = k.textContent.trim();
    note.classList.remove('is-typing');
    void note.offsetWidth;
    note.classList.add('is-typing');
  }));

  /* ---------- app bar elevation + FAB collapse ---------- */
  const appbar = $('[data-appbar]');
  const fab = $('[data-fab]');
  let lastY = window.scrollY;
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = window.scrollY;
      if (appbar) appbar.classList.toggle('is-raised', y > 8);
      if (fab) {
        if (y > lastY + 6 && y > 260) fab.classList.add('is-collapsed');
        else if (y < lastY - 6 || y < 260) fab.classList.remove('is-collapsed');
      }
      lastY = y;
      ticking = false;
    });
  }, { passive: true });

  /* the floating FAB stays out of the way while the hero's own buttons are visible */
  const heroActions = $('.hero .actions');
  if (fab && heroActions && 'IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      entries.forEach((en) => fab.classList.toggle('is-hidden', en.isIntersecting));
    }, { threshold: 0.01 }).observe(heroActions);
  }

  /* ---------- scrollspy + sliding tab indicator ---------- */
  const tabLinks = $$('.tabs a[data-tab]');
  const navLinks = $$('[data-tab]');
  const tabInk = $('.tabs-ink');
  let current = 'profile';
  function moveInk() {
    const a = tabLinks.find((t) => t.dataset.tab === current);
    if (!a || !tabInk || !a.offsetWidth) return;
    tabInk.style.width = a.offsetWidth + 'px';
    tabInk.style.transform = 'translateX(' + a.offsetLeft + 'px)';
  }
  function setActive(id) {
    if (!id) return;
    current = id;
    navLinks.forEach((a) => {
      if (a.dataset.tab === id) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });
    moveInk();
  }
  const sections = ['profile', 'journey', 'skills', 'contact'].map((id) => d.getElementById(id)).filter(Boolean);
  if ('IntersectionObserver' in window) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) setActive(en.target.id); });
    }, { rootMargin: '-38% 0px -58% 0px' });
    sections.forEach((s) => spy.observe(s));
  }
  window.addEventListener('scroll', () => {
    if (window.innerHeight + window.scrollY >= d.documentElement.scrollHeight - 4) setActive('contact');
  }, { passive: true });
  window.addEventListener('resize', moveInk);

  /* ---------- journey graph ---------- */
  const graph = $('[data-graph]');
  const dataEl = $('#journey-data');
  const data = dataEl ? JSON.parse(dataEl.textContent) : { nodes: [], edges: [], experience: [] };
  const NS = 'http://www.w3.org/2000/svg';
  const nodeEls = {};
  let wires = [];
  let drawn = false;

  if (graph) {
    $$('.node', graph).forEach((n) => { nodeEls[n.dataset.node] = n; });
    const svg = $('.wires', graph);
    wires = data.edges.map((e) => {
      const a = nodeEls[e.from];
      const b = nodeEls[e.to];
      const same = a.dataset.col === b.dataset.col;
      const p = d.createElementNS(NS, 'path');
      p.setAttribute('class', 'wire ' + e.kind + (e.dashed ? ' dashed' : '') + (same ? ' dotted' : ''));
      svg.appendChild(p);
      if (!same) {
        const out = $('.port-out', a);
        const inn = $('.port-in', b);
        out.classList.add('is-linked'); out.dataset.kind = e.kind;
        inn.classList.add('is-linked'); inn.dataset.kind = e.kind;
        $('.port-in', a).classList.add('is-stack');
        inn.classList.add('is-stack');
        if (!$('.port-in', a).dataset.kind) $('.port-in', a).dataset.kind = e.kind;
      }
      return Object.assign({}, e, { el: p, a, b, same });
    });

    const layout = () => {
      const g = graph.getBoundingClientRect();
      const w = graph.offsetWidth;
      const h = graph.offsetHeight;
      if (!w) return;
      const k = g.width / w || 1; // undo ancestor scale transforms
      const mode = getComputedStyle(graph).getPropertyValue('--graph-mode').trim() || 'cols';
      svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
      const rel = (el) => {
        const r = el.getBoundingClientRect();
        const l = (r.left - g.left) / k;
        const t = (r.top - g.top) / k;
        const rw = r.width / k;
        const rh = r.height / k;
        return { l, t, r: l + rw, b: t + rh, cy: t + rh / 2 };
      };
      wires.forEach((wire) => {
        const A = rel(wire.a);
        const B = rel(wire.b);
        let path;
        if (wire.same) {
          const ia = wire.a.querySelector('.node-icon').getBoundingClientRect();
          const ib = wire.b.querySelector('.node-icon').getBoundingClientRect();
          const xa = (ia.left + ia.width / 2 - g.left) / k;
          const xb = (ib.left + ib.width / 2 - g.left) / k;
          path = 'M' + xa + ',' + (A.b + 5) + ' L' + xb + ',' + (B.t - 5);
        } else if (mode === 'cols') {
          const x1 = A.r + 6;
          const x2 = B.l - 6;
          const mx = (x1 + x2) / 2;
          path = 'M' + x1 + ',' + A.cy + ' C' + mx + ',' + A.cy + ' ' + mx + ',' + B.cy + ' ' + x2 + ',' + B.cy;
        } else {
          const span = Math.abs(B.cy - A.cy);
          const off = 16 + Math.min(22, span / 22);
          const x1 = A.l - 6;
          const x2 = B.l - 6;
          path = 'M' + x1 + ',' + A.cy + ' C' + (x1 - off) + ',' + A.cy + ' ' + (x2 - off) + ',' + B.cy + ' ' + x2 + ',' + B.cy;
        }
        wire.el.setAttribute('d', path);
      });
    };
    graph._layout = layout;

    if ('ResizeObserver' in window) new ResizeObserver(layout).observe(graph);
    window.addEventListener('resize', layout);
    if (d.fonts && d.fonts.ready) d.fonts.ready.then(() => { layout(); moveInk(); });
    setTimeout(layout, 1200);
    layout();

    /* hover / focus: light up a node's connections */
    const focusNode = (id) => {
      graph.classList.toggle('has-focus', Boolean(id));
      wires.forEach((w) => w.el.classList.toggle('is-hot', Boolean(id) && (w.from === id || w.to === id)));
      Object.keys(nodeEls).forEach((key) => {
        const linked = Boolean(id) && (key === id || wires.some((w) => (w.from === id && w.to === key) || (w.to === id && w.from === key)));
        nodeEls[key].classList.toggle('is-hot', linked);
      });
    };
    Object.keys(nodeEls).forEach((id) => {
      const el = nodeEls[id];
      el.addEventListener('pointerenter', () => focusNode(id));
      el.addEventListener('pointerleave', () => focusNode(null));
      el.addEventListener('focus', () => focusNode(id));
      el.addEventListener('blur', () => focusNode(null));
      el.addEventListener('click', () => openNode(id));
    });

    /* filter: a Material segmented button (radio group with arrow keys) */
    const radios = $$('.segmented [data-filter]');
    const select = (b, focus) => {
      radios.forEach((x) => {
        const on = x === b;
        x.setAttribute('aria-checked', String(on));
        x.tabIndex = on ? 0 : -1;
      });
      graph.dataset.filter = b.dataset.filter;
      if (focus) b.focus();
    };
    radios.forEach((b, i) => {
      b.tabIndex = b.getAttribute('aria-checked') === 'true' ? 0 : -1;
      b.addEventListener('click', () => select(b, false));
      b.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); select(radios[(i + 1) % radios.length], true); }
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); select(radios[(i - 1 + radios.length) % radios.length], true); }
      });
    });
  }

  function drawWires() {
    if (drawn || !graph) return;
    drawn = true;
    graph._layout();
    if (reduce.matches) return;
    wires.forEach((w, i) => {
      if (!w.el.animate || !w.el.getTotalLength) return;
      const len = w.el.getTotalLength();
      w.el.style.strokeDasharray = len + ' ' + len;
      const anim = w.el.animate(
        [{ strokeDashoffset: len }, { strokeDashoffset: 0 }],
        { duration: 950, delay: 250 + i * 150, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'backwards' }
      );
      anim.onfinish = () => { w.el.style.strokeDasharray = ''; };
    });
  }

  /* ---------- reveal on scroll ---------- */
  const reveals = $$('.reveal');
  if ('IntersectionObserver' in window && !reduce.matches) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        en.target.classList.add('is-in');
        io.unobserve(en.target);
        if (graph && en.target.contains(graph)) setTimeout(drawWires, 120);
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.06 });
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add('is-in'));
    drawWires();
  }

  /* ---------- dialogs ---------- */
  let lastFocus = null;
  function openDialog(dlg, opener) {
    if (!dlg || dlg.open) return;
    $$('dialog.sheet[open]').forEach((x) => closeDialog(x, true, false));
    if (opener) lastFocus = opener;
    if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
    d.body.classList.add('has-dialog');
    requestAnimationFrame(() => requestAnimationFrame(() => dlg.classList.add('is-in')));
  }
  function closeDialog(dlg, instant, restore = true) {
    if (!dlg || !dlg.open) return;
    dlg.classList.remove('is-in');
    d.body.classList.remove('has-dialog');
    const finish = () => {
      if (typeof dlg.close === 'function') dlg.close(); else dlg.removeAttribute('open');
      if (restore && lastFocus && d.contains(lastFocus)) lastFocus.focus({ preventScroll: true });
    };
    if (instant || reduce.matches) finish(); else setTimeout(finish, 260);
  }
  $$('dialog.sheet').forEach((dlg) => {
    dlg.addEventListener('cancel', (e) => { e.preventDefault(); closeDialog(dlg); });
    dlg.addEventListener('click', (e) => { if (e.target === dlg) closeDialog(dlg); });
    $$('[data-close]', dlg).forEach((b) => b.addEventListener('click', () => closeDialog(dlg)));
  });

  /* journey step details */
  const dlgNode = $('#dlg-node');
  function openNode(id) {
    const n = data.nodes.find((x) => x.id === id);
    if (!n || !dlgNode) return;
    const exp = n.experience ? data.experience.find((e) => e.id === n.experience) : null;
    $('[data-node-title]', dlgNode).textContent = exp ? exp.title : n.title;
    $('[data-node-meta]', dlgNode).textContent = exp
      ? [exp.product, exp.org, exp.period].filter(Boolean).join(' · ')
      : n.detail_meta;
    const use = $('[data-node-icon]', dlgNode);
    use.setAttribute('href', '#i-' + n.icon);
    const body = $('[data-node-body]', dlgNode);
    body.textContent = '';
    if (exp && exp.about) {
      const p = d.createElement('p');
      p.className = 'sheet-about';
      p.textContent = exp.about;
      body.appendChild(p);
    }
    const ul = d.createElement('ul');
    (exp ? exp.points : n.detail || []).forEach((t) => {
      const li = d.createElement('li');
      li.textContent = t;
      ul.appendChild(li);
    });
    body.appendChild(ul);
    openDialog(dlgNode, nodeEls[id]);
  }

  /* contact form (Netlify Forms, submitted with fetch) */
  const dlgContact = $('#dlg-contact');
  const form = $('[data-contact-form]');
  const done = $('[data-contact-done]');
  const formErr = $('[data-form-error]');
  $$('[data-open-contact]').forEach((b) => b.addEventListener('click', () => {
    if (done && !done.hidden) { done.hidden = true; form.hidden = false; }
    const opener = dlgNode && dlgNode.open ? lastFocus : b;
    openDialog(dlgContact, opener);
  }));

  if (form) {
    const required = ['name', 'email', 'message'];
    const messages = {
      name: 'Enter your name.',
      email: 'Enter your email address so I can reply.',
      message: 'Write a short message.'
    };
    const validate = (field) => {
      const wrap = field.closest('.field');
      const out = $('[data-error-for="' + field.name + '"]', form);
      let msg = '';
      if (!field.value.trim()) msg = messages[field.name];
      else if (field.type === 'email' && field.validity.typeMismatch) msg = 'Check the email address. Use a format like name@company.com.';
      wrap.classList.toggle('is-invalid', Boolean(msg));
      field.setAttribute('aria-invalid', msg ? 'true' : 'false');
      if (out) out.textContent = msg;
      return !msg;
    };
    required.forEach((n) => {
      const f = form.elements[n];
      f.addEventListener('input', () => { if (f.closest('.field').classList.contains('is-invalid')) validate(f); });
      f.addEventListener('blur', () => { if (f.value) validate(f); });
    });
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fields = required.map((n) => form.elements[n]);
      const results = fields.map(validate);
      if (results.includes(false)) {
        const first = fields.find((f) => f.getAttribute('aria-invalid') === 'true');
        if (first) first.focus();
        return;
      }
      const btn = $('[data-submit]', form);
      const label = $('span', btn);
      btn.disabled = true;
      label.textContent = 'Sending…';
      formErr.hidden = true;
      try {
        const res = await fetch('/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams(new FormData(form)).toString()
        });
        if (!res.ok) throw new Error('Status ' + res.status);
        form.reset();
        form.hidden = true;
        done.hidden = false;
        const title = $('[data-done-title]', done);
        if (title) title.focus();
      } catch (err) {
        formErr.textContent = "Your message didn't send. Check your connection and try again, or email ndalabumai@gmail.com.";
        formErr.hidden = false;
      } finally {
        btn.disabled = false;
        label.textContent = 'Send message';
      }
    });
  }

  moveInk();
})();
