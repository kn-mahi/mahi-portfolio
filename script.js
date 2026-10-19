
const GITHUB_USERNAME = "kn-mahi";

// Add a real deployed URL here only when a project has a live website.
// Example: "my-project": "https://your-project.pages.dev"
const DEMO_URLS = {
  // "repository-name": "https://your-live-demo-url.com",
};

const EXCLUDED_REPOS = ["mahi-portfolio"];
const API_BASE = "https://api.github.com";

const grid = document.getElementById("projectsGrid");
const status = document.getElementById("repoStatus");
const searchInput = document.getElementById("projectSearch");
const languageFilter = document.getElementById("languageFilter");
const sortSelect = document.getElementById("sortProjects");
const modal = document.getElementById("projectModal");
const modalContent = document.getElementById("modalContent");
const modalClose = document.getElementById("modalClose");
const themeToggle = document.getElementById("themeToggle");
const menuToggle = document.getElementById("menuToggle");
const navLinks = document.getElementById("navLinks");
const toast = document.getElementById("toast");

let repositories = [];
let toastTimeout;

// ---------- Theme ----------
const savedTheme = (() => {
  try {
    return localStorage.getItem("mahi-portfolio-theme");
  } catch {
    return null;
  }
})();

if (savedTheme === "light") {
  document.body.classList.add("light-theme");
}

function updateThemeButton() {
  const light = document.body.classList.contains("light-theme");
  themeToggle.textContent = light ? "☾" : "☼";
  themeToggle.setAttribute("aria-label", light ? "Switch to dark theme" : "Switch to light theme");
}

updateThemeButton();

themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("light-theme");

  const theme = document.body.classList.contains("light-theme") ? "light" : "dark";

  try {
    localStorage.setItem("mahi-portfolio-theme", theme);
  } catch {
    // Theme still works if storage is unavailable.
  }

  updateThemeButton();
});

// ---------- Mobile navigation ----------
menuToggle.addEventListener("click", () => {
  const isOpen = navLinks.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
  menuToggle.textContent = isOpen ? "✕" : "☰";
});

navLinks.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    navLinks.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.textContent = "☰";
  });
});

// ---------- Helpers ----------
function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
}

function safeURL(value) {
  try {
    const url = new URL(value);
    if (url.protocol === "https:" || url.protocol === "http:") {
      return url.href;
    }
  } catch {
    // Invalid URL.
  }
  return "";
}

function formatDate(dateString) {
  if (!dateString) return "Date unavailable";

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    year: "numeric",
  }).format(date);
}

function getDemoURL(repo) {
  return safeURL(DEMO_URLS[repo.name] || repo.homepage || "");
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove("show"), 2800);
}

function createAction(url, label, primary = false) {
  const safe = safeURL(url);
  if (!safe) return "";

  return `
    <a class="project-action ${primary ? "primary" : ""}"
       href="${escapeHTML(safe)}"
       target="_blank"
       rel="noopener noreferrer">${escapeHTML(label)} ↗</a>
  `;
}

// ---------- Load GitHub repositories ----------
async function fetchRepositories() {
  status.textContent = "Loading your public GitHub repositories…";
  grid.innerHTML = "";

  try {
    const response = await fetch(
      `${API_BASE}/users/${encodeURIComponent(GITHUB_USERNAME)}/repos?type=public&sort=updated&per_page=100`
    );

    if (!response.ok) {
      if (response.status === 403 || response.status === 429) {
        throw new Error("GitHub API rate limit reached. Please try again later.");
      }
      if (response.status === 404) {
        throw new Error("GitHub profile not found. Check the username in script.js.");
      }
      throw new Error("Could not load repositories from GitHub.");
    }

    const data = await response.json();

    repositories = data
      .filter((repo) => !repo.fork)
      .filter((repo) => !EXCLUDED_REPOS.includes(repo.name.toLowerCase()))
      .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));

    populateLanguageFilter();
    renderProjects();

    status.textContent = `${repositories.length} public ${repositories.length === 1 ? "project" : "projects"} loaded from GitHub.`;
  } catch (error) {
    status.textContent = error.message;

    grid.innerHTML = `
      <div class="empty-state">
        <h3>Projects could not be loaded</h3>
        <p>Check your internet connection or try again later.</p>
        <button class="button button-secondary" id="retryRepos">Try again</button>
      </div>
    `;

    document.getElementById("retryRepos")?.addEventListener("click", fetchRepositories);
  }
}

function populateLanguageFilter() {
  const selected = languageFilter.value;

  const languages = [...new Set(
    repositories.map((repo) => repo.language).filter(Boolean)
  )].sort((a, b) => a.localeCompare(b));

  languageFilter.innerHTML = '<option value="all">All languages</option>';

  languages.forEach((language) => {
    const option = document.createElement("option");
    option.value = language;
    option.textContent = language;
    languageFilter.appendChild(option);
  });

  if (languages.includes(selected)) {
    languageFilter.value = selected;
  }
}

// ---------- Render project gallery ----------
function renderProjects() {
  const query = searchInput.value.trim().toLowerCase();
  const selectedLanguage = languageFilter.value;
  const sortBy = sortSelect.value;

  let filtered = repositories.filter((repo) => {
    const searchableText = [
      repo.name,
      repo.description || "",
      repo.language || "",
      ...(repo.topics || []),
    ].join(" ").toLowerCase();

    const matchesQuery = searchableText.includes(query);
    const matchesLanguage =
      selectedLanguage === "all" || repo.language === selectedLanguage;

    return matchesQuery && matchesLanguage;
  });

  if (sortBy === "stars") {
    filtered.sort((a, b) => b.stargazers_count - a.stargazers_count);
  } else if (sortBy === "name") {
    filtered.sort((a, b) => a.name.localeCompare(b.name));
  } else {
    filtered.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
  }

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <h3>No matching projects</h3>
        <p>Try another search term or select a different language.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map((repo) => {
    const description = repo.description || "No description added yet. Open the project details to explore its README.";
    const demoURL = getDemoURL(repo);
    const language = repo.language
      ? `<span><span class="language-dot"></span>${escapeHTML(repo.language)}</span>`
      : "";

    const updated = `Updated ${formatDate(repo.updated_at)}`;

    return `
      <article class="project-card">
        <div class="project-card-top">
          <span class="repo-symbol">⌘</span>
          <span class="repo-stars">☆ ${repo.stargazers_count || 0}</span>
        </div>

        <div class="project-card-body">
          <h3>
            <button type="button" data-details="${escapeHTML(repo.name)}">
              ${escapeHTML(repo.name.replace(/[-_]/g, " "))}
            </button>
          </h3>
          <p class="project-description">${escapeHTML(description)}</p>
          <div class="project-meta">
            ${language}
            <span>${updated}</span>
          </div>
        </div>

        <div class="project-actions">
          <button type="button" class="project-action primary" data-details="${escapeHTML(repo.name)}">
            View details
          </button>
          ${createAction(demoURL, "Live Demo")}
          ${createAction(repo.html_url, "GitHub")}
        </div>
      </article>
    `;
  }).join("");

  grid.querySelectorAll("[data-details]").forEach((button) => {
    button.addEventListener("click", () => {
      const repo = repositories.find((item) => item.name === button.dataset.details);
      if (repo) openProjectDetails(repo);
    });
  });
}

searchInput.addEventListener("input", renderProjects);
languageFilter.addEventListener("change", renderProjects);
sortSelect.addEventListener("change", renderProjects);

// Keyboard shortcut: Ctrl/Cmd + K
document.addEventListener("keydown", (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    searchInput.focus();
  }

  if (event.key === "Escape" && modal.open) {
    modal.close();
  }
});

// ---------- README rendering ----------
// This is a lightweight Markdown renderer for common README elements.
// HTML from a README is escaped first so repository content is not run as scripts.
function markdownToHTML(markdown) {
  let source = escapeHTML(markdown || "").replace(/\r\n/g, "\n");

  const codeBlocks = [];

  source = source.replace(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g, (_, language, code) => {
    const placeholder = `%%CODEBLOCK${codeBlocks.length}%%`;
    codeBlocks.push(
      `<pre><code${language ? ` class="language-${escapeHTML(language)}"` : ""}>${code.trimEnd()}</code></pre>`
    );
    return `\n${placeholder}\n`;
  });

  source = source
    .replace(/^###### (.+)$/gm, "<h6>$1</h6>")
    .replace(/^##### (.+)$/gm, "<h5>$1</h5>")
    .replace(/^#### (.+)$/gm, "<h4>$1</h4>")
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>");

  source = source.replace(/`([^`\n]+)`/g, "<code>$1</code>");
  source = source.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  source = source.replace(/__(.+?)__/g, "<strong>$1</strong>");
  source = source.replace(/\*([^*\n]+)\*/g, "<em>$1</em>");
  source = source.replace(/_([^_\n]+)_/g, "<em>$1</em>");

  // Only allow safe HTTP(S) URLs in Markdown links and images.
  source = source.replace(/!\[([^\]]*)\]\((https?:\/\/[^)\s]+)(?:\s+"([^"]*)")?\)/g,
    (_, alt, url, title) => {
      const safe = safeURL(url);
      return safe
        ? `<img src="${escapeHTML(safe)}" alt="${alt}"${title ? ` title="${title}"` : ""} loading="lazy">`
        : alt;
    }
  );

  source = source.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)(?:\s+"([^"]*)")?\)/g,
    (_, label, url, title) => {
      const safe = safeURL(url);
      return safe
        ? `<a href="${escapeHTML(safe)}"${title ? ` title="${title}"` : ""} target="_blank" rel="noopener noreferrer">${label}</a>`
        : label;
    }
  );

  source = source.replace(/^&gt; ?(.+)$/gm, "<blockquote>$1</blockquote>");
  source = source.replace(/^(?:[-*_]\s*){3,}$/gm, "<hr>");

  // Basic ordered and unordered lists.
  source = source.replace(/^(?:-|\*|\+) (.+)$/gm, "<li>$1</li>");
  source = source.replace(/^\d+\. (.+)$/gm, "<li>$1</li>");

  source = source.replace(/(?:<li>.*<\/li>\n?)+/gs, (list) => {
    const items = list.trim();
    return `<ul>${items}</ul>`;
  });

  // Paragraphs and line breaks.
  source = source.split(/\n{2,}/).map((block) => {
    const trimmed = block.trim();
    if (!trimmed) return "";

    if (
      /^%%CODEBLOCK\d+%%$/.test(trimmed) ||
      /^<(h[1-6]|ul|ol|li|pre|blockquote|hr|img)/i.test(trimmed) ||
      /^<\/?(ul|ol|blockquote|pre)/i.test(trimmed)
    ) {
      return trimmed;
    }

    return `<p>${trimmed.replace(/\n/g, "<br>")}</p>`;
  }).join("\n");

  source = source.replace(/%%CODEBLOCK(\d+)%%/g, (_, index) => codeBlocks[Number(index)] || "");

  return source;
}

// ---------- Project details + live README ----------
async function openProjectDetails(repo) {
  modalContent.innerHTML = `
    <h2>${escapeHTML(repo.name.replace(/[-_]/g, " "))}</h2>
    <p class="modal-description">${escapeHTML(repo.description || "No repository description has been added yet.")}</p>
    <div class="project-meta">
      ${repo.language ? `<span><span class="language-dot"></span>${escapeHTML(repo.language)}</span>` : ""}
      <span>☆ ${repo.stargazers_count || 0} stars</span>
      <span>Updated ${formatDate(repo.updated_at)}</span>
    </div>

    <div class="modal-actions">
      ${createAction(getDemoURL(repo), "Live Demo", true)}
      ${createAction(repo.html_url, "GitHub Repository")}
    </div>

    <h3 class="readme-heading">Project README</h3>
    <div class="readme-content readme-loading">Fetching the latest README from GitHub…</div>
  `;

  if (!modal.open) modal.showModal();

  const readmeContainer = modalContent.querySelector(".readme-content");

  try {
    const response = await fetch(
      `${API_BASE}/repos/${encodeURIComponent(GITHUB_USERNAME)}/${encodeURIComponent(repo.name)}/readme`,
      {
        headers: {
          Accept: "application/vnd.github+json",
        },
      }
    );

    if (!response.ok) {
      throw new Error("No README found for this repository.");
    }

    const readmeData = await response.json();

    let readmeText = "";

    if (readmeData.encoding === "base64" && readmeData.content) {
      const binary = atob(readmeData.content.replace(/\s/g, ""));
      const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
      readmeText = new TextDecoder("utf-8").decode(bytes);
    } else if (readmeData.download_url) {
      const rawResponse = await fetch(readmeData.download_url);
      if (!rawResponse.ok) throw new Error("Could not read the README content.");
      readmeText = await rawResponse.text();
    }

    if (!readmeText.trim()) {
      throw new Error("This README is empty.");
    }

    // Ignore stale responses if another project was opened in the meantime.
    if (!modal.open || !readmeContainer.isConnected) return;

    readmeContainer.classList.remove("readme-loading");
    readmeContainer.innerHTML = markdownToHTML(readmeText);
  } catch (error) {
    if (!modal.open || !readmeContainer.isConnected) return;

    readmeContainer.classList.remove("readme-loading");
    readmeContainer.innerHTML = `
      <p>${escapeHTML(error.message || "Could not load the README.")}</p>
      <p>You can still read the project documentation on
        <a href="${escapeHTML(repo.html_url)}" target="_blank" rel="noopener noreferrer">GitHub ↗</a>.
      </p>
    `;
  }
}

modalClose.addEventListener("click", () => modal.close());

modal.addEventListener("click", (event) => {
  if (event.target === modal) modal.close();
});

// ---------- Scroll reveal ----------
const revealObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll(".reveal").forEach((element) => {
  revealObserver.observe(element);
});

// ---------- Start ----------
fetchRepositories();
