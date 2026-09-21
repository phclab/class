const W = 900, H = 360;
const CLEFT_TOP = 150, CLEFT_BOTTOM = 210;
const CYCLE = 5200;

const PHASES = [
  { t: 0, step: 0, cap: '1 · transmitter is made in the terminal' },
  { t: 900, step: 1, cap: '2 · vesicles are loaded' },
  { t: 1700, step: 2, cap: '3 · Ca²⁺ enters, the vesicle fuses' },
  { t: 2500, step: 3, cap: '4 · transmitter binds its receptors' },
  { t: 3600, step: 4, cap: '5 · transporters clear the cleft' },
];

const CARGO = [[-0.42, -0.2], [0.02, -0.44], [0.44, -0.12], [-0.3, 0.34], [0.22, 0.4], [-0.02, 0.05]];
const rnd = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const ease = t => t * t * (3 - 2 * t);

function palette(body) {
  const r = getComputedStyle(document.documentElement), b = getComputedStyle(body);
  const g = n => (b.getPropertyValue(n) || r.getPropertyValue(n)).trim();
  return {
    ink: g('--ink'), dim: g('--dim'), line: g('--line'), panel: g('--panel'),
    ground: g('--ground'), vesicle: g('--vesicle'), accent: g('--accent'),
    inh: g('--inh'), mod: g('--mod'),
  };
}

function bouton(g, C) {
  g.beginPath();
  g.moveTo(20, 74);
  g.lineTo(84, 74);
  g.quadraticCurveTo(70, 40, 150, 38);
  g.lineTo(450, 38);
  g.quadraticCurveTo(534, 40, 534, 96);
  g.quadraticCurveTo(534, 148, 470, CLEFT_TOP);
  g.lineTo(180, CLEFT_TOP);
  g.quadraticCurveTo(86, 148, 86, 100);
  g.lineTo(20, 100);
  g.closePath();
  g.fillStyle = C.panel; g.fill();
  g.strokeStyle = C.line; g.lineWidth = 3; g.stroke();
}

function spine(g, C) {
  g.beginPath();
  g.moveTo(206, CLEFT_BOTTOM);
  g.lineTo(474, CLEFT_BOTTOM);
  g.quadraticCurveTo(516, 212, 500, 268);
  g.quadraticCurveTo(486, 316, 400, 320);
  g.lineTo(366, 320);
  g.lineTo(366, 352);
  g.lineTo(314, 352);
  g.lineTo(314, 320);
  g.lineTo(280, 320);
  g.quadraticCurveTo(194, 316, 180, 268);
  g.quadraticCurveTo(164, 212, 206, CLEFT_BOTTOM);
  g.closePath();
  g.fillStyle = C.panel; g.fill();
  g.strokeStyle = C.line; g.lineWidth = 3; g.stroke();
  g.beginPath();
  g.moveTo(224, CLEFT_BOTTOM + 7); g.lineTo(456, CLEFT_BOTTOM + 7);
  g.strokeStyle = C.dim; g.lineWidth = 5; g.globalAlpha = .35; g.stroke(); g.globalAlpha = 1;
}

function astrocyte(g, C, label) {
  g.beginPath();
  g.moveTo(596, 92);
  g.quadraticCurveTo(650, 52, 730, 62);
  g.quadraticCurveTo(858, 56, 862, 128);
  g.quadraticCurveTo(880, 206, 792, 226);
  g.quadraticCurveTo(704, 250, 646, 212);
  g.quadraticCurveTo(586, 178, 596, 92);
  g.closePath();
  g.fillStyle = C.panel; g.fill();
  g.strokeStyle = C.line; g.lineWidth = 3; g.stroke();
  g.fillStyle = C.dim; g.font = '13px "IBM Plex Sans", sans-serif';
  g.fillText(label, 656, 96);
}

function channel(g, C, x, y, open, color) {
  const gap = 4 + open * 7;
  g.fillStyle = color;
  g.beginPath(); g.roundRect(x - 17, y - 14, 17 - gap / 2, 30, 5); g.fill();
  g.beginPath(); g.roundRect(x + gap / 2, y - 14, 17 - gap / 2, 30, 5); g.fill();
  if (open > 0.05) {
    g.strokeStyle = color; g.globalAlpha = 0.25 + open * 0.5; g.lineWidth = 2;
    g.beginPath(); g.arc(x, y, 20 + open * 5, 0, Math.PI * 2); g.stroke();
    g.globalAlpha = 1;
  }
}

function gpcr(g, C, x, y, active, color, effect) {
  g.fillStyle = color;
  g.beginPath(); g.roundRect(x - 15, y - 13, 30, 28, 8); g.fill();
  if (active > 0.05) {
    g.globalAlpha = Math.min(1, active + 0.25);
    g.fillStyle = C.dim;
    g.beginPath(); g.ellipse(x, y + 26, 13, 8, 0, 0, Math.PI * 2); g.fill();
    g.strokeStyle = C.dim; g.lineWidth = 2;
    g.beginPath(); g.moveTo(x, y + 34); g.lineTo(x, y + 44); g.stroke();
    g.beginPath(); g.moveTo(x - 4, y + 40); g.lineTo(x, y + 45); g.lineTo(x + 4, y + 40); g.stroke();
    g.font = '11px "IBM Plex Mono", monospace'; g.textAlign = 'center';
    if (effect) { g.fillStyle = color; g.fillText(effect, x, y + 78); }
    g.textAlign = 'left'; g.globalAlpha = 1;
  }
}

function fusionPore(g, C, x, y, k) {
  const r = 15 - 3 * k, mouth = 5 + 20 * k;
  g.save();
  g.beginPath(); g.rect(x - 34, y - 46, 68, 46); g.clip();
  g.beginPath(); g.arc(x, y - r * 0.5, r, 0, Math.PI * 2);
  g.fillStyle = C.vesicle; g.fill();
  g.strokeStyle = C.line; g.lineWidth = 2; g.stroke();
  g.restore();
  g.beginPath();
  g.moveTo(x - mouth / 2, y);
  g.quadraticCurveTo(x, y - 16 * (1 - k) - 2, x + mouth / 2, y);
  g.fillStyle = C.panel; g.fill();
  g.strokeStyle = C.line; g.lineWidth = 2; g.stroke();
}

function transporter(g, C, x, y, color) {
  g.fillStyle = color; g.globalAlpha = .8;
  g.beginPath(); g.roundRect(x - 16, y - 13, 32, 26, 6); g.fill();
  g.globalAlpha = 1;
}

export function synapse(canvas, cfg) {
  const body = document.body;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const g = canvas.getContext('2d');
  canvas.style.aspectRatio = `${W} / ${H}`;
  canvas.width = W * dpr; canvas.height = H * dpr;
  g.scale(dpr, dpr);

  let C = palette(body);
  const recs = cfg.receptors.map((r, i) => ({
    ...r, x: 250 + i * (cfg.receptors.length > 2 ? 86 : 104), open: 0,
  }));
  const pump = cfg.pump ? { ...cfg.pump, x: 250 + recs.length * 86 + 10 } : null;
  const where = cfg.uptake.where;
  const upX = where === 'astro' ? 610 : where === 'cleft' ? 190 : 178;
  const upY = where === 'astro' ? 150 : where === 'cleft' ? 180 : CLEFT_TOP;

  let mols = [], ions = [], cas = [], ret = null;
  let t = 0, last = 0, playing = true, raf = null, phase = -1, speed = 1, pore = 0;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const cap = document.getElementById(cfg.capId);
  const steps = [...document.querySelectorAll('.steps li')];

  const TOTAL = cfg.volume ? 20 : 15;
  function emit(n) {
    for (let i = 0; i < n; i++)
      mols.push({ x: 340 + rnd(-6, 6), y: CLEFT_TOP + 6, vx: rnd(-1.6, 1.6), vy: rnd(0.6, 1.8), a: 1, held: 0, gone: 0 });
  }
  function release() { emit(TOTAL); }

  function reset() {
    mols = []; ions = []; cas = []; ret = null;
    recs.forEach(r => (r.open = 0));
  }

  function stepMolecules(dt) {
    for (const m of mols) {
      if (m.gone) { m.a = Math.max(0, m.a - dt / 260); continue; }
      if (m.held > 0) { m.held -= dt; if (m.held <= 0) { m.vy = -0.4; m.vx = rnd(-1, 1); } continue; }
      m.x += m.vx * dt / 16; m.y += m.vy * dt / 16;
      m.vx += rnd(-0.12, 0.12); m.vy += rnd(-0.1, 0.1);
      m.vx = clamp(m.vx, -2.2, 2.2); m.vy = clamp(m.vy, -1.6, 1.8);
      const lo = cfg.volume ? 120 : 210, hi = cfg.volume ? 870 : 500;
      if (m.x < lo || m.x > hi) m.vx *= -1;
      if (m.y < CLEFT_TOP + 4) { m.y = CLEFT_TOP + 4; m.vy = Math.abs(m.vy); }
      if (m.y > CLEFT_BOTTOM - 4) { m.y = CLEFT_BOTTOM - 4; m.vy = -Math.abs(m.vy); }
      for (const r of recs) {
        if (Math.abs(m.x - r.x) < 16 && m.y > CLEFT_BOTTOM - 14) {
          m.held = 900; m.x = r.x; m.y = CLEFT_BOTTOM - 8;
          r.open = Math.min(1, r.open + 0.6);
          if (r.type === 'iono') for (let k = 0; k < 3; k++)
            ions.push({ x: r.x + rnd(-6, 6), y: CLEFT_BOTTOM + 6, a: 1, label: r.ion });
        }
      }
      if (Math.abs(m.x - upX) < 22 && Math.abs(m.y - upY) < 26) {
        m.gone = 1;
        if (cfg.astro) ret = ret || { p: 0 };
      }
    }
    mols = mols.filter(m => m.a > 0.02);
  }

  function draw() {
    g.clearRect(0, 0, W, H);
    g.font = '13px "IBM Plex Sans", sans-serif';

    if (cfg.astro) astrocyte(g, C, cfg.astro.label);
    bouton(g, C);
    spine(g, C);

    g.fillStyle = C.dim;
    g.fillText(cfg.pre, 100, 66);
    g.fillText(cfg.post, 46, 258);
    g.font = '12px "IBM Plex Mono", monospace';
    g.fillText(cfg.synth, 300, 66);

    for (const x of [236, 424]) {
      g.fillStyle = C.mod; g.globalAlpha = .55;
      g.beginPath(); g.roundRect(x - 13, CLEFT_TOP - 13, 26, 24, 5); g.fill();
      g.globalAlpha = 1;
    }

    for (const v of vesicles) {
      if (v.fusing) continue;
      g.beginPath(); g.arc(v.x, v.y, v.r, 0, Math.PI * 2);
      g.fillStyle = C.vesicle; g.fill();
      g.strokeStyle = C.line; g.lineWidth = 2; g.stroke();
      g.fillStyle = C.accent;
      for (const [dx, dy] of CARGO) {
        g.beginPath();
        g.arc(v.x + dx * v.r, v.y + dy * v.r, Math.max(1, v.r * 0.16), 0, Math.PI * 2);
        g.fill();
      }
    }
    g.fillStyle = C.dim;
    g.fillText(cfg.loader, 120, CLEFT_TOP - 16);

    if (pore > 0) fusionPore(g, C, 340, CLEFT_TOP, pore);
    transporter(g, C, upX, upY, where === 'astro' ? C.mod : where === 'cleft' ? C.dim : C.inh);
    g.fillStyle = C.dim;
    g.fillText(cfg.uptake.label, upX + 24, where === 'pre' ? upY + 26 : upY + 4);

    for (const c of cas) {
      g.globalAlpha = c.a; g.fillStyle = C.mod;
      g.beginPath(); g.arc(c.x, c.y, 4, 0, Math.PI * 2); g.fill(); g.globalAlpha = 1;
    }

    for (const r of recs) {
      if (r.type === 'iono') channel(g, C, r.x, CLEFT_BOTTOM, r.open, C.accent);
      else gpcr(g, C, r.x, CLEFT_BOTTOM, r.open, C.accent, r.effect);
      g.font = '13px "IBM Plex Sans", sans-serif';
      g.fillStyle = C.ink; g.textAlign = 'center';
      g.fillText(r.label, r.x, CLEFT_BOTTOM + 60);
      if (r.type === 'iono' && r.open > 0.05 && r.ion) {
        g.font = '11px "IBM Plex Mono", monospace';
        g.fillStyle = C.accent; g.globalAlpha = Math.min(1, r.open + 0.3);
        g.fillText(r.ion, r.x, CLEFT_BOTTOM + 78);
        g.globalAlpha = 1;
      }
      g.textAlign = 'left'; g.font = '13px "IBM Plex Sans", sans-serif';
    }
    if (pump) {
      transporter(g, C, pump.x, CLEFT_BOTTOM, C.mod);
      g.fillStyle = C.ink; g.textAlign = 'center';
      g.fillText(pump.label, pump.x, CLEFT_BOTTOM + 60);
      g.textAlign = 'left';
      g.fillStyle = C.dim; g.textAlign = 'center';
      g.fillText(pump.note, pump.x, CLEFT_BOTTOM + 96);
      g.textAlign = 'left';
    }

    for (const i of ions) {
      g.globalAlpha = i.a; g.fillStyle = C.accent;
      g.beginPath(); g.arc(i.x, i.y, 4, 0, Math.PI * 2); g.fill();
      g.globalAlpha = 1;
    }


    for (const m of mols) {
      g.globalAlpha = m.a; g.fillStyle = C.accent;
      g.beginPath(); g.arc(m.x, m.y, 5, 0, Math.PI * 2); g.fill();
      g.globalAlpha = 1;
    }

    if (ret && cfg.astro) {
      const p = ease(clamp(ret.p, 0, 1));
      const x = 700 - p * 420, y = 70 - Math.sin(p * Math.PI) * 30;
      g.globalAlpha = 1 - Math.max(0, p - 0.85) / 0.15;
      g.fillStyle = C.mod;
      g.beginPath(); g.arc(x, y, 6, 0, Math.PI * 2); g.fill();
      g.fillStyle = C.dim; g.font = '12px "IBM Plex Mono", monospace';
      g.fillText(cfg.astro.cycle, x + 12, y + 4);
      g.globalAlpha = 1;
    }

    if (cfg.volume) {
      g.fillStyle = C.dim; g.font = '12px "IBM Plex Mono", monospace';
      g.fillText('volume transmission', 640, 196);
    }
  }

  const HOME = [[168, 98], [210, 84], [252, 104], [294, 94], [186, 108], [236, 116]];
  let vesicles = [], dock = null, fused = false;
  function freeSlot() {
    const open = HOME.filter(([x, y]) => !vesicles.some(v => Math.abs(v.x - x) < 26 && Math.abs(v.y - y) < 26));
    const [x, y] = open.length ? open[Math.floor(Math.random() * open.length)] : HOME[0];
    return { x, y, r: 15 };
  }
  function layoutVesicles() {
    vesicles = HOME.slice(0, 4).map(([x, y]) => ({ x, y, r: 15 }));
    dock = null; fused = false;
  }
  layoutVesicles();

  function frame(now) {
    if (!last) last = now;
    let dt = Math.min(50, now - last) / speed; last = now;
    if (playing) t = (t + dt) % CYCLE;

    pore = 0;
    if (t < 1500) {
      if (!dock && vesicles.length) {
        dock = vesicles[vesicles.length - 1];
        dock.sx = dock.x; dock.sy = dock.y;
      }
      fused = false;
    }
    if (dock) {
      if (t >= 1500 && t < 2000) {
        const p = ease(clamp((t - 1500) / 500, 0, 1));
        dock.x = dock.sx + (340 - dock.sx) * p;
        dock.y = dock.sy + (134 - dock.sy) * p;
        dock.fusing = false;
      } else if (t >= 2000 && t < 2900) {
        dock.fusing = true;
        pore = clamp((t - 2000) / 700, 0, 1);
        const want = Math.round(clamp((t - 2050) / 600, 0, 1) * TOTAL);
        if (mols.length < want) emit(want - mols.length);
      } else if (t >= 2900 && !fused) {
        vesicles = vesicles.filter(v => v !== dock);
        vesicles.unshift(freeSlot());
        dock = null; fused = true;
      }
    }

    if (t > 1400 && t < 2100 && cas.length < 10 && Math.random() < 0.25)
      for (const x of [236, 424]) cas.push({ x: x + rnd(-6, 6), y: CLEFT_TOP - 12, a: 1 });
    for (const c of cas) { c.y -= dt / 22; c.a -= dt / 900; }
    cas = cas.filter(c => c.a > 0.05);

    if (t < 1000) reset();
    stepMolecules(dt);
    for (const r of recs) r.open = Math.max(0, r.open - dt / (r.type === 'iono' ? 700 : 1400));
    for (const i of ions) { i.y += dt / 14; i.a -= dt / 700; }
    ions = ions.filter(i => i.a > 0.05);
    if (ret) ret.p += dt / 1400;

    let ph = 0;
    for (let i = 0; i < PHASES.length; i++) if (t >= PHASES[i].t) ph = i;
    if (ph !== phase) {
      phase = ph;
      if (cap) cap.textContent = PHASES[ph].cap;
      steps.forEach((li, i) => li.classList.toggle('on', i === PHASES[ph].step));
    }

    draw();
    raf = requestAnimationFrame(frame);
  }

  function start() { playing = true; last = 0; if (!raf) raf = requestAnimationFrame(frame); }
  function stop() { playing = false; }

  const btn = document.getElementById(cfg.playId);
  if (btn) btn.addEventListener('click', () => {
    playing = !playing;
    btn.textContent = playing ? 'Pause' : 'Play';
    if (playing) { last = 0; if (!raf) raf = requestAnimationFrame(frame); }
  });
  const slow = document.getElementById(cfg.slowId);
  if (slow) slow.addEventListener('click', () => {
    speed = speed === 1 ? 3 : 1;
    slow.textContent = speed === 1 ? 'Slow motion' : 'Normal speed';
    slow.setAttribute('aria-pressed', speed !== 1);
  });
  const rep = document.getElementById(cfg.replayId);
  if (rep) rep.addEventListener('click', () => { t = 0; pore = 0; reset(); layoutVesicles(); last = 0; });
  canvas.addEventListener('click', () => btn && btn.click());

  const repaint = () => { C = palette(body); draw(); };
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', repaint);
  new MutationObserver(repaint).observe(document.documentElement,
    { attributes: true, attributeFilter: ['data-theme'] });

  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });

  if (reduce) {
    t = 2600; release(); stepMolecules(400); draw(); playing = false;
    if (btn) btn.textContent = 'Play';
    if (cap) cap.textContent = PHASES[3].cap;
  } else {
    start();
  }
}
