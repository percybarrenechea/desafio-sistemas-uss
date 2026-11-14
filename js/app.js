/* =========================================================
   ¿Sí o No? — cartas + vidas + peleas contra jefes + ranking
   - Registras tu nombre y respondes cartas (SÍ / NO).
   - Tienes 3 vidas: cada respuesta incorrecta te quita una y
     NO se recuperan. Sin vidas -> fin del juego y ranking.
   - A los 40 pts aparece el primer jefe; luego uno más fuerte
     cada 50 pts (100, 150, ...). El jefe final está en 400.
   - Si pierdes la pelea: pregunta de rescate.
       acierto -> revancha · error -> fin del juego y ranking.
   - Gana quien llega a 400 pts y derrota al jefe final.
   ========================================================= */
(() => {
  const $ = s => document.querySelector(s);
  const RANK_KEY = "uss-sino-ranking";
  const VIDAS = 3;
  // segundos para responder cada carta: baja con cada jefe vencido
  const tiempoCarta = () => Math.max(5, 9 - J.vencidos * .5);
  // después de vencer al primer jefe ya no hay vidas: un error = fin
  const sinVidas = () => J.vencidos >= 1;

  let J = null;   // partida actual
  const nuevaPartida = nombre => ({
    nombre, puntos: 0, racha: 0, vidas: VIDAS, jefe: 0, vencidos: 0,
    mazo: [], esperando: false, rescate: false, siguiente: null, id: Date.now()
  });

  const mezclar = a => a.map(v => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map(x => x[1]);

  function mostrar(id) {
    document.querySelectorAll(".pantalla").forEach(p => p.classList.toggle("activa", p.id === id));
    window.scrollTo(0, 0);
  }

  /* ---------- Sonidos generados (sin archivos) ---------- */
  let audio;
  function tono(notas, tipo = "triangle", vol = .12, dur = .14) {
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      notas.forEach((f, k) => {
        const o = audio.createOscillator(), g = audio.createGain(), t = audio.currentTime + k * .1;
        o.type = tipo; o.frequency.value = f;
        g.gain.setValueAtTime(vol, t);
        g.gain.exponentialRampToValueAtTime(.001, t + dur);
        o.connect(g).connect(audio.destination);
        o.start(t); o.stop(t + dur + .02);
      });
    } catch (_) {}
  }
  const SONIDOS = {
    bien: () => tono([660, 880]),
    mal: () => tono([220, 160], "square", .08),
    jefe: () => tono([200, 150, 100], "sawtooth", .1, .2),
    tic: () => tono([440]),
    go: () => tono([880, 1100]),
    golpe: () => tono([180], "square", .08, .07),
    critico: () => tono([300, 600], "sawtooth", .08, .1),
    aire: () => tono([500], "sine", .04, .05),
    salto: () => tono([350, 520], "sine", .06, .08),
    herido: () => tono([120, 90], "sawtooth", .1, .15),
    alerta: () => tono([760, 760], "square", .05, .06),
    disparo: () => tono([260], "triangle", .06, .08),
    victoria: () => tono([523, 659, 784, 1046], "triangle", .14, .2),
    derrota: () => tono([300, 220, 150], "sawtooth", .1, .25)
  };
  const sonar = n => SONIDOS[n] && SONIDOS[n]();

  /* =======================================================
     Ranking (se guarda en este navegador)
     ======================================================= */
  /* Dos rankings:
     - Compartido (en la página publicada): una base de datos donde todos
       los jugadores ven los mismos puntajes. Cada cuenta guarda sus
       partidas en su propio documento: ranking/<id de la cuenta>.
     - Local (respaldo): se usa si no hay base compartida, por ejemplo al
       abrir el juego desde la carpeta o sin sesión iniciada. */
  const ordenar = r => r.sort((a, b) => (b.w - a.w) || (b.p - a.p) || (b.j - a.j));
  const nube = { db: null, uid: null, puedeEscribir: true, partidas: [], listo: false };

  function leerLocal() {
    try { return JSON.parse(localStorage.getItem(RANK_KEY)) || []; } catch (_) { return []; }
  }
  function leerRanking() {
    return nube.listo ? ordenar(nube.partidas.slice()) : ordenar(leerLocal());
  }
  function guardarEnRanking() {
    const entrada = { n: J.nombre.slice(0, 15), p: J.puntos, j: J.vencidos, w: !!J.gano, id: J.id };
    const r = leerLocal();
    r.push(entrada);
    try { localStorage.setItem(RANK_KEY, JSON.stringify(ordenar(r).slice(0, 50))); } catch (_) {}
    if (nube.listo && nube.puedeEscribir) {
      nube.partidas.push(entrada);           // se muestra al instante
      guardarEnNube(entrada);
    }
  }

  // Una escritura a la vez a nuestro documento
  let colaNube = Promise.resolve();
  function guardarEnNube(entrada) {
    colaNube = colaNube.then(async () => {
      const ref = nube.db.collection("ranking").doc(nube.uid);
      try {
        const snap = await ref.get();
        const mias = (snap.exists && Array.isArray(snap.data().partidas)) ? snap.data().partidas : [];
        const nuevas = ordenar([...mias.filter(e => e.id !== entrada.id), entrada]).slice(0, 20);
        await ref.set({ partidas: nuevas });
      } catch (e) {
        nube.puedeEscribir = false;
        nube.partidas = nube.partidas.filter(e2 => e2.id !== entrada.id);
        avisoRanking("📱 Tu puntaje se guardó solo en este dispositivo (no tienes permiso para el ranking compartido).");
        repintarRankings();
      }
    });
  }

  function avisoRanking(txt) {
    document.querySelectorAll(".ranking-estado").forEach(el => el.textContent = txt);
  }
  function repintarRankings() {
    pintarRanking("#ranking-inicio");
    if (J) pintarRanking("#ranking-fin", J.id);
  }

  async function conectarRankingCompartido() {
    if (!window.claude || !window.claude.use) { avisoRanking("📱 Ranking de este dispositivo"); return; }
    avisoRanking("🌐 Conectando con el ranking compartido…");
    try {
      const [db, user] = await Promise.all([window.claude.use("db"), window.claude.use("user")]);
      if (!db || !user) { avisoRanking("📱 Ranking de este dispositivo (inicia sesión en Claude para el ranking compartido)"); return; }
      nube.db = db;
      nube.uid = await user.id();
      if ((await user.can("data.write")) === false) nube.puedeEscribir = false;
      const espera = setTimeout(() => { if (!nube.listo) avisoRanking("📱 No se pudo conectar al ranking compartido; se muestra el de este dispositivo."); }, 10000);
      db.collection("ranking").onSnapshot(snap => {
        clearTimeout(espera);
        const todas = [];
        snap.docs.forEach(d => {
          const lista = d.data() && d.data().partidas;
          if (Array.isArray(lista)) lista.forEach(e => {
            if (e && typeof e.n === "string" && typeof e.p === "number") todas.push(e);
          });
        });
        // conservar lo recién jugado que aún no confirma la base
        nube.partidas.forEach(e => { if (!todas.some(t => t.id === e.id)) todas.push(e); });
        nube.partidas = todas;
        nube.listo = true;
        avisoRanking(nube.puedeEscribir ? "🌐 Ranking compartido: todos ven los mismos puntajes"
                                        : "🌐 Ranking compartido (solo lectura: tus puntajes se guardan en este dispositivo)");
        repintarRankings();
      }, () => {
        clearTimeout(espera);
        avisoRanking("📱 Ranking de este dispositivo");
      });
    } catch (_) {
      avisoRanking("📱 Ranking de este dispositivo");
    }
  }
  const escapar = s => s.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  function pintarRanking(sel, idActual) {
    const r = leerRanking().slice(0, 10);
    const medallas = ["🥇", "🥈", "🥉"];
    $(sel).innerHTML = r.length
      ? r.map((e, k) => `
        <li class="${e.id === idActual ? "yo" : ""}">
          <span class="pos">${medallas[k] || k + 1}</span>
          <span>${e.w ? "👑 " : ""}${escapar(e.n)}</span>
          <span class="jefes" title="Jefes derrotados">${e.j ? "👾×" + e.j : ""}</span>
          <span class="pts">${e.p} pts</span>
        </li>`).join("")
      : `<li class="sin-datos">Aún nadie juega. ¡Sé el primero!</li>`;
  }

  /* =======================================================
     Inicio / registro
     ======================================================= */
  // Cada partida empieza escribiendo un nombre (se puede repetir el mismo nombre)
  $("#nombre").value = "";
  pintarRanking("#ranking-inicio");
  conectarRankingCompartido();

  $("#registro").addEventListener("submit", e => {
    e.preventDefault();
    const nombre = $("#nombre").value.trim();
    if (!nombre) { $("#nombre").focus(); return; }
    J = nuevaPartida(nombre);
    $("#jugador").textContent = "🦸 " + nombre;
    actualizarMarcador();
    mostrar("juego");
    siguienteCarta();
  });

  /* =======================================================
     Cartas
     ======================================================= */
  function sacarCarta() {
    if (!J.mazo.length) {
      J.mazo = mezclar([
        ...CARTAS_SI.map(c => ({ ...c, si: true })),
        ...CARTAS_NO.map(c => ({ ...c, si: false }))
      ]);
    }
    return J.mazo.pop();
  }

  function pintarVidas() {
    const v = $("#vidas");
    if (sinVidas()) {
      v.textContent = "☠️ 1 error = fin";
      v.classList.add("sin-vidas");
      v.title = "Después del primer jefe ya no tienes vidas";
    } else {
      v.textContent = "❤️".repeat(J.vidas) + "🖤".repeat(VIDAS - J.vidas);
      v.classList.remove("sin-vidas");
      v.title = "Vidas";
    }
  }

  function actualizarMarcador() {
    $("#puntos").textContent = J.puntos;
    $("#racha").textContent = J.racha >= 2 ? `🔥x${J.racha}` : "";
    pintarVidas();
    const jefe = JEFES[J.jefe];
    if (jefe) {
      const desde = J.jefe ? JEFES[J.jefe - 1].umbral : 0;
      const pct = Math.max(0, Math.min(100, (J.puntos - desde) / (jefe.umbral - desde) * 100));
      $("#barra").style.width = pct + "%";
      $("#proximo-txt").textContent = `${jefe.final ? "JEFE FINAL" : "Jefe"} ${jefe.emoji} a los ${jefe.umbral} pts`;
    }
  }

  let cartaActual = null;
  function siguienteCarta() {
    cartaActual = sacarCarta();
    $("#carta-emoji").textContent = cartaActual.emoji;
    $("#carta-texto").textContent = cartaActual.texto;
    $("#respuesta").hidden = true;
    $("#rescate-banner").hidden = !J.rescate;
    const carta = $("#carta");
    carta.hidden = false;
    carta.style.transform = "";
    carta.style.opacity = "";
    marcarSellos(0);
    carta.classList.remove("entra"); void carta.offsetWidth; carta.classList.add("entra");
    $("#pregunta").style.visibility = "visible";
    $("#controles").classList.remove("oculto");
    J.esperando = true;
    iniciarReloj();
  }

  /* ---------- Reloj de cada carta ---------- */
  let reloj = 0;
  function iniciarReloj() {
    clearInterval(reloj);
    const total = tiempoCarta(), inicio = performance.now();
    const barra = $("#reloj-barra"), num = $("#reloj-num");
    const tic = () => {
      const quedan = Math.max(0, total - (performance.now() - inicio) / 1000);
      barra.style.width = (quedan / total * 100) + "%";
      barra.classList.toggle("urgente", quedan < 3);
      num.textContent = Math.ceil(quedan);
      if (quedan <= 0) { clearInterval(reloj); responder(null); }
    };
    tic();
    reloj = setInterval(tic, 100);
  }

  function responder(dijoSi) {
    if (!J || !J.esperando) return;
    J.esperando = false;
    clearInterval(reloj);
    const c = cartaActual;
    const sinTiempo = dijoSi === null;
    const bien = !sinTiempo && dijoSi === c.si;

    const carta = $("#carta");
    carta.style.transform = sinTiempo ? "translateY(60%) scale(.6)"
      : `translateX(${dijoSi ? 140 : -140}%) rotate(${dijoSi ? 25 : -25}deg)`;
    carta.style.opacity = "0";
    sonar(bien ? "bien" : "mal");

    let boton = "Siguiente →", alerta = "";
    if (J.rescate) {
      // pregunta de rescate después de perder contra un jefe
      J.rescate = false;
      if (bien) {
        boton = "⚔️ ¡REVANCHA!";
        alerta = `¡Salvado! Otra oportunidad contra ${JEFES[J.jefe].emoji} ${JEFES[J.jefe].nombre}`;
        J.siguiente = empezarPelea;
      } else {
        boton = "🏆 Ver mi ranking";
        alerta = "💥 Fallaste la pregunta de rescate… ¡fin del juego!";
        J.siguiente = finDelJuego;
      }
    } else if (bien) {
      J.racha++;
      J.puntos += 10 + (J.racha >= 2 ? 5 : 0);
      const jefe = JEFES[J.jefe];
      if (jefe && J.puntos >= jefe.umbral) {
        boton = "⚔️ ¡A PELEAR!";
        alerta = `⚠️ ¡Apareció ${jefe.final ? "el JEFE FINAL" : "un jefe"}: ${jefe.emoji} ${jefe.nombre}!`;
        J.siguiente = empezarPelea;
        sonar("jefe");
      } else {
        J.siguiente = siguienteCarta;
      }
    } else {
      // respuesta incorrecta (o sin tiempo)
      J.racha = 0;
      const v = $("#vidas");
      v.classList.remove("pierde"); void v.offsetWidth; v.classList.add("pierde");
      const motivo = sinTiempo ? "⏰ ¡Se acabó el tiempo! " : "";
      if (sinVidas()) {
        // después del primer jefe: un solo error termina el juego
        boton = "🏆 Ver mi ranking";
        alerta = motivo + "☠️ Después del primer jefe no hay vidas… ¡fin del juego!";
        J.siguiente = finDelJuego;
      } else {
        J.vidas--;
        if (J.vidas <= 0) {
          boton = "🏆 Ver mi ranking";
          alerta = motivo + "💀 ¡Te quedaste sin vidas! Fin del juego.";
          J.siguiente = finDelJuego;
        } else {
          alerta = motivo + `💔 Perdiste una vida. Te ${J.vidas === 1 ? "queda 1 vida" : `quedan ${J.vidas} vidas`}.`;
          J.siguiente = siguienteCarta;
        }
      }
    }
    actualizarMarcador();

    setTimeout(() => {
      carta.hidden = true;
      $("#rescate-banner").hidden = true;
      $("#pregunta").style.visibility = "hidden";
      $("#controles").classList.add("oculto");
      const t = $("#resp-titulo");
      if (sinTiempo) {
        t.textContent = "⏰ ¡Muy lento!";
        $("#resp-curso").innerHTML = "";
      } else if (c.si) {
        t.textContent = bien ? "✅ ¡Sí puede!" : "😮 ¡Sí puede!";
        $("#resp-curso").innerHTML = c.ciclo === "USS"
          ? `<small>Por qué estudiar en la USS</small>${c.curso}`
          : `<small>Lo aprendes en</small>${c.curso}<small>Ciclo ${c.ciclo}</small>`;
      } else {
        t.textContent = bien ? "✅ ¡Correcto, no!" : "❌ ¡No!";
        $("#resp-curso").innerHTML = "";
      }
      t.className = "resp-titulo " + (bien ? "bien" : "mal");
      $("#resp-texto").textContent = sinTiempo
        ? `La respuesta era ${c.si ? "SÍ" : "NO"}. ${c.explica}`
        : c.explica;
      $("#resp-alerta").hidden = !alerta;
      $("#resp-alerta").textContent = alerta;
      $("#btn-sig").textContent = boton;
      $("#respuesta").hidden = false;
      $("#btn-sig").focus();
    }, 280);
  }

  /* ---------- Deslizar la carta ---------- */
  function marcarSellos(dx) {
    $(".sello-si").style.opacity = Math.max(0, Math.min(1, dx / 90));
    $(".sello-no").style.opacity = Math.max(0, Math.min(1, -dx / 90));
  }
  const cartaEl = $("#carta");
  let inicioX = null;
  cartaEl.addEventListener("pointerdown", e => {
    if (!J || !J.esperando) return;
    inicioX = e.clientX;
    cartaEl.setPointerCapture(e.pointerId);
    cartaEl.classList.add("arrastrando");
  });
  cartaEl.addEventListener("pointermove", e => {
    if (inicioX === null) return;
    const dx = e.clientX - inicioX;
    cartaEl.style.transform = `translateX(${dx}px) rotate(${dx / 15}deg)`;
    marcarSellos(dx);
  });
  const soltarCarta = e => {
    if (inicioX === null) return;
    const dx = e.clientX - inicioX;
    inicioX = null;
    cartaEl.classList.remove("arrastrando");
    if (Math.abs(dx) > 90) responder(dx > 0);
    else { cartaEl.style.transform = ""; marcarSellos(0); }
  };
  cartaEl.addEventListener("pointerup", soltarCarta);
  cartaEl.addEventListener("pointercancel", soltarCarta);

  $("#btn-si").onclick = () => responder(true);
  $("#btn-no").onclick = () => responder(false);
  $("#btn-sig").onclick = () => { const f = J && J.siguiente; if (!f) return; J.siguiente = null; f(); };
  // Salir con ✕ o con el logo: se guardan los puntos en el ranking
  // Confirmación dentro de la página (las páginas publicadas no muestran confirm())
  function salir() {
    if (!J || $("#fin").classList.contains("activa") || !$("#modal").hidden) return;
    const enCarta = J.esperando;
    clearInterval(reloj);           // pausa el reloj de la carta
    Pelea.pausar(true);             // pausa la pelea
    modal("🚪", "¿Salir de la partida?", `Tus ${J.puntos} puntos se guardarán en el ranking.`, "",
      "Sí, salir", () => finDelJuego(),
      () => { Pelea.pausar(false); if (enCarta) iniciarReloj(); });
  }
  $("#btn-salir").onclick = salir;
  $("#btn-logo").onclick = salir;
  $("#btn-salir-pelea").onclick = salir;

  // Teclado en las cartas: ← NO · → SÍ
  document.addEventListener("keydown", e => {
    if (!$("#juego").classList.contains("activa") || !$("#modal").hidden) return;
    if ($("#respuesta").hidden) {
      if (e.key === "ArrowRight") responder(true);
      if (e.key === "ArrowLeft") responder(false);
    }
  });

  /* =======================================================
     Pelea (ver js/pelea.js)
     ======================================================= */
  function empezarPelea() {
    const jefe = JEFES[J.jefe];
    mostrar("pelea");
    if (document.activeElement) document.activeElement.blur();   // que ESPACIO no active botones
    Pelea.iniciar({
      jefe, nivel: J.jefe, nombre: J.nombre, sonido: sonar,
      alTerminar: gane => gane ? ganePelea(jefe) : perdiPelea(jefe)
    });
  }

  function ganePelea(jefe) {
    J.vencidos++;
    J.jefe++;
    confeti();
    if (jefe.final) {
      J.gano = true;
      return modal("👑", "¡GANASTE EL JUEGO!",
        `Llegaste a ${J.puntos} pts y derrotaste a ${jefe.emoji} ${jefe.nombre}. ¡Eres un verdadero Ingeniero de Sistemas!`,
        jefe.dato, "🏆 Ver el ranking", finDelJuego);
    }
    const prox = JEFES[J.jefe];
    modal("🏆", `¡Derrotaste a ${jefe.nombre}!`,
      (J.vencidos === 1 ? "☠️ ¡OJO! Desde ahora ya no tienes vidas: UN SOLO ERROR termina el juego. " : "") +
      `El próximo jefe ${prox.emoji} aparece a los ${prox.umbral} pts… y es más fuerte.`,
      "💡 " + jefe.dato, "Seguir respondiendo →",
      () => { actualizarMarcador(); mostrar("juego"); siguienteCarta(); });
  }

  function perdiPelea(jefe) {
    modal("💥", `${jefe.emoji} ${jefe.nombre} te derrotó`,
      "¡Aún no termina! Responde la PREGUNTA DE RESCATE: si aciertas tienes revancha, si fallas se acaba el juego.",
      "", "🆘 Pregunta de rescate",
      () => { J.rescate = true; actualizarMarcador(); mostrar("juego"); siguienteCarta(); });
  }

  /* =======================================================
     Modal y fin del juego
     ======================================================= */
  function modal(emoji, titulo, texto, dato, boton, alCerrar, alCancelar) {
    $("#modal-emoji").textContent = emoji;
    $("#modal-titulo").textContent = titulo;
    $("#modal-texto").textContent = texto;
    $("#modal-dato").textContent = dato || "";
    const b = $("#modal-btn"), c = $("#modal-cancelar");
    b.textContent = boton;
    // se habilita tras un momento para que un ESPACIO de la pelea no lo active sin querer
    b.disabled = true;
    setTimeout(() => { b.disabled = false; b.focus(); }, alCancelar ? 150 : 700);
    c.hidden = !alCancelar;
    $("#modal").hidden = false;
    b.onclick = () => { $("#modal").hidden = true; alCerrar(); };
    c.onclick = () => { $("#modal").hidden = true; alCancelar && alCancelar(); };
  }

  function finDelJuego() {
    clearInterval(reloj);
    Pelea.detener();
    guardarEnRanking();
    const pos = leerRanking().findIndex(e => e.id === J.id) + 1;
    $("#fin-emoji").textContent = J.gano ? "👑" : pos && pos <= 3 ? "🏆" : "🎮";
    $("#fin-titulo").textContent = J.gano ? `¡${J.nombre}, eres el campeón!` : `¡Buen juego, ${J.nombre}!`;
    $("#fin-resumen").innerHTML = `<b>${J.puntos}</b> puntos · <b>${J.vencidos}</b> jefe${J.vencidos === 1 ? "" : "s"} derrotado${J.vencidos === 1 ? "" : "s"}${pos ? ` · puesto <b>#${pos}</b>` : ""}`;
    pintarRanking("#ranking-fin", J.id);
    J.esperando = false;
    mostrar("fin");
    if (J.gano || pos === 1) confeti();
  }

  $("#btn-otra").onclick = () => {
    Pelea.detener();
    clearInterval(reloj);
    J = null;
    pintarRanking("#ranking-inicio");
    $("#nombre").value = "";          // para volver a jugar se escribe un nombre (puede ser el mismo)
    mostrar("inicio");
    $("#nombre").focus();
  };

  /* ---------- Confeti ---------- */
  function confeti() {
    const cv = $("#confeti"), g = cv.getContext("2d");
    cv.width = innerWidth; cv.height = innerHeight;
    const colores = ["#f5a623", "#22c07a", "#4a63d8", "#ff5a5f", "#ffffff"];
    const ps = Array.from({ length: 160 }, () => ({
      x: Math.random() * cv.width, y: -20 - Math.random() * cv.height * .5,
      vx: (Math.random() - .5) * 3, vy: 2 + Math.random() * 4, s: 5 + Math.random() * 7,
      r: Math.random() * 6, vr: (Math.random() - .5) * .3, c: colores[Math.floor(Math.random() * colores.length)]
    }));
    const t0 = performance.now();
    (function frame(t) {
      g.clearRect(0, 0, cv.width, cv.height);
      ps.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.vy += .05; p.r += p.vr;
        g.save(); g.translate(p.x, p.y); g.rotate(p.r);
        g.fillStyle = p.c; g.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); g.restore();
      });
      if (t - t0 < 3000) requestAnimationFrame(frame); else g.clearRect(0, 0, cv.width, cv.height);
    })(t0);
  }
})();
