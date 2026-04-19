function byId(id) {
  return document.getElementById(id);
}

const THEME_KEY = "profile_theme";

function isDarkMode() {
  return document.body.dataset.theme === "dark";
}

function setTheme(mode) {
  if (mode === "dark") {
    document.body.dataset.theme = "dark";
  } else {
    document.body.removeAttribute("data-theme");
  }
}

function updateThemeToggleText() {
  const btn = byId("themeToggle");
  if (!btn) {
    return;
  }

  const dark = isDarkMode();
  btn.setAttribute("aria-pressed", dark ? "true" : "false");
  btn.setAttribute("aria-label", dark ? "切换到亮色模式" : "切换到暗色模式");
}

function maxRadiusFrom(x, y) {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const distances = [
    Math.hypot(x, y),
    Math.hypot(w - x, y),
    Math.hypot(x, h - y),
    Math.hypot(w - x, h - y)
  ];
  return Math.max(...distances);
}

function animateThemeTransition(triggerButton) {
  const toDark = !isDarkMode();
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const nextTheme = toDark ? "dark" : "light";

  if (prefersReducedMotion) {
    setTheme(nextTheme);
    localStorage.setItem(THEME_KEY, nextTheme);
    updateThemeToggleText();
    return;
  }

  const rect = triggerButton.getBoundingClientRect();
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;
  const radius = maxRadiusFrom(x, y);
  const root = document.documentElement;
  root.style.setProperty("--reveal-x", `${x}px`);
  root.style.setProperty("--reveal-y", `${y}px`);
  root.style.setProperty("--reveal-r", `${radius + 8}px`);

  triggerButton.disabled = true;
  const applyTheme = () => {
    setTheme(nextTheme);
    localStorage.setItem(THEME_KEY, nextTheme);
    updateThemeToggleText();
  };

  if (typeof document.startViewTransition === "function") {
    const transition = document.startViewTransition(() => {
      applyTheme();
    });
    transition.finished.finally(() => {
      triggerButton.disabled = false;
    });
    return;
  }

  applyTheme();
  triggerButton.disabled = false;
}

function initThemeToggle() {
  const btn = byId("themeToggle");
  if (!btn) {
    return;
  }

  const saved = localStorage.getItem(THEME_KEY);
  if (saved === "dark") {
    setTheme("dark");
  } else {
    setTheme("light");
  }
  updateThemeToggleText();

  btn.addEventListener("click", () => {
    animateThemeTransition(btn);
  });
}

function addMagneticEffect(element, intensity = 0.22) {
  element.addEventListener("mousemove", (event) => {
    const rect = element.getBoundingClientRect();
    const x = event.clientX - rect.left - rect.width / 2;
    const y = event.clientY - rect.top - rect.height / 2;
    element.style.transform = `translate(${x * intensity}px, ${y * intensity}px)`;
  });

  element.addEventListener("mouseleave", () => {
    element.style.transform = "";
  });
}

function initMouseInteractions() {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReducedMotion) {
    return;
  }

  const cards = document.querySelectorAll(".card");
  cards.forEach((card) => {
    const state = {
      currentRX: 0,
      currentRY: 0,
      currentFX: 0,
      currentFY: 0,
      targetRX: 0,
      targetRY: 0,
      targetFX: 0,
      targetFY: 0,
      rafId: null
    };

    const animateCard = () => {
      const easing = 0.18;
      state.currentRX += (state.targetRX - state.currentRX) * easing;
      state.currentRY += (state.targetRY - state.currentRY) * easing;
      state.currentFX += (state.targetFX - state.currentFX) * easing;
      state.currentFY += (state.targetFY - state.currentFY) * easing;

      card.style.setProperty("--rx", `${state.currentRX.toFixed(2)}deg`);
      card.style.setProperty("--ry", `${state.currentRY.toFixed(2)}deg`);
      card.style.setProperty("--fx", `${state.currentFX.toFixed(2)}px`);
      card.style.setProperty("--fy", `${state.currentFY.toFixed(2)}px`);

      const near = (a, b) => Math.abs(a - b) < 0.02;
      if (
        near(state.currentRX, state.targetRX) &&
        near(state.currentRY, state.targetRY) &&
        near(state.currentFX, state.targetFX) &&
        near(state.currentFY, state.targetFY)
      ) {
        state.rafId = null;
        return;
      }
      state.rafId = requestAnimationFrame(animateCard);
    };

    const ensureAnimate = () => {
      if (!state.rafId) {
        state.rafId = requestAnimationFrame(animateCard);
      }
    };

    card.addEventListener("mousemove", (event) => {
      const rect = card.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const nx = (x - cx) / cx;
      const ny = (y - cy) / cy;

      state.targetRY = nx * 4.2;
      state.targetRX = -ny * 4.2;
      state.targetFX = nx * 2.6;
      state.targetFY = ny * 2.2;
      card.classList.add("is-hovered");
      ensureAnimate();
    });

    card.addEventListener("mouseleave", () => {
      state.targetRX = 0;
      state.targetRY = 0;
      state.targetFX = 0;
      state.targetFY = 0;
      card.classList.remove("is-hovered");
      ensureAnimate();
    });
  });

  const buttons = document.querySelectorAll(".btn, #themeToggle");
  buttons.forEach((button) => {
    addMagneticEffect(button, button.id === "themeToggle" ? 0.18 : 0.14);
  });
}

function renderStats(stats) {
  return stats
    .map(
      (item) => `
      <article class="card">
        <div class="stat-num">${item.value}</div>
        <div class="stat-label">${item.label}</div>
      </article>
    `
    )
    .join("");
}

function renderServices(services) {
  return services
    .map(
      (item) => `
      <article class="card">
        <h3 class="service-title">${item.title}</h3>
        <p class="service-desc">${item.desc}</p>
      </article>
    `
    )
    .join("");
}

function renderTimeline(list) {
  return list
    .map(
      (item) => `
      <li>
        <span class="timeline-year">${item.year}</span>
        <div class="timeline-text">${item.text}</div>
      </li>
    `
    )
    .join("");
}

function renderContacts(list) {
  return list
    .map(
      (item) => `
      <div class="contact-row">
        <span class="contact-label">${item.label}</span>
        <span>${item.value}</span>
      </div>
    `
    )
    .join("");
}

function boot() {
  byId("companyName").textContent = companyData.name;
  byId("tagline").textContent = companyData.tagline;
  byId("introMain").textContent = companyData.intro;
  byId("statsGrid").innerHTML = renderStats(companyData.stats);
  byId("servicesGrid").innerHTML = renderServices(companyData.services);
  byId("timelineList").innerHTML = renderTimeline(companyData.timeline);
  byId("contactSlogan").textContent = companyData.contactSlogan;
  byId("contactList").innerHTML = renderContacts(companyData.contacts);
  byId("footerText").textContent = companyData.footer;
  initThemeToggle();
  initMouseInteractions();
}

boot();
