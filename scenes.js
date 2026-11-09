// ===== Word Rain — background scenes =====
// Each scene is drawn with SVG (shapes made in code), so there are no image files to load.

const SCENES = (() => {
  const W = 1600, H = 900;

  // Random numbers that come out the same every time (so the scene doesn't change on reload)
  function seeded(seed) {
    return () => {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function stars(rand, count, maxY, color = "#fff") {
    let out = "";
    for (let i = 0; i < count; i++) {
      const x = rand() * W, y = rand() * maxY, r = 0.6 + rand() * 1.6;
      const delay = (rand() * 4).toFixed(2);
      out += `<circle class="twinkle" style="animation-delay:-${delay}s" cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${r.toFixed(1)}" fill="${color}"/>`;
    }
    return out;
  }

  function svg(inner) {
    return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;
  }

  // ---------- 🌅 Sunset Hills ----------
  function sunset() {
    const rand = seeded(7);
    const birds = [[420, 300], [455, 280], [490, 310], [1240, 220], [1270, 240]]
      .map(([x, y]) => `<path d="M${x} ${y} q8 -8 16 0 q8 -8 16 0" stroke="#3a1046" stroke-width="3" fill="none" stroke-linecap="round"/>`)
      .join("");
    return svg(`
      <defs>
        <linearGradient id="ss-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0"    stop-color="#1a0b3d"/>
          <stop offset="0.4"  stop-color="#5b1a6e"/>
          <stop offset="0.65" stop-color="#d9457f"/>
          <stop offset="0.82" stop-color="#ff9a5a"/>
          <stop offset="1"    stop-color="#ffd27f"/>
        </linearGradient>
        <radialGradient id="ss-glow">
          <stop offset="0"   stop-color="#fff1c4" stop-opacity="0.95"/>
          <stop offset="0.35" stop-color="#ffb070" stop-opacity="0.45"/>
          <stop offset="1"   stop-color="#ff7a7a" stop-opacity="0"/>
        </radialGradient>
        <linearGradient id="ss-sun" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#fff4c9"/>
          <stop offset="1" stop-color="#ffb35c"/>
        </linearGradient>
      </defs>
      <rect width="${W}" height="${H}" fill="url(#ss-sky)"/>
      ${stars(rand, 70, 300)}
      <circle class="pulse" cx="1080" cy="640" r="340" fill="url(#ss-glow)"/>
      <circle cx="1080" cy="640" r="120" fill="url(#ss-sun)"/>
      <g class="drift" fill="#ffc4d6" opacity="0.28">
        <ellipse cx="250" cy="330" rx="170" ry="26"/>
        <ellipse cx="360" cy="352" rx="120" ry="18"/>
        <ellipse cx="900" cy="250" rx="210" ry="22"/>
        <ellipse cx="1400" cy="390" rx="160" ry="20"/>
        <ellipse cx="1900" cy="300" rx="190" ry="24"/>
      </g>
      ${birds}
      <path fill="#a8397a" d="M0 650 Q200 570 400 630 T800 610 T1200 640 T1600 595 V900 H0Z"/>
      <path fill="#702066" d="M0 715 Q250 630 520 700 T1040 690 T1600 665 V900 H0Z"/>
      <path fill="#3d1049" d="M0 790 Q300 705 660 780 T1320 770 T1600 745 V900 H0Z"/>
    `);
  }

  // ---------- 🌃 Neon City ----------
  function neon() {
    const rand = seeded(42);

    // Sun with stripes (retro style)
    let stripes = "";
    for (let i = 0; i < 7; i++) {
      const y = 560 + i * 26, h = 4 + i * 2.2;
      stripes += `<rect x="560" y="${y}" width="480" height="${h}" fill="#1a0533"/>`;
    }

    // Buildings: a back row and a front row with lit windows
    function row(color, minH, maxH, windows) {
      let out = "", x = -20;
      while (x < W + 20) {
        const w = 50 + rand() * 80, h = minH + rand() * (maxH - minH);
        out += `<rect x="${x.toFixed(0)}" y="${(H - h).toFixed(0)}" width="${w.toFixed(0)}" height="${h.toFixed(0)}" fill="${color}"/>`;
        if (rand() < 0.3) {
          out += `<rect x="${(x + w / 2 - 2).toFixed(0)}" y="${(H - h - 40).toFixed(0)}" width="4" height="40" fill="${color}"/>`;
          out += `<circle class="twinkle" cx="${(x + w / 2).toFixed(0)}" cy="${(H - h - 42).toFixed(0)}" r="4" fill="#ff3864"/>`;
        }
        if (windows) {
          for (let wy = H - h + 16; wy < H - 20; wy += 22) {
            for (let wx = x + 10; wx < x + w - 14; wx += 16) {
              if (rand() < 0.38) {
                const c = rand() < 0.6 ? "#ffd166" : "#5ef2ff";
                out += `<rect x="${wx.toFixed(0)}" y="${wy.toFixed(0)}" width="7" height="10" fill="${c}" opacity="${(0.5 + rand() * 0.5).toFixed(2)}"/>`;
              }
            }
          }
        }
        x += w + 4;
      }
      return out;
    }

    return svg(`
      <defs>
        <linearGradient id="nc-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0"   stop-color="#0d0221"/>
          <stop offset="0.45" stop-color="#2b0f54"/>
          <stop offset="0.75" stop-color="#7a1f6b"/>
          <stop offset="1"   stop-color="#ff3864"/>
        </linearGradient>
        <linearGradient id="nc-sun" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0"   stop-color="#ffe66d"/>
          <stop offset="0.55" stop-color="#ff8e53"/>
          <stop offset="1"   stop-color="#ff2e88"/>
        </linearGradient>
        <radialGradient id="nc-glow">
          <stop offset="0" stop-color="#ff2e88" stop-opacity="0.55"/>
          <stop offset="1" stop-color="#ff2e88" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="${W}" height="${H}" fill="url(#nc-sky)"/>
      ${stars(rand, 110, 450)}
      <circle class="pulse" cx="800" cy="560" r="380" fill="url(#nc-glow)"/>
      <circle cx="800" cy="560" r="220" fill="url(#nc-sun)"/>
      ${stripes}
      <g opacity="0.95">${row("#3a1466", 260, 520, false)}</g>
      ${row("#0b0118", 140, 380, true)}
    `);
  }

  // ---------- 🌲 Misty Forest ----------
  function forest() {
    const rand = seeded(99);

    function pines(base, minH, maxH, color, step) {
      let out = `<rect x="0" y="${base}" width="${W}" height="${H - base}" fill="${color}"/>`;
      for (let x = -30; x < W + 30; x += step * (0.6 + rand() * 0.8)) {
        const h = minH + rand() * (maxH - minH), w = h * 0.42;
        const pts = (top, half, bottom) =>
          `${x.toFixed(0)},${top.toFixed(0)} ${(x - half).toFixed(0)},${bottom.toFixed(0)} ${(x + half).toFixed(0)},${bottom.toFixed(0)}`;
        out += `<polygon fill="${color}" points="${pts(base - h, w / 2, base + 2)}"/>`;
        out += `<polygon fill="${color}" points="${pts(base - h * 0.75, w * 0.62, base - h * 0.25)}"/>`;
      }
      return out;
    }

    let flies = "";
    for (let i = 0; i < 26; i++) {
      const x = rand() * W, y = 560 + rand() * 300, d = (rand() * 6).toFixed(2);
      flies += `<circle class="firefly" style="animation-delay:-${d}s" cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="2.6" fill="#f6ff8a"/>`;
    }

    return svg(`
      <defs>
        <linearGradient id="fo-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0"   stop-color="#071e2b"/>
          <stop offset="0.5" stop-color="#14505a"/>
          <stop offset="0.85" stop-color="#4d9a8a"/>
          <stop offset="1"   stop-color="#9fd3b5"/>
        </linearGradient>
        <radialGradient id="fo-glow">
          <stop offset="0" stop-color="#f4ffe8" stop-opacity="0.7"/>
          <stop offset="1" stop-color="#f4ffe8" stop-opacity="0"/>
        </radialGradient>
        <linearGradient id="fo-mist" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#d8fff0" stop-opacity="0"/>
          <stop offset="1" stop-color="#d8fff0" stop-opacity="0.35"/>
        </linearGradient>
      </defs>
      <rect width="${W}" height="${H}" fill="url(#fo-sky)"/>
      ${stars(rand, 80, 380, "#eafff6")}
      <circle class="pulse" cx="340" cy="190" r="190" fill="url(#fo-glow)"/>
      <circle cx="340" cy="190" r="62" fill="#f4ffe8"/>
      <circle cx="322" cy="176" r="10" fill="#dfeedd"/>
      <circle cx="356" cy="208" r="7" fill="#dfeedd"/>
      ${pines(690, 120, 220, "#2c6b67", 46)}
      <rect class="drift" x="-200" y="600" width="2000" height="140" fill="url(#fo-mist)"/>
      ${pines(780, 150, 260, "#1a4747", 58)}
      ${pines(900, 200, 340, "#0b2528", 74)}
      ${flies}
    `);
  }

  return {
    sunset: { label: "🌅 Sunset", draw: sunset },
    neon:   { label: "🌃 Neon City", draw: neon },
    forest: { label: "🌲 Forest", draw: forest }
  };
})();
