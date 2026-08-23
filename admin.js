/**
 * evilfurrybird - Admin Dashboard Logic
 */

document.addEventListener("DOMContentLoaded", () => {
  const loginSection = document.getElementById("admin-login-section");
  const dashboardSection = document.getElementById("admin-dashboard-section");
  const loginForm = document.getElementById("login-form");
  const loginEmailInput = document.getElementById("login-email");
  const loginPasswordInput = document.getElementById("login-password");
  const loginError = document.getElementById("login-error");
  const logoutBtn = document.getElementById("logout-btn");
  const userEmailDisplay = document.getElementById("user-email-display");
  const toast = document.getElementById("admin-toast");

  const statusChips = document.querySelectorAll(".status-chip");
  const uploadForm = document.getElementById("upload-artwork-form");
  const uploadFileInput = document.getElementById("artwork-file");
  const uploadTitleInput = document.getElementById("artwork-title");
  const uploadBtn = document.getElementById("upload-btn");
  const adminGalleryGrid = document.getElementById("admin-gallery-grid");
  const galleryCountEl = document.getElementById("gallery-count");
  const adminPricingGrid = document.getElementById("admin-pricing-grid");

  // Show Toast Notification
  function showToast(msg, isError = false) {
    if (!toast) return;
    toast.textContent = msg;
    toast.className = `admin-toast ${isError ? "error" : "success"} show`;
    setTimeout(() => {
      toast.className = "admin-toast";
    }, 3500);
  }

  const loginBtn = document.getElementById("login-btn");

  // Check auth session
  async function checkAuthSession() {
    const client = getSupabaseClient();
    
    // Check if passcode session exists
    const localPasscode = localStorage.getItem("evilfurrybird_admin_auth");
    if (localPasscode === "authenticated") {
      if (loginSection) loginSection.style.display = "none";
      if (dashboardSection) dashboardSection.style.display = "block";
      if (userEmailDisplay) userEmailDisplay.textContent = "Artist (Admin)";
      loadDashboardData();
      return;
    }

    if (!client) {
      if (loginSection) loginSection.style.display = "flex";
      if (dashboardSection) dashboardSection.style.display = "none";
      if (loginError) {
        loginError.style.display = "block";
        loginError.innerHTML = "<strong>Notice:</strong> Please add your Supabase URL and Anon Key inside <code>supabase.js</code> to connect authentication.";
      }
      return;
    }

    try {
      const { data: { session } } = await client.auth.getSession();
      if (session && session.user) {
        if (loginSection) loginSection.style.display = "none";
        if (dashboardSection) dashboardSection.style.display = "block";
        if (userEmailDisplay) userEmailDisplay.textContent = session.user.email || "Artist";
        loadDashboardData();
      } else {
        if (loginSection) loginSection.style.display = "flex";
        if (dashboardSection) dashboardSection.style.display = "none";
      }
    } catch (err) {
      console.error("Auth check failed:", err);
      if (loginSection) loginSection.style.display = "flex";
      if (dashboardSection) dashboardSection.style.display = "none";
    }
  }

  // Handle Login Form Submit
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = loginEmailInput ? loginEmailInput.value.trim() : "";
      const password = loginPasswordInput ? loginPasswordInput.value.trim() : "";
      
      if (loginError) loginError.style.display = "none";

      if (loginBtn) {
        loginBtn.disabled = true;
        loginBtn.textContent = "Signing In...";
      }

      const client = getSupabaseClient();

      try {
        // Option A: If Supabase client exists, attempt Supabase Auth
        if (client) {
          const { data, error } = await client.auth.signInWithPassword({ email, password });
          if (!error && data && data.session) {
            showToast("Welcome back! Loading dashboard... ✨");
            await checkAuthSession();
            return;
          }
        }

        // Option B: Passcode / Local Admin fallback if email or password matches artist password or passcode
        if (password === "evilfurrybird" || password === "admin" || email === "evilfurrybird") {
          localStorage.setItem("evilfurrybird_admin_auth", "authenticated");
          showToast("Signed in successfully! ✨");
          await checkAuthSession();
          return;
        }

        // If auth failed
        throw new Error("Invalid email or password. (If you haven't created a Supabase Auth user yet in your Supabase Dashboard, use passcode 'evilfurrybird' to log in).");

      } catch (err) {
        if (loginError) {
          loginError.style.display = "block";
          loginError.innerHTML = `<strong>Login Error:</strong> ${escapeHTML(err.message || "Authentication failed.")}`;
        }
        showToast(err.message || "Login failed", true);
      } finally {
        if (loginBtn) {
          loginBtn.disabled = false;
          loginBtn.textContent = "Sign In to Dashboard";
        }
      }
    });
  }

  // Handle Logout
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      localStorage.removeItem("evilfurrybird_admin_auth");
      const client = getSupabaseClient();
      if (client) {
        try {
          await client.auth.signOut();
        } catch (e) {}
      }
      checkAuthSession();
      showToast("Logged out successfully.");
    });
  }

  // Load All Dashboard Data
  async function loadDashboardData() {
    loadStatusSetting();
    loadGalleryManager();
    loadPricingManager();
  }

  // 1. Commission Status Settings
  async function loadStatusSetting() {
    const settings = await fetchSiteSettings();
    const currentStatus = (settings && settings.commission_status) ? settings.commission_status : "paused";
    updateActiveStatusChip(currentStatus);
  }

  function updateActiveStatusChip(activeStatus) {
    statusChips.forEach(chip => {
      if (chip.getAttribute("data-status") === activeStatus) {
        chip.classList.add("active");
      } else {
        chip.classList.remove("active");
      }
    });
  }

  statusChips.forEach(chip => {
    chip.addEventListener("click", async () => {
      const newStatus = chip.getAttribute("data-status");
      updateActiveStatusChip(newStatus);
      try {
        await updateCommissionStatus(newStatus);
        showToast(`Commission status updated to ${newStatus.toUpperCase()}! ✨`);
      } catch (err) {
        showToast(`Failed to update status: ${err.message}`, true);
      }
    });
  });

  // 2. Gallery Artwork Manager
  async function loadGalleryManager() {
    if (!adminGalleryGrid) return;
    adminGalleryGrid.innerHTML = `<div class="admin-loading">Loading live gallery items...</div>`;

    const items = await fetchGalleryItems();

    if (!items || items.length === 0) {
      adminGalleryGrid.innerHTML = `<div class="admin-empty">No gallery images uploaded yet. Upload one above!</div>`;
      if (galleryCountEl) galleryCountEl.textContent = "0";
      return;
    }

    if (galleryCountEl) galleryCountEl.textContent = String(items.length);
    adminGalleryGrid.innerHTML = "";

    items.forEach(item => {
      const card = document.createElement("div");
      card.className = "admin-art-card";
      card.innerHTML = `
        <div class="admin-art-img-wrapper">
          <img src="${item.image_url}" alt="${escapeHTML(item.title || 'Artwork')}" loading="lazy">
        </div>
        <div class="admin-art-info">
          <div class="admin-art-title">${escapeHTML(item.title || "Untitled")}</div>
          <button type="button" class="admin-delete-btn" data-id="${item.id}" data-path="${item.storage_path || ''}">
            Delete 🗑️
          </button>
        </div>
      `;
      adminGalleryGrid.appendChild(card);
    });

    // Attach delete handlers
    document.querySelectorAll(".admin-delete-btn").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-id");
        const path = btn.getAttribute("data-path");
        if (confirm("Are you sure you want to delete this artwork from the live gallery?")) {
          btn.textContent = "Deleting...";
          btn.disabled = true;
          try {
            await deleteGalleryArtwork(id, path);
            showToast("Artwork deleted successfully!");
            loadGalleryManager();
          } catch (err) {
            showToast(`Delete failed: ${err.message}`, true);
            btn.textContent = "Delete 🗑️";
            btn.disabled = false;
          }
        }
      });
    });
  }

  // Handle Upload
  if (uploadForm) {
    uploadForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const file = uploadFileInput.files[0];
      const title = uploadTitleInput.value.trim();

      if (!file) {
        showToast("Please select an image file to upload.", true);
        return;
      }

      uploadBtn.disabled = true;
      uploadBtn.textContent = "Uploading Image...";

      try {
        await uploadGalleryArtwork(file, title);
        showToast("Artwork uploaded to live gallery! ✨");
        uploadForm.reset();
        loadGalleryManager();
      } catch (err) {
        showToast(`Upload failed: ${err.message}`, true);
      } finally {
        uploadBtn.disabled = false;
        uploadBtn.textContent = "Upload to Gallery ✨";
      }
    });
  }

  // 3. Pricing Manager
  async function loadPricingManager() {
    if (!adminPricingGrid) return;
    adminPricingGrid.innerHTML = `<div class="admin-loading">Loading pricing tiers...</div>`;

    const prices = await fetchCommissionPrices();

    if (!prices || prices.length === 0) {
      adminPricingGrid.innerHTML = `<div class="admin-empty">No pricing tiers found in database. Create rows in commission_prices table to edit them here.</div>`;
      return;
    }

    adminPricingGrid.innerHTML = "";

    prices.forEach(tier => {
      const card = document.createElement("div");
      card.className = "admin-price-card";
      card.innerHTML = `
        <form class="price-edit-form" data-id="${tier.id}">
          <h3>${escapeHTML(tier.title || "Commission Tier")}</h3>
          <div class="form-group">
            <label>Price ($ USD)</label>
            <input type="number" class="admin-input price-val" value="${tier.price || 0}" step="1" required>
          </div>
          <div class="form-group">
            <label>Tier Title</label>
            <input type="text" class="admin-input title-val" value="${escapeHTML(tier.title || '')}" required>
          </div>
          <div class="form-group">
            <label>Subtitle / Details</label>
            <input type="text" class="admin-input subtitle-val" value="${escapeHTML(tier.subtitle || '')}">
          </div>
          <button type="submit" class="button primary btn-sm">Save Price & Details</button>
        </form>
      `;
      adminPricingGrid.appendChild(card);
    });

    document.querySelectorAll(".price-edit-form").forEach(form => {
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const id = form.getAttribute("data-id");
        const newPrice = parseFloat(form.querySelector(".price-val").value);
        const newTitle = form.querySelector(".title-val").value.trim();
        const newSubtitle = form.querySelector(".subtitle-val").value.trim();

        const submitBtn = form.querySelector("button[type='submit']");
        submitBtn.disabled = true;
        submitBtn.textContent = "Saving...";

        try {
          await updatePriceTier(id, { price: newPrice, title: newTitle, subtitle: newSubtitle });
          showToast("Price tier updated live!");
        } catch (err) {
          showToast(`Update failed: ${err.message}`, true);
        } finally {
          submitBtn.disabled = false;
          submitBtn.textContent = "Save Price & Details";
        }
      });
    });
  }

  // Helper
  function escapeHTML(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Initialize Auth Check
  checkAuthSession();
});
