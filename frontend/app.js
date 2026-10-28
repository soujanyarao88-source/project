const API = "/api";
const issueForm = document.querySelector("#issue-form");
const issuesList = document.querySelector("#issues-list");
const formMessage = document.querySelector("#form-message");
const searchInput = document.querySelector("#search-issues");
const statusFilter = document.querySelector("#filter-status");
const adminDialog = document.querySelector("#admin-dialog");
let issues = [];
let isAdmin = false;

function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
}
function statusClass(status) {
  return `status-${String(status).toLowerCase().replace(/\s+/g, "-")}`;
}
function formatDate(value) {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Date unavailable" : date.toLocaleDateString(undefined,{day:"numeric",month:"short",year:"numeric"});
}
function showMessage(element, message, kind = "") {
  element.textContent = message;
  element.className = `form-message ${kind}`.trim();
}
async function api(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    credentials: "same-origin",
    headers: {"Content-Type":"application/json", ...(options.headers || {})},
    ...options
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || "Something went wrong. Please try again.");
  return payload;
}
function updateStats() {
  document.querySelector("#stat-total").textContent = issues.length;
  document.querySelector("#stat-progress").textContent = issues.filter(i => i.status === "In Progress").length;
  document.querySelector("#stat-resolved").textContent = issues.filter(i => i.status === "Resolved").length;
}
function renderIssues() {
  const query = searchInput.value.trim().toLowerCase();
  const wantedStatus = statusFilter.value;
  const filtered = issues.filter(issue =>
    (!wantedStatus || issue.status === wantedStatus) &&
    `${issue.title} ${issue.location} ${issue.category} ${issue.description}`.toLowerCase().includes(query)
  );
  if (!filtered.length) {
    issuesList.innerHTML = '<div class="empty-state">No matching issues found. Try another search or report a new issue.</div>';
    return;
  }
  issuesList.innerHTML = filtered.map(issue => `
    <article class="issue-card">
      <div class="issue-top"><div><h3>${escapeHTML(issue.title)}</h3><p>${escapeHTML(issue.location)}</p></div>
      <span class="pill ${statusClass(issue.status)}">${escapeHTML(issue.status)}</span></div>
      <p>${escapeHTML(issue.description)}</p>
      <div class="issue-meta"><span class="category-tag">${escapeHTML(issue.category)}</span><span>Reported ${formatDate(issue.created_at)}</span><span>ID: ${escapeHTML(issue.id.slice(0,8))}</span></div>
      ${issue.resolution_note ? `<p><strong>Update:</strong> ${escapeHTML(issue.resolution_note)}</p>` : ""}
    </article>`).join("");
}
async function loadIssues() {
  issuesList.innerHTML = '<div class="loading-state">Loading community issues…</div>';
  try {
    const data = await api("/issues");
    issues = data.issues || [];
    updateStats();
    renderIssues();
    document.querySelector("#issues-message").textContent = `${issues.length} issue${issues.length === 1 ? "" : "s"} available`;
  } catch (error) {
    issuesList.innerHTML = '<div class="empty-state">Could not load issues. Check that the server and Supabase setup are running.</div>';
    document.querySelector("#issues-message").textContent = error.message;
    ["#stat-total","#stat-progress","#stat-resolved"].forEach(selector => document.querySelector(selector).textContent = "—");
  }
}
issueForm.addEventListener("submit", async event => {
  event.preventDefault();
  const button = document.querySelector("#submit-issue");
  button.disabled = true;
  button.textContent = "Submitting…";
  showMessage(formMessage, "");
  const formData = new FormData(issueForm);
  const body = Object.fromEntries(formData.entries());
  for (const key of Object.keys(body)) body[key] = body[key].trim();
  try {
    const result = await api("/issues", {method:"POST",body:JSON.stringify(body)});
    showMessage(formMessage, `Report submitted successfully. Your issue ID is ${result.issue.id}.`, "success");
    issueForm.reset();
    await loadIssues();
  } catch (error) {
    showMessage(formMessage, error.message, "error");
  } finally {
    button.disabled = false;
    button.innerHTML = 'Submit report <span aria-hidden="true">→</span>';
  }
});
searchInput.addEventListener("input", renderIssues);
statusFilter.addEventListener("change", renderIssues);
document.querySelector("#refresh-issues").addEventListener("click", loadIssues);

function openAdmin() {
  adminDialog.showModal();
  if (!isAdmin) document.querySelector("#admin-password").focus();
  else loadAdminIssues();
}
document.querySelector("#admin-open").addEventListener("click", openAdmin);
document.querySelector("#admin-close").addEventListener("click", () => adminDialog.close());
document.querySelector("#admin-login-form").addEventListener("submit", async event => {
  event.preventDefault();
  const button = document.querySelector("#admin-login-submit");
  button.disabled = true;
  showMessage(document.querySelector("#login-message"), "");
  try {
    await api("/admin/login", {method:"POST",body:JSON.stringify({password:document.querySelector("#admin-password").value})});
    isAdmin = true;
    document.querySelector("#admin-password").value = "";
    document.querySelector("#admin-login-form").hidden = true;
    document.querySelector("#admin-tools").hidden = false;
    await loadAdminIssues();
  } catch (error) {
    showMessage(document.querySelector("#login-message"), error.message, "error");
  } finally { button.disabled = false; }
});
async function loadAdminIssues() {
  const list = document.querySelector("#admin-issue-list");
  list.innerHTML = '<div class="loading-state">Loading…</div>';
  try {
    const data = await api("/admin/issues");
    list.innerHTML = data.issues.length ? data.issues.map(issue => `
      <article class="admin-row" data-id="${escapeHTML(issue.id)}">
        <h4>${escapeHTML(issue.title)}</h4><p>${escapeHTML(issue.location)} · ${escapeHTML(issue.category)}</p>
        <label for="status-${escapeHTML(issue.id)}">Status</label>
        <div class="admin-row-controls"><select id="status-${escapeHTML(issue.id)}">
          ${["Pending","In Progress","Resolved"].map(status => `<option ${issue.status===status?"selected":""}>${status}</option>`).join("")}
        </select><button class="button button-primary save-status" type="button">Save</button></div>
        <label for="note-${escapeHTML(issue.id)}">Resolution note (optional)</label><input id="note-${escapeHTML(issue.id)}" maxlength="500" value="${escapeHTML(issue.resolution_note || "")}" placeholder="Add an update">
      </article>`).join("") : '<div class="empty-state">No reports have been submitted yet.</div>';
    list.querySelectorAll(".save-status").forEach(button => button.addEventListener("click", async () => {
      const row = button.closest(".admin-row");
      button.disabled = true;
      try {
        await api(`/admin/issues/${encodeURIComponent(row.dataset.id)}`, {
          method:"PATCH",
          body:JSON.stringify({
            status:row.querySelector("select").value,
            resolution_note:row.querySelector("input").value.trim()
          })
        });
        showToast("Issue updated successfully.");
        await loadIssues();
        await loadAdminIssues();
      } catch (error) { showToast(error.message); }
      finally { button.disabled = false; }
    }));
  } catch (error) {
    list.innerHTML = `<div class="empty-state">${escapeHTML(error.message)}</div>`;
  }
}
document.querySelector("#admin-logout").addEventListener("click", async () => {
  try { await api("/admin/logout", {method:"POST",body:"{}"}); } catch {}
  isAdmin = false;
  document.querySelector("#admin-login-form").hidden = false;
  document.querySelector("#admin-tools").hidden = true;
  showMessage(document.querySelector("#login-message"), "You have logged out.", "success");
});
function showToast(message) {
  const toast = document.querySelector("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  window.setTimeout(() => toast.classList.remove("show"), 2600);
}
loadIssues();
