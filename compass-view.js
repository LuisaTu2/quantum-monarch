// 7. What Might She Sense?
// The triplet yield depends only on the angle theta between the coupling axis and the field
// (the real N5 coupling is axially symmetric), so all we need is geometry + the yield table.
(function () {
  const root = document.getElementById("compass-view");
  if (!root) return;

  // Triplet yield every 5 deg, theta = 0..90: real flavin N5 values (Smith et al. 2022),
  // Earth's field (50 uT), 1 us lifetime. Same model as Step 5b in main.py.
  const YIELD = [
    0.5966, 0.5979, 0.6018, 0.6082, 0.6167, 0.6271, 0.6389, 0.6517, 0.665,
    0.6783, 0.6913, 0.7034, 0.7144, 0.724, 0.732, 0.7383, 0.7428, 0.7455,
    0.7464,
  ];
  const YMIN = YIELD[0],
    YMAX = YIELD[YIELD.length - 1];

  const rad = (d) => (d * Math.PI) / 180,
    deg = (r) => (r * 180) / Math.PI;

  // axial coupling: theta and 180 - theta give the same signal
  function yieldAtTheta(theta) {
    const a = Math.min(theta, 180 - theta);
    const i = Math.min(Math.floor(a / 5), YIELD.length - 2);
    const f = (a - i * 5) / 5;
    return YIELD[i] + f * (YIELD[i + 1] - YIELD[i]);
  }

  // Heading phi: clockwise from north. Field: points north, dipping by `dip` below horizontal.
  // Receptor axis: along the body, tilted up by `tilt`.
  //   b = (cos t cos phi, cos t sin phi, sin t)   [north, east, up]
  //   B = (cos dip, 0, -sin dip)
  function thetaAt(phi, dip, tilt) {
    const c =
      Math.cos(rad(tilt)) * Math.cos(rad(phi)) * Math.cos(rad(dip)) -
      Math.sin(rad(tilt)) * Math.sin(rad(dip));
    return deg(Math.acos(Math.max(-1, Math.min(1, c))));
  }

  const el = (s) => root.querySelector(s);
  const slider = el("#cv-slider"),
    play = el("#cv-play");
  const bfly = el("#cv-bfly"),
    world = el("#cv-world");
  const outHeading = el("#cv-heading"),
    outAngle = el("#cv-angle"),
    outYield = el("#cv-yield");

  const NAMES = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const name = (phi) => NAMES[Math.round(phi / 45) % 8];

  function render() {
    const phi = +slider.value;
    const theta = thetaAt(phi, 0, 0); // flat field, receptor along the body
    const y = yieldAtTheta(theta);

    root.style.setProperty(
      "--wash",
      (0.04 + (0.36 * (y - YMIN)) / (YMAX - YMIN)).toFixed(3),
    );
    bfly.setAttribute("transform", `translate(80 82) rotate(${phi - 90})`);
    // panorama: heading phi sits in the middle of the view
    const P = (phi / 360) * PANO;
    const t = ((((400 - P) % PANO) + PANO) % PANO) - PANO;
    world.setAttribute("transform", `translate(${t} 0)`);

    outHeading.textContent = `${name(phi)} ${phi}°`;
    outAngle.textContent = `${Math.round(Math.min(theta, 180 - theta))}°`;
    outYield.textContent = y.toFixed(3);
  }

  // the painting: original + mirrored copy = one full turn (PANO wide); then repeat once more to wrap
  const NS = "http://www.w3.org/2000/svg";
  const pano = el("#cv-pano");
  const W = 500 * (+pano.dataset.ratio || 1.5); // painting drawn 500 tall
  const PANO = 2 * W;
  const img = (x, flip) => {
    const i = document.createElementNS(NS, "image");
    i.setAttribute("href", pano.dataset.src);
    i.setAttribute("width", W + 1);
    i.setAttribute("height", 500);
    i.setAttribute("preserveAspectRatio", "none");
    i.setAttribute(
      "transform",
      flip ? `translate(${x + W} 0) scale(-1 1)` : `translate(${x} 0)`,
    );
    return i;
  };
  for (let k = 0; k < 2; k++)
    pano.append(img(k * PANO, false), img(k * PANO + W, true));
  const card = document.createElementNS(NS, "g");
  card.setAttribute("class", "cv-cardinals");
  for (let k = 0; k < 2; k++)
    ["N", "E", "S", "W"].forEach((n, q) => {
      const t = document.createElementNS(NS, "text");
      t.setAttribute("x", k * PANO + (q * PANO) / 4);
      t.setAttribute("y", 60);
      t.textContent = n;
      card.appendChild(t);
    });
  pano.appendChild(card);

  // controls
  slider.addEventListener("input", () => {
    stop();
    render();
  });

  let timer = null;
  function stop() {
    clearInterval(timer);
    timer = null;
    play.textContent = "▶";
  }
  play.addEventListener("click", () => {
    if (timer) return stop();
    play.textContent = "❚❚";
    timer = setInterval(() => {
      slider.value = (+slider.value + 1) % 360;
      render();
    }, 70); // gentle turn, about 25 s per circle
  });

  render();
})();
