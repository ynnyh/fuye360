import.meta.env = {"ASSETS_PREFIX": undefined, "BASE_URL": "/fuye360", "DEV": true, "MODE": "development", "PROD": false, "SITE": "https://ynnyh.github.io/fuye360", "SSR": false};const shops = JSON.parse(
  document.getElementById("street-data").textContent ?? "[]"
);
const canvas = document.getElementById("street");
const ctx = canvas.getContext("2d");
const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;
const KAI = '"Kaiti SC","STKaiti","KaiTi",serif';
const SANS = '"Microsoft YaHei","PingFang SC",sans-serif';
const withBase = (path) => `${(import.meta.env.BASE_URL ?? "").replace(/\/$/, "")}${path}`;
const H = 720;
const GROUND = 610;
const SHOP_W = 360;
const STREET_X0 = 300;
const WORLD_W = STREET_X0 + shops.length * SHOP_W + 380;
const DOOR_OFF = SHOP_W / 2;
const world = { camX: 0, scale: 1, viewW: 0, dpr: 1 };
const player = { x: STREET_X0 + 40, target: STREET_X0 + 40, face: 1, bob: 0, walk: false };
let pendingShop = null;
let seed = 7;
const rnd = () => (seed = seed * 16807 % 2147483647) / 2147483647;
const stars = Array.from({ length: 70 }, () => ({
  x: rnd() * WORLD_W,
  y: 20 + rnd() * 260,
  r: 0.6 + rnd() * 1.1
}));
const stones = Array.from({ length: 220 }, () => ({
  x: rnd() * WORLD_W,
  y: GROUND + 8 + rnd() * 34,
  w: 16 + rnd() * 22
}));
const backHouses = Array.from({ length: Math.ceil(WORLD_W / 150) }, (_, i) => {
  const w = 90 + rnd() * 70;
  return { x: i * 150 + rnd() * 30, w, h: 70 + rnd() * 60 };
});
const LIT_KEY = "fuye360.lit";
const lit = new Set(JSON.parse(localStorage.getItem(LIT_KEY) ?? "[]"));
const litCount = document.getElementById("lit-count");
function refreshLit() {
  litCount.innerHTML = `已点亮 <b>${lit.size}</b>/${shops.length} 家`;
}
refreshLit();
function resize() {
  world.dpr = Math.min(devicePixelRatio || 1, 2);
  canvas.width = innerWidth * world.dpr;
  canvas.height = innerHeight * world.dpr;
  world.scale = innerHeight / H;
  world.viewW = innerWidth / world.scale;
  world.camX = Math.min(world.camX, Math.max(0, WORLD_W - world.viewW));
}
const px = (v) => v * world.scale * world.dpr;
function drawSky(camX, viewW) {
  const right = camX + viewW + 60;
  const sky = ctx.createLinearGradient(0, 0, 0, px(GROUND));
  sky.addColorStop(0, "#1e1832");
  sky.addColorStop(0.45, "#4a2b3a");
  sky.addColorStop(0.78, "#a34e38");
  sky.addColorStop(1, "#e2955a");
  ctx.fillStyle = sky;
  ctx.fillRect(px(camX - 60), 0, px(right - camX + 120), px(GROUND));
  ctx.fillStyle = "#171310";
  ctx.fillRect(px(camX - 60), px(GROUND), px(right - camX + 120), px(H - GROUND + 40));
  for (const s of stars) {
    if (s.x < camX - 20 || s.x > right) continue;
    ctx.fillStyle = "rgba(243,220,184,0.7)";
    ctx.beginPath();
    ctx.arc(px(s.x), px(s.y), px(s.r), 0, 7);
    ctx.fill();
  }
  const mx = WORLD_W * 0.82;
  ctx.fillStyle = "rgba(248,236,210,0.12)";
  ctx.beginPath();
  ctx.arc(px(mx), px(120), px(84), 0, 7);
  ctx.fill();
  ctx.fillStyle = "rgba(248,236,210,0.95)";
  ctx.beginPath();
  ctx.arc(px(mx), px(120), px(38), 0, 7);
  ctx.fill();
}
function drawMountain(baseY, amp, freq, phase, color, camX, viewW) {
  ctx.fillStyle = color;
  ctx.beginPath();
  const x0 = Math.max(0, camX - 80);
  const x1 = camX + viewW + 80;
  ctx.moveTo(px(x0), px(baseY));
  for (let x = x0; x <= x1; x += 26) {
    const y = baseY - Math.abs(Math.sin((x + phase) * freq)) * amp - Math.abs(Math.sin((x + phase) * freq * 2.7)) * amp * 0.35;
    ctx.lineTo(px(x), px(y));
  }
  ctx.lineTo(px(x1), px(H));
  ctx.lineTo(px(x0), px(H));
  ctx.closePath();
  ctx.fill();
}
function drawBackHouses(camX, viewW) {
  ctx.fillStyle = "#261d2b";
  for (const b of backHouses) {
    if (b.x + b.w < camX - 40 || b.x > camX + viewW + 40) continue;
    const y = 560 - b.h;
    ctx.fillRect(px(b.x), px(y), px(b.w), px(b.h + 55));
    ctx.beginPath();
    ctx.moveTo(px(b.x - 8), px(y));
    ctx.lineTo(px(b.x + b.w / 2), px(y - 24));
    ctx.lineTo(px(b.x + b.w + 8), px(y));
    ctx.closePath();
    ctx.fill();
  }
}
function drawStreet(camX, viewW) {
  ctx.fillStyle = "#2c2523";
  ctx.fillRect(px(camX - 60), px(GROUND), px(viewW + 120), px(46));
  ctx.fillStyle = "#241e1d";
  for (const s of stones) {
    if (s.x < camX - 40 || s.x > camX + viewW + 40) continue;
    ctx.beginPath();
    ctx.ellipse(px(s.x), px(s.y), px(s.w / 2), px(6), 0, 0, 7);
    ctx.fill();
  }
}
function drawLantern(g, x, y, on) {
  g.strokeStyle = "#1c1418";
  g.lineWidth = px(3);
  g.beginPath();
  g.moveTo(px(x), px(y - 18));
  g.lineTo(px(x), px(y - 6));
  g.stroke();
  g.fillStyle = on ? "#ff9a3c" : "#6b3f33";
  g.beginPath();
  g.ellipse(px(x), px(y + 8), px(17), px(20), 0, 0, 7);
  g.fill();
  g.strokeStyle = "rgba(28,20,24,0.8)";
  g.lineWidth = px(2);
  g.beginPath();
  g.ellipse(px(x), px(y + 8), px(17), px(20), 0, 0, 7);
  g.stroke();
  g.fillStyle = "#1c1418";
  g.fillRect(px(x - 8), px(y - 14), px(16), px(6));
  g.fillRect(px(x - 6), px(y + 26), px(12), px(5));
}
function drawArchway() {
  const ax = 60;
  ctx.fillStyle = "#221820";
  ctx.fillRect(px(ax), px(280), px(20), px(GROUND - 280));
  ctx.fillRect(px(ax + 150), px(280), px(20), px(GROUND - 280));
  ctx.fillRect(px(ax - 14), px(280), px(198), px(20));
  ctx.beginPath();
  ctx.moveTo(px(ax - 30), px(282));
  ctx.quadraticCurveTo(px(ax + 95), px(214), px(ax + 220), px(282));
  ctx.lineTo(px(ax + 220), px(268));
  ctx.quadraticCurveTo(px(ax + 95), px(198), px(ax - 30), px(268));
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#8f3a2e";
  ctx.fillRect(px(ax + 60), px(296), px(52), px(124));
  ctx.fillStyle = "#f6ecd8";
  ctx.font = `700 ${px(26)}px ${KAI}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  "副业街".split("").forEach((ch, ci) => ctx.fillText(ch, px(ax + 86), px(316 + ci * 36)));
}
function drawShop(shop, i, now) {
  const sx = STREET_X0 + i * SHOP_W;
  const on = lit.has(shop.id);
  const alt = i % 2 === 0;
  ctx.fillStyle = alt ? "#3a2b26" : "#35281f";
  ctx.fillRect(px(sx + 6), px(300), px(SHOP_W - 12), px(GROUND - 300));
  ctx.fillStyle = on ? "rgba(255,170,90,0.16)" : "rgba(255,170,90,0.05)";
  ctx.fillRect(px(sx + 6), px(300), px(SHOP_W - 12), px(GROUND - 300));
  ctx.fillStyle = "#221820";
  ctx.beginPath();
  ctx.moveTo(px(sx - 26), px(312));
  ctx.quadraticCurveTo(px(sx + SHOP_W / 2), px(224), px(sx + SHOP_W + 26), px(312));
  ctx.lineTo(px(sx + SHOP_W + 26), px(300));
  ctx.quadraticCurveTo(px(sx + SHOP_W + 6), px(282), px(sx + SHOP_W / 2), px(280));
  ctx.quadraticCurveTo(px(sx + 6), px(282), px(sx - 26), px(300));
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#1c1418";
  ctx.fillRect(px(sx + 22), px(300), px(14), px(GROUND - 300));
  ctx.fillRect(px(sx + SHOP_W - 36), px(300), px(14), px(GROUND - 300));
  ctx.fillStyle = on ? "#ffca7a" : "#57402f";
  ctx.fillRect(px(sx + 58), px(360), px(72), px(64));
  ctx.fillRect(px(sx + SHOP_W - 130), px(360), px(72), px(64));
  ctx.strokeStyle = "#1c1418";
  ctx.lineWidth = px(5);
  ctx.strokeRect(px(sx + 58), px(360), px(72), px(64));
  ctx.strokeRect(px(sx + SHOP_W - 130), px(360), px(72), px(64));
  ctx.beginPath();
  ctx.moveTo(px(sx + 94), px(360));
  ctx.lineTo(px(sx + 94), px(424));
  ctx.moveTo(px(sx + SHOP_W - 94), px(360));
  ctx.lineTo(px(sx + SHOP_W - 94), px(424));
  ctx.stroke();
  ctx.fillStyle = "#151011";
  ctx.beginPath();
  ctx.moveTo(px(sx + DOOR_OFF - 46), px(GROUND));
  ctx.lineTo(px(sx + DOOR_OFF - 46), px(474));
  ctx.quadraticCurveTo(px(sx + DOOR_OFF), px(446), px(sx + DOOR_OFF + 46), px(474));
  ctx.lineTo(px(sx + DOOR_OFF + 46), px(GROUND));
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#1e1618";
  ctx.fillRect(px(sx + DOOR_OFF - 54), px(GROUND - 6), px(108), px(10));
  if (alt) {
    ctx.fillStyle = "#4a3324";
    ctx.fillRect(px(sx + 46), px(GROUND - 44), px(44), px(44));
    ctx.fillStyle = "#5c4433";
    ctx.fillRect(px(sx + 42), px(GROUND - 52), px(52), px(12));
  } else {
    ctx.fillStyle = "#4a3324";
    ctx.beginPath();
    ctx.ellipse(px(sx + SHOP_W - 74), px(GROUND - 20), px(30), px(20), 0, 0, 7);
    ctx.fill();
    ctx.fillStyle = "#5c4433";
    ctx.beginPath();
    ctx.ellipse(px(sx + SHOP_W - 74), px(GROUND - 40), px(22), px(8), 0, 0, 7);
    ctx.fill();
  }
  const poleX = sx + SHOP_W - 52;
  ctx.strokeStyle = "#1c1418";
  ctx.lineWidth = px(6);
  ctx.beginPath();
  ctx.moveTo(px(poleX), px(316));
  ctx.lineTo(px(poleX), px(232));
  ctx.stroke();
  const flutter = REDUCED ? 0 : Math.sin(now / 700 + i) * 3;
  ctx.fillStyle = on ? "#c0392b" : "#8f3a2e";
  ctx.fillRect(px(poleX + 2 + flutter * 0.3), px(232), px(46), px(150));
  ctx.fillStyle = "#f6ecd8";
  ctx.font = `700 ${px(30)}px ${KAI}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  shop.sign.slice(0, 4).split("").forEach((ch, ci) => {
    ctx.fillText(ch, px(poleX + 25 + flutter * 0.3), px(260 + ci * 36));
  });
  drawLantern(ctx, sx + 96, 330, on);
  drawLantern(ctx, sx + SHOP_W - 128, 330, on);
}
function drawGate() {
  const ex = WORLD_W - 220;
  ctx.fillStyle = "#241a24";
  ctx.fillRect(px(ex), px(320), px(200), px(GROUND - 320));
  ctx.fillStyle = "#120d12";
  ctx.beginPath();
  ctx.moveTo(px(ex + 50), px(GROUND));
  ctx.lineTo(px(ex + 50), px(480));
  ctx.quadraticCurveTo(px(ex + 100), px(430), px(ex + 150), px(480));
  ctx.lineTo(px(ex + 150), px(GROUND));
  ctx.closePath();
  ctx.fill();
}
function drawPerson(x, groundY, scale, face, phase, walking, sash, hat) {
  const bob = REDUCED ? 0 : (walking ? Math.abs(Math.sin(phase)) * 4 : 0) * scale;
  const y = groundY - bob;
  ctx.save();
  ctx.translate(px(x), px(y));
  ctx.scale(px(scale) * face, px(scale));
  ctx.fillStyle = "#171116";
  const legSwing = walking && !REDUCED ? Math.sin(phase * 2) * 6 : 0;
  ctx.fillRect(-10 + legSwing, -26, 8, 26);
  ctx.fillRect(2 - legSwing, -26, 8, 26);
  ctx.fillStyle = "#241a22";
  ctx.beginPath();
  ctx.moveTo(-14, -26);
  ctx.lineTo(14, -26);
  ctx.lineTo(20, -74);
  ctx.lineTo(-20, -74);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = sash;
  ctx.fillRect(-18, -56, 36, 8);
  ctx.fillStyle = "#2e2226";
  ctx.beginPath();
  ctx.arc(0, -86, 12, 0, 7);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, -100, 5, 0, 7);
  ctx.fill();
  if (hat) {
    ctx.fillStyle = "#8f6a3a";
    ctx.beginPath();
    ctx.moveTo(-22, -92);
    ctx.lineTo(0, -108);
    ctx.lineTo(22, -92);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}
const npcs = [0, 1, 2, 3].map((i) => ({
  x: STREET_X0 + 160 + i * SHOP_W * 2.4,
  dir: i % 2 === 0 ? 1 : -1,
  speed: 26 + i * 7,
  phase: i * 1.7,
  sash: ["#c0392b", "#d68a2e", "#4a6b5a", "#7a4a6b"][i]
}));
function glow(x, y, r) {
  const grad = ctx.createRadialGradient(px(x), px(y), 0, px(x), px(y), px(r));
  grad.addColorStop(0, "rgba(255,170,80,0.5)");
  grad.addColorStop(1, "rgba(255,170,80,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(px(x - r), px(y - r), px(r * 2), px(r * 2));
}
function roundRectPath(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(px(x + r), px(y));
  ctx.arcTo(px(x + w), px(y), px(x + w), px(y + h), px(r));
  ctx.arcTo(px(x + w), px(y + h), px(x), px(y + h), px(r));
  ctx.arcTo(px(x), px(y + h), px(x), px(y), px(r));
  ctx.arcTo(px(x), px(y), px(x + w), px(y), px(r));
  ctx.closePath();
}
function bubble(x, y, text) {
  ctx.font = `600 ${px(20)}px ${SANS}`;
  const w = ctx.measureText(text).width + 34;
  ctx.fillStyle = "rgba(20,14,26,0.78)";
  roundRectPath(x - w / 2, y - 26, w, 40, 10);
  ctx.fill();
  ctx.fillStyle = "#f3dcb8";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, px(x), px(y - 6));
  ctx.beginPath();
  ctx.moveTo(px(x - 7), px(y + 14));
  ctx.lineTo(px(x + 7), px(y + 14));
  ctx.lineTo(px(x), px(y + 24));
  ctx.closePath();
  ctx.fill();
}
function nearestShop() {
  let best = null;
  let bestD = 130;
  shops.forEach((shop, i) => {
    const d = Math.abs(player.x - (STREET_X0 + i * SHOP_W + DOOR_OFF));
    if (d < bestD) {
      bestD = d;
      best = shop;
    }
  });
  return best;
}
const dialog = document.getElementById("dialog");
let dialogOpen = false;
function openDialog(shop) {
  document.getElementById("dlg-sign").textContent = `${shop.sign} · ${shop.id}铺`;
  document.getElementById("dlg-keeper").textContent = shop.keeper;
  document.getElementById("dlg-greeting").textContent = shop.greeting;
  const box = document.getElementById("dlg-cards");
  box.innerHTML = "";
  if (shop.cards.length === 0) {
    box.innerHTML = `
        <div class="recruit-note">
          <span class="kai">本铺秘籍征稿中</span>
          你正好懂「${shop.id}」这行？拆成一本秘籍投来，署你的名，灯为你亮。
          <p style="margin:10px 0 0;"><a class="btn btn--ghost" href="${withBase("/submit/")}">去投稿 →</a></p>
        </div>`;
  } else {
    for (const c of shop.cards) {
      const a = document.createElement("a");
      a.className = "shop-card";
      a.href = withBase(`/cards/${c.id}/`);
      a.innerHTML = `
          <p class="sc-title">${c.title}</p>
          <p style="margin:0;color:var(--ink-soft);font-size:.88rem;">${c.summary}</p>
          <div class="sc-meta">
            <span class="chip chip--money">${c.income}</span>
            <span class="sc-go">翻阅秘籍 →</span>
          </div>`;
      box.appendChild(a);
    }
  }
  dialog.hidden = false;
  dialogOpen = true;
  document.getElementById("dlg-close")?.focus();
  document.getElementById("street-hint")?.classList.add("gone");
  if (!lit.has(shop.id)) {
    lit.add(shop.id);
    localStorage.setItem(LIT_KEY, JSON.stringify([...lit]));
    refreshLit();
  }
}
function closeDialog() {
  dialog.hidden = true;
  dialogOpen = false;
  pendingShop = null;
}
document.getElementById("dlg-close")?.addEventListener("click", closeDialog);
dialog.addEventListener("click", (e) => {
  if (e.target === dialog) closeDialog();
});
canvas.addEventListener("pointerdown", (e) => {
  const rect = canvas.getBoundingClientRect();
  const wx = world.camX + (e.clientX - rect.left) / world.scale;
  const wy = (e.clientY - rect.top) / world.scale;
  if (dialogOpen) return;
  if (wy > 170 && wy < GROUND + 40) {
    const idx = Math.floor((wx - STREET_X0) / SHOP_W);
    if (idx >= 0 && idx < shops.length && wx < STREET_X0 + shops.length * SHOP_W) {
      pendingShop = shops[idx];
      player.target = STREET_X0 + idx * SHOP_W + DOOR_OFF;
      return;
    }
  }
  pendingShop = null;
  player.target = Math.max(140, Math.min(WORLD_W - 160, wx));
});
addEventListener("keydown", (e) => {
  if (e.key === "Escape" && dialogOpen) {
    closeDialog();
    return;
  }
  if (dialogOpen) return;
  if (e.key === "ArrowLeft" || e.key === "a") {
    pendingShop = null;
    player.target = player.x - 200;
  }
  if (e.key === "ArrowRight" || e.key === "d") {
    pendingShop = null;
    player.target = player.x + 200;
  }
  if (e.key === "Enter" || e.key === "e") {
    const near = nearestShop();
    if (near) {
      try {
        openDialog(near);
      } catch (err) {
        console.error(err);
      }
    }
  }
});
let last = performance.now();
let hintTimer = 0;
function frame(now) {
  try {
    tick(now);
  } catch (err) {
    window.__streetErr = String(err && err.stack || err);
    console.error("frame:", err);
    return;
  }
  requestAnimationFrame(frame);
}
function tick(now) {
  const dt = Math.min(0.05, (now - last) / 1e3);
  last = now;
  const dx = player.target - player.x;
  player.walk = Math.abs(dx) > 4;
  if (player.walk) {
    const step = Math.sign(dx) * 430 * dt;
    player.x += Math.abs(dx) < Math.abs(step) ? dx : step;
    player.face = Math.sign(dx) || player.face;
    player.bob += dt * 14;
  } else if (pendingShop) {
    const shop = pendingShop;
    pendingShop = null;
    try {
      openDialog(shop);
    } catch (err) {
      console.error("openDialog:", err);
    }
  }
  for (const n of npcs) {
    if (!REDUCED) {
      n.x += n.dir * n.speed * dt;
      n.phase += dt * 9;
      if (n.x < STREET_X0 - 60) n.dir = 1;
      if (n.x > WORLD_W - 160) n.dir = -1;
    }
  }
  const targetCam = Math.max(0, Math.min(WORLD_W - world.viewW, player.x - world.viewW * 0.42));
  world.camX += (targetCam - world.camX) * Math.min(1, dt * 6);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.setTransform(px(1), 0, 0, px(1), -px(world.camX), 0);
  drawSky(world.camX, world.viewW);
  drawMountain(435, 90, 8e-3, 0, "#2a2038", world.camX, world.viewW);
  drawMountain(470, 60, 0.013, 400, "#332640", world.camX, world.viewW);
  drawBackHouses(world.camX, world.viewW);
  drawStreet(world.camX, world.viewW);
  drawArchway();
  shops.forEach((shop, i) => drawShop(shop, i, now));
  drawGate();
  const pulse = REDUCED ? 0.85 : Math.sin(now / 420) * 0.12 + 0.88;
  shops.forEach((shop, i) => {
    if (!lit.has(shop.id)) return;
    const sx = STREET_X0 + i * SHOP_W;
    glow(sx + 96, 338, 66 * pulse);
    glow(sx + SHOP_W - 128, 338, 66 * pulse);
    glow(sx + DOOR_OFF, 500, 90 * pulse);
  });
  const sway = REDUCED ? 0 : Math.sin(now / 900) * 8;
  for (let lx = Math.floor(world.camX / 380) * 380; lx < world.camX + world.viewW + 100; lx += 380) {
    const ly = 90 + Math.sin(lx * 0.013 + now / 900) * sway;
    ctx.strokeStyle = "rgba(28,20,24,0.9)";
    ctx.lineWidth = px(3);
    ctx.beginPath();
    ctx.moveTo(px(lx), px(0));
    ctx.lineTo(px(lx), px(ly));
    ctx.stroke();
    drawLantern(ctx, lx, ly, true);
    glow(lx, ly + 8, 44 * pulse);
  }
  for (const n of npcs) drawPerson(n.x, GROUND + 30, 0.8, n.dir, n.phase, true, n.sash, false);
  const near = nearestShop();
  drawPerson(player.x, GROUND + 34, 1, player.face, player.bob, player.walk, "#c0392b", true);
  if (near && !dialogOpen) {
    const sx = STREET_X0 + shops.indexOf(near) * SHOP_W + DOOR_OFF;
    bubble(sx, 430, near.cards.length ? "进店看秘籍" : "征稿中…");
  }
  const vg = ctx.createLinearGradient(0, px(H * 0.55), 0, px(H));
  vg.addColorStop(0, "rgba(10,6,14,0)");
  vg.addColorStop(1, "rgba(10,6,14,0.35)");
  ctx.fillStyle = vg;
  ctx.fillRect(px(world.camX), px(H * 0.55), px(world.viewW), px(H * 0.45));
  hintTimer += dt;
  if (hintTimer > 8) document.getElementById("street-hint")?.classList.add("gone");
  window.__dbg = { x: Math.round(player.x), t: Math.round(player.target), pend: !!pendingShop, cam: Math.round(world.camX), walk: player.walk };
}
const intro = document.getElementById("intro");
if (localStorage.getItem("fuye360.introSeen")) intro.hidden = true;
document.getElementById("intro-go")?.addEventListener("click", () => {
  intro.hidden = true;
  localStorage.setItem("fuye360.introSeen", "1");
});
addEventListener("resize", resize);
resize();
requestAnimationFrame(frame);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluZGV4LmFzdHJvIl0sInNvdXJjZXNDb250ZW50IjpbIi0tLVxuLyoqXG4gKiDlia/kuJrooZcg4oCU4oCUIOWbvemjjuW4guS6leWwj+a4uOaIj+mmlumhteOAglxuICog5aOz77ya5LiA5p2h5Ymq57q4L+earuW9semjjueahOaaruiJsuiAgeihl++8jOWNgeS6jOWutumTuuWtkOWvueW6lOWNgeS6jOS4quihjOW9k++8m1xuICog5qC477ya6L+b5bqX55yL44CM5omL6Im656eY57GN44CN77yM5YaF5a655bCx5piv546p5rOV5Y2h77yI5pWw5o2u5LiOIC9jYXJkcy8g5a6M5YWo5ZCM5rqQ77yJ44CCXG4gKi9cbmltcG9ydCB7IGdldENvbGxlY3Rpb24gfSBmcm9tICdhc3Rybzpjb250ZW50JztcbmltcG9ydCB7IGluZHVzdHJpZXMgfSBmcm9tICcuLi9kYXRhL2luZHVzdHJpZXMnO1xuaW1wb3J0IHsgc2hvcFNraW5zIH0gZnJvbSAnLi4vZGF0YS9zaG9wcyc7XG5pbXBvcnQgeyBTSVRFLCB3aXRoQmFzZSB9IGZyb20gJy4uL2NvbmZpZyc7XG5pbXBvcnQgJy4uL3N0eWxlcy9nbG9iYWwuY3NzJztcblxuY29uc3QgY2FyZHMgPSAoYXdhaXQgZ2V0Q29sbGVjdGlvbignY2FyZHMnKSkuc29ydChcbiAgKGEsIGIpID0+IGIuZGF0YS5wdWJEYXRlLnZhbHVlT2YoKSAtIGEuZGF0YS5wdWJEYXRlLnZhbHVlT2YoKSxcbik7XG5cbmNvbnN0IHNob3BzID0gaW5kdXN0cmllcy5tYXAoKGluZCkgPT4ge1xuICBjb25zdCBsaXN0ID0gY2FyZHMuZmlsdGVyKChjKSA9PiBjLmRhdGEuaW5kdXN0cnkgPT09IGluZC5uYW1lKTtcbiAgY29uc3Qgc2tpbiA9IHNob3BTa2luc1tpbmQubmFtZV07XG4gIHJldHVybiB7XG4gICAgaWQ6IGluZC5uYW1lLFxuICAgIHNpZ246IHNraW4uc2lnbixcbiAgICBrZWVwZXI6IHNraW4ua2VlcGVyLFxuICAgIGdyZWV0aW5nOiBza2luLmdyZWV0aW5nLFxuICAgIGVtb2ppOiBpbmQuZW1vamksXG4gICAgY2FyZHM6IGxpc3QubWFwKChjKSA9PiAoe1xuICAgICAgaWQ6IGMuaWQsXG4gICAgICB0aXRsZTogYy5kYXRhLnRpdGxlLFxuICAgICAgc3VtbWFyeTogYy5kYXRhLnN1bW1hcnksXG4gICAgICBpbmNvbWU6IGMuZGF0YS5pbmNvbWUsXG4gICAgfSkpLFxuICB9O1xufSk7XG4tLS1cblxuPGh0bWwgbGFuZz1cInpoLUNOXCI+XG4gIDxoZWFkPlxuICAgIDxtZXRhIGNoYXJzZXQ9XCJ1dGYtOFwiIC8+XG4gICAgPG1ldGEgbmFtZT1cInZpZXdwb3J0XCIgY29udGVudD1cIndpZHRoPWRldmljZS13aWR0aCwgaW5pdGlhbC1zY2FsZT0xLCB2aWV3cG9ydC1maXQ9Y292ZXJcIiAvPlxuICAgIDx0aXRsZT57U0lURS50aXRsZX08L3RpdGxlPlxuICAgIDxtZXRhIG5hbWU9XCJkZXNjcmlwdGlvblwiIGNvbnRlbnQ9e1NJVEUuZGVzY3JpcHRpb259IC8+XG4gICAgPG1ldGEgbmFtZT1cImtleXdvcmRzXCIgY29udGVudD17U0lURS5rZXl3b3Jkcy5qb2luKCcsJyl9IC8+XG4gICAgPGxpbmsgcmVsPVwiY2Fub25pY2FsXCIgaHJlZj17QXN0cm8uc2l0ZX0gLz5cbiAgICA8bGluayByZWw9XCJpY29uXCIgdHlwZT1cImltYWdlL3N2Zyt4bWxcIiBocmVmPXt3aXRoQmFzZSgnL2Zhdmljb24uc3ZnJyl9IC8+XG4gICAgPG1ldGEgbmFtZT1cInRoZW1lLWNvbG9yXCIgY29udGVudD1cIiMxZTE4MzJcIiAvPlxuICAgIDxtZXRhIHByb3BlcnR5PVwib2c6dHlwZVwiIGNvbnRlbnQ9XCJ3ZWJzaXRlXCIgLz5cbiAgICA8bWV0YSBwcm9wZXJ0eT1cIm9nOnNpdGVfbmFtZVwiIGNvbnRlbnQ9e1NJVEUubmFtZX0gLz5cbiAgICA8bWV0YSBwcm9wZXJ0eT1cIm9nOnRpdGxlXCIgY29udGVudD17U0lURS50aXRsZX0gLz5cbiAgICA8bWV0YSBwcm9wZXJ0eT1cIm9nOmRlc2NyaXB0aW9uXCIgY29udGVudD17U0lURS5kZXNjcmlwdGlvbn0gLz5cbiAgICA8bWV0YSBwcm9wZXJ0eT1cIm9nOmxvY2FsZVwiIGNvbnRlbnQ9XCJ6aF9DTlwiIC8+XG4gICAgPHN0eWxlPlxuICAgICAgLyogLS0tLS0tLS0tLSDluILkupXpobXkuJPlsZ7vvJrlhajlsY/nlLvluIMgKyBIVUQgKyDlr7nor53moYYgLS0tLS0tLS0tLSAqL1xuICAgICAgaHRtbCwgYm9keSB7IGhlaWdodDogMTAwJTsgfVxuICAgICAgYm9keS5zdHJlZXQtYm9keSB7XG4gICAgICAgIG1hcmdpbjogMDtcbiAgICAgICAgb3ZlcmZsb3c6IGhpZGRlbjtcbiAgICAgICAgYmFja2dyb3VuZDogIzFlMTgzMjtcbiAgICAgICAgZm9udC1mYW1pbHk6IHZhcigtLWZvbnQtYm9keSk7XG4gICAgICB9XG4gICAgICAjc3RyZWV0IHsgcG9zaXRpb246IGZpeGVkOyBpbnNldDogMDsgd2lkdGg6IDEwMCU7IGhlaWdodDogMTAwJTsgZGlzcGxheTogYmxvY2s7IGN1cnNvcjogcG9pbnRlcjsgfVxuXG4gICAgICAuaHVkIHtcbiAgICAgICAgcG9zaXRpb246IGZpeGVkOyB0b3A6IDA7IGxlZnQ6IDA7IHJpZ2h0OiAwO1xuICAgICAgICBkaXNwbGF5OiBmbGV4OyBhbGlnbi1pdGVtczogY2VudGVyOyBqdXN0aWZ5LWNvbnRlbnQ6IHNwYWNlLWJldHdlZW47XG4gICAgICAgIHBhZGRpbmc6IDE0cHggMThweDtcbiAgICAgICAgcG9pbnRlci1ldmVudHM6IG5vbmU7XG4gICAgICAgIHotaW5kZXg6IDU7XG4gICAgICB9XG4gICAgICAuaHVkID4gKiB7IHBvaW50ZXItZXZlbnRzOiBhdXRvOyB9XG4gICAgICAuaHVkLWxlZnQgeyBkaXNwbGF5OiBmbGV4OyBhbGlnbi1pdGVtczogY2VudGVyOyBnYXA6IDEycHg7IH1cbiAgICAgIC5odWQgLmxpdC1jb3VudCB7XG4gICAgICAgIGNvbG9yOiAjZjNkY2I4OyBmb250LXNpemU6IDAuOXJlbTtcbiAgICAgICAgYmFja2dyb3VuZDogcmdiYSgyMCwgMTQsIDI2LCAwLjU1KTtcbiAgICAgICAgYm9yZGVyOiAxcHggc29saWQgcmdiYSgyNDMsIDIyMCwgMTg0LCAwLjM1KTtcbiAgICAgICAgYm9yZGVyLXJhZGl1czogOTk5cHg7IHBhZGRpbmc6IDRweCAxNHB4O1xuICAgICAgICBiYWNrZHJvcC1maWx0ZXI6IGJsdXIoMnB4KTtcbiAgICAgIH1cbiAgICAgIC5odWQgLmxpdC1jb3VudCBiIHsgY29sb3I6ICNmZmI0NWM7IGZvbnQtd2VpZ2h0OiA3MDA7IH1cbiAgICAgIC5odWQtbmF2IHsgZGlzcGxheTogZmxleDsgZ2FwOiA2cHg7IH1cbiAgICAgIC5odWQtbmF2IGEge1xuICAgICAgICBjb2xvcjogI2YzZGNiODsgdGV4dC1kZWNvcmF0aW9uOiBub25lOyBmb250LXNpemU6IDAuOTJyZW07XG4gICAgICAgIGJhY2tncm91bmQ6IHJnYmEoMjAsIDE0LCAyNiwgMC41NSk7XG4gICAgICAgIGJvcmRlcjogMXB4IHNvbGlkIHJnYmEoMjQzLCAyMjAsIDE4NCwgMC4zNSk7XG4gICAgICAgIGJvcmRlci1yYWRpdXM6IDk5OXB4OyBwYWRkaW5nOiA1cHggMTRweDtcbiAgICAgICAgdHJhbnNpdGlvbjogYmFja2dyb3VuZCAwLjE1cztcbiAgICAgIH1cbiAgICAgIC5odWQtbmF2IGE6aG92ZXIgeyBiYWNrZ3JvdW5kOiByZ2JhKDE5MCwgNTksIDQzLCAwLjgpOyB9XG5cbiAgICAgIC5zdHJlZXQtaGludCB7XG4gICAgICAgIHBvc2l0aW9uOiBmaXhlZDsgYm90dG9tOiAxOHB4OyBsZWZ0OiA1MCU7IHRyYW5zZm9ybTogdHJhbnNsYXRlWCgtNTAlKTtcbiAgICAgICAgY29sb3I6IHJnYmEoMjQzLCAyMjAsIDE4NCwgMC44NSk7IGZvbnQtc2l6ZTogMC44NXJlbTtcbiAgICAgICAgYmFja2dyb3VuZDogcmdiYSgyMCwgMTQsIDI2LCAwLjU1KTtcbiAgICAgICAgYm9yZGVyOiAxcHggc29saWQgcmdiYSgyNDMsIDIyMCwgMTg0LCAwLjI1KTtcbiAgICAgICAgYm9yZGVyLXJhZGl1czogOTk5cHg7IHBhZGRpbmc6IDZweCAxOHB4O1xuICAgICAgICB6LWluZGV4OiA1OyBwb2ludGVyLWV2ZW50czogbm9uZTtcbiAgICAgICAgdHJhbnNpdGlvbjogb3BhY2l0eSAwLjhzO1xuICAgICAgICB3aGl0ZS1zcGFjZTogbm93cmFwO1xuICAgICAgfVxuICAgICAgLnN0cmVldC1oaW50LmdvbmUgeyBvcGFjaXR5OiAwOyB9XG5cbiAgICAgIC8qIC0tLS0tLS0tLS0g6YGu572p5bGC77yI5byA5Zy6IC8g6L+b5bqX77yJIC0tLS0tLS0tLS0gKi9cbiAgICAgIC52ZWlsIHtcbiAgICAgICAgcG9zaXRpb246IGZpeGVkOyBpbnNldDogMDsgei1pbmRleDogMTA7XG4gICAgICAgIGJhY2tncm91bmQ6IHJnYmEoMTIsIDksIDE4LCAwLjcyKTtcbiAgICAgICAgZGlzcGxheTogZ3JpZDsgcGxhY2UtaXRlbXM6IGNlbnRlcjtcbiAgICAgICAgcGFkZGluZzogMjBweDtcbiAgICAgIH1cbiAgICAgIC52ZWlsW2hpZGRlbl0geyBkaXNwbGF5OiBub25lOyB9XG4gICAgICAucGFwZXItcGFuZWwge1xuICAgICAgICBiYWNrZ3JvdW5kOiB2YXIoLS1wYXBlcik7XG4gICAgICAgIGNvbG9yOiB2YXIoLS1pbmspO1xuICAgICAgICBib3JkZXI6IDEuNXB4IHNvbGlkIHZhcigtLWxpbmUtc3Ryb25nKTtcbiAgICAgICAgYm9yZGVyLXJhZGl1czogMTBweDtcbiAgICAgICAgYm94LXNoYWRvdzogMCAxOHB4IDYwcHggcmdiYSgwLCAwLCAwLCAwLjUpO1xuICAgICAgICBtYXgtd2lkdGg6IDU2MHB4OyB3aWR0aDogMTAwJTtcbiAgICAgICAgbWF4LWhlaWdodDogODZ2aDsgb3ZlcmZsb3cteTogYXV0bztcbiAgICAgICAgcGFkZGluZzogMjZweCAyNnB4IDIycHg7XG4gICAgICAgIHBvc2l0aW9uOiByZWxhdGl2ZTtcbiAgICAgIH1cbiAgICAgIC5pbnRyby1wYW5lbCB7IHRleHQtYWxpZ246IGNlbnRlcjsgfVxuICAgICAgLmludHJvLXRpdGxlIHtcbiAgICAgICAgZm9udC1mYW1pbHk6IHZhcigtLWZvbnQta2FpKTsgZm9udC13ZWlnaHQ6IDcwMDtcbiAgICAgICAgZm9udC1zaXplOiAyLjFyZW07IGxldHRlci1zcGFjaW5nOiA2cHg7IG1hcmdpbjogMTRweCAwIDZweDtcbiAgICAgIH1cbiAgICAgIC5pbnRyby1zdWIgeyBjb2xvcjogdmFyKC0taW5rLXNvZnQpOyBtYXJnaW46IDAgMCAxNHB4OyB9XG4gICAgICAuaW50cm8tbGluZXMgeyB0ZXh0LWFsaWduOiBsZWZ0OyBjb2xvcjogdmFyKC0taW5rLXNvZnQpOyBmb250LXNpemU6IDAuOTVyZW07IGxpbmUtaGVpZ2h0OiAxLjk7IG1hcmdpbjogMCAwIDIwcHg7IH1cbiAgICAgIC5pbnRyby1saW5lcyBwIHsgbWFyZ2luOiA0cHggMDsgfVxuICAgICAgLmludHJvLWxpbmVzIGIgeyBjb2xvcjogdmFyKC0taW5rKTsgfVxuXG4gICAgICAuc2hvcC1oZWFkIHsgZGlzcGxheTogZmxleDsgYWxpZ24taXRlbXM6IGJhc2VsaW5lOyBnYXA6IDEwcHg7IGJvcmRlci1ib3R0b206IDNweCBkb3VibGUgdmFyKC0taW5rKTsgcGFkZGluZy1ib3R0b206IDEwcHg7IGZsZXgtd3JhcDogd3JhcDsgfVxuICAgICAgLnNob3Atc2lnbiB7IGZvbnQtZmFtaWx5OiB2YXIoLS1mb250LWthaSk7IGZvbnQtd2VpZ2h0OiA3MDA7IGZvbnQtc2l6ZTogMS42cmVtOyBsZXR0ZXItc3BhY2luZzogM3B4OyBtYXJnaW46IDA7IH1cbiAgICAgIC5zaG9wLWtlZXBlciB7IGNvbG9yOiB2YXIoLS1waW5lKTsgZm9udC1zaXplOiAwLjlyZW07IH1cbiAgICAgIC5zaG9wLWdyZWV0aW5nIHsgY29sb3I6IHZhcigtLWluay1zb2Z0KTsgZm9udC1zaXplOiAwLjk1cmVtOyBsaW5lLWhlaWdodDogMS44OyBtYXJnaW46IDE0cHggMCAxNnB4OyB9XG4gICAgICAuc2hvcC1jYXJkcyB7IGRpc3BsYXk6IGdyaWQ7IGdhcDogMTBweDsgfVxuICAgICAgLnNob3AtY2FyZCB7XG4gICAgICAgIGRpc3BsYXk6IGJsb2NrOyB0ZXh0LWRlY29yYXRpb246IG5vbmU7IGNvbG9yOiBpbmhlcml0O1xuICAgICAgICBib3JkZXI6IDEuNXB4IHNvbGlkIHZhcigtLWxpbmUtc3Ryb25nKTsgYm9yZGVyLXJhZGl1czogOHB4O1xuICAgICAgICBiYWNrZ3JvdW5kOiB2YXIoLS1wYXBlci1oaSk7IHBhZGRpbmc6IDEycHggMTRweDtcbiAgICAgICAgdHJhbnNpdGlvbjogYm9yZGVyLWNvbG9yIDAuMTVzLCB0cmFuc2Zvcm0gMC4xNXM7XG4gICAgICB9XG4gICAgICAuc2hvcC1jYXJkOmhvdmVyIHsgYm9yZGVyLWNvbG9yOiB2YXIoLS1zZWFsKTsgdHJhbnNmb3JtOiB0cmFuc2xhdGVZKC0ycHgpOyB9XG4gICAgICAuc2hvcC1jYXJkIC5zYy10aXRsZSB7IGZvbnQtd2VpZ2h0OiA3MDA7IGZvbnQtc2l6ZTogMXJlbTsgbWFyZ2luOiAwIDAgM3B4OyB9XG4gICAgICAuc2hvcC1jYXJkOmhvdmVyIC5zYy10aXRsZSB7IGNvbG9yOiB2YXIoLS1zZWFsLWRlZXApOyB9XG4gICAgICAuc2hvcC1jYXJkIC5zYy1tZXRhIHsgZGlzcGxheTogZmxleDsgZ2FwOiA4cHg7IGFsaWduLWl0ZW1zOiBjZW50ZXI7IGZsZXgtd3JhcDogd3JhcDsgbWFyZ2luLXRvcDogNXB4OyB9XG4gICAgICAuc2hvcC1jYXJkIC5zYy1nbyB7IGNvbG9yOiB2YXIoLS1waW5lKTsgZm9udC1zaXplOiAwLjg1cmVtOyBtYXJnaW4tbGVmdDogYXV0bzsgfVxuICAgICAgLnBhbmVsLWNsb3NlIHtcbiAgICAgICAgcG9zaXRpb246IGFic29sdXRlOyB0b3A6IDEycHg7IHJpZ2h0OiAxMnB4O1xuICAgICAgICBmb250OiBpbmhlcml0OyBmb250LXNpemU6IDAuODhyZW07XG4gICAgICAgIGJvcmRlcjogMS41cHggc29saWQgdmFyKC0tbGluZS1zdHJvbmcpOyBib3JkZXItcmFkaXVzOiA5OTlweDtcbiAgICAgICAgYmFja2dyb3VuZDogdmFyKC0tcGFuZWwpOyBjb2xvcjogdmFyKC0taW5rKTtcbiAgICAgICAgcGFkZGluZzogNHB4IDE0cHg7IGN1cnNvcjogcG9pbnRlcjtcbiAgICAgIH1cbiAgICAgIC5wYW5lbC1jbG9zZTpob3ZlciB7IGJvcmRlci1jb2xvcjogdmFyKC0tc2VhbCk7IGNvbG9yOiB2YXIoLS1zZWFsKTsgfVxuICAgICAgLnJlY3J1aXQtbm90ZSB7XG4gICAgICAgIGJvcmRlcjogMS41cHggZGFzaGVkIHZhcigtLWxpbmUtc3Ryb25nKTsgYm9yZGVyLXJhZGl1czogOHB4O1xuICAgICAgICBwYWRkaW5nOiAxOHB4OyB0ZXh0LWFsaWduOiBjZW50ZXI7IGNvbG9yOiB2YXIoLS1pbmstc29mdCk7IGZvbnQtc2l6ZTogMC45NXJlbTtcbiAgICAgIH1cbiAgICAgIC5yZWNydWl0LW5vdGUgLmthaSB7IGRpc3BsYXk6IGJsb2NrOyBmb250LXNpemU6IDEuMnJlbTsgY29sb3I6IHZhcigtLWluayk7IG1hcmdpbi1ib3R0b206IDZweDsgfVxuXG4gICAgICAvKiDml6AgSlMgLyDmkJzntKLlvJXmk47lj6/op4HnmoTmloflrZflsYIgKi9cbiAgICAgIC5zdHJlZXQtZmFsbGJhY2sge1xuICAgICAgICBwb3NpdGlvbjogYWJzb2x1dGU7IHdpZHRoOiAxcHg7IGhlaWdodDogMXB4O1xuICAgICAgICBvdmVyZmxvdzogaGlkZGVuOyBjbGlwLXBhdGg6IGluc2V0KDUwJSk7IHdoaXRlLXNwYWNlOiBub3dyYXA7XG4gICAgICB9XG4gICAgICBAbWVkaWEgKG1heC13aWR0aDogNjIwcHgpIHtcbiAgICAgICAgLmh1ZCB7IHBhZGRpbmc6IDEwcHggMTJweDsgfVxuICAgICAgICAuaHVkIC5zZWFsIHsgZGlzcGxheTogbm9uZTsgfVxuICAgICAgICAucGFwZXItcGFuZWwgeyBwYWRkaW5nOiAyMHB4IDE2cHggMTZweDsgfVxuICAgICAgfVxuICAgIDwvc3R5bGU+XG4gIDwvaGVhZD5cbiAgPGJvZHkgY2xhc3M9XCJzdHJlZXQtYm9keVwiPlxuICAgIDxjYW52YXMgaWQ9XCJzdHJlZXRcIiBhcmlhLWxhYmVsPVwi5Ymv5Lia6KGX77ya5LiA5p2h5Zu96aOO5biC5LqV6ICB6KGX77yM5Y2B5LqM5a626ZO65a2Q5a+55bqU5Y2B5LqM5Liq6KGM5b2TXCI+PC9jYW52YXM+XG5cbiAgICA8ZGl2IGNsYXNzPVwiaHVkXCI+XG4gICAgICA8ZGl2IGNsYXNzPVwiaHVkLWxlZnRcIj5cbiAgICAgICAgPHNwYW4gY2xhc3M9XCJzZWFsIHNlYWwtLXNtXCIgYXJpYS1oaWRkZW49XCJ0cnVlXCI+PHNwYW4gY2xhc3M9XCJzZWFsLWJpZ1wiPuWJr+S4mjwvc3Bhbj48c3BhbiBjbGFzcz1cInNlYWwtbnVtXCI+MzYwPC9zcGFuPjwvc3Bhbj5cbiAgICAgICAgPHNwYW4gY2xhc3M9XCJsaXQtY291bnRcIiBpZD1cImxpdC1jb3VudFwiIGFyaWEtbGl2ZT1cInBvbGl0ZVwiPuW3sueCueS6riA8Yj4wPC9iPi8xMiDlrrY8L3NwYW4+XG4gICAgICA8L2Rpdj5cbiAgICAgIDxuYXYgY2xhc3M9XCJodWQtbmF2XCIgYXJpYS1sYWJlbD1cIuihl+WkluWFpeWPo1wiPlxuICAgICAgICA8YSBocmVmPXt3aXRoQmFzZSgnL2NhcmRzLycpfT7lm77pibQ8L2E+XG4gICAgICAgIDxhIGhyZWY9e3dpdGhCYXNlKCcvc3VibWl0LycpfT7mipXnqL88L2E+XG4gICAgICAgIDxhIGhyZWY9e3dpdGhCYXNlKCcvYWJvdXQvJyl9PuWFs+S6jjwvYT5cbiAgICAgIDwvbmF2PlxuICAgIDwvZGl2PlxuXG4gICAgPGRpdiBjbGFzcz1cInN0cmVldC1oaW50XCIgaWQ9XCJzdHJlZXQtaGludFwiPueCuemTuuWtkOi/m+W6l+eci+enmOexjSDCtyDngrnooZfkuIrotbDot688L2Rpdj5cblxuICAgIDwhLS0g5byA5Zy6IC0tPlxuICAgIDxkaXYgY2xhc3M9XCJ2ZWlsXCIgaWQ9XCJpbnRyb1wiPlxuICAgICAgPGRpdiBjbGFzcz1cInBhcGVyLXBhbmVsIGludHJvLXBhbmVsXCI+XG4gICAgICAgIDxzcGFuIGNsYXNzPVwic2VhbFwiIGFyaWEtaGlkZGVuPVwidHJ1ZVwiPjxzcGFuIGNsYXNzPVwic2VhbC1iaWdcIj7lia/kuJo8L3NwYW4+PHNwYW4gY2xhc3M9XCJzZWFsLW51bVwiPjM2MDwvc3Bhbj48L3NwYW4+XG4gICAgICAgIDxoMSBjbGFzcz1cImludHJvLXRpdGxlXCI+5Ymv5Lia6KGXPC9oMT5cbiAgICAgICAgPHAgY2xhc3M9XCJpbnRyby1zdWJcIj7kuInnmb7lha3ljYHooYzvvIzooYzooYznlKggQUk8L3A+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJpbnRyby1saW5lc1wiPlxuICAgICAgICAgIDxwPui/meaYr+S4gOadoeW4guS6leiAgeihl++8jDxiPuWNgeS6jOWutumTuuWtkO+8jOWvueW6lOWNgeS6jOS4quihjOW9kzwvYj7jgII8L3A+XG4gICAgICAgICAgPHA+5q+P5a626ZO65a2Q6YeM6JeP552A5Yeg5pysPGI+44CM5omL6Im656eY57GN44CNPC9iPuKAlOKAlOaLhua4heS6hueUqCBBSSDlgZrlia/kuJrnmoTlt6XlhbfjgIHmraXpqqTjgIHmiJDmnKzlkozmlLbnm4rvvIznhafnnYDlsLHog73lvIDlt6XjgII8L3A+XG4gICAgICAgICAgPHA+54K56ZO65a2Q6L+b5bqX77yM54K56KGX5LiK6LWw6Lev44CC6YCb6L+H5LiA5a6255qE54Gv77yM5bCx5pu/5L2g54K55Lqu5LiA55uP44CCPC9wPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3M9XCJidG5cIiBpZD1cImludHJvLWdvXCI+6L+b5Z+OPC9idXR0b24+XG4gICAgICA8L2Rpdj5cbiAgICA8L2Rpdj5cblxuICAgIDwhLS0g6L+b5bqXIC0tPlxuICAgIDxkaXYgY2xhc3M9XCJ2ZWlsXCIgaWQ9XCJkaWFsb2dcIiBoaWRkZW4+XG4gICAgICA8ZGl2IGNsYXNzPVwicGFwZXItcGFuZWxcIiByb2xlPVwiZGlhbG9nXCIgYXJpYS1tb2RhbD1cInRydWVcIiBhcmlhLWxhYmVsbGVkYnk9XCJkbGctc2lnblwiPlxuICAgICAgICA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBjbGFzcz1cInBhbmVsLWNsb3NlXCIgaWQ9XCJkbGctY2xvc2VcIj7lh7rpl6g8L2J1dHRvbj5cbiAgICAgICAgPGRpdiBjbGFzcz1cInNob3AtaGVhZFwiPlxuICAgICAgICAgIDxoMiBjbGFzcz1cInNob3Atc2lnblwiIGlkPVwiZGxnLXNpZ25cIj48L2gyPlxuICAgICAgICAgIDxzcGFuIGNsYXNzPVwic2hvcC1rZWVwZXJcIiBpZD1cImRsZy1rZWVwZXJcIj48L3NwYW4+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8cCBjbGFzcz1cInNob3AtZ3JlZXRpbmdcIiBpZD1cImRsZy1ncmVldGluZ1wiPjwvcD5cbiAgICAgICAgPGRpdiBjbGFzcz1cInNob3AtY2FyZHNcIiBpZD1cImRsZy1jYXJkc1wiPjwvZGl2PlxuICAgICAgPC9kaXY+XG4gICAgPC9kaXY+XG5cbiAgICA8IS0tIOaXoCBKUyDml7bnmoTmloflrZflsYLvvIjkuZ/mmK/nu5nmkJzntKLlvJXmk47nnIvnmoTmraPmlofvvIkgLS0+XG4gICAgPGRpdiBjbGFzcz1cInN0cmVldC1mYWxsYmFja1wiPlxuICAgICAgPGgxPntTSVRFLm5hbWV9PC9oMT5cbiAgICAgIDxwPntTSVRFLmRlc2NyaXB0aW9ufTwvcD5cbiAgICAgIDx1bD5cbiAgICAgICAge2NhcmRzLm1hcCgoYykgPT4gKFxuICAgICAgICAgIDxsaT48YSBocmVmPXt3aXRoQmFzZShgL2NhcmRzLyR7Yy5pZH0vYCl9PntjLmRhdGEudGl0bGV9PC9hPjwvbGk+XG4gICAgICAgICkpfVxuICAgICAgPC91bD5cbiAgICAgIDxhIGhyZWY9e3dpdGhCYXNlKCcvY2FyZHMvJyl9Pui/m+WFpeWbvumJtOaooeW8jzwvYT5cbiAgICA8L2Rpdj5cblxuICAgIDxzY3JpcHQgdHlwZT1cImFwcGxpY2F0aW9uL2pzb25cIiBpZD1cInN0cmVldC1kYXRhXCIgc2V0Omh0bWw9e0pTT04uc3RyaW5naWZ5KHNob3BzKX0gLz5cbiAgPC9ib2R5PlxuPC9odG1sPlxuXG48c2NyaXB0PlxuICAvLyA9PT09PT09PT09PT0g5Ymv5Lia6KGX77ya5Ymq57q45pqu6Imy6aOO5qiq54mI5bCP6KGXID09PT09PT09PT09PVxuICBpbnRlcmZhY2UgU2hvcENhcmQgeyBpZDogc3RyaW5nOyB0aXRsZTogc3RyaW5nOyBzdW1tYXJ5OiBzdHJpbmc7IGluY29tZTogc3RyaW5nIH1cbiAgaW50ZXJmYWNlIFNob3Age1xuICAgIGlkOiBzdHJpbmc7IHNpZ246IHN0cmluZzsga2VlcGVyOiBzdHJpbmc7IGdyZWV0aW5nOiBzdHJpbmc7XG4gICAgZW1vamk6IHN0cmluZzsgY2FyZHM6IFNob3BDYXJkW107XG4gIH1cbiAgY29uc3Qgc2hvcHM6IFNob3BbXSA9IEpTT04ucGFyc2UoXG4gICAgKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzdHJlZXQtZGF0YScpIGFzIEhUTUxTY3JpcHRFbGVtZW50KS50ZXh0Q29udGVudCA/PyAnW10nLFxuICApO1xuXG4gIGNvbnN0IGNhbnZhcyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzdHJlZXQnKSBhcyBIVE1MQ2FudmFzRWxlbWVudDtcbiAgY29uc3QgY3R4ID0gY2FudmFzLmdldENvbnRleHQoJzJkJykhO1xuICBjb25zdCBSRURVQ0VEID0gbWF0Y2hNZWRpYSgnKHByZWZlcnMtcmVkdWNlZC1tb3Rpb246IHJlZHVjZSknKS5tYXRjaGVzO1xuICBjb25zdCBLQUkgPSAnXCJLYWl0aSBTQ1wiLFwiU1RLYWl0aVwiLFwiS2FpVGlcIixzZXJpZic7XG4gIGNvbnN0IFNBTlMgPSAnXCJNaWNyb3NvZnQgWWFIZWlcIixcIlBpbmdGYW5nIFNDXCIsc2Fucy1zZXJpZic7XG5cbiAgLy8g5a6i5oi356uv6ISa5pys5YaF6Ieq566XIGJhc2Ug5YmN57yA77yI5pyN5Yqh56uv5qih5p2/55qEIHdpdGhCYXNlIOWcqOi/memHjOS4jeWPr+eUqO+8iVxuICBjb25zdCB3aXRoQmFzZSA9IChwYXRoOiBzdHJpbmcpID0+XG4gICAgYCR7KGltcG9ydC5tZXRhLmVudi5CQVNFX1VSTCA/PyAnJykucmVwbGFjZSgvXFwvJC8sICcnKX0ke3BhdGh9YDtcblxuICAvLyAtLS0tLS0tLS0tIOS4lueVjOW4uOmHjyAtLS0tLS0tLS0tXG4gIGNvbnN0IEggPSA3MjA7ICAgICAgICAgICAgICAgLy8g5LiW55WM6K6+6K6h6auY5bqmXG4gIGNvbnN0IEdST1VORCA9IDYxMDsgICAgICAgICAgLy8g6KGX6Z2iXG4gIGNvbnN0IFNIT1BfVyA9IDM2MDtcbiAgY29uc3QgU1RSRUVUX1gwID0gMzAwOyAgICAgICAvLyDnrKzkuIDlrrbpk7rlrZDnmoTotbfngrnvvIjniYzlnYrkuYvlkI7vvIlcbiAgY29uc3QgV09STERfVyA9IFNUUkVFVF9YMCArIHNob3BzLmxlbmd0aCAqIFNIT1BfVyArIDM4MDtcbiAgY29uc3QgRE9PUl9PRkYgPSBTSE9QX1cgLyAyO1xuXG4gIGNvbnN0IHdvcmxkID0geyBjYW1YOiAwLCBzY2FsZTogMSwgdmlld1c6IDAsIGRwcjogMSB9O1xuICBjb25zdCBwbGF5ZXIgPSB7IHg6IFNUUkVFVF9YMCArIDQwLCB0YXJnZXQ6IFNUUkVFVF9YMCArIDQwLCBmYWNlOiAxLCBib2I6IDAsIHdhbGs6IGZhbHNlIH07XG4gIGxldCBwZW5kaW5nU2hvcDogU2hvcCB8IG51bGwgPSBudWxsO1xuXG4gIC8vIC0tLS0tLS0tLS0g56Gu5a6a5oCn6KOF6aWw5Z2Q5qCH77yI6aKE6K6h566X77yM6YG/5YWN5q+P5bin6ZqP5py677yJIC0tLS0tLS0tLS1cbiAgbGV0IHNlZWQgPSA3O1xuICBjb25zdCBybmQgPSAoKSA9PiAoc2VlZCA9IChzZWVkICogMTY4MDcpICUgMjE0NzQ4MzY0NykgLyAyMTQ3NDgzNjQ3O1xuICBjb25zdCBzdGFycyA9IEFycmF5LmZyb20oeyBsZW5ndGg6IDcwIH0sICgpID0+ICh7XG4gICAgeDogcm5kKCkgKiBXT1JMRF9XLCB5OiAyMCArIHJuZCgpICogMjYwLCByOiAwLjYgKyBybmQoKSAqIDEuMSxcbiAgfSkpO1xuICBjb25zdCBzdG9uZXMgPSBBcnJheS5mcm9tKHsgbGVuZ3RoOiAyMjAgfSwgKCkgPT4gKHtcbiAgICB4OiBybmQoKSAqIFdPUkxEX1csIHk6IEdST1VORCArIDggKyBybmQoKSAqIDM0LCB3OiAxNiArIHJuZCgpICogMjIsXG4gIH0pKTtcbiAgY29uc3QgYmFja0hvdXNlcyA9IEFycmF5LmZyb20oeyBsZW5ndGg6IE1hdGguY2VpbChXT1JMRF9XIC8gMTUwKSB9LCAoXywgaSkgPT4ge1xuICAgIGNvbnN0IHcgPSA5MCArIHJuZCgpICogNzA7XG4gICAgcmV0dXJuIHsgeDogaSAqIDE1MCArIHJuZCgpICogMzAsIHcsIGg6IDcwICsgcm5kKCkgKiA2MCB9O1xuICB9KTtcblxuICAvLyAtLS0tLS0tLS0tIOWtmOahoyAtLS0tLS0tLS0tXG4gIGNvbnN0IExJVF9LRVkgPSAnZnV5ZTM2MC5saXQnO1xuICBjb25zdCBsaXQ6IFNldDxzdHJpbmc+ID0gbmV3IFNldChKU09OLnBhcnNlKGxvY2FsU3RvcmFnZS5nZXRJdGVtKExJVF9LRVkpID8/ICdbXScpKTtcbiAgY29uc3QgbGl0Q291bnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbGl0LWNvdW50JykhO1xuICBmdW5jdGlvbiByZWZyZXNoTGl0KCkge1xuICAgIGxpdENvdW50LmlubmVySFRNTCA9IGDlt7Lngrnkuq4gPGI+JHtsaXQuc2l6ZX08L2I+LyR7c2hvcHMubGVuZ3RofSDlrrZgO1xuICB9XG4gIHJlZnJlc2hMaXQoKTtcblxuICBmdW5jdGlvbiByZXNpemUoKSB7XG4gICAgd29ybGQuZHByID0gTWF0aC5taW4oZGV2aWNlUGl4ZWxSYXRpbyB8fCAxLCAyKTtcbiAgICBjYW52YXMud2lkdGggPSBpbm5lcldpZHRoICogd29ybGQuZHByO1xuICAgIGNhbnZhcy5oZWlnaHQgPSBpbm5lckhlaWdodCAqIHdvcmxkLmRwcjtcbiAgICB3b3JsZC5zY2FsZSA9IGlubmVySGVpZ2h0IC8gSDtcbiAgICB3b3JsZC52aWV3VyA9IGlubmVyV2lkdGggLyB3b3JsZC5zY2FsZTtcbiAgICB3b3JsZC5jYW1YID0gTWF0aC5taW4od29ybGQuY2FtWCwgTWF0aC5tYXgoMCwgV09STERfVyAtIHdvcmxkLnZpZXdXKSk7XG4gIH1cblxuICAvLyDmr4/luKfnmoTkuJbnlYzlnZDmoIcg4oaSIOiuvuWkh+WDj+e0oFxuICBjb25zdCBweCA9ICh2OiBudW1iZXIpID0+IHYgKiB3b3JsZC5zY2FsZSAqIHdvcmxkLmRwcjtcblxuICAvLyAtLS0tLS0tLS0tIOe7mOWItiAtLS0tLS0tLS0tXG4gIGZ1bmN0aW9uIGRyYXdTa3koY2FtWDogbnVtYmVyLCB2aWV3VzogbnVtYmVyKSB7XG4gICAgY29uc3QgcmlnaHQgPSBjYW1YICsgdmlld1cgKyA2MDtcbiAgICBjb25zdCBza3kgPSBjdHguY3JlYXRlTGluZWFyR3JhZGllbnQoMCwgMCwgMCwgcHgoR1JPVU5EKSk7XG4gICAgc2t5LmFkZENvbG9yU3RvcCgwLCAnIzFlMTgzMicpO1xuICAgIHNreS5hZGRDb2xvclN0b3AoMC40NSwgJyM0YTJiM2EnKTtcbiAgICBza3kuYWRkQ29sb3JTdG9wKDAuNzgsICcjYTM0ZTM4Jyk7XG4gICAgc2t5LmFkZENvbG9yU3RvcCgxLCAnI2UyOTU1YScpO1xuICAgIGN0eC5maWxsU3R5bGUgPSBza3k7XG4gICAgY3R4LmZpbGxSZWN0KHB4KGNhbVggLSA2MCksIDAsIHB4KHJpZ2h0IC0gY2FtWCArIDEyMCksIHB4KEdST1VORCkpO1xuICAgIGN0eC5maWxsU3R5bGUgPSAnIzE3MTMxMCc7XG4gICAgY3R4LmZpbGxSZWN0KHB4KGNhbVggLSA2MCksIHB4KEdST1VORCksIHB4KHJpZ2h0IC0gY2FtWCArIDEyMCksIHB4KEggLSBHUk9VTkQgKyA0MCkpO1xuXG4gICAgZm9yIChjb25zdCBzIG9mIHN0YXJzKSB7XG4gICAgICBpZiAocy54IDwgY2FtWCAtIDIwIHx8IHMueCA+IHJpZ2h0KSBjb250aW51ZTtcbiAgICAgIGN0eC5maWxsU3R5bGUgPSAncmdiYSgyNDMsMjIwLDE4NCwwLjcpJztcbiAgICAgIGN0eC5iZWdpblBhdGgoKTsgY3R4LmFyYyhweChzLngpLCBweChzLnkpLCBweChzLnIpLCAwLCA3KTsgY3R4LmZpbGwoKTtcbiAgICB9XG4gICAgLy8g5pyI5LquXG4gICAgY29uc3QgbXggPSBXT1JMRF9XICogMC44MjtcbiAgICBjdHguZmlsbFN0eWxlID0gJ3JnYmEoMjQ4LDIzNiwyMTAsMC4xMiknO1xuICAgIGN0eC5iZWdpblBhdGgoKTsgY3R4LmFyYyhweChteCksIHB4KDEyMCksIHB4KDg0KSwgMCwgNyk7IGN0eC5maWxsKCk7XG4gICAgY3R4LmZpbGxTdHlsZSA9ICdyZ2JhKDI0OCwyMzYsMjEwLDAuOTUpJztcbiAgICBjdHguYmVnaW5QYXRoKCk7IGN0eC5hcmMocHgobXgpLCBweCgxMjApLCBweCgzOCksIDAsIDcpOyBjdHguZmlsbCgpO1xuICB9XG5cbiAgZnVuY3Rpb24gZHJhd01vdW50YWluKGJhc2VZOiBudW1iZXIsIGFtcDogbnVtYmVyLCBmcmVxOiBudW1iZXIsIHBoYXNlOiBudW1iZXIsIGNvbG9yOiBzdHJpbmcsIGNhbVg6IG51bWJlciwgdmlld1c6IG51bWJlcikge1xuICAgIGN0eC5maWxsU3R5bGUgPSBjb2xvcjtcbiAgICBjdHguYmVnaW5QYXRoKCk7XG4gICAgY29uc3QgeDAgPSBNYXRoLm1heCgwLCBjYW1YIC0gODApO1xuICAgIGNvbnN0IHgxID0gY2FtWCArIHZpZXdXICsgODA7XG4gICAgY3R4Lm1vdmVUbyhweCh4MCksIHB4KGJhc2VZKSk7XG4gICAgZm9yIChsZXQgeCA9IHgwOyB4IDw9IHgxOyB4ICs9IDI2KSB7XG4gICAgICBjb25zdCB5ID0gYmFzZVlcbiAgICAgICAgLSBNYXRoLmFicyhNYXRoLnNpbigoeCArIHBoYXNlKSAqIGZyZXEpKSAqIGFtcFxuICAgICAgICAtIE1hdGguYWJzKE1hdGguc2luKCh4ICsgcGhhc2UpICogZnJlcSAqIDIuNykpICogYW1wICogMC4zNTtcbiAgICAgIGN0eC5saW5lVG8ocHgoeCksIHB4KHkpKTtcbiAgICB9XG4gICAgY3R4LmxpbmVUbyhweCh4MSksIHB4KEgpKTtcbiAgICBjdHgubGluZVRvKHB4KHgwKSwgcHgoSCkpO1xuICAgIGN0eC5jbG9zZVBhdGgoKTsgY3R4LmZpbGwoKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGRyYXdCYWNrSG91c2VzKGNhbVg6IG51bWJlciwgdmlld1c6IG51bWJlcikge1xuICAgIGN0eC5maWxsU3R5bGUgPSAnIzI2MWQyYic7XG4gICAgZm9yIChjb25zdCBiIG9mIGJhY2tIb3VzZXMpIHtcbiAgICAgIGlmIChiLnggKyBiLncgPCBjYW1YIC0gNDAgfHwgYi54ID4gY2FtWCArIHZpZXdXICsgNDApIGNvbnRpbnVlO1xuICAgICAgY29uc3QgeSA9IDU2MCAtIGIuaDtcbiAgICAgIGN0eC5maWxsUmVjdChweChiLngpLCBweCh5KSwgcHgoYi53KSwgcHgoYi5oICsgNTUpKTtcbiAgICAgIGN0eC5iZWdpblBhdGgoKTtcbiAgICAgIGN0eC5tb3ZlVG8ocHgoYi54IC0gOCksIHB4KHkpKTtcbiAgICAgIGN0eC5saW5lVG8ocHgoYi54ICsgYi53IC8gMiksIHB4KHkgLSAyNCkpO1xuICAgICAgY3R4LmxpbmVUbyhweChiLnggKyBiLncgKyA4KSwgcHgoeSkpO1xuICAgICAgY3R4LmNsb3NlUGF0aCgpOyBjdHguZmlsbCgpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGRyYXdTdHJlZXQoY2FtWDogbnVtYmVyLCB2aWV3VzogbnVtYmVyKSB7XG4gICAgY3R4LmZpbGxTdHlsZSA9ICcjMmMyNTIzJztcbiAgICBjdHguZmlsbFJlY3QocHgoY2FtWCAtIDYwKSwgcHgoR1JPVU5EKSwgcHgodmlld1cgKyAxMjApLCBweCg0NikpO1xuICAgIGN0eC5maWxsU3R5bGUgPSAnIzI0MWUxZCc7XG4gICAgZm9yIChjb25zdCBzIG9mIHN0b25lcykge1xuICAgICAgaWYgKHMueCA8IGNhbVggLSA0MCB8fCBzLnggPiBjYW1YICsgdmlld1cgKyA0MCkgY29udGludWU7XG4gICAgICBjdHguYmVnaW5QYXRoKCk7XG4gICAgICBjdHguZWxsaXBzZShweChzLngpLCBweChzLnkpLCBweChzLncgLyAyKSwgcHgoNiksIDAsIDAsIDcpO1xuICAgICAgY3R4LmZpbGwoKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBkcmF3TGFudGVybihnOiBDYW52YXNSZW5kZXJpbmdDb250ZXh0MkQsIHg6IG51bWJlciwgeTogbnVtYmVyLCBvbjogYm9vbGVhbikge1xuICAgIGcuc3Ryb2tlU3R5bGUgPSAnIzFjMTQxOCc7IGcubGluZVdpZHRoID0gcHgoMyk7XG4gICAgZy5iZWdpblBhdGgoKTsgZy5tb3ZlVG8ocHgoeCksIHB4KHkgLSAxOCkpOyBnLmxpbmVUbyhweCh4KSwgcHgoeSAtIDYpKTsgZy5zdHJva2UoKTtcbiAgICBnLmZpbGxTdHlsZSA9IG9uID8gJyNmZjlhM2MnIDogJyM2YjNmMzMnO1xuICAgIGcuYmVnaW5QYXRoKCk7IGcuZWxsaXBzZShweCh4KSwgcHgoeSArIDgpLCBweCgxNyksIHB4KDIwKSwgMCwgMCwgNyk7IGcuZmlsbCgpO1xuICAgIGcuc3Ryb2tlU3R5bGUgPSAncmdiYSgyOCwyMCwyNCwwLjgpJzsgZy5saW5lV2lkdGggPSBweCgyKTtcbiAgICBnLmJlZ2luUGF0aCgpOyBnLmVsbGlwc2UocHgoeCksIHB4KHkgKyA4KSwgcHgoMTcpLCBweCgyMCksIDAsIDAsIDcpOyBnLnN0cm9rZSgpO1xuICAgIGcuZmlsbFN0eWxlID0gJyMxYzE0MTgnO1xuICAgIGcuZmlsbFJlY3QocHgoeCAtIDgpLCBweCh5IC0gMTQpLCBweCgxNiksIHB4KDYpKTtcbiAgICBnLmZpbGxSZWN0KHB4KHggLSA2KSwgcHgoeSArIDI2KSwgcHgoMTIpLCBweCg1KSk7XG4gIH1cblxuICBmdW5jdGlvbiBkcmF3QXJjaHdheSgpIHtcbiAgICBjb25zdCBheCA9IDYwO1xuICAgIGN0eC5maWxsU3R5bGUgPSAnIzIyMTgyMCc7XG4gICAgY3R4LmZpbGxSZWN0KHB4KGF4KSwgcHgoMjgwKSwgcHgoMjApLCBweChHUk9VTkQgLSAyODApKTtcbiAgICBjdHguZmlsbFJlY3QocHgoYXggKyAxNTApLCBweCgyODApLCBweCgyMCksIHB4KEdST1VORCAtIDI4MCkpO1xuICAgIGN0eC5maWxsUmVjdChweChheCAtIDE0KSwgcHgoMjgwKSwgcHgoMTk4KSwgcHgoMjApKTtcbiAgICBjdHguYmVnaW5QYXRoKCk7XG4gICAgY3R4Lm1vdmVUbyhweChheCAtIDMwKSwgcHgoMjgyKSk7XG4gICAgY3R4LnF1YWRyYXRpY0N1cnZlVG8ocHgoYXggKyA5NSksIHB4KDIxNCksIHB4KGF4ICsgMjIwKSwgcHgoMjgyKSk7XG4gICAgY3R4LmxpbmVUbyhweChheCArIDIyMCksIHB4KDI2OCkpO1xuICAgIGN0eC5xdWFkcmF0aWNDdXJ2ZVRvKHB4KGF4ICsgOTUpLCBweCgxOTgpLCBweChheCAtIDMwKSwgcHgoMjY4KSk7XG4gICAgY3R4LmNsb3NlUGF0aCgpOyBjdHguZmlsbCgpO1xuICAgIGN0eC5maWxsU3R5bGUgPSAnIzhmM2EyZSc7XG4gICAgY3R4LmZpbGxSZWN0KHB4KGF4ICsgNjApLCBweCgyOTYpLCBweCg1MiksIHB4KDEyNCkpO1xuICAgIGN0eC5maWxsU3R5bGUgPSAnI2Y2ZWNkOCc7XG4gICAgY3R4LmZvbnQgPSBgNzAwICR7cHgoMjYpfXB4ICR7S0FJfWA7XG4gICAgY3R4LnRleHRBbGlnbiA9ICdjZW50ZXInOyBjdHgudGV4dEJhc2VsaW5lID0gJ21pZGRsZSc7XG4gICAgJ+WJr+S4muihlycuc3BsaXQoJycpLmZvckVhY2goKGNoLCBjaSkgPT4gY3R4LmZpbGxUZXh0KGNoLCBweChheCArIDg2KSwgcHgoMzE2ICsgY2kgKiAzNikpKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGRyYXdTaG9wKHNob3A6IFNob3AsIGk6IG51bWJlciwgbm93OiBudW1iZXIpIHtcbiAgICBjb25zdCBzeCA9IFNUUkVFVF9YMCArIGkgKiBTSE9QX1c7XG4gICAgY29uc3Qgb24gPSBsaXQuaGFzKHNob3AuaWQpO1xuICAgIGNvbnN0IGFsdCA9IGkgJSAyID09PSAwO1xuXG4gICAgLy8g5bGL6LqrXG4gICAgY3R4LmZpbGxTdHlsZSA9IGFsdCA/ICcjM2EyYjI2JyA6ICcjMzUyODFmJztcbiAgICBjdHguZmlsbFJlY3QocHgoc3ggKyA2KSwgcHgoMzAwKSwgcHgoU0hPUF9XIC0gMTIpLCBweChHUk9VTkQgLSAzMDApKTtcbiAgICBjdHguZmlsbFN0eWxlID0gb24gPyAncmdiYSgyNTUsMTcwLDkwLDAuMTYpJyA6ICdyZ2JhKDI1NSwxNzAsOTAsMC4wNSknO1xuICAgIGN0eC5maWxsUmVjdChweChzeCArIDYpLCBweCgzMDApLCBweChTSE9QX1cgLSAxMiksIHB4KEdST1VORCAtIDMwMCkpO1xuXG4gICAgLy8g5bGL5qqQXG4gICAgY3R4LmZpbGxTdHlsZSA9ICcjMjIxODIwJztcbiAgICBjdHguYmVnaW5QYXRoKCk7XG4gICAgY3R4Lm1vdmVUbyhweChzeCAtIDI2KSwgcHgoMzEyKSk7XG4gICAgY3R4LnF1YWRyYXRpY0N1cnZlVG8ocHgoc3ggKyBTSE9QX1cgLyAyKSwgcHgoMjI0KSwgcHgoc3ggKyBTSE9QX1cgKyAyNiksIHB4KDMxMikpO1xuICAgIGN0eC5saW5lVG8ocHgoc3ggKyBTSE9QX1cgKyAyNiksIHB4KDMwMCkpO1xuICAgIGN0eC5xdWFkcmF0aWNDdXJ2ZVRvKHB4KHN4ICsgU0hPUF9XICsgNiksIHB4KDI4MiksIHB4KHN4ICsgU0hPUF9XIC8gMiksIHB4KDI4MCkpO1xuICAgIGN0eC5xdWFkcmF0aWNDdXJ2ZVRvKHB4KHN4ICsgNiksIHB4KDI4MiksIHB4KHN4IC0gMjYpLCBweCgzMDApKTtcbiAgICBjdHguY2xvc2VQYXRoKCk7IGN0eC5maWxsKCk7XG5cbiAgICAvLyDmn7FcbiAgICBjdHguZmlsbFN0eWxlID0gJyMxYzE0MTgnO1xuICAgIGN0eC5maWxsUmVjdChweChzeCArIDIyKSwgcHgoMzAwKSwgcHgoMTQpLCBweChHUk9VTkQgLSAzMDApKTtcbiAgICBjdHguZmlsbFJlY3QocHgoc3ggKyBTSE9QX1cgLSAzNiksIHB4KDMwMCksIHB4KDE0KSwgcHgoR1JPVU5EIC0gMzAwKSk7XG5cbiAgICAvLyDnqpdcbiAgICBjdHguZmlsbFN0eWxlID0gb24gPyAnI2ZmY2E3YScgOiAnIzU3NDAyZic7XG4gICAgY3R4LmZpbGxSZWN0KHB4KHN4ICsgNTgpLCBweCgzNjApLCBweCg3MiksIHB4KDY0KSk7XG4gICAgY3R4LmZpbGxSZWN0KHB4KHN4ICsgU0hPUF9XIC0gMTMwKSwgcHgoMzYwKSwgcHgoNzIpLCBweCg2NCkpO1xuICAgIGN0eC5zdHJva2VTdHlsZSA9ICcjMWMxNDE4JzsgY3R4LmxpbmVXaWR0aCA9IHB4KDUpO1xuICAgIGN0eC5zdHJva2VSZWN0KHB4KHN4ICsgNTgpLCBweCgzNjApLCBweCg3MiksIHB4KDY0KSk7XG4gICAgY3R4LnN0cm9rZVJlY3QocHgoc3ggKyBTSE9QX1cgLSAxMzApLCBweCgzNjApLCBweCg3MiksIHB4KDY0KSk7XG4gICAgY3R4LmJlZ2luUGF0aCgpO1xuICAgIGN0eC5tb3ZlVG8ocHgoc3ggKyA5NCksIHB4KDM2MCkpOyBjdHgubGluZVRvKHB4KHN4ICsgOTQpLCBweCg0MjQpKTtcbiAgICBjdHgubW92ZVRvKHB4KHN4ICsgU0hPUF9XIC0gOTQpLCBweCgzNjApKTsgY3R4LmxpbmVUbyhweChzeCArIFNIT1BfVyAtIDk0KSwgcHgoNDI0KSk7XG4gICAgY3R4LnN0cm9rZSgpO1xuXG4gICAgLy8g6ZeoXG4gICAgY3R4LmZpbGxTdHlsZSA9ICcjMTUxMDExJztcbiAgICBjdHguYmVnaW5QYXRoKCk7XG4gICAgY3R4Lm1vdmVUbyhweChzeCArIERPT1JfT0ZGIC0gNDYpLCBweChHUk9VTkQpKTtcbiAgICBjdHgubGluZVRvKHB4KHN4ICsgRE9PUl9PRkYgLSA0NiksIHB4KDQ3NCkpO1xuICAgIGN0eC5xdWFkcmF0aWNDdXJ2ZVRvKHB4KHN4ICsgRE9PUl9PRkYpLCBweCg0NDYpLCBweChzeCArIERPT1JfT0ZGICsgNDYpLCBweCg0NzQpKTtcbiAgICBjdHgubGluZVRvKHB4KHN4ICsgRE9PUl9PRkYgKyA0NiksIHB4KEdST1VORCkpO1xuICAgIGN0eC5jbG9zZVBhdGgoKTsgY3R4LmZpbGwoKTtcblxuICAgIC8vIOmXqOanmyArIOaRiuS9jeadgueJqVxuICAgIGN0eC5maWxsU3R5bGUgPSAnIzFlMTYxOCc7XG4gICAgY3R4LmZpbGxSZWN0KHB4KHN4ICsgRE9PUl9PRkYgLSA1NCksIHB4KEdST1VORCAtIDYpLCBweCgxMDgpLCBweCgxMCkpO1xuICAgIGlmIChhbHQpIHtcbiAgICAgIGN0eC5maWxsU3R5bGUgPSAnIzRhMzMyNCc7XG4gICAgICBjdHguZmlsbFJlY3QocHgoc3ggKyA0NiksIHB4KEdST1VORCAtIDQ0KSwgcHgoNDQpLCBweCg0NCkpO1xuICAgICAgY3R4LmZpbGxTdHlsZSA9ICcjNWM0NDMzJztcbiAgICAgIGN0eC5maWxsUmVjdChweChzeCArIDQyKSwgcHgoR1JPVU5EIC0gNTIpLCBweCg1MiksIHB4KDEyKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGN0eC5maWxsU3R5bGUgPSAnIzRhMzMyNCc7XG4gICAgICBjdHguYmVnaW5QYXRoKCk7IGN0eC5lbGxpcHNlKHB4KHN4ICsgU0hPUF9XIC0gNzQpLCBweChHUk9VTkQgLSAyMCksIHB4KDMwKSwgcHgoMjApLCAwLCAwLCA3KTsgY3R4LmZpbGwoKTtcbiAgICAgIGN0eC5maWxsU3R5bGUgPSAnIzVjNDQzMyc7XG4gICAgICBjdHguYmVnaW5QYXRoKCk7IGN0eC5lbGxpcHNlKHB4KHN4ICsgU0hPUF9XIC0gNzQpLCBweChHUk9VTkQgLSA0MCksIHB4KDIyKSwgcHgoOCksIDAsIDAsIDcpOyBjdHguZmlsbCgpO1xuICAgIH1cblxuICAgIC8vIOmFkuaXl++8iOaLm+eJjO+8iVxuICAgIGNvbnN0IHBvbGVYID0gc3ggKyBTSE9QX1cgLSA1MjtcbiAgICBjdHguc3Ryb2tlU3R5bGUgPSAnIzFjMTQxOCc7IGN0eC5saW5lV2lkdGggPSBweCg2KTtcbiAgICBjdHguYmVnaW5QYXRoKCk7IGN0eC5tb3ZlVG8ocHgocG9sZVgpLCBweCgzMTYpKTsgY3R4LmxpbmVUbyhweChwb2xlWCksIHB4KDIzMikpOyBjdHguc3Ryb2tlKCk7XG4gICAgY29uc3QgZmx1dHRlciA9IFJFRFVDRUQgPyAwIDogTWF0aC5zaW4obm93IC8gNzAwICsgaSkgKiAzO1xuICAgIGN0eC5maWxsU3R5bGUgPSBvbiA/ICcjYzAzOTJiJyA6ICcjOGYzYTJlJztcbiAgICBjdHguZmlsbFJlY3QocHgocG9sZVggKyAyICsgZmx1dHRlciAqIDAuMyksIHB4KDIzMiksIHB4KDQ2KSwgcHgoMTUwKSk7XG4gICAgY3R4LmZpbGxTdHlsZSA9ICcjZjZlY2Q4JztcbiAgICBjdHguZm9udCA9IGA3MDAgJHtweCgzMCl9cHggJHtLQUl9YDtcbiAgICBjdHgudGV4dEFsaWduID0gJ2NlbnRlcic7IGN0eC50ZXh0QmFzZWxpbmUgPSAnbWlkZGxlJztcbiAgICBzaG9wLnNpZ24uc2xpY2UoMCwgNCkuc3BsaXQoJycpLmZvckVhY2goKGNoLCBjaSkgPT4ge1xuICAgICAgY3R4LmZpbGxUZXh0KGNoLCBweChwb2xlWCArIDI1ICsgZmx1dHRlciAqIDAuMyksIHB4KDI2MCArIGNpICogMzYpKTtcbiAgICB9KTtcblxuICAgIC8vIOeBr+esvFxuICAgIGRyYXdMYW50ZXJuKGN0eCwgc3ggKyA5NiwgMzMwLCBvbik7XG4gICAgZHJhd0xhbnRlcm4oY3R4LCBzeCArIFNIT1BfVyAtIDEyOCwgMzMwLCBvbik7XG4gIH1cblxuICBmdW5jdGlvbiBkcmF3R2F0ZSgpIHtcbiAgICBjb25zdCBleCA9IFdPUkxEX1cgLSAyMjA7XG4gICAgY3R4LmZpbGxTdHlsZSA9ICcjMjQxYTI0JztcbiAgICBjdHguZmlsbFJlY3QocHgoZXgpLCBweCgzMjApLCBweCgyMDApLCBweChHUk9VTkQgLSAzMjApKTtcbiAgICBjdHguZmlsbFN0eWxlID0gJyMxMjBkMTInO1xuICAgIGN0eC5iZWdpblBhdGgoKTtcbiAgICBjdHgubW92ZVRvKHB4KGV4ICsgNTApLCBweChHUk9VTkQpKTtcbiAgICBjdHgubGluZVRvKHB4KGV4ICsgNTApLCBweCg0ODApKTtcbiAgICBjdHgucXVhZHJhdGljQ3VydmVUbyhweChleCArIDEwMCksIHB4KDQzMCksIHB4KGV4ICsgMTUwKSwgcHgoNDgwKSk7XG4gICAgY3R4LmxpbmVUbyhweChleCArIDE1MCksIHB4KEdST1VORCkpO1xuICAgIGN0eC5jbG9zZVBhdGgoKTsgY3R4LmZpbGwoKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGRyYXdQZXJzb24oXG4gICAgeDogbnVtYmVyLCBncm91bmRZOiBudW1iZXIsIHNjYWxlOiBudW1iZXIsIGZhY2U6IG51bWJlcixcbiAgICBwaGFzZTogbnVtYmVyLCB3YWxraW5nOiBib29sZWFuLCBzYXNoOiBzdHJpbmcsIGhhdDogYm9vbGVhbixcbiAgKSB7XG4gICAgY29uc3QgYm9iID0gUkVEVUNFRCA/IDAgOiAod2Fsa2luZyA/IE1hdGguYWJzKE1hdGguc2luKHBoYXNlKSkgKiA0IDogMCkgKiBzY2FsZTtcbiAgICBjb25zdCB5ID0gZ3JvdW5kWSAtIGJvYjtcbiAgICBjdHguc2F2ZSgpO1xuICAgIGN0eC50cmFuc2xhdGUocHgoeCksIHB4KHkpKTtcbiAgICBjdHguc2NhbGUocHgoc2NhbGUpICogZmFjZSwgcHgoc2NhbGUpKTtcbiAgICBjdHguZmlsbFN0eWxlID0gJyMxNzExMTYnO1xuICAgIGNvbnN0IGxlZ1N3aW5nID0gd2Fsa2luZyAmJiAhUkVEVUNFRCA/IE1hdGguc2luKHBoYXNlICogMikgKiA2IDogMDtcbiAgICBjdHguZmlsbFJlY3QoLTEwICsgbGVnU3dpbmcsIC0yNiwgOCwgMjYpO1xuICAgIGN0eC5maWxsUmVjdCgyIC0gbGVnU3dpbmcsIC0yNiwgOCwgMjYpO1xuICAgIGN0eC5maWxsU3R5bGUgPSAnIzI0MWEyMic7XG4gICAgY3R4LmJlZ2luUGF0aCgpO1xuICAgIGN0eC5tb3ZlVG8oLTE0LCAtMjYpOyBjdHgubGluZVRvKDE0LCAtMjYpOyBjdHgubGluZVRvKDIwLCAtNzQpOyBjdHgubGluZVRvKC0yMCwgLTc0KTtcbiAgICBjdHguY2xvc2VQYXRoKCk7IGN0eC5maWxsKCk7XG4gICAgY3R4LmZpbGxTdHlsZSA9IHNhc2g7XG4gICAgY3R4LmZpbGxSZWN0KC0xOCwgLTU2LCAzNiwgOCk7XG4gICAgY3R4LmZpbGxTdHlsZSA9ICcjMmUyMjI2JztcbiAgICBjdHguYmVnaW5QYXRoKCk7IGN0eC5hcmMoMCwgLTg2LCAxMiwgMCwgNyk7IGN0eC5maWxsKCk7XG4gICAgY3R4LmJlZ2luUGF0aCgpOyBjdHguYXJjKDAsIC0xMDAsIDUsIDAsIDcpOyBjdHguZmlsbCgpO1xuICAgIGlmIChoYXQpIHtcbiAgICAgIGN0eC5maWxsU3R5bGUgPSAnIzhmNmEzYSc7XG4gICAgICBjdHguYmVnaW5QYXRoKCk7XG4gICAgICBjdHgubW92ZVRvKC0yMiwgLTkyKTsgY3R4LmxpbmVUbygwLCAtMTA4KTsgY3R4LmxpbmVUbygyMiwgLTkyKTtcbiAgICAgIGN0eC5jbG9zZVBhdGgoKTsgY3R4LmZpbGwoKTtcbiAgICB9XG4gICAgY3R4LnJlc3RvcmUoKTtcbiAgfVxuXG4gIGNvbnN0IG5wY3MgPSBbMCwgMSwgMiwgM10ubWFwKChpKSA9PiAoe1xuICAgIHg6IFNUUkVFVF9YMCArIDE2MCArIGkgKiBTSE9QX1cgKiAyLjQsXG4gICAgZGlyOiBpICUgMiA9PT0gMCA/IDEgOiAtMSxcbiAgICBzcGVlZDogMjYgKyBpICogNyxcbiAgICBwaGFzZTogaSAqIDEuNyxcbiAgICBzYXNoOiBbJyNjMDM5MmInLCAnI2Q2OGEyZScsICcjNGE2YjVhJywgJyM3YTRhNmInXVtpXSxcbiAgfSkpO1xuXG4gIGZ1bmN0aW9uIGdsb3coeDogbnVtYmVyLCB5OiBudW1iZXIsIHI6IG51bWJlcikge1xuICAgIGNvbnN0IGdyYWQgPSBjdHguY3JlYXRlUmFkaWFsR3JhZGllbnQocHgoeCksIHB4KHkpLCAwLCBweCh4KSwgcHgoeSksIHB4KHIpKTtcbiAgICBncmFkLmFkZENvbG9yU3RvcCgwLCAncmdiYSgyNTUsMTcwLDgwLDAuNSknKTtcbiAgICBncmFkLmFkZENvbG9yU3RvcCgxLCAncmdiYSgyNTUsMTcwLDgwLDApJyk7XG4gICAgY3R4LmZpbGxTdHlsZSA9IGdyYWQ7XG4gICAgY3R4LmZpbGxSZWN0KHB4KHggLSByKSwgcHgoeSAtIHIpLCBweChyICogMiksIHB4KHIgKiAyKSk7XG4gIH1cblxuICBmdW5jdGlvbiByb3VuZFJlY3RQYXRoKHg6IG51bWJlciwgeTogbnVtYmVyLCB3OiBudW1iZXIsIGg6IG51bWJlciwgcjogbnVtYmVyKSB7XG4gICAgY3R4LmJlZ2luUGF0aCgpO1xuICAgIGN0eC5tb3ZlVG8ocHgoeCArIHIpLCBweCh5KSk7XG4gICAgY3R4LmFyY1RvKHB4KHggKyB3KSwgcHgoeSksIHB4KHggKyB3KSwgcHgoeSArIGgpLCBweChyKSk7XG4gICAgY3R4LmFyY1RvKHB4KHggKyB3KSwgcHgoeSArIGgpLCBweCh4KSwgcHgoeSArIGgpLCBweChyKSk7XG4gICAgY3R4LmFyY1RvKHB4KHgpLCBweCh5ICsgaCksIHB4KHgpLCBweCh5KSwgcHgocikpO1xuICAgIGN0eC5hcmNUbyhweCh4KSwgcHgoeSksIHB4KHggKyB3KSwgcHgoeSksIHB4KHIpKTtcbiAgICBjdHguY2xvc2VQYXRoKCk7XG4gIH1cblxuICBmdW5jdGlvbiBidWJibGUoeDogbnVtYmVyLCB5OiBudW1iZXIsIHRleHQ6IHN0cmluZykge1xuICAgIGN0eC5mb250ID0gYDYwMCAke3B4KDIwKX1weCAke1NBTlN9YDtcbiAgICBjb25zdCB3ID0gY3R4Lm1lYXN1cmVUZXh0KHRleHQpLndpZHRoICsgMzQ7XG4gICAgY3R4LmZpbGxTdHlsZSA9ICdyZ2JhKDIwLDE0LDI2LDAuNzgpJztcbiAgICByb3VuZFJlY3RQYXRoKHggLSB3IC8gMiwgeSAtIDI2LCB3LCA0MCwgMTApO1xuICAgIGN0eC5maWxsKCk7XG4gICAgY3R4LmZpbGxTdHlsZSA9ICcjZjNkY2I4JztcbiAgICBjdHgudGV4dEFsaWduID0gJ2NlbnRlcic7IGN0eC50ZXh0QmFzZWxpbmUgPSAnbWlkZGxlJztcbiAgICBjdHguZmlsbFRleHQodGV4dCwgcHgoeCksIHB4KHkgLSA2KSk7XG4gICAgY3R4LmJlZ2luUGF0aCgpO1xuICAgIGN0eC5tb3ZlVG8ocHgoeCAtIDcpLCBweCh5ICsgMTQpKTsgY3R4LmxpbmVUbyhweCh4ICsgNyksIHB4KHkgKyAxNCkpOyBjdHgubGluZVRvKHB4KHgpLCBweCh5ICsgMjQpKTtcbiAgICBjdHguY2xvc2VQYXRoKCk7IGN0eC5maWxsKCk7XG4gIH1cblxuICBmdW5jdGlvbiBuZWFyZXN0U2hvcCgpOiBTaG9wIHwgbnVsbCB7XG4gICAgbGV0IGJlc3Q6IFNob3AgfCBudWxsID0gbnVsbDtcbiAgICBsZXQgYmVzdEQgPSAxMzA7XG4gICAgc2hvcHMuZm9yRWFjaCgoc2hvcCwgaSkgPT4ge1xuICAgICAgY29uc3QgZCA9IE1hdGguYWJzKHBsYXllci54IC0gKFNUUkVFVF9YMCArIGkgKiBTSE9QX1cgKyBET09SX09GRikpO1xuICAgICAgaWYgKGQgPCBiZXN0RCkgeyBiZXN0RCA9IGQ7IGJlc3QgPSBzaG9wOyB9XG4gICAgfSk7XG4gICAgcmV0dXJuIGJlc3Q7XG4gIH1cblxuICAvLyAtLS0tLS0tLS0tIOWvueivneahhiAtLS0tLS0tLS0tXG4gIGNvbnN0IGRpYWxvZyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdkaWFsb2cnKSBhcyBIVE1MRGl2RWxlbWVudDtcbiAgbGV0IGRpYWxvZ09wZW4gPSBmYWxzZTtcblxuICBmdW5jdGlvbiBvcGVuRGlhbG9nKHNob3A6IFNob3ApIHtcbiAgICAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2RsZy1zaWduJykgYXMgSFRNTEVsZW1lbnQpLnRleHRDb250ZW50ID0gYCR7c2hvcC5zaWdufSDCtyAke3Nob3AuaWR96ZO6YDtcbiAgICAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2RsZy1rZWVwZXInKSBhcyBIVE1MRWxlbWVudCkudGV4dENvbnRlbnQgPSBzaG9wLmtlZXBlcjtcbiAgICAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2RsZy1ncmVldGluZycpIGFzIEhUTUxFbGVtZW50KS50ZXh0Q29udGVudCA9IHNob3AuZ3JlZXRpbmc7XG4gICAgY29uc3QgYm94ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2RsZy1jYXJkcycpIGFzIEhUTUxFbGVtZW50O1xuICAgIGJveC5pbm5lckhUTUwgPSAnJztcbiAgICBpZiAoc2hvcC5jYXJkcy5sZW5ndGggPT09IDApIHtcbiAgICAgIGJveC5pbm5lckhUTUwgPSBgXG4gICAgICAgIDxkaXYgY2xhc3M9XCJyZWNydWl0LW5vdGVcIj5cbiAgICAgICAgICA8c3BhbiBjbGFzcz1cImthaVwiPuacrOmTuuenmOexjeW+geeov+S4rTwvc3Bhbj5cbiAgICAgICAgICDkvaDmraPlpb3mh4LjgIwke3Nob3AuaWR944CN6L+Z6KGM77yf5ouG5oiQ5LiA5pys56eY57GN5oqV5p2l77yM572y5L2g55qE5ZCN77yM54Gv5Li65L2g5Lqu44CCXG4gICAgICAgICAgPHAgc3R5bGU9XCJtYXJnaW46MTBweCAwIDA7XCI+PGEgY2xhc3M9XCJidG4gYnRuLS1naG9zdFwiIGhyZWY9XCIke3dpdGhCYXNlKCcvc3VibWl0LycpfVwiPuWOu+aKleeovyDihpI8L2E+PC9wPlxuICAgICAgICA8L2Rpdj5gO1xuICAgIH0gZWxzZSB7XG4gICAgICBmb3IgKGNvbnN0IGMgb2Ygc2hvcC5jYXJkcykge1xuICAgICAgICBjb25zdCBhID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScpO1xuICAgICAgICBhLmNsYXNzTmFtZSA9ICdzaG9wLWNhcmQnO1xuICAgICAgICBhLmhyZWYgPSB3aXRoQmFzZShgL2NhcmRzLyR7Yy5pZH0vYCk7XG4gICAgICAgIGEuaW5uZXJIVE1MID0gYFxuICAgICAgICAgIDxwIGNsYXNzPVwic2MtdGl0bGVcIj4ke2MudGl0bGV9PC9wPlxuICAgICAgICAgIDxwIHN0eWxlPVwibWFyZ2luOjA7Y29sb3I6dmFyKC0taW5rLXNvZnQpO2ZvbnQtc2l6ZTouODhyZW07XCI+JHtjLnN1bW1hcnl9PC9wPlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJzYy1tZXRhXCI+XG4gICAgICAgICAgICA8c3BhbiBjbGFzcz1cImNoaXAgY2hpcC0tbW9uZXlcIj4ke2MuaW5jb21lfTwvc3Bhbj5cbiAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwic2MtZ29cIj7nv7vpmIXnp5jnsY0g4oaSPC9zcGFuPlxuICAgICAgICAgIDwvZGl2PmA7XG4gICAgICAgIGJveC5hcHBlbmRDaGlsZChhKTtcbiAgICAgIH1cbiAgICB9XG4gICAgZGlhbG9nLmhpZGRlbiA9IGZhbHNlO1xuICAgIGRpYWxvZ09wZW4gPSB0cnVlO1xuICAgIChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZGxnLWNsb3NlJykgYXMgSFRNTEJ1dHRvbkVsZW1lbnQpPy5mb2N1cygpO1xuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzdHJlZXQtaGludCcpPy5jbGFzc0xpc3QuYWRkKCdnb25lJyk7XG4gICAgaWYgKCFsaXQuaGFzKHNob3AuaWQpKSB7XG4gICAgICBsaXQuYWRkKHNob3AuaWQpO1xuICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oTElUX0tFWSwgSlNPTi5zdHJpbmdpZnkoWy4uLmxpdF0pKTtcbiAgICAgIHJlZnJlc2hMaXQoKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBjbG9zZURpYWxvZygpIHtcbiAgICBkaWFsb2cuaGlkZGVuID0gdHJ1ZTtcbiAgICBkaWFsb2dPcGVuID0gZmFsc2U7XG4gICAgcGVuZGluZ1Nob3AgPSBudWxsO1xuICB9XG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdkbGctY2xvc2UnKT8uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBjbG9zZURpYWxvZyk7XG4gIGRpYWxvZy5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIChlKSA9PiB7IGlmIChlLnRhcmdldCA9PT0gZGlhbG9nKSBjbG9zZURpYWxvZygpOyB9KTtcblxuICAvLyAtLS0tLS0tLS0tIOS6pOS6kiAtLS0tLS0tLS0tXG4gIGNhbnZhcy5hZGRFdmVudExpc3RlbmVyKCdwb2ludGVyZG93bicsIChlKSA9PiB7XG4gICAgY29uc3QgcmVjdCA9IGNhbnZhcy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICBjb25zdCB3eCA9IHdvcmxkLmNhbVggKyAoZS5jbGllbnRYIC0gcmVjdC5sZWZ0KSAvIHdvcmxkLnNjYWxlO1xuICAgIGNvbnN0IHd5ID0gKGUuY2xpZW50WSAtIHJlY3QudG9wKSAvIHdvcmxkLnNjYWxlO1xuICAgIGlmIChkaWFsb2dPcGVuKSByZXR1cm47XG4gICAgaWYgKHd5ID4gMTcwICYmIHd5IDwgR1JPVU5EICsgNDApIHtcbiAgICAgIGNvbnN0IGlkeCA9IE1hdGguZmxvb3IoKHd4IC0gU1RSRUVUX1gwKSAvIFNIT1BfVyk7XG4gICAgICBpZiAoaWR4ID49IDAgJiYgaWR4IDwgc2hvcHMubGVuZ3RoICYmIHd4IDwgU1RSRUVUX1gwICsgc2hvcHMubGVuZ3RoICogU0hPUF9XKSB7XG4gICAgICAgIHBlbmRpbmdTaG9wID0gc2hvcHNbaWR4XTtcbiAgICAgICAgcGxheWVyLnRhcmdldCA9IFNUUkVFVF9YMCArIGlkeCAqIFNIT1BfVyArIERPT1JfT0ZGO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgfVxuICAgIHBlbmRpbmdTaG9wID0gbnVsbDtcbiAgICBwbGF5ZXIudGFyZ2V0ID0gTWF0aC5tYXgoMTQwLCBNYXRoLm1pbihXT1JMRF9XIC0gMTYwLCB3eCkpO1xuICB9KTtcblxuICBhZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgKGUpID0+IHtcbiAgICBpZiAoZS5rZXkgPT09ICdFc2NhcGUnICYmIGRpYWxvZ09wZW4pIHsgY2xvc2VEaWFsb2coKTsgcmV0dXJuOyB9XG4gICAgaWYgKGRpYWxvZ09wZW4pIHJldHVybjtcbiAgICBpZiAoZS5rZXkgPT09ICdBcnJvd0xlZnQnIHx8IGUua2V5ID09PSAnYScpIHsgcGVuZGluZ1Nob3AgPSBudWxsOyBwbGF5ZXIudGFyZ2V0ID0gcGxheWVyLnggLSAyMDA7IH1cbiAgICBpZiAoZS5rZXkgPT09ICdBcnJvd1JpZ2h0JyB8fCBlLmtleSA9PT0gJ2QnKSB7IHBlbmRpbmdTaG9wID0gbnVsbDsgcGxheWVyLnRhcmdldCA9IHBsYXllci54ICsgMjAwOyB9XG4gICAgaWYgKGUua2V5ID09PSAnRW50ZXInIHx8IGUua2V5ID09PSAnZScpIHtcbiAgICAgIGNvbnN0IG5lYXIgPSBuZWFyZXN0U2hvcCgpO1xuICAgICAgaWYgKG5lYXIpIHsgdHJ5IHsgb3BlbkRpYWxvZyhuZWFyIGFzIFNob3ApOyB9IGNhdGNoIChlcnIpIHsgY29uc29sZS5lcnJvcihlcnIpOyB9IH1cbiAgICB9XG4gIH0pO1xuXG4gIC8vIC0tLS0tLS0tLS0g5Li75b6q546vIC0tLS0tLS0tLS1cbiAgbGV0IGxhc3QgPSBwZXJmb3JtYW5jZS5ub3coKTtcbiAgbGV0IGhpbnRUaW1lciA9IDA7XG5cbiAgZnVuY3Rpb24gZnJhbWUobm93OiBudW1iZXIpIHtcbiAgICB0cnkge1xuICAgICAgdGljayhub3cpO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgKHdpbmRvdyBhcyBhbnkpLl9fc3RyZWV0RXJyID0gU3RyaW5nKGVyciAmJiAoZXJyIGFzIEVycm9yKS5zdGFjayB8fCBlcnIpO1xuICAgICAgY29uc29sZS5lcnJvcignZnJhbWU6JywgZXJyKTtcbiAgICAgIHJldHVybjsgLy8g5b6q546v5YGc5q2i77yM5L2G6ZSZ6K+v5bey6KKr6K6w5b2VXG4gICAgfVxuICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZShmcmFtZSk7XG4gIH1cblxuICBmdW5jdGlvbiB0aWNrKG5vdzogbnVtYmVyKSB7XG4gICAgY29uc3QgZHQgPSBNYXRoLm1pbigwLjA1LCAobm93IC0gbGFzdCkgLyAxMDAwKTtcbiAgICBsYXN0ID0gbm93O1xuXG4gICAgLy8g546p5a6256e75YqoXG4gICAgY29uc3QgZHggPSBwbGF5ZXIudGFyZ2V0IC0gcGxheWVyLng7XG4gICAgcGxheWVyLndhbGsgPSBNYXRoLmFicyhkeCkgPiA0O1xuICAgIGlmIChwbGF5ZXIud2Fsaykge1xuICAgICAgY29uc3Qgc3RlcCA9IE1hdGguc2lnbihkeCkgKiA0MzAgKiBkdDtcbiAgICAgIHBsYXllci54ICs9IE1hdGguYWJzKGR4KSA8IE1hdGguYWJzKHN0ZXApID8gZHggOiBzdGVwO1xuICAgICAgcGxheWVyLmZhY2UgPSBNYXRoLnNpZ24oZHgpIHx8IHBsYXllci5mYWNlO1xuICAgICAgcGxheWVyLmJvYiArPSBkdCAqIDE0O1xuICAgIH0gZWxzZSBpZiAocGVuZGluZ1Nob3ApIHtcbiAgICAgIGNvbnN0IHNob3AgPSBwZW5kaW5nU2hvcDtcbiAgICAgIHBlbmRpbmdTaG9wID0gbnVsbDtcbiAgICAgIHRyeSB7IG9wZW5EaWFsb2coc2hvcCk7IH0gY2F0Y2ggKGVycikgeyBjb25zb2xlLmVycm9yKCdvcGVuRGlhbG9nOicsIGVycik7IH1cbiAgICB9XG4gICAgLy8g6KGM5Lq65ri46LWwXG4gICAgZm9yIChjb25zdCBuIG9mIG5wY3MpIHtcbiAgICAgIGlmICghUkVEVUNFRCkge1xuICAgICAgICBuLnggKz0gbi5kaXIgKiBuLnNwZWVkICogZHQ7XG4gICAgICAgIG4ucGhhc2UgKz0gZHQgKiA5O1xuICAgICAgICBpZiAobi54IDwgU1RSRUVUX1gwIC0gNjApIG4uZGlyID0gMTtcbiAgICAgICAgaWYgKG4ueCA+IFdPUkxEX1cgLSAxNjApIG4uZGlyID0gLTE7XG4gICAgICB9XG4gICAgfVxuICAgIC8vIOebuOacuui3n+maj1xuICAgIGNvbnN0IHRhcmdldENhbSA9IE1hdGgubWF4KDAsIE1hdGgubWluKFdPUkxEX1cgLSB3b3JsZC52aWV3VywgcGxheWVyLnggLSB3b3JsZC52aWV3VyAqIDAuNDIpKTtcbiAgICB3b3JsZC5jYW1YICs9ICh0YXJnZXRDYW0gLSB3b3JsZC5jYW1YKSAqIE1hdGgubWluKDEsIGR0ICogNik7XG5cbiAgICAvLyAtLS0tIOa4suafkyAtLS0tXG4gICAgY3R4LnNldFRyYW5zZm9ybSgxLCAwLCAwLCAxLCAwLCAwKTtcbiAgICBjdHguY2xlYXJSZWN0KDAsIDAsIGNhbnZhcy53aWR0aCwgY2FudmFzLmhlaWdodCk7XG4gICAgY3R4LnNldFRyYW5zZm9ybShweCgxKSwgMCwgMCwgcHgoMSksIC1weCh3b3JsZC5jYW1YKSwgMCk7XG5cbiAgICBkcmF3U2t5KHdvcmxkLmNhbVgsIHdvcmxkLnZpZXdXKTtcbiAgICBkcmF3TW91bnRhaW4oNDM1LCA5MCwgMC4wMDgsIDAsICcjMmEyMDM4Jywgd29ybGQuY2FtWCwgd29ybGQudmlld1cpO1xuICAgIGRyYXdNb3VudGFpbig0NzAsIDYwLCAwLjAxMywgNDAwLCAnIzMzMjY0MCcsIHdvcmxkLmNhbVgsIHdvcmxkLnZpZXdXKTtcbiAgICBkcmF3QmFja0hvdXNlcyh3b3JsZC5jYW1YLCB3b3JsZC52aWV3Vyk7XG4gICAgZHJhd1N0cmVldCh3b3JsZC5jYW1YLCB3b3JsZC52aWV3Vyk7XG4gICAgZHJhd0FyY2h3YXkoKTtcbiAgICBzaG9wcy5mb3JFYWNoKChzaG9wLCBpKSA9PiBkcmF3U2hvcChzaG9wLCBpLCBub3cpKTtcbiAgICBkcmF3R2F0ZSgpO1xuXG4gICAgLy8g54K55Lqu5bqX6ZO655qE5YWJ5pmVXG4gICAgY29uc3QgcHVsc2UgPSBSRURVQ0VEID8gMC44NSA6IE1hdGguc2luKG5vdyAvIDQyMCkgKiAwLjEyICsgMC44ODtcbiAgICBzaG9wcy5mb3JFYWNoKChzaG9wLCBpKSA9PiB7XG4gICAgICBpZiAoIWxpdC5oYXMoc2hvcC5pZCkpIHJldHVybjtcbiAgICAgIGNvbnN0IHN4ID0gU1RSRUVUX1gwICsgaSAqIFNIT1BfVztcbiAgICAgIGdsb3coc3ggKyA5NiwgMzM4LCA2NiAqIHB1bHNlKTtcbiAgICAgIGdsb3coc3ggKyBTSE9QX1cgLSAxMjgsIDMzOCwgNjYgKiBwdWxzZSk7XG4gICAgICBnbG93KHN4ICsgRE9PUl9PRkYsIDUwMCwgOTAgKiBwdWxzZSk7XG4gICAgfSk7XG5cbiAgICAvLyDmqpDkuIrnga/nrLzkuLJcbiAgICBjb25zdCBzd2F5ID0gUkVEVUNFRCA/IDAgOiBNYXRoLnNpbihub3cgLyA5MDApICogODtcbiAgICBmb3IgKGxldCBseCA9IE1hdGguZmxvb3Iod29ybGQuY2FtWCAvIDM4MCkgKiAzODA7IGx4IDwgd29ybGQuY2FtWCArIHdvcmxkLnZpZXdXICsgMTAwOyBseCArPSAzODApIHtcbiAgICAgIGNvbnN0IGx5ID0gOTAgKyBNYXRoLnNpbihseCAqIDAuMDEzICsgbm93IC8gOTAwKSAqIHN3YXk7XG4gICAgICBjdHguc3Ryb2tlU3R5bGUgPSAncmdiYSgyOCwyMCwyNCwwLjkpJztcbiAgICAgIGN0eC5saW5lV2lkdGggPSBweCgzKTtcbiAgICAgIGN0eC5iZWdpblBhdGgoKTsgY3R4Lm1vdmVUbyhweChseCksIHB4KDApKTsgY3R4LmxpbmVUbyhweChseCksIHB4KGx5KSk7IGN0eC5zdHJva2UoKTtcbiAgICAgIGRyYXdMYW50ZXJuKGN0eCwgbHgsIGx5LCB0cnVlKTtcbiAgICAgIGdsb3cobHgsIGx5ICsgOCwgNDQgKiBwdWxzZSk7XG4gICAgfVxuXG4gICAgLy8g5Lq654mpXG4gICAgZm9yIChjb25zdCBuIG9mIG5wY3MpIGRyYXdQZXJzb24obi54LCBHUk9VTkQgKyAzMCwgMC44LCBuLmRpciwgbi5waGFzZSwgdHJ1ZSwgbi5zYXNoLCBmYWxzZSk7XG4gICAgY29uc3QgbmVhciA9IG5lYXJlc3RTaG9wKCkgYXMgU2hvcCB8IG51bGw7XG4gICAgZHJhd1BlcnNvbihwbGF5ZXIueCwgR1JPVU5EICsgMzQsIDEsIHBsYXllci5mYWNlLCBwbGF5ZXIuYm9iLCBwbGF5ZXIud2FsaywgJyNjMDM5MmInLCB0cnVlKTtcbiAgICBpZiAobmVhciAmJiAhZGlhbG9nT3Blbikge1xuICAgICAgY29uc3Qgc3ggPSBTVFJFRVRfWDAgKyAoc2hvcHMuaW5kZXhPZihuZWFyKSBhcyBudW1iZXIpICogU0hPUF9XICsgRE9PUl9PRkY7XG4gICAgICBidWJibGUoc3gsIDQzMCwgKG5lYXIgYXMgU2hvcCkuY2FyZHMubGVuZ3RoID8gJ+i/m+W6l+eci+enmOexjScgOiAn5b6B56i/5Lit4oCmJyk7XG4gICAgfVxuXG4gICAgLy8g5pqX6KeSXG4gICAgY29uc3QgdmcgPSBjdHguY3JlYXRlTGluZWFyR3JhZGllbnQoMCwgcHgoSCAqIDAuNTUpLCAwLCBweChIKSk7XG4gICAgdmcuYWRkQ29sb3JTdG9wKDAsICdyZ2JhKDEwLDYsMTQsMCknKTtcbiAgICB2Zy5hZGRDb2xvclN0b3AoMSwgJ3JnYmEoMTAsNiwxNCwwLjM1KScpO1xuICAgIGN0eC5maWxsU3R5bGUgPSB2ZztcbiAgICBjdHguZmlsbFJlY3QocHgod29ybGQuY2FtWCksIHB4KEggKiAwLjU1KSwgcHgod29ybGQudmlld1cpLCBweChIICogMC40NSkpO1xuXG4gICAgaGludFRpbWVyICs9IGR0O1xuICAgIGlmIChoaW50VGltZXIgPiA4KSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc3RyZWV0LWhpbnQnKT8uY2xhc3NMaXN0LmFkZCgnZ29uZScpO1xuICAgICh3aW5kb3cgYXMgYW55KS5fX2RiZyA9IHsgeDogTWF0aC5yb3VuZChwbGF5ZXIueCksIHQ6IE1hdGgucm91bmQocGxheWVyLnRhcmdldCksIHBlbmQ6ICEhcGVuZGluZ1Nob3AsIGNhbTogTWF0aC5yb3VuZCh3b3JsZC5jYW1YKSwgd2FsazogcGxheWVyLndhbGsgfTtcbiAgfVxuXG4gIC8vIC0tLS0tLS0tLS0g5byA5Zy6IC0tLS0tLS0tLS1cbiAgY29uc3QgaW50cm8gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnaW50cm8nKSBhcyBIVE1MRGl2RWxlbWVudDtcbiAgaWYgKGxvY2FsU3RvcmFnZS5nZXRJdGVtKCdmdXllMzYwLmludHJvU2VlbicpKSBpbnRyby5oaWRkZW4gPSB0cnVlO1xuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnaW50cm8tZ28nKT8uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XG4gICAgaW50cm8uaGlkZGVuID0gdHJ1ZTtcbiAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSgnZnV5ZTM2MC5pbnRyb1NlZW4nLCAnMScpO1xuICB9KTtcblxuICBhZGRFdmVudExpc3RlbmVyKCdyZXNpemUnLCByZXNpemUpO1xuICByZXNpemUoKTtcbiAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKGZyYW1lKTtcbjwvc2NyaXB0PiJdLCJtYXBwaW5ncyI6IkFBK09FLE1BQU0sUUFBZ0IsS0FBSztFQUN4QixTQUFTLGVBQWUsYUFBYSxFQUF3QixlQUFlO0FBQy9FO0FBRUEsTUFBTSxTQUFTLFNBQVMsZUFBZSxRQUFRO0FBQy9DLE1BQU0sTUFBTSxPQUFPLFdBQVcsSUFBSTtBQUNsQyxNQUFNLFVBQVUsV0FBVyxrQ0FBa0MsRUFBRTtBQUMvRCxNQUFNLE1BQU07QUFDWixNQUFNLE9BQU87QUFHYixNQUFNLFdBQVcsQ0FBQyxTQUNoQixJQUFJLFlBQVksSUFBSSxZQUFZLElBQUksUUFBUSxPQUFPLEVBQUUsQ0FBQyxHQUFHLElBQUk7QUFHL0QsTUFBTSxJQUFJO0FBQ1YsTUFBTSxTQUFTO0FBQ2YsTUFBTSxTQUFTO0FBQ2YsTUFBTSxZQUFZO0FBQ2xCLE1BQU0sVUFBVSxZQUFZLE1BQU0sU0FBUyxTQUFTO0FBQ3BELE1BQU0sV0FBVyxTQUFTO0FBRTFCLE1BQU0sUUFBUSxFQUFFLE1BQU0sR0FBRyxPQUFPLEdBQUcsT0FBTyxHQUFHLEtBQUssRUFBRTtBQUNwRCxNQUFNLFNBQVMsRUFBRSxHQUFHLFlBQVksSUFBSSxRQUFRLFlBQVksSUFBSSxNQUFNLEdBQUcsS0FBSyxHQUFHLE1BQU0sTUFBTTtBQUN6RixJQUFJLGNBQTJCO0FBRy9CLElBQUksT0FBTztBQUNYLE1BQU0sTUFBTSxPQUFPLE9BQVEsT0FBTyxRQUFTLGNBQWM7QUFDekQsTUFBTSxRQUFRLE1BQU0sS0FBSyxFQUFFLFFBQVEsR0FBRyxHQUFHLE9BQU87RUFDOUMsR0FBRyxJ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