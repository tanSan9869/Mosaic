// Little Joys parent guidance companion — prototype
// Vanilla JS, hash-routed, persisted to localStorage so the "one-time
// child profile" and feedback actually persist across visits on this device.

const store = {
  get(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch { return fallback; }
  },
  set(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
};

const DEFAULT_FEEDBACK = [
  { topic: "millet-noodles", text: "I only use half the tastemaker sachet for my 2-year-old and add grated carrot — works well and isn't too salty." },
  { topic: "dosage", text: "Wished the pack said a portion in 'cups' instead of grams — had to guess the first few times." },
  { topic: "veggie-puffs", text: "My son eats these dry straight from the box in the car, no mess, which solved snack-time for us." }
];

function getProfile() { return store.get("lj_profile", null); }
function setProfile(p) { store.set("lj_profile", p); }
function getTrial() { return store.get("lj_trial", []); }
function setTrial(t) { store.set("lj_trial", t); }
function getSubs() { return store.get("lj_subs", {}); }
function setSubs(s) { store.set("lj_subs", s); }
function getFeedback() { return store.get("lj_feedback", DEFAULT_FEEDBACK); }
function setFeedback(f) { store.set("lj_feedback", f); }

const app = document.getElementById("app");

function render() {
  const hash = location.hash || "#/";
  document.querySelectorAll(".topnav a").forEach(a => {
    a.classList.toggle("active", hash.startsWith("#/" + a.dataset.nav));
  });

  if (hash === "#/" || hash === "") return renderHome();
  if (hash === "#/profile") return renderProfile();
  if (hash.startsWith("#/product/")) return renderProduct(hash.split("/")[2]);
  if (hash === "#/trial") return renderTrial();
  if (hash === "#/subscribe") return renderSubscribe();
  if (hash === "#/feedback") return renderFeedback();
  renderHome();
}

window.addEventListener("hashchange", render);
window.addEventListener("DOMContentLoaded", render);

/* ---------------- Home ---------------- */

function renderHome() {
  const tpl = document.getElementById("tpl-home").content.cloneNode(true);
  const grid = tpl.getElementById("product-grid");

  PRODUCTS.forEach(p => {
    const card = document.createElement("button");
    card.className = "product-card";
    card.innerHTML = `
      <span class="product-kind">${p.kind === "staple" ? "Meal staple" : "Snack"}</span>
      <h3>${p.name}</h3>
      <p class="muted small">${p.tagline}</p>
      <div class="product-tags">${p.contains.map(c => `<span class="tag">${c}</span>`).join("")}</div>
      <span class="card-cta">See guidance for my child →</span>
    `;
    card.addEventListener("click", () => location.hash = "#/product/" + p.id);
    grid.appendChild(card);
  });

  app.innerHTML = "";
  app.appendChild(tpl);

  if (!getProfile()) {
    document.getElementById("profile-nudge").hidden = false;
  }
}

/* ---------------- Profile ---------------- */

function renderProfile() {
  const tpl = document.getElementById("tpl-profile").content.cloneNode(true);
  app.innerHTML = "";
  app.appendChild(tpl);

  const existing = getProfile() || { ageBand: null, avoid: [] };

  document.getElementById("child-name").value = existing.name || "";
  document.getElementById("notes").value = existing.notes || "";

  const ageRow = document.getElementById("age-band-row");
  [...ageRow.children].forEach(chip => {
    chip.classList.toggle("selected", chip.dataset.value === existing.ageBand);
    chip.addEventListener("click", () => {
      [...ageRow.children].forEach(c => c.classList.remove("selected"));
      chip.classList.add("selected");
    });
  });

  const avoidRow = document.getElementById("allergen-row");
  [...avoidRow.children].forEach(chip => {
    chip.classList.toggle("selected", (existing.avoid || []).includes(chip.dataset.value));
    chip.addEventListener("click", () => chip.classList.toggle("selected"));
  });

  document.getElementById("profile-form").addEventListener("submit", e => {
    e.preventDefault();
    const ageBand = ageRow.querySelector(".chip.selected")?.dataset.value || null;
    const avoid = [...avoidRow.querySelectorAll(".chip.selected")].map(c => c.dataset.value);
    const profile = {
      name: document.getElementById("child-name").value.trim(),
      notes: document.getElementById("notes").value.trim(),
      ageBand, avoid
    };
    setProfile(profile);
    const confirm = document.getElementById("save-confirm");
    confirm.hidden = false;
    setTimeout(() => confirm.hidden = true, 2500);
  });
}

/* ---------------- Product guidance ---------------- */

function renderProduct(id) {
  const product = PRODUCTS.find(p => p.id === id);
  if (!product) return renderHome();

  const tpl = document.getElementById("tpl-product").content.cloneNode(true);
  app.innerHTML = "";
  app.appendChild(tpl);

  document.getElementById("product-header").innerHTML = `
    <p class="eyebrow">${product.kind === "staple" ? "Meal staple" : "Snack"}</p>
    <h1>${product.name}</h1>
    <p class="muted">${product.tagline}</p>
  `;

  const profile = getProfile();
  const stack = document.getElementById("guidance-stack");
  const result = getSuitability(product, profile);

  if (result.verdict === "no-profile") {
    stack.innerHTML = `
      <div class="verdict-card no-profile">
        <p class="verdict-label">No child profile yet</p>
        <h2>Set up your child's profile to see personal guidance</h2>
        <p>Once we know their age band and anything to avoid, this screen will tell you a suitable serving size, how often, and how to prepare it.</p>
        <a class="btn btn-primary" href="#/profile">Set up profile</a>
      </div>`;
    return;
  }

  if (result.verdict === "too-young") {
    stack.innerHTML = `
      <div class="verdict-card too-young">
        <p class="verdict-label">Not yet suitable</p>
        <h2>Hold off on ${product.name} for now</h2>
        <ul class="verdict-reasons">${result.reasons.map(r => `<li>${r}</li>`).join("")}</ul>
      </div>`;
    return;
  }

  const verdictCopy = result.verdict === "caution"
    ? { label: "Suitable, with one thing to know", title: `Yes, with a small adjustment` }
    : { label: `Suitable for ${ageBandLabel(profile.ageBand)}`, title: `Good to go for ${profile.name || "your child"}` };

  let html = `
    <div class="verdict-card ${result.verdict}">
      <p class="verdict-label">${verdictCopy.label}</p>
      <h2>${verdictCopy.title}</h2>
      ${result.reasons.length ? `<ul class="verdict-reasons">${result.reasons.map(r => `<li>${r}</li>`).join("")}</ul>` : ""}
    </div>

    <div class="card">
      <h3>Serving guidance</h3>
      <div class="serving-grid">
        <div class="serving-item"><div class="k">Amount</div><div class="v">${result.serving.amount}</div></div>
        <div class="serving-item"><div class="k">How often</div><div class="v">${result.serving.perWeek}</div></div>
      </div>
    </div>

    <div class="card">
      <h3>At the point of use</h3>
      <div class="prep-note">${result.serving.prep}</div>
      ${product.tastemakerNote ? `<p class="muted small" style="margin-top:14px;">${product.tastemakerNote}</p>` : ""}
    </div>
  `;

  stack.innerHTML = html;
}

/* ---------------- Trial / sampler ---------------- */

function renderTrial() {
  const tpl = document.getElementById("tpl-trial").content.cloneNode(true);
  app.innerHTML = "";
  app.appendChild(tpl);

  const picker = document.getElementById("trial-picker");
  const wrap = document.createElement("div");
  wrap.className = "product-grid";
  picker.appendChild(wrap);

  function draw() {
    wrap.innerHTML = "";
    const cart = getTrial();
    PRODUCTS.forEach(p => {
      const card = document.createElement("div");
      card.className = "trial-pick-card";
      const added = cart.includes(p.id);
      card.innerHTML = `
        <div class="info"><strong>${p.name}</strong><span class="muted small">${p.tagline}</span></div>
        <button class="btn ${added ? '' : 'btn-primary'}" ${cart.length >= 3 && !added ? "disabled" : ""}>${added ? "Added ✓" : "Add"}</button>
      `;
      card.querySelector("button").addEventListener("click", () => {
        let c = getTrial();
        if (c.includes(p.id)) c = c.filter(x => x !== p.id);
        else if (c.length < 3) c = [...c, p.id];
        setTrial(c);
        draw();
        drawCart();
      });
      wrap.appendChild(card);
    });
  }

  const cartList = document.getElementById("trial-cart-list");
  const emptyMsg = document.getElementById("trial-empty");
  const confirmBtn = document.getElementById("trial-confirm");

  function drawCart() {
    const cart = getTrial();
    cartList.innerHTML = "";
    cart.forEach(id => {
      const p = PRODUCTS.find(x => x.id === id);
      const li = document.createElement("li");
      li.innerHTML = `<span>${p.name}</span><button type="button">Remove</button>`;
      li.querySelector("button").addEventListener("click", () => {
        setTrial(getTrial().filter(x => x !== id));
        draw();
        drawCart();
      });
      cartList.appendChild(li);
    });
    emptyMsg.hidden = cart.length > 0;
    confirmBtn.disabled = cart.length === 0;
  }

  confirmBtn.addEventListener("click", () => {
    const msg = document.getElementById("trial-confirm-msg");
    msg.hidden = false;
    confirmBtn.disabled = true;
  });

  draw();
  drawCart();
}

/* ---------------- Subscribe / replenishment ---------------- */

const FREQS = ["Every 2 weeks", "Monthly", "Every 6 weeks"];

function renderSubscribe() {
  const tpl = document.getElementById("tpl-subscribe").content.cloneNode(true);
  app.innerHTML = "";
  app.appendChild(tpl);

  const list = document.getElementById("subscribe-list");
  const subs = getSubs();

  PRODUCTS.forEach(p => {
    const current = subs[p.id];
    const card = document.createElement("div");
    card.className = "subscribe-card";
    card.innerHTML = `
      <div>
        <strong>${p.name}</strong>
        <p class="muted small" style="margin:4px 0 0;">${current ? `Reordering ${current.toLowerCase()}` : "Not subscribed yet"}</p>
        <div class="freq-row">
          ${FREQS.map(f => `<button class="chip ${current === f ? "selected" : ""}" data-freq="${f}">${f}</button>`).join("")}
        </div>
      </div>
      <div class="status">${current ? "Active ✓" : ""}</div>
    `;
    card.querySelectorAll(".chip").forEach(chip => {
      chip.addEventListener("click", () => {
        const s = getSubs();
        s[p.id] = chip.dataset.freq;
        setSubs(s);
        renderSubscribe();
      });
    });
    list.appendChild(card);
  });
}

/* ---------------- Feedback ---------------- */

const TOPIC_LABEL = {
  general: "General question",
  "millet-noodles": "Millet Noodles",
  "veggie-puffs": "Veggie Puffs",
  dosage: "Portion / serving amount",
  reaction: "Reaction",
  other: "Other"
};

function renderFeedback() {
  const tpl = document.getElementById("tpl-feedback").content.cloneNode(true);
  app.innerHTML = "";
  app.appendChild(tpl);

  const list = document.getElementById("feedback-list");
  function drawList() {
    const items = getFeedback();
    list.innerHTML = items.map(f => `
      <li><span class="fb-topic">${TOPIC_LABEL[f.topic] || f.topic}</span>${f.text}</li>
    `).join("");
  }
  drawList();

  document.getElementById("feedback-form").addEventListener("submit", e => {
    e.preventDefault();
    const topic = document.getElementById("fb-topic").value;
    const text = document.getElementById("fb-text").value.trim();
    if (!text) return;
    const items = getFeedback();
    items.unshift({ topic, text });
    setFeedback(items);
    document.getElementById("fb-text").value = "";
    drawList();
    const confirm = document.getElementById("fb-confirm");
    confirm.hidden = false;
    setTimeout(() => confirm.hidden = true, 2500);
  });
}
