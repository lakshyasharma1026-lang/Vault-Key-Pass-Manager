const STORAGE_KEY = "vaultkey.passwords";
const THEME_KEY = "vaultkey.theme";

const form = document.getElementById("passwordForm");
const entryIdInput = document.getElementById("entryId");
const siteInput = document.getElementById("siteInput");
const usernameInput = document.getElementById("usernameInput");
const passwordInput = document.getElementById("passwordInput");
const passwordTableBody = document.getElementById("passwordTableBody");
const emptyState = document.getElementById("emptyState");
const searchInput = document.getElementById("searchInput");
const submitBtn = document.getElementById("submitBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");
const formTitle = document.getElementById("formTitle");
const generateBtn = document.getElementById("generateBtn");
const copyGeneratedBtn = document.getElementById("copyGeneratedBtn");
const lengthInput = document.getElementById("lengthInput");
const lengthValue = document.getElementById("lengthValue");
const uppercaseOption = document.getElementById("uppercaseOption");
const numbersOption = document.getElementById("numbersOption");
const symbolsOption = document.getElementById("symbolsOption");
const themeToggle = document.getElementById("themeToggle");
const themeIcon = document.querySelector(".theme-icon");
const totalCount = document.getElementById("totalCount");
const visibleCount = document.getElementById("visibleCount");
const toast = document.getElementById("toast");

let passwords = loadPasswords();
let toastTimer;

function loadPasswords() {
  const saved = localStorage.getItem(STORAGE_KEY);

  try {
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.warn("VaultKey could not read saved passwords.", error);
    return [];
  }
}

function savePasswords() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(passwords));
}

function createId() {
  if (window.crypto && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getFilteredPasswords() {
  const term = searchInput.value.trim().toLowerCase();

  if (!term) {
    return passwords;
  }

  return passwords.filter((item) => {
    return (
      item.site.toLowerCase().includes(term) ||
      item.username.toLowerCase().includes(term)
    );
  });
}

function renderPasswords() {
  const filteredPasswords = getFilteredPasswords();

  totalCount.textContent = passwords.length;
  visibleCount.textContent = filteredPasswords.length;
  emptyState.classList.toggle("show", filteredPasswords.length === 0);
  passwordTableBody.innerHTML = "";

  filteredPasswords.forEach((item) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td class="site-cell">${escapeHtml(item.site)}</td>
      <td class="muted-cell">${escapeHtml(item.username)}</td>
      <td><span class="masked-password">${"*".repeat(Math.min(item.password.length, 14))}</span></td>
      <td>
        <div class="actions">
          <button class="action-btn copy" type="button" data-action="copy" data-id="${item.id}">Copy</button>
          <button class="action-btn edit" type="button" data-action="edit" data-id="${item.id}">Edit</button>
          <button class="action-btn delete" type="button" data-action="delete" data-id="${item.id}">Delete</button>
        </div>
      </td>
    `;
    passwordTableBody.appendChild(row);
  });
}

function resetForm() {
  form.reset();
  entryIdInput.value = "";
  lengthInput.value = "16";
  lengthValue.textContent = "16";
  uppercaseOption.checked = true;
  numbersOption.checked = true;
  symbolsOption.checked = true;
  formTitle.textContent = "Add password";
  submitBtn.textContent = "Add password";
  cancelEditBtn.classList.add("hidden");
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2200);
}

async function copyText(text, successMessage) {
  try {
    await navigator.clipboard.writeText(text);
    showToast(successMessage);
  } catch (error) {
    const helper = document.createElement("textarea");
    helper.value = text;
    helper.setAttribute("readonly", "");
    helper.style.position = "fixed";
    helper.style.opacity = "0";
    document.body.appendChild(helper);
    helper.select();
    document.execCommand("copy");
    document.body.removeChild(helper);
    showToast(successMessage);
  }
}

function handleSubmit(event) {
  event.preventDefault();

  const site = siteInput.value.trim();
  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();
  const editingId = entryIdInput.value;

  if (!site || !username || !password) {
    showToast("Please fill in all fields.");
    return;
  }

  if (editingId) {
    passwords = passwords.map((item) => {
      if (item.id !== editingId) {
        return item;
      }

      return {
        ...item,
        site,
        username,
        password,
        updatedAt: new Date().toISOString()
      };
    });
    showToast("Password updated.");
  } else {
    passwords.unshift({
      id: createId(),
      site,
      username,
      password,
      createdAt: new Date().toISOString()
    });
    showToast("Password added.");
  }

  savePasswords();
  resetForm();
  renderPasswords();
}

function editPassword(id) {
  const item = passwords.find((entry) => entry.id === id);

  if (!item) {
    return;
  }

  entryIdInput.value = item.id;
  siteInput.value = item.site;
  usernameInput.value = item.username;
  passwordInput.value = item.password;
  formTitle.textContent = "Edit password";
  submitBtn.textContent = "Save changes";
  cancelEditBtn.classList.remove("hidden");
  siteInput.focus();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function deletePassword(id) {
  const item = passwords.find((entry) => entry.id === id);

  if (!item) {
    return;
  }

  passwords = passwords.filter((entry) => entry.id !== id);
  savePasswords();
  renderPasswords();
  showToast("Password deleted.");
}

function generatePassword() {
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numbers = "0123456789";
  const symbols = "!@#$%^&*()_+-=[]{}|;:,.<>?";
  const requiredSets = [lowercase];

  if (uppercaseOption.checked) {
    requiredSets.push(uppercase);
  }

  if (numbersOption.checked) {
    requiredSets.push(numbers);
  }

  if (symbolsOption.checked) {
    requiredSets.push(symbols);
  }

  const allCharacters = requiredSets.join("");
  const length = Number(lengthInput.value);
  const passwordCharacters = requiredSets.map((set) => randomCharacter(set));

  while (passwordCharacters.length < length) {
    passwordCharacters.push(randomCharacter(allCharacters));
  }

  passwordInput.value = shuffle(passwordCharacters).join("");
  passwordInput.focus();
  showToast("Password generated.");
}

function randomCharacter(characters) {
  const values = new Uint32Array(1);
  crypto.getRandomValues(values);
  return characters[values[0] % characters.length];
}

function shuffle(items) {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const values = new Uint32Array(1);
    crypto.getRandomValues(values);
    const randomIndex = values[0] % (index + 1);
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }

  return shuffled;
}

function applyTheme(theme) {
  const isDark = theme === "dark";
  document.body.classList.toggle("dark", isDark);
  themeIcon.textContent = isDark ? "Light" : "Dark";
  localStorage.setItem(THEME_KEY, theme);
}

function initTheme() {
  const savedTheme = localStorage.getItem(THEME_KEY);
  const preferredTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  applyTheme(savedTheme || preferredTheme);
}

form.addEventListener("submit", handleSubmit);

passwordTableBody.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");

  if (!button) {
    return;
  }

  const id = button.dataset.id;
  const action = button.dataset.action;
  const item = passwords.find((entry) => entry.id === id);

  if (action === "copy" && item) {
    copyText(item.password, "Password copied.");
  }

  if (action === "edit") {
    editPassword(id);
  }

  if (action === "delete") {
    deletePassword(id);
  }
});

searchInput.addEventListener("input", renderPasswords);

cancelEditBtn.addEventListener("click", () => {
  resetForm();
  showToast("Edit cancelled.");
});

generateBtn.addEventListener("click", generatePassword);

copyGeneratedBtn.addEventListener("click", () => {
  if (!passwordInput.value.trim()) {
    showToast("Generate or enter a password first.");
    return;
  }

  copyText(passwordInput.value, "Password copied.");
});

lengthInput.addEventListener("input", () => {
  lengthValue.textContent = lengthInput.value;
});

themeToggle.addEventListener("click", () => {
  const nextTheme = document.body.classList.contains("dark") ? "light" : "dark";
  applyTheme(nextTheme);
});

initTheme();
renderPasswords();
