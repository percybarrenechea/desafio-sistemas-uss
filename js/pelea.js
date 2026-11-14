/* =========================================================
   Juego de pelea 2D (canvas)

   CONTROLES (teclado)                 CELULAR (botones)
   ← →  o  A D   moverse               ◀ ▶
   ↑  o  W       saltar (doble salto)  ⬆
   ESPACIO o J   atacar (combo x3)     👊
   SHIFT o ↓     esquivar (dash)       💨
   K  o  E       súper ataque ⚡       ⚡  (cuando la barra está llena)

   EL JEFE tiene varios ataques según su nivel:
   - Golpe (⚠️ ¡CUIDADO!)       -> salta o esquiva con dash
   - Proyectiles bajos / altos   -> salta los bajos, agáchate... no saltes los altos
   - Salto aplastante + ondas    -> estar en el aire cuando cae
   - Escudo 🛡️ (bloquea de frente) -> pégale por la espalda o usa el súper
   - FURIA al 40% de vida: más rápido y agresivo
   Hay tiempo límite y objetos que caen: ❤️ (vida) y ⚡ (energía).
   ========================================================= */
const Pelea = (() => {
  const W = 960, H = 540, SUELO = 452;
  const GRAV = 2400, SALTO = -900, VEL = 350, DASH = 1150;
  const VIDA_YO = 100;

  let cv, g, raf = 0, ultimo = 0, S = null;
  const teclas = {};

  /* ---------- Entrada ---------- */
  const MAPA = {
    ArrowLeft: "izq", a: "izq", A: "izq",
    ArrowRight: "der", d: "der", D: "der",
    ArrowUp: "salto", w: "salto", W: "salto",
    " ": "atk", j: "atk", J: "atk",
    Shift: "dash", ArrowDown: "dash", s: "dash", S: "dash", l: "dash", L: "dash",
    k: "esp", K: "esp", e: "esp", E: "esp"
  };
  function pulsar(a) {
    if (!S) return;
    if (!teclas[a]) {
      if (a === "atk") S.quiere.atk = true;
      if (a === "salto") S.quiere.salto = true;
      if (a === "dash") S.quiere.dash = true;
      if (a === "esp") S.quiere.esp = true;
    }
    teclas[a] = true;
  }
  function teclaAbajo(e) {
    const a = MAPA[e.key];
    if (!a || !S) return;
    e.preventDefault();
    pulsar(a);
  }
  function teclaArriba(e) { const a = MAPA[e.key]; if (a) teclas[a] = false; }

  function botonesTactiles() {
    document.querySelectorAll("[data-ctrl]").forEach(b => {
      const a = b.dataset.ctrl;
      const on = e => { e.preventDefault(); b.classList.add("pulsado"); pulsar(a); };
      const off = e => { e && e.preventDefault(); b.classList.remove("pulsado"); teclas[a] = false; };
      b.addEventListener("pointerdown", on);
      b.addEventListener("pointerup", off);
      b.addEventListener("pointerleave", off);
      b.addEventListener("pointercancel", off);
      b.addEventListener("contextmenu", e => e.preventDefault());
    });
  }

  /* ---------- Utilidades ---------- */
  const azar = (a, b) => a + Math.random() * (b - a);
  const elegir = a => a[Math.floor(Math.random() * a.length)];
  function flotante(x, y, texto, color, tam = 30) { S.textos.push({ x, y, texto, color, tam, t: 0 }); }
  function chispas(x, y, color, n = 10) {
    for (let k = 0; k < n; k++) S.chispas.push({ x, y, vx: azar(-300, 300), vy: azar(-420, -60), t: 0, color });
  }

  /* ---------- Iniciar ---------- */
  function iniciar({ jefe, nivel, nombre, sonido, alTerminar }) {
    cv = document.getElementById("lienzo");
    g = cv.getContext("2d");
    Object.keys(teclas).forEach(k => teclas[k] = false);
    const vida = Math.round(jefe.vida * 1.6);
    S = {
      jefe, nivel, nombre, sonido, alTerminar,
      t: 0, fase: "cuenta", faseT: 0, ultimaCuenta: -1,
      tiempo: 60 + nivel * 5,
      yo: { x: 180, y: SUELO, vy: 0, dir: 1, vida: VIDA_YO, piso: true, saltos: 0, inv: 0,
            atkHasta: 0, atkListo: 0, combo: 0, comboHasta: 0,
            dashHasta: 0, dashListo: 0, energia: 0 },
      J: { x: 780, y: SUELO, vy: 0, vx: 0, dir: -1, vida, max: vida, tam: 120 + nivel * 9,
           estado: "caminar", estT: 0, flash: 0, piso: true, furia: false,
           vel: 100 + nivel * 22, proxAccion: 1.2, rafaga: 0 },
      balas: [], rayos: [], ondas: [], items: [], textos: [], chispas: [], estela: [],
      proxItem: azar(8, 11), quiere: {}, temblor: 0
    };
    document.addEventListener("keydown", teclaAbajo);
    document.addEventListener("keyup", teclaArriba);
    cancelAnimationFrame(raf);
    ultimo = performance.now();
    raf = requestAnimationFrame(bucle);
  }

  function detener() {
    cancelAnimationFrame(raf);
    document.removeEventListener("keydown", teclaAbajo);
    document.removeEventListener("keyup", teclaArriba);
    if (S) S.cerrado = true;
  }

  function pausar(si) {
    if (!S) return;
    S.pausa = si;
    Object.keys(teclas).forEach(k => teclas[k] = false);
  }

  function bucle(ahora) {
    const dt = Math.min(0.05, (ahora - ultimo) / 1000);
    ultimo = ahora;
    if (!S || S.cerrado) return;
    if (S.pausa) { raf = requestAnimationFrame(bucle); return; }
    actualizar(dt);
    dibujar();
    if (S && !S.cerrado) raf = requestAnimationFrame(bucle);
  }

  /* =======================================================
     Lógica
     ======================================================= */
  function actualizar(dt) {
    S.t += dt; S.faseT += dt;
    if (S.fase === "cuenta") {
      const n = Math.floor(S.faseT / 0.7);
      if (n !== S.ultimaCuenta) { S.ultimaCuenta = n; S.sonido(n < 3 ? "tic" : "go"); }
      if (S.faseT > 2.8) { S.fase = "pelea"; S.faseT = 0; S.quiere = {}; }
      return;
    }
    if (S.fase === "final") {
      efectos(dt);
      if (S.faseT > 1.5) { const gane = S.gane; detener(); S.alTerminar(gane); }
      return;
    }

    S.tiempo -= dt;
    if (S.tiempo <= 0) { S.tiempo = 0; return terminar(false, "⏰ ¡TIEMPO!"); }

    jugador(dt);
    if (S.fase !== "pelea") return;
    jefe(dt);
    proyectiles(dt);
    objetos(dt);
    efectos(dt);
    S.quiere = {};
  }

  /* ---------- Jugador ---------- */
  function jugador(dt) {
    const yo = S.yo, J = S.J;
    const dashing = S.t < yo.dashHasta;

    let mov = 0;
    if (teclas.izq) mov -= 1;
    if (teclas.der) mov += 1;
    if (mov && !dashing) yo.dir = mov;

    // dash (esquive con invulnerabilidad)
    if (S.quiere.dash && S.t >= yo.dashListo) {
      yo.dashHasta = S.t + .2; yo.dashListo = S.t + .75; yo.inv = Math.max(yo.inv, .22);
      S.sonido("salto");
    }
    if (S.t < yo.dashHasta) {
      yo.x += yo.dir * DASH * dt;
      S.estela.push({ x: yo.x, y: yo.y, dir: yo.dir, t: 0 });
    } else {
      yo.x += mov * VEL * dt;
    }

    // salto doble
    if (S.quiere.salto && yo.saltos < 2) {
      yo.vy = yo.saltos === 0 ? SALTO : SALTO * .85;
      yo.saltos++; yo.piso = false;
      S.sonido("salto");
      if (yo.saltos === 2) chispas(yo.x, yo.y, "#9fb3ff", 6);
    }
    yo.vy += GRAV * dt; yo.y += yo.vy * dt;
    if (yo.y >= SUELO) { yo.y = SUELO; yo.vy = 0; yo.piso = true; yo.saltos = 0; }
    yo.x = Math.max(40, Math.min(W - 40, yo.x));
    yo.inv = Math.max(0, yo.inv - dt);

    // ataque con combo
    if (S.quiere.atk && S.t >= yo.atkListo) {
      yo.combo = S.t < yo.comboHasta ? (yo.combo % 3) + 1 : 1;
      yo.comboHasta = S.t + .7;
      yo.atkHasta = S.t + .14;
      yo.atkListo = S.t + (yo.combo === 3 ? .42 : .24);
      golpear();
    }

    // súper ataque ⚡ (código que viaja)
    if (S.quiere.esp) {
      if (yo.energia >= 100) {
        yo.energia = 0;
        S.rayos.push({ x: yo.x + yo.dir * 40, y: yo.y - 45, vx: yo.dir * 950 });
        S.sonido("critico"); S.temblor = .15;
        flotante(yo.x, yo.y - 110, "⚡ SÚPER", "#f5a623", 34);
      } else {
        flotante(yo.x, yo.y - 100, "Energía " + Math.floor(yo.energia) + "%", "#9fb3ff", 22);
      }
    }
  }

  function golpear() {
    const yo = S.yo, J = S.J;
    const dx = (J.x - yo.x) * yo.dir;
    const enAltura = Math.abs((J.y - J.tam * .4) - (yo.y - 40)) < J.tam * .6 + 30;
    if (!(dx > -20 && dx < 105 + J.tam * .35 && enAltura)) { S.sonido("aire"); return; }

    // escudo: bloquea golpes de frente
    const deFrente = Math.sign(yo.x - J.x) === J.dir;
    if (J.estado === "escudo" && deFrente) {
      S.sonido("alerta");
      flotante(J.x, J.y - J.tam - 10, "🛡️ ¡BLOQUEADO!", "#9fb3ff", 26);
      yo.x -= yo.dir * 30;
      return;
    }
    let dano = 5 + Math.floor(Math.random() * 3);
    let txt = "-";
    if (!yo.piso) { dano += 3; txt = "AÉREO -"; }
    if (yo.combo === 3) { dano *= 2; txt = "¡COMBO x3! -"; J.x += yo.dir * 50; S.temblor = .12; }
    if (J.estado === "escudo") { dano = Math.round(dano * 1.5); txt = "¡POR LA ESPALDA! -"; }
    J.vida -= dano; J.flash = .15; J.x += yo.dir * 14;
    yo.energia = Math.min(100, yo.energia + (yo.combo === 3 ? 18 : 9));
    S.sonido(yo.combo === 3 || !yo.piso ? "critico" : "golpe");
    flotante(J.x, J.y - J.tam, txt + dano, yo.combo === 3 ? "#f5a623" : "#ffffff", yo.combo === 3 ? 34 : 28);
    chispas(J.x - yo.dir * J.tam * .3, J.y - J.tam * .45, "#fff");
    revisarJefe();
  }

  function revisarJefe() {
    const J = S.J;
    if (J.vida <= 0) return terminar(true);
    if (!J.furia && J.vida < J.max * .4) {
      J.furia = true; J.vel *= 1.35;
      flotante(J.x, J.y - J.tam - 20, "😡 ¡FURIA!", "#ff5a5f", 40);
      S.sonido("jefe"); S.temblor = .3;
    }
  }

  /* ---------- Jefe (IA) ---------- */
  function jefe(dt) {
    const yo = S.yo, J = S.J;
    J.flash = Math.max(0, J.flash - dt);
    J.estT += dt;
    const dist = yo.x - J.x;
    const alcance = 70 + J.tam * .45;
    const aviso = S.jefe.aviso / 1000 * (J.furia ? .75 : 1);

    switch (J.estado) {
      case "caminar": {
        J.dir = Math.sign(dist) || J.dir;
        if (Math.abs(dist) > alcance * .7) J.x += J.dir * J.vel * dt;
        J.proxAccion -= dt * (J.furia ? 1.4 : 1);
        if (J.proxAccion <= 0) elegirAccion(Math.abs(dist) < alcance * 1.1);
        break;
      }
      case "carga":
        if (J.estT >= aviso) { J.estado = "golpe"; J.estT = 0; golpeJefe(); }
        break;
      case "golpe":
        if (J.estT < .16) J.x += J.dir * (650 + S.nivel * 40) * dt;     // embestida
        if (J.estT > .5) volverACaminar();
        break;
      case "disparo":
        if (J.estT >= .35 && J.rafaga > 0) {
          disparar(); J.rafaga--; J.estT = J.rafaga > 0 ? .1 : .35;
        }
        if (J.rafaga === 0 && J.estT > .6) volverACaminar();
        break;
      case "salto":
        J.vy += GRAV * .9 * dt; J.y += J.vy * dt; J.x += J.vx * dt;
        if (J.y >= SUELO && J.vy > 0) {
          J.y = SUELO; J.vy = 0;
          // aterrizaje: ondas expansivas a ambos lados
          S.ondas.push({ x: J.x, vx: 560, t: 0 }, { x: J.x, vx: -560, t: 0 });
          S.temblor = .35; S.sonido("herido");
          if (Math.abs(yo.x - J.x) < J.tam * .5 && yo.y > SUELO - 60) herirme(S.jefe.dano, Math.sign(dist) || 1);
          J.estado = "aterriza"; J.estT = 0;
        }
        break;
      case "aterriza":
        if (J.estT > .5) volverACaminar();
        break;
      case "escudo":
        if (J.estT > 1.7) volverACaminar();
        break;
    }
    J.x = Math.max(60, Math.min(W - 60, J.x));

    // tocar al jefe mientras embiste hace daño
    if (J.estado === "golpe" && J.estT < .2 && Math.abs(yo.x - J.x) < J.tam * .4 && yo.y > SUELO - J.tam * .7) {
      herirme(Math.round(S.jefe.dano * .5), J.dir);
    }
  }

  function volverACaminar() {
    const J = S.J;
    J.estado = "caminar"; J.estT = 0;
    const [a, b] = S.jefe.cada;
    J.proxAccion = azar(a, b) / 1000 * .75;
  }

  function elegirAccion(cerca) {
    const J = S.J, n = S.nivel;
    const opciones = [];
    if (cerca) opciones.push("golpe", "golpe");
    if (S.jefe.bala) opciones.push("disparo");
    if (n >= 2) opciones.push("salto");
    if (n >= 4 && cerca) opciones.push("escudo");
    if (!opciones.length) opciones.push("golpe");
    let acc = elegir(opciones);
    if (acc === "golpe" && !cerca) acc = n >= 2 ? "salto" : "caminar";
    J.estT = 0;
    if (acc === "golpe") { J.estado = "carga"; S.sonido("alerta"); }
    else if (acc === "disparo") { J.estado = "disparo"; J.rafaga = n >= 3 ? 3 : n >= 1 ? 2 : 1; }
    else if (acc === "salto") {
      J.estado = "salto"; J.vy = -1050; J.piso = false;
      const t = 2 * 1050 / (GRAV * .9);
      J.vx = (S.yo.x - J.x) / t;
      S.sonido("salto");
    }
    else if (acc === "escudo") { J.estado = "escudo"; S.sonido("alerta"); }
    else { J.proxAccion = .4; }
  }

  function disparar() {
    const J = S.J;
    const alto = S.nivel >= 3 && Math.random() < .4;
    S.balas.push({ x: J.x + J.dir * J.tam * .4, y: alto ? SUELO - 125 : SUELO - 26, vx: J.dir * (380 + S.nivel * 35) });
    S.sonido("disparo");
  }

  function golpeJefe() {
    const yo = S.yo, J = S.J;
    const dx = (yo.x - J.x) * J.dir;
    const alcance = 90 + J.tam * .55;
    const enAire = yo.y < SUELO - 75;
    if (dx > -10 && dx < alcance && !enAire && yo.inv <= 0) herirme(S.jefe.dano, J.dir);
    else if (dx > -10 && dx < alcance + 80) { esquiveBonus(); }
  }

  function esquiveBonus() {
    const yo = S.yo;
    flotante(yo.x, yo.y - 110, "¡ESQUIVADO! +⚡", "#9fb3ff", 26);
    yo.energia = Math.min(100, yo.energia + 15);
  }

  function herirme(dano, dir) {
    const yo = S.yo;
    if (yo.inv > 0 || S.fase !== "pelea") return;
    dano = Math.round(dano * 1.2);
    yo.vida -= dano;
    yo.inv = .9;
    yo.x += dir * 70;
    yo.vy = -340; yo.piso = false;
    S.temblor = .25;
    S.sonido("herido");
    flotante(yo.x, yo.y - 100, "-" + dano, "#ff5a5f");
    chispas(yo.x, yo.y - 40, "#ff5a5f");
    if (yo.vida <= 0) terminar(false, "¡PERDISTE!");
  }

  /* ---------- Proyectiles, ondas y rayos ---------- */
  function proyectiles(dt) {
    const yo = S.yo, J = S.J;
    S.balas.forEach(b => {
      b.x += b.vx * dt;
      if (!b.usada && Math.abs(b.x - yo.x) < 34 && Math.abs(b.y - (yo.y - 38)) < 44) {
        b.usada = true;
        if (yo.inv > 0) { esquiveBonus(); return; }
        herirme(Math.round(S.jefe.dano * .6), Math.sign(b.vx));
      }
    });
    S.balas = S.balas.filter(b => !b.usada && b.x > -60 && b.x < W + 60);

    S.ondas.forEach(o => {
      o.x += o.vx * dt; o.t += dt;
      if (!o.usada && Math.abs(o.x - yo.x) < 30 && yo.y > SUELO - 30) {
        o.usada = true;
        herirme(Math.round(S.jefe.dano * .7), Math.sign(o.vx));
      }
    });
    S.ondas = S.ondas.filter(o => o.x > -40 && o.x < W + 40);

    S.rayos.forEach(r => {
      r.x += r.vx * dt;
      if (!r.usado && Math.abs(r.x - J.x) < J.tam * .45 && S.fase === "pelea") {
        r.usado = true;
        const dano = 22 + S.nivel * 3;
        J.vida -= dano; J.flash = .3; J.x += Math.sign(r.vx) * 40;
        if (J.estado === "escudo") volverACaminar();       // el súper rompe el escudo
        flotante(J.x, J.y - J.tam - 10, "⚡ -" + dano, "#f5a623", 40);
        chispas(J.x, J.y - J.tam * .5, "#f5a623", 18);
        S.temblor = .3;
        revisarJefe();
      }
    });
    S.rayos = S.rayos.filter(r => !r.usado && r.x > -80 && r.x < W + 80);
  }

  /* ---------- Objetos que caen ---------- */
  function objetos(dt) {
    const yo = S.yo;
    S.proxItem -= dt;
    if (S.proxItem <= 0) {
      S.proxItem = azar(9, 13);
      S.items.push({ x: azar(80, W - 80), y: -30, vy: 0, tipo: Math.random() < .5 ? "vida" : "energia", t: 0 });
    }
    S.items.forEach(it => {
      it.t += dt;
      if (it.y < SUELO - 10) { it.vy += 900 * dt; it.y = Math.min(SUELO - 10, it.y + it.vy * dt); }
      if (!it.usado && Math.abs(it.x - yo.x) < 44 && Math.abs(it.y - (yo.y - 30)) < 70) {
        it.usado = true;
        if (it.tipo === "vida") { yo.vida = Math.min(VIDA_YO, yo.vida + 20); flotante(yo.x, yo.y - 110, "+20 ❤️", "#22c07a"); }
        else { yo.energia = Math.min(100, yo.energia + 50); flotante(yo.x, yo.y - 110, "+50 ⚡", "#f5a623"); }
        S.sonido("bien");
      }
    });
    S.items = S.items.filter(it => !it.usado && it.t < 7);
  }

  function efectos(dt) {
    S.textos.forEach(t => { t.t += dt; t.y -= 60 * dt; });
    S.textos = S.textos.filter(t => t.t < .9);
    S.chispas.forEach(c => { c.x += c.vx * dt; c.y += c.vy * dt; c.vy += 900 * dt; c.t += dt; });
    S.chispas = S.chispas.filter(c => c.t < .5);
    S.estela.forEach(e => e.t += dt);
    S.estela = S.estela.filter(e => e.t < .18);
    S.temblor = Math.max(0, S.temblor - dt);
  }

  function terminar(gane, texto) {
    if (S.fase === "final") return;
    S.fase = "final"; S.faseT = 0; S.gane = gane;
    S.textoFinal = gane ? "¡K.O.!" : texto;
    S.balas = []; S.ondas = [];
    S.sonido(gane ? "victoria" : "derrota");
    if (gane) chispas(S.J.x, S.J.y - S.J.tam * .5, "#f5a623", 30);
  }

  /* =======================================================
     Dibujo
     ======================================================= */
  function emoji(txt, x, y, tam, dir = 1, alpha = 1) {
    g.save();
    g.globalAlpha = alpha;
    g.translate(x, y); g.scale(dir, 1);
    g.font = `${tam}px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif`;
    g.textAlign = "center"; g.textBaseline = "bottom";
    g.fillText(txt, 0, 0);
    g.restore();
  }

  function barra(x, y, w, h, p, color, derecha) {
    g.fillStyle = "rgba(0,0,0,.45)"; g.fillRect(x, y, w, h);
    p = Math.max(0, Math.min(1, p));
    g.fillStyle = color;
    if (derecha) g.fillRect(x + w * (1 - p), y, w * p, h); else g.fillRect(x, y, w * p, h);
    g.strokeStyle = "rgba(255,255,255,.7)"; g.lineWidth = 2; g.strokeRect(x, y, w, h);
  }

  function texto(t, x, y, tam, color, align = "center") {
    g.font = `900 ${tam}px Nunito, sans-serif`; g.textAlign = align; g.textBaseline = "middle";
    g.lineWidth = Math.max(3, tam / 8); g.strokeStyle = "rgba(0,0,0,.65)"; g.strokeText(t, x, y);
    g.fillStyle = color; g.fillText(t, x, y);
  }

  function dibujar() {
    const yo = S.yo, J = S.J;
    g.save();
    if (S.temblor > 0) g.translate(azar(-7, 7), azar(-7, 7));

    // fondo
    const fondo = g.createLinearGradient(0, 0, 0, H);
    fondo.addColorStop(0, J.furia ? "#3a1030" : "#141c52"); fondo.addColorStop(1, J.furia ? "#6a1a3a" : "#3a2a7a");
    g.fillStyle = fondo; g.fillRect(-10, -10, W + 20, H + 20);
    g.strokeStyle = "rgba(255,255,255,.06)"; g.lineWidth = 1;
    for (let x = 0; x < W; x += 40) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, SUELO); g.stroke(); }
    g.fillStyle = "rgba(255,255,255,.05)"; g.font = "bold 16px monospace"; g.textAlign = "left"; g.textBaseline = "top";
    const codigo = "01001 if(bug){ fix(); } 10110 while(true){ aprender(); } 0110 ";
    for (let r = 0; r < 8; r++) g.fillText(codigo.slice(r * 3) + codigo, 10 - (S.t * 20 % 40), 100 + r * 40);
    g.fillStyle = "#f5a623"; g.fillRect(0, SUELO, W, 6);
    g.fillStyle = "#1c2667"; g.fillRect(0, SUELO + 6, W, H - SUELO);

    // sombras
    g.fillStyle = "rgba(0,0,0,.35)";
    g.beginPath(); g.ellipse(yo.x, SUELO + 4, 34, 8, 0, 0, Math.PI * 2); g.fill();
    const sj = J.tam * .4 * Math.max(.4, 1 - (SUELO - J.y) / 500);
    g.beginPath(); g.ellipse(J.x, SUELO + 4, sj, 10, 0, 0, Math.PI * 2); g.fill();

    // ondas expansivas
    S.ondas.forEach(o => {
      g.fillStyle = "rgba(245,166,35,.85)";
      g.beginPath(); g.ellipse(o.x, SUELO - 6, 26, 16, 0, Math.PI, 0); g.fill();
      emoji("💥", o.x, SUELO + 4, 30);
    });

    // objetos
    S.items.forEach(it => {
      const parp = it.t > 5 && Math.floor(it.t * 8) % 2 === 0;
      if (!parp) emoji(it.tipo === "vida" ? "❤️" : "⚡", it.x, it.y + 10 + Math.sin(it.t * 6) * 4, 40);
    });

    // jefe
    const jdir = -J.dir;
    if (S.fase === "final" && S.gane) {
      emoji(S.jefe.emoji, J.x, J.y + S.faseT * 80, J.tam * Math.max(.1, 1 - S.faseT * .6), jdir, Math.max(0, 1 - S.faseT));
    } else {
      g.save();
      if (J.estado === "carga" || J.furia) { g.shadowColor = "red"; g.shadowBlur = J.estado === "carga" ? 45 : 20; }
      const latido = J.estado === "carga" ? 1 + Math.sin(S.t * 30) * .05 : 1;
      emoji(S.jefe.emoji, J.x, J.y, J.tam * latido, jdir, J.flash > 0 ? .5 : 1);
      g.restore();
      if (J.estado === "carga") texto("⚠️ ¡CUIDADO!", J.x, J.y - J.tam - 16, 26, "#ff5a5f");
      if (J.estado === "disparo" && J.estT < .35) texto("🎯", J.x, J.y - J.tam - 16, 30, "#fff");
      if (J.estado === "salto") texto("⬇️ ¡SALTA!", S.yo.x, SUELO - 190, 24, "#f5a623");
      if (J.estado === "escudo") emoji("🛡️", J.x + J.dir * J.tam * .45, J.y - J.tam * .25, J.tam * .6);
      if (J.estado === "golpe" && J.estT < .2) emoji("💥", J.x + J.dir * J.tam * .55, J.y - J.tam * .3, 64);
    }

    // estela del dash
    S.estela.forEach(e => emoji("🦸", e.x, e.y, 84, -e.dir, .3 * (1 - e.t / .18)));

    // jugador
    const parpadeo = yo.inv > 0 && S.t >= yo.dashHasta && Math.floor(S.t * 20) % 2 === 0;
    const caido = S.fase === "final" && !S.gane;
    if (!parpadeo) emoji("🦸", yo.x, yo.y + (caido ? 20 : 0), 84, -yo.dir, caido ? .5 : 1);
    if (S.t < yo.atkHasta) emoji(yo.combo === 3 ? "💥" : "👊", yo.x + yo.dir * 64, yo.y - 30, yo.combo === 3 ? 64 : 50, -yo.dir);

    // proyectiles y rayos
    S.balas.forEach(b => emoji(S.jefe.bala, b.x, b.y + 22, 46, b.vx > 0 ? -1 : 1));
    S.rayos.forEach(r => {
      g.save(); g.shadowColor = "#f5a623"; g.shadowBlur = 25;
      texto("</>", r.x, r.y, 48, "#f5a623");
      g.restore();
    });

    // partículas y textos
    S.chispas.forEach(c => { g.globalAlpha = Math.max(0, 1 - c.t * 2); g.fillStyle = c.color; g.fillRect(c.x, c.y, 6, 6); });
    g.globalAlpha = 1;
    S.textos.forEach(t => { g.globalAlpha = Math.max(0, 1 - t.t); texto(t.texto, t.x, t.y, t.tam, t.color); });
    g.globalAlpha = 1;
    g.restore();

    /* --- HUD --- */
    barra(24, 18, 340, 22, yo.vida / VIDA_YO, "#22c07a", false);
    barra(24, 46, 220, 12, yo.energia / 100, yo.energia >= 100 ? (Math.floor(S.t * 6) % 2 ? "#f5a623" : "#ffd27a") : "#f5a623", false);
    texto("🦸 " + S.nombre, 24, 76, 20, "#fff", "left");
    if (yo.energia >= 100) texto("⚡ SÚPER LISTO", 252, 52, 16, "#f5a623", "left");
    barra(W - 364, 18, 340, 22, J.vida / J.max, J.furia ? "#ff2d55" : "#ff5a5f", true);
    texto(S.jefe.nombre + " " + S.jefe.emoji + (J.furia ? " 😡" : ""), W - 24, 56, 20, "#fff", "right");
    // tiempo
    const urgente = S.tiempo < 10;
    texto("⏱ " + Math.ceil(S.tiempo), W / 2, 32, urgente ? 34 : 28, urgente ? "#ff5a5f" : "#fff");
    // combo
    if (S.t < yo.comboHasta && yo.combo >= 2) texto("COMBO x" + yo.combo, W / 2, 72, 22, "#f5a623");

    if (S.fase === "cuenta") {
      const n = Math.min(3, Math.floor(S.faseT / 0.7));
      texto(["3", "2", "1", "¡PELEA!"][n], W / 2, H / 2 - 30, 96, "#f5a623");
    }
    if (S.fase === "final") texto(S.textoFinal, W / 2, H / 2 - 30, 90, S.gane ? "#22c07a" : "#ff5a5f");
  }

  document.addEventListener("DOMContentLoaded", botonesTactiles);
  return { iniciar, detener, pausar };
})();
