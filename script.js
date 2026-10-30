const menuToggle = document.querySelector(".menu-toggle");
const primaryNav = document.querySelector("#primary-nav");

menuToggle.addEventListener("click", () => {
  const isExpanded = menuToggle.getAttribute("aria-expanded") === "true";
  menuToggle.setAttribute("aria-expanded", String(!isExpanded));
  menuToggle.setAttribute("aria-label", isExpanded ? "Open navigation" : "Close navigation");
  primaryNav.classList.toggle("is-open", !isExpanded);
});

primaryNav.addEventListener("click", (event) => {
  if (event.target.closest("a")) {
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open navigation");
    primaryNav.classList.remove("is-open");
  }
});

const cropSearch = document.querySelector("#crop-search");
const marketRows = [...document.querySelectorAll("#market-rows tr")];
const noResults = document.querySelector("#no-results");

cropSearch.addEventListener("input", () => {
  const query = cropSearch.value.trim().toLocaleLowerCase();
  let visibleRows = 0;

  for (const row of marketRows) {
    const matches = row.cells[0].textContent.toLocaleLowerCase().includes(query);
    row.hidden = !matches;
    if (matches) visibleRows += 1;
  }

  noResults.hidden = visibleRows > 0;
});

const cropGuides = {
  wheat: {
    season: "BEFORE SOWING",
    title: "Start with the field",
    description: "Check field drainage and soil condition. Use locally recommended seed and sowing dates for your area.",
    steps: ["Check soil moisture before preparing the seedbed.", "Confirm variety and seed rate with a local adviser.", "Plan irrigation and field access before sowing."]
  },
  rice: {
    season: "PLAN THE FIELD",
    title: "Prepare for a steady start",
    description: "Rice practices vary widely by variety and water availability. Base planting decisions on local guidance.",
    steps: ["Check your field's water supply and drainage.", "Ask about locally suitable varieties and planting dates.", "Plan how you will monitor water and crop health."]
  },
  cotton: {
    season: "BEFORE PLANTING",
    title: "Make room for good decisions",
    description: "Local growing conditions and pest pressure matter. Start with regional recommendations for cotton.",
    steps: ["Check planting windows and spacing guidance for your area.", "Use locally approved seed and crop protection advice.", "Plan regular field checks and keep notes."]
  },
  soybean: {
    season: "GET READY",
    title: "Set up the season",
    description: "Soil and rainfall can affect soybean establishment. Confirm sowing choices with a local agriculture adviser.",
    steps: ["Check soil condition and drainage before sowing.", "Confirm seed variety and sowing rate locally.", "Make a simple plan for field checks after planting."]
  }
};

const guideCrop = document.querySelector("#guide-crop");
const guideSeason = document.querySelector("#guide-season");
const guideTitle = document.querySelector("#guide-title");
const guideDescription = document.querySelector("#guide-description");
const guideChecklist = document.querySelector("#guide-checklist");

guideCrop.addEventListener("change", () => {
  const guide = cropGuides[guideCrop.value];
  guideSeason.textContent = guide.season;
  guideTitle.textContent = guide.title;
  guideDescription.textContent = guide.description;
  guideChecklist.replaceChildren(...guide.steps.map((step) => {
    const item = document.createElement("li");
    item.textContent = step;
    return item;
  }));
});
guideCrop.dispatchEvent(new Event("change"));

const formatNumber = (number) => new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 2
}).format(number);
const formatRupees = (number) => `₹${formatNumber(number)}`;

document.querySelector("#seed-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const area = Number(document.querySelector("#seed-area").value);
  const rate = Number(document.querySelector("#seed-rate").value);
  document.querySelector("#seed-result").textContent =
    `Estimated seed needed: ${formatNumber(area * rate)} kg (${formatNumber(area)} acres × ${formatNumber(rate)} kg/acre).`;
});

document.querySelector("#profit-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const area = Number(document.querySelector("#profit-area").value);
  const yieldPerAcre = Number(document.querySelector("#profit-yield").value);
  const price = Number(document.querySelector("#profit-price").value);
  const costs = Number(document.querySelector("#profit-costs").value);
  const harvest = area * yieldPerAcre;
  const revenue = harvest * price;
  const net = revenue - costs;
  const breakEven = harvest > 0 ? ` Break-even price: ${formatRupees(costs / harvest)}/quintal.` : "";
  const outcome = net >= 0 ? "Estimated amount after costs" : "Estimated shortfall after costs";

  document.querySelector("#profit-result").textContent =
    `Estimated harvest: ${formatNumber(harvest)} quintals. Gross income: ${formatRupees(revenue)}. ${outcome}: ${formatRupees(Math.abs(net))}.${breakEven}`;
});

const storage = {
  read(key, isValid, statusElement, description) {
    try {
      const saved = localStorage.getItem(key);
      if (saved === null) return [];
      const value = JSON.parse(saved);
      if (!Array.isArray(value) || !value.every(isValid)) {
        throw new Error("Saved data has an unexpected format.");
      }
      return value;
    } catch (error) {
      statusElement.textContent = `Could not load ${description}: ${error.message}`;
      return [];
    }
  },
  write(key, value, statusElement, description) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      statusElement.textContent = `${description} saved in this browser.`;
      return true;
    } catch (error) {
      statusElement.textContent = `Could not save ${description}: ${error.message}`;
      return false;
    }
  }
};

const taskStatus = document.querySelector("#task-status");
const taskList = document.querySelector("#task-list");
const taskForm = document.querySelector("#task-form");
const taskInput = document.querySelector("#task-input");
const taskFilterButtons = [...document.querySelectorAll("[data-task-filter]")];
let activeTaskFilter = "all";
let tasks = storage.read(
  "fieldwise-tasks-v1",
  (item) => item && typeof item.id === "string" && typeof item.text === "string" && typeof item.done === "boolean",
  taskStatus,
  "farm tasks"
);

function renderTasks() {
  const visibleTasks = tasks.filter((task) =>
    activeTaskFilter === "all" ||
    (activeTaskFilter === "open" && !task.done) ||
    (activeTaskFilter === "done" && task.done)
  );
  const items = visibleTasks.map((task) => {
    const item = document.createElement("li");
    item.className = task.done ? "task-item is-done" : "task-item";
    const label = document.createElement("label");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.done;
    checkbox.dataset.taskAction = "toggle";
    checkbox.dataset.taskId = task.id;
    checkbox.setAttribute("aria-label", `${task.done ? "Mark as to do" : "Mark complete"}: ${task.text}`);
    const text = document.createElement("span");
    text.textContent = task.text;
    label.append(checkbox, text);
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "task-remove";
    remove.dataset.taskAction = "remove";
    remove.dataset.taskId = task.id;
    remove.setAttribute("aria-label", `Remove task: ${task.text}`);
    remove.textContent = "×";
    item.append(label, remove);
    return item;
  });
  taskList.replaceChildren(...items);

  if (visibleTasks.length === 0) {
    const empty = document.createElement("li");
    empty.className = "task-empty";
    empty.textContent = tasks.length === 0 ? "Your task list is clear. Add a reminder above." : "No tasks in this view.";
    taskList.append(empty);
  }
}

taskForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = taskInput.value.trim();
  if (!text) {
    taskInput.setCustomValidity("Enter a task before adding it.");
    taskInput.reportValidity();
    return;
  }
  taskInput.setCustomValidity("");
  tasks.unshift({ id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, text, done: false });
  storage.write("fieldwise-tasks-v1", tasks, taskStatus, "Farm tasks");
  taskForm.reset();
  renderTasks();
});

taskInput.addEventListener("input", () => taskInput.setCustomValidity(""));

taskList.addEventListener("change", (event) => {
  const checkbox = event.target.closest('[data-task-action="toggle"]');
  if (!checkbox) return;
  const task = tasks.find((item) => item.id === checkbox.dataset.taskId);
  if (!task) return;
  task.done = checkbox.checked;
  storage.write("fieldwise-tasks-v1", tasks, taskStatus, "Farm tasks");
  renderTasks();
});

taskList.addEventListener("click", (event) => {
  const remove = event.target.closest('[data-task-action="remove"]');
  if (!remove) return;
  tasks = tasks.filter((task) => task.id !== remove.dataset.taskId);
  storage.write("fieldwise-tasks-v1", tasks, taskStatus, "Farm tasks");
  renderTasks();
});

taskFilterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeTaskFilter = button.dataset.taskFilter;
    taskFilterButtons.forEach((filterButton) => {
      const isActive = filterButton === button;
      filterButton.classList.toggle("is-active", isActive);
      filterButton.setAttribute("aria-pressed", String(isActive));
    });
    renderTasks();
  });
});

document.querySelector("#clear-done").addEventListener("click", () => {
  tasks = tasks.filter((task) => !task.done);
  storage.write("fieldwise-tasks-v1", tasks, taskStatus, "Farm tasks");
  renderTasks();
});
renderTasks();

const tipStatus = document.querySelector("#tip-status");
const tipList = document.querySelector("#tip-list");
const tipCount = document.querySelector("#tip-count");
let tips = storage.read(
  "fieldwise-tips-v1",
  (item) => item && typeof item.id === "string" && typeof item.name === "string" &&
    typeof item.area === "string" && typeof item.message === "string",
  tipStatus,
  "noticeboard posts"
);

function renderTips() {
  tipCount.textContent = String(tips.length);
  if (tips.length === 0) {
    const empty = document.createElement("p");
    empty.className = "tip-empty";
    empty.textContent = "No notes yet. Share the first useful tip from your field.";
    tipList.replaceChildren(empty);
    return;
  }

  tipList.replaceChildren(...tips.map((tip) => {
    const article = document.createElement("article");
    article.className = "tip-post";
    const heading = document.createElement("div");
    heading.className = "tip-post-heading";
    const author = document.createElement("strong");
    author.textContent = tip.name || "Farmer";
    const area = document.createElement("span");
    area.textContent = tip.area;
    heading.append(author, area);
    const message = document.createElement("p");
    message.textContent = tip.message;
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "tip-remove";
    remove.dataset.tipId = tip.id;
    remove.textContent = "Remove";
    remove.setAttribute("aria-label", `Remove tip from ${tip.name || "Farmer"}`);
    article.append(heading, message, remove);
    return article;
  }));
}

document.querySelector("#tip-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const message = document.querySelector("#tip-message").value.trim();
  if (!message) return;
  tips.unshift({
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    name: document.querySelector("#tip-name").value.trim(),
    area: document.querySelector("#tip-area").value.trim(),
    message
  });
  storage.write("fieldwise-tips-v1", tips, tipStatus, "Noticeboard post");
  event.currentTarget.reset();
  renderTips();
});

tipList.addEventListener("click", (event) => {
  const remove = event.target.closest("[data-tip-id]");
  if (!remove) return;
  tips = tips.filter((tip) => tip.id !== remove.dataset.tipId);
  storage.write("fieldwise-tips-v1", tips, tipStatus, "Noticeboard post");
  renderTips();
});
renderTips();
