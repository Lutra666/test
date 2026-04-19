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

function initMouseInteractions() {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReducedMotion) {
    return;
  }

  const root = document.documentElement;
  const orbA = document.querySelector(".orb-a");
  const orbB = document.querySelector(".orb-b");

  const updatePageTilt = (event) => {
    const nx = event.clientX / window.innerWidth - 0.5;
    const ny = event.clientY / window.innerHeight - 0.5;
    const tiltX = (nx * 2).toFixed(3);
    const tiltY = (ny * 2).toFixed(3);
    root.style.setProperty("--page-tilt-x", tiltX);
    root.style.setProperty("--page-tilt-y", String(-tiltY));

    if (orbA && orbB) {
      orbA.style.transform = `translate(${nx * -20}px, ${ny * -16}px)`;
      orbB.style.transform = `translate(${nx * 24}px, ${ny * 18}px)`;
    }
  };

  const glow = byId("cursorGlow");
  if (glow) {
    const moveGlow = (event) => {
      glow.style.left = `${event.clientX}px`;
      glow.style.top = `${event.clientY}px`;
      updatePageTilt(event);
    };

    window.addEventListener("mousemove", moveGlow);
    window.addEventListener("mouseenter", () => {
      glow.style.opacity = "1";
    });
    window.addEventListener("mouseleave", () => {
      glow.style.opacity = "0";
      root.style.setProperty("--page-tilt-x", "0");
      root.style.setProperty("--page-tilt-y", "0");
      if (orbA && orbB) {
        orbA.style.transform = "";
        orbB.style.transform = "";
      }
    });
  }

  const cards = document.querySelectorAll(".card");
  cards.forEach((card) => {
    card.addEventListener("mousemove", (event) => {
      const rect = card.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const cx = rect.width / 2;
      const cy = rect.height / 2;

      const rotateY = ((x - cx) / cx) * 8;
      const rotateX = ((cy - y) / cy) * 8;
      card.style.setProperty("--mx", `${x}px`);
      card.style.setProperty("--my", `${y}px`);
      card.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-5px)`;
    });

    card.addEventListener("mouseleave", () => {
      card.style.transform = "";
      card.style.removeProperty("--mx");
      card.style.removeProperty("--my");
    });
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
