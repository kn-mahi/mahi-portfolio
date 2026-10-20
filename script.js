/* =========================
   MAHI PORTFOLIO
   Interactive functionality
========================= */

// Change this if your GitHub username is different
const GITHUB_USERNAME = "kn-mahi";

const GITHUB_API =
  `https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=100`;

// Optional: add live demo URLs here using repository names
const DEMO_URLS = {
  // "repository-name": "https://your-live-demo-link.com"
};


/* =========================
   THEME TOGGLE
========================= */

const html = document.documentElement;
const themeToggle = document.getElementById("themeToggle");
const themeIcon = document.getElementById("themeIcon");

function applyTheme(theme) {
  const selectedTheme = theme === "light" ? "light" : "dark";

  html.setAttribute("data-theme", selectedTheme);

  if (themeIcon) {
    themeIcon.textContent = selectedTheme === "dark" ? "☀" : "☾";
  }

  if (themeToggle) {
    const nextTheme = selectedTheme === "dark" ? "light" : "dark";

    themeToggle.setAttribute(
      "aria-label",
      `Switch to ${nextTheme} theme`
    );

    themeToggle.setAttribute("title", `Switch to ${nextTheme} theme`);
  }

  const themeColor = document.querySelector('meta[name="theme-color"]');

  if (themeColor) {
    themeColor.setAttribute(
      "content",
      selectedTheme === "dark" ? "#0b1020" : "#f5f7fc"
    );
  }

  try {
    localStorage.setItem("mahi-portfolio-theme", selectedTheme);
  } catch {
    // The site still works when local storage is unavailable
  }
}

let savedTheme = "dark";

try {
  savedTheme = localStorage.getItem("mahi-portfolio-theme") || "dark";
} catch {
  savedTheme = "dark";
}

applyTheme(savedTheme);

themeToggle?.addEventListener("click", () => {
  const currentTheme = html.getAttribute("data-theme");
  applyTheme(currentTheme === "dark" ? "light" : "dark");
});


/* =========================
   MOBILE NAVIGATION
========================= */

const menuToggle = document.getElementById("menuToggle");
const navLinks = document.getElementById("navLinks");
const navItems = document.querySelectorAll(".nav-link");

function closeMenu() {
  navLinks?.classList.remove("open");
  menuToggle?.setAttribute("aria-expanded", "false");
  menuToggle?.setAttribute("aria-label", "Open navigation menu");
}

menuToggle?.addEventListener("click", () => {
  const isOpen = navLinks?.classList.toggle("open");

  menuToggle.setAttribute("aria-expanded", String(Boolean(isOpen)));
  menuToggle.setAttribute(
    "aria-label",
    isOpen ? "Close navigation menu" : "Open navigation menu"
  );
});

navItems.forEach((link) => {
  link.addEventListener("click", closeMenu);
});

document.addEventListener("click", (event) => {
  if (
    navLinks?.classList.contains("open") &&
    !navLinks.contains(event.target) &&
    !menuToggle?.contains(event.target)
  ) {
    closeMenu();
  }
});


/* =========================
   ROTATING HERO TEXT
========================= */

const rotatingRole = document.getElementById("rotatingRole");

const roles = [
  "Data Science",
  "Machine Learning",
  "Python Programming",
  "Web Development"
];

let roleIndex = 0;

if (rotatingRole) {
  setInterval(() => {
    roleIndex = (roleIndex + 1) % roles.length;

    rotatingRole.animate(
      [
        { opacity: 0, transform: "translateY(6px)" },
        { opacity: 1, transform: "translateY(0)" }
      ],
      {
        duration: 350,
        easing: "ease-out"
      }
    );

    rotatingRole.textContent = roles[roleIndex];
  }, 2400);
}


/* =========================
   SCROLL REVEAL ANIMATION
========================= */

const revealElements = document.querySelectorAll(".reveal");

if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.1,
      rootMargin: "0px 0px -25px 0px"
    }
  );

  revealElements.forEach((element) => {
    revealObserver.observe(element);
  });
} else {
  revealElements.forEach((element) => {
    element.classList.add("visible");
  });
}


/* =========================
   ACTIVE NAV LINK
========================= */

const sections = document.querySelectorAll("main section[id]");

if ("IntersectionObserver" in window) {
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const currentId = entry.target.id;

          navItems.forEach((link) => {
            const isActive = link.getAttribute("href") === `#${currentId}`;

            link.classList.toggle("active", isActive);

            if (isActive) {
              link.setAttribute("aria-current", "location");
            } else {
              link.removeAttribute("aria-current");
            }
          });
        }
      });
    },
    {
      rootMargin: "-30% 0px -60% 0px",
      threshold: 0
    }
  );

  sections.forEach((section) => {
    sectionObserver.observe(section);
  });
}


/* =========================
   BACK TO TOP
========================= */

const floatingTop = document.getElementById("floatingTop");

function updateBackToTop() {
  floatingTop?.classList.toggle("visible", window.scrollY > 500);
}

window.addEventListener("scroll", updateBackToTop, { passive: true });

updateBackToTop();

floatingTop?.addEventListener("click", () => {
  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
});


/* =========================
   GITHUB PROJECT GALLERY
========================= */

const projectsGrid = document.getElementById("projectsGrid");
const projectsStatus = document.getElementById("projectsStatus");
const projectsEmpty = document.getElementById("projectsEmpty");
const projectSearch = document.getElementById("projectSearch");
const projectSort = document.getElementById("projectSort");
const projectFilters = document.getElementById("projectFilters");
const resetProjects = document.getElementById("resetProjects");

const projectDialog = document.getElementById("projectDialog");
const dialogClose = document.getElementById("dialogClose");
const dialogTitle = document.getElementById("dialogTitle");
const dialogDescription = document.getElementById("dialogDescription");
const dialogTags = document.getElementById("dialogTags");
const dialogMeta = document.getElementById("dialogMeta");
const dialogActions = document.getElementById("dialogActions");

let allProjects = [];
let activeFilter = "all";
let searchTerm = "";
let sortMethod = "updated";


/* Escape HTML so repository content is displayed safely */

function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    };

    return entities[character];
  });
}


/* Convert repository names into readable titles */

function formatRepoName(name = "") {
  return name
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}


/* Assign broad categories based on repository information */

function categorizeProject(repo) {
  const text = [
    repo.name || "",
    repo.description || "",
    repo.language || "",
    ...(repo.topics || [])
  ].join(" ").toLowerCase();

  if (
    /machine.learning|scikit|tensorflow|pytorch|deep.learning|neural.network|classification|regression|prediction/.test(text)
  ) {
    return "machine-learning";
  }

  if (
    /html|css|javascript|typescript|react|next.js|website|web.development|frontend|backend/.test(text)
  ) {
    return "web";
  }

  if (
    /python|pandas|numpy|jupyter|data.science|data.analysis|matplotlib/.test(text)
  ) {
    return "python";
  }

  return "other";
}


/* Prepare repositories for rendering */

function normalizeRepository(repo) {
  return {
    id: repo.id,
    name: repo.name || "Untitled Project",
    title: formatRepoName(repo.name || "Untitled Project"),
    description:
      repo.description?.trim() ||
      "A coding project exploring ideas, concepts, and practical implementation",
    language: repo.language || "Various",
    topics: Array.isArray(repo.topics) ? repo.topics : [],
    htmlUrl: repo.html_url,
    homepage: repo.homepage || DEMO_URLS[repo.name] || "",
    stars: repo.stargazers_count || 0,
    forks: repo.forks_count || 0,
    updatedAt: repo.updated_at || "",
    createdAt: repo.created_at || "",
    category: categorizeProject(repo)
  };
}


/* Format dates */

function formatDate(dateString) {
  if (!dateString) return "Not available";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) return "Not available";

  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric"
  }).format(date);
}


/* Get current filtered and sorted projects */

function getVisibleProjects() {
  let projects = [...allProjects];

  if (activeFilter !== "all") {
    projects = projects.filter(
      (project) => project.category === activeFilter
    );
  }

  if (searchTerm) {
    const term = searchTerm.toLowerCase();

    projects = projects.filter((project) => {
      const searchableText = [
        project.name,
        project.title,
        project.description,
        project.language,
        ...project.topics
      ].join(" ").toLowerCase();

      return searchableText.includes(term);
    });
  }

  if (sortMethod === "name") {
    projects.sort((a, b) => a.title.localeCompare(b.title));
  } else if (sortMethod === "stars") {
    projects.sort((a, b) => b.stars - a.stars);
  } else {
    projects.sort(
      (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
    );
  }

  return projects;
}


/* Build project card HTML */

function createProjectCard(project) {
  const title = escapeHTML(project.title);
  const description = escapeHTML(project.description);
  const language = escapeHTML(project.language);
  const repoName = escapeHTML(project.name);

  const topics = project.topics.length
    ? project.topics.slice(0, 4)
    : [project.language].filter(Boolean);

  const topicMarkup = topics
    .map((topic) => `<span>${escapeHTML(topic)}</span>`)
    .join("");

  return `
    <article class="project-card">
      <div class="project-card-top">
        <div class="project-folder" aria-hidden="true">⌘</div>
        <span class="project-stars">☆ ${project.stars}</span>
      </div>

      <div class="project-card-body">
        <h3>${title}</h3>

        <p class="project-card-description">${description}</p>

        <div class="skill-tags project-tags">
          ${topicMarkup}
        </div>

        <div class="project-card-footer">
          <span class="project-language">
            <span class="language-dot"></span>
            ${language}
          </span>

          <button
            class="project-details-btn"
            type="button"
            data-project-id="${project.id}"
            aria-label="View details for ${repoName}"
          >
            View Details ↗
          </button>
        </div>
      </div>
    </article>
  `;
}


/* Render the project gallery */

function renderProjects() {
  if (!projectsGrid) return;

  const projects = getVisibleProjects();

  projectsGrid.innerHTML = projects
    .map(createProjectCard)
    .join("");

  const isEmpty = projects.length === 0;

  projectsEmpty.hidden = !isEmpty;
  projectsGrid.hidden = isEmpty;

  if (allProjects.length === 0) {
    projectsStatus.textContent = "No repositories to display";
  } else if (isEmpty) {
    projectsStatus.textContent = "No projects match your search";
  } else {
    projectsStatus.textContent =
      `Showing ${projects.length} ${projects.length === 1 ? "project" : "projects"}`;
  }
}


/* Load repositories from GitHub */

async function loadGitHubProjects() {
  if (!projectsGrid || !projectsStatus) return;

  projectsStatus.textContent = "Loading projects from GitHub...";

  projectsGrid.innerHTML = `
    <div class="project-error">
      Fetching public repositories...
    </div>
  `;

  try {
    const response = await fetch(GITHUB_API, {
      headers: {
        Accept: "application/vnd.github+json"
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(
          "GitHub profile not found. Check the username in script.js."
        );
      }

      if (response.status === 403 || response.status === 429) {
        throw new Error(
          "GitHub temporarily limited requests. Please refresh the page later."
        );
      }

      throw new Error(
        `GitHub returned an error (${response.status}).`
      );
    }

    const repositories = await response.json();

    allProjects = repositories
      .filter((repo) => !repo.fork && !repo.archived)
      .map(normalizeRepository);

    renderProjects();
  } catch (error) {
    console.error("GitHub projects could not be loaded:", error);

    projectsGrid.hidden = false;
    projectsEmpty.hidden = true;

    projectsGrid.innerHTML = `
      <div class="project-error">
        <h3>Projects could not be loaded</h3>
        <p>${escapeHTML(error.message || "Please check your internet connection.")}</p>
        <p style="margin-top: 12px">
          <a
            class="btn btn-secondary"
            href="https://github.com/${encodeURIComponent(GITHUB_USERNAME)}"
            target="_blank"
            rel="noopener noreferrer"
          >
            Open GitHub Profile ↗
          </a>
        </p>
      </div>
    `;

    projectsStatus.textContent = "Unable to load projects from GitHub";
  }
}


/* Search */

projectSearch?.addEventListener("input", () => {
  searchTerm = projectSearch.value.trim();
  renderProjects();
});


/* Sorting */

projectSort?.addEventListener("change", () => {
  sortMethod = projectSort.value;
  renderProjects();
});


/* Category filtering */

projectFilters?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-filter]");

  if (!button) return;

  activeFilter = button.dataset.filter;

  projectFilters.querySelectorAll("[data-filter]").forEach((filterButton) => {
    const isActive = filterButton === button;

    filterButton.classList.toggle("active", isActive);
    filterButton.setAttribute("aria-pressed", String(isActive));
  });

  renderProjects();
});


/* Reset search and filters */

resetProjects?.addEventListener("click", () => {
  activeFilter = "all";
  searchTerm = "";
  sortMethod = "updated";

  if (projectSearch) projectSearch.value = "";
  if (projectSort) projectSort.value = "updated";

  projectFilters?.querySelectorAll("[data-filter]").forEach((button) => {
    const isActive = button.dataset.filter === "all";

    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });

  renderProjects();
});


/* =========================
   PROJECT DETAILS DIALOG
========================= */

function openProjectDetails(projectId) {
  const project = allProjects.find(
    (item) => String(item.id) === String(projectId)
  );

  if (!project || !projectDialog) return;

  dialogTitle.textContent = project.title;
  dialogDescription.textContent = project.description;

  const topics = project.topics.length
    ? project.topics
    : [project.language].filter(Boolean);

  dialogTags.innerHTML = topics
    .map((topic) => `<span>${escapeHTML(topic)}</span>`)
    .join("");

  dialogMeta.innerHTML = `
    <span>★ ${project.stars} stars</span>
    <span>⑂ ${project.forks} forks</span>
    <span>Updated ${escapeHTML(formatDate(project.updatedAt))}</span>
  `;

  const links = [
    {
      label: "View on GitHub ↗",
      url: project.htmlUrl,
      primary: true
    }
  ];

  if (project.homepage) {
    links.push({
      label: "Live Demo ↗",
      url: project.homepage,
      primary: false
    });
  }

  dialogActions.innerHTML = links
    .map((link) => `
      <a
        class="btn ${link.primary ? "btn-primary" : "btn-secondary"}"
        href="${escapeHTML(link.url)}"
        target="_blank"
        rel="noopener noreferrer"
      >
        ${escapeHTML(link.label)}
      </a>
    `)
    .join("");

  if (typeof projectDialog.showModal === "function") {
    projectDialog.showModal();
  } else {
    projectDialog.setAttribute("open", "");
  }
}


projectsGrid?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-project-id]");

  if (!button) return;

  openProjectDetails(button.dataset.projectId);
});


dialogClose?.addEventListener("click", () => {
  if (typeof projectDialog.close === "function") {
    projectDialog.close();
  } else {
    projectDialog.removeAttribute("open");
  }
});


projectDialog?.addEventListener("click", (event) => {
  if (event.target === projectDialog) {
    if (typeof projectDialog.close === "function") {
      projectDialog.close();
    } else {
      projectDialog.removeAttribute("open");
    }
  }
});


document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && projectDialog?.hasAttribute("open")) {
    if (typeof projectDialog.close === "function") {
      projectDialog.close();
    } else {
      projectDialog.removeAttribute("open");
    }
  }
});


/* =========================
   INITIALIZE
========================= */

loadGitHubProjects();