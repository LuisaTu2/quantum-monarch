// Spin visualization: vector model of the radical pair (field along the coupling axis).
// Electron 1 turns at the Larmor rate w; electron 2 at w + m*a/2 (m = nucleus up/down).
// They start opposite (singlet); P_S = cos^2(delta/2), delta = how far they drifted apart
// = cos^2(a t / 4), the exact quantum result for this case.
(function () {
  const root = document.getElementById("spin-view");
  if (!root) return;
  const el = (s) => root.querySelector(s);
  const a1 = el("#sv-a1"),
    a2 = el("#sv-a2"),
    an = el("#sv-an");
  const meter = el("#sv-meter"),
    ps = el("#sv-ps"),
    state = el("#sv-state");
  const play = el("#sv-play"),
    reset = el("#sv-reset");

  const TILT = 0.95; // cone opening (radians from the field axis)
  const L = 90; // arrow length
  const W = 1.2; // Larmor rate on screen (rad/s), shared by both electrons
  const A = 0.5; // relative rate from the nucleus on screen (rad/s), so a full beat ~ 12.6 s
  let m = 1,
    t = 0,
    running = true,
    last = null;

  // a spin on a cone around the vertical field, drawn in simple perspective
  // up = true: upper cone (electron 1); up = false: lower cone (electron 2, opposite spin)
  function tip(phi, up) {
    const x = L * Math.sin(TILT) * Math.cos(phi);
    const y = (up ? -1 : 1) * L * Math.cos(TILT) + 14 * Math.sin(phi); // 14 = the cone ellipse's ry
    return [x, y];
  }

  function draw() {
    const phi1 = W * t;
    const phi2 = Math.PI + (W + m * A) * t; // opposite cone and opposite side: singlet
    const [x1, y1] = tip(phi1, true),
      [x2, y2] = tip(phi2, false);
    a1.setAttribute("x2", x1.toFixed(1));
    a1.setAttribute("y2", y1.toFixed(1));
    a2.setAttribute("x2", x2.toFixed(1));
    a2.setAttribute("y2", y2.toFixed(1));
    an.setAttribute("y2", m > 0 ? -34 : 34);

    const drift = A * t; // how far electron 2 has drifted from "opposite"
    const p = Math.cos(drift / 2) ** 2;
    meter.setAttribute("y", (170 * (1 - p)).toFixed(1));
    meter.setAttribute("height", (170 * p).toFixed(1));
    ps.textContent = p.toFixed(2);
    state.innerHTML =
      p > 0.75
        ? "<b>in step</b>: mostly singlet"
        : p < 0.25
          ? "<b>out of step</b>: mostly triplet"
          : "<b>drifting</b>: part singlet, part triplet";
  }

  function frame(ts) {
    if (last !== null && running) t += Math.min(0.05, (ts - last) / 1000);
    last = ts;
    draw();
    requestAnimationFrame(frame);
  }

  play.addEventListener("click", () => {
    running = !running;
    play.textContent = running ? "❚❚" : "▶";
    play.setAttribute("aria-label", running ? "Pause" : "Play");
  });
  reset.addEventListener("click", () => {
    t = 0;
    draw();
  });
  root.querySelectorAll(".sv-toggle button").forEach((b) =>
    b.addEventListener("click", () => {
      root
        .querySelectorAll(".sv-toggle button")
        .forEach((x) => x.classList.toggle("is-on", x === b));
      m = +b.dataset.m;
      t = 0;
      draw();
    }),
  );

  if (
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    running = false;
    play.textContent = "▶";
  }
  draw();
  requestAnimationFrame(frame);
})();
