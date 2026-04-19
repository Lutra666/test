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
}

boot();
