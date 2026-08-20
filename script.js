// Header frosted glass scroll detection
const siteHeader = document.querySelector(".site-header");
if (siteHeader) {
  const onHeaderScroll = () => {
    if (window.scrollY > 15) {
      siteHeader.classList.add("is-scrolled");
    } else {
      siteHeader.classList.remove("is-scrolled");
    }
  };
  window.addEventListener("scroll", onHeaderScroll, { passive: true });
  onHeaderScroll();
}

const toggle = document.querySelector(".nav-toggle");
const nav = document.querySelector(".site-nav");

if (toggle && nav) {
  toggle.addEventListener("click", (e) => {
    e.stopPropagation();
    const isOpen = nav.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });

  document.addEventListener("click", (e) => {
    if (nav.classList.contains("is-open") && !nav.contains(e.target) && e.target !== toggle) {
      nav.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    }
  });
}

// Lightbox logic
const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightbox-img");
const lightboxClose = document.getElementById("lightbox-close");
const artCards = document.querySelectorAll(".art-card");

if (lightbox && lightboxImg && lightboxClose) {
  const openLightbox = (card) => {
    const img = card.querySelector(".art-card-img");
    if (img && img.src) {
      lightboxImg.src = img.src;
      lightbox.classList.add("is-active");
      lightbox.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      lightboxClose.focus();
    }
  };

  const closeLightbox = () => {
    lightbox.classList.remove("is-active");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.style.overflow = ""; // Restore scroll
    lightboxImg.src = "";
  };

  artCards.forEach(card => {
    card.style.cursor = "pointer";
    card.setAttribute("tabindex", "0");
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", "View artwork in full size");

    card.addEventListener("click", () => openLightbox(card));
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openLightbox(card);
      }
    });
  });

  lightboxClose.addEventListener("click", closeLightbox);

  // Close on background click
  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) {
      closeLightbox();
    }
  });

  // Close on Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && lightbox.classList.contains("is-active")) {
      closeLightbox();
    }
  });
}

// Request modal logic
const openModalBtn = document.getElementById("open-request-modal");
const requestModal = document.getElementById("request-modal");
const modalCloseBtn = document.getElementById("modal-close");
const modalBackdrop = document.getElementById("modal-backdrop");

if (openModalBtn && requestModal) {
  const openModal = () => {
    requestModal.classList.add("is-active");
    requestModal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    if (modalCloseBtn) modalCloseBtn.focus();
  };

  const closeModal = () => {
    requestModal.classList.remove("is-active");
    requestModal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  };

  openModalBtn.addEventListener("click", openModal);
  if (modalCloseBtn) modalCloseBtn.addEventListener("click", closeModal);
  if (modalBackdrop) modalBackdrop.addEventListener("click", closeModal);

  // Close on Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && requestModal.classList.contains("is-active")) {
      closeModal();
    }
  });
}

// ✦ Dynamic Sparkle Cursor Trail & Twinkling Background Particles ✦
(function () {
  // Only enable on screen pointer devices (non-mobile touch-only to prevent lags/accidental taps)
  if (window.matchMedia("(pointer: coarse)").matches) return;

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  canvas.style.position = "fixed";
  canvas.style.top = "0";
  canvas.style.left = "0";
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.pointerEvents = "none";
  canvas.style.zIndex = "-1"; // Layered in front of body gradients, behind interactive DOM content
  document.body.appendChild(canvas);

  let width = canvas.width = window.innerWidth;
  let height = canvas.height = window.innerHeight;

  window.addEventListener("resize", () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  const sparkles = [];
  const colors = ["#fca772", "#ff85a7", "#ffd875"]; // Peach, Berry, Honey brand colors

  class Sparkle {
    constructor(x, y, isMouse = false) {
      this.x = x;
      this.y = y;
      this.isMouse = isMouse;
      this.size = Math.random() * 4 + 2; // Star diameter
      this.maxLife = Math.random() * 25 + 20; // Particle life steps
      this.life = this.maxLife;
      this.color = colors[Math.floor(Math.random() * colors.length)];
      // Drift velocity: slight upward float for all, mouse spreads out slightly
      this.vx = (Math.random() - 0.5) * (isMouse ? 1.6 : 0.6);
      this.vy = isMouse ? (Math.random() - 0.5) * 1.2 - 0.9 : -Math.random() * 0.7 - 0.2;
      this.rotation = Math.random() * Math.PI;
      this.rotSpeed = (Math.random() - 0.5) * 0.04;
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.life--;
      this.rotation += this.rotSpeed;
    }

    draw() {
      const alpha = this.life / this.maxLife;
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);
      ctx.fillStyle = this.color;
      ctx.globalAlpha = alpha;

      // Draw premium 4-point sparkle star vector path
      ctx.beginPath();
      for (let i = 0; i < 4; i++) {
        ctx.rotate(Math.PI / 2);
        ctx.lineTo(0, this.size * 1.5);
        ctx.lineTo(this.size * 0.35, this.size * 0.35);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  // Twinkle drifting stars in background continuously
  setInterval(() => {
    if (sparkles.length < 90 && document.visibilityState === "visible") {
      // Spawn gently from random viewport heights and drift upwards
      sparkles.push(new Sparkle(Math.random() * width, Math.random() * height + height * 0.1, false));
    }
  }, 160);

  // Mouse sparkle trail triggers on mousemove with a tiny throttle distance
  let lastMouseX = 0;
  let lastMouseY = 0;

  window.addEventListener("mousemove", (e) => {
    const dist = Math.hypot(e.clientX - lastMouseX, e.clientY - lastMouseY);
    if (dist > 10) {
      // Spawn 1-2 star sparkles
      sparkles.push(new Sparkle(e.clientX, e.clientY, true));
      if (Math.random() > 0.6) {
        sparkles.push(new Sparkle(e.clientX + (Math.random() - 0.5) * 8, e.clientY + (Math.random() - 0.5) * 8, true));
      }
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;
    }
  });

  function animate() {
    ctx.clearRect(0, 0, width, height);
    for (let i = sparkles.length - 1; i >= 0; i--) {
      const s = sparkles[i];
      s.update();
      if (s.life <= 0 || s.x < -10 || s.x > width + 10 || s.y < -10) {
        sparkles.splice(i, 1);
      } else {
        s.draw();
      }
    }
    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
})();

// ==========================================
// COMMISSION QUEUE LOGIC
// ==========================================

// Google Sheet Comma-Separated Values (CSV) URL.
// When you publish your sheet, paste the .csv link here.
const GOOGLE_SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRl715zmMse3Yj02wVCfOtt6L02VPUtru3oDxAOZ6FQGqz7H3LN-RkXInr0H9DnVKubqVCF2AQWhngI/pub?gid=1202163835&single=true&output=csv";

// Placeholder / Fallback queue data matching your sheet's actual clients!
const fallbackQueueData = [
  { client: "butter26 (Sopainful)", type: "2 FB RENDERED", status: "In Progress" },
  { client: "chrisfish778 (cooper)", type: "1 FB RENDERED", status: "In Progress" },
  { client: "westtworks (Westt)", type: "1 CHIBI", status: "In Queue" },
  { client: "nekrosdoodles (jm)", type: "3 FB RENDERED", status: "In Queue" },
  { client: "dior_jhay (Scarlet)", type: "2 FB RENDERED", status: "Not Started" },
  { client: "icyraven (icyraven)", type: "1 FB + BG", status: "Completed" },
  { client: "aradioactivetoast", type: "album cover hb", status: "Completed" }
];

// Robust CSV Parser: handles quotes, commas inside fields, and empty rows
function parseCSV(text) {
  try {
    const lines = [];
    let row = [];
    let inQuotes = false;
    let currentCell = "";

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          currentCell += '"';
          i++; // Skip escaped double quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        row.push(currentCell.trim());
        currentCell = "";
      } else if ((char === '\r' || char === '\n') && !inQuotes) {
        if (char === '\r' && nextChar === '\n') i++;
        row.push(currentCell.trim());
        if (row.some(cell => cell.length > 0)) {
          lines.push(row);
        }
        row = [];
        currentCell = "";
      } else {
        currentCell += char;
      }
    }
    if (currentCell || row.length > 0) {
      row.push(currentCell.trim());
      lines.push(row);
    }

    if (lines.length < 2) return [];

    const headers = lines[0].map(h => h.toLowerCase());

    // Find column indexes matching Client Name, Commission De, and Project Status
    const clientIdx = headers.findIndex(h => h.includes("client") || h.includes("name"));
    const typeIdx = headers.findIndex(h => h.includes("commission de") || h.includes("detail") || h.includes("type"));

    // Specifically target "Project Status" to avoid conflicting with "Payment Status"
    let statusIdx = headers.findIndex(h => h === "project status" || h.includes("project status"));
    if (statusIdx === -1) {
      statusIdx = headers.findIndex(h => h.includes("status") && !h.includes("payment"));
    }

    if (clientIdx === -1 || statusIdx === -1) {
      console.warn("CSV headers must include 'Client Name' (or similar) and 'Project Status'");
      return [];
    }

    const results = [];
    for (let i = 1; i < lines.length; i++) {
      const cells = lines[i];
      const client = cells[clientIdx] || "";
      const status = cells[statusIdx] || "";

      // Skip inquiries or empty cells that are not active in the queue
      if (!client || !status || status.trim() === "") continue;

      results.push({
        client: client,
        type: typeIdx !== -1 ? (cells[typeIdx] || "") : "",
        status: status
      });
    }
    return results;
  } catch (err) {
    console.error("Error parsing CSV:", err);
    return [];
  }
}

// Render queue cards into the Kanban board columns
function renderQueueKanban(data) {
  const cols = {
    notstarted: document.getElementById("queue-notstarted"),
    inqueue: document.getElementById("queue-inqueue"),
    inprogress: document.getElementById("queue-inprogress"),
    completed: document.getElementById("queue-completed")
  };

  // Clear all columns first
  Object.values(cols).forEach(col => {
    if (col) col.innerHTML = "";
  });

  if (!data || data.length === 0) {
    Object.keys(cols).forEach(key => {
      const colEl = cols[key];
      if (colEl) colEl.innerHTML = `<div class="kanban-empty-state">No commissions</div>`;
    });
    return;
  }

  const counts = { notstarted: 0, inqueue: 0, inprogress: 0, completed: 0 };

  data.forEach(item => {
    const status = (item.status || "").toLowerCase().trim();
    let colKey = "notstarted";

    if (status.includes("progress")) {
      colKey = "inprogress";
    } else if (status.includes("completed") || status.includes("done")) {
      colKey = "completed";
    } else if (status.includes("queue")) {
      colKey = "inqueue";
    } else if (status.includes("started") || status.includes("not started")) {
      colKey = "notstarted";
    }

    const colEl = cols[colKey];
    if (colEl) {
      counts[colKey]++;
      const card = document.createElement("div");
      card.className = "kanban-card";
      card.innerHTML = `
        <div class="kanban-client">${escapeHTML(item.client)}</div>
        <div class="kanban-type">${escapeHTML(item.type || "N/A")}</div>
      `;
      colEl.appendChild(card);
    }
  });

  // For columns that are empty, add a subtle empty state card
  Object.keys(cols).forEach(key => {
    const colEl = cols[key];
    if (colEl && counts[key] === 0) {
      colEl.innerHTML = `<div class="kanban-empty-state">Empty</div>`;
    }
  });
}

// Simple HTML escaping helper
function escapeHTML(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Main fetcher
async function fetchQueueData() {
  if (!GOOGLE_SHEET_CSV_URL) {
    console.log("No Google Sheet CSV URL set. Displaying fallback/placeholder data.");
    renderQueueKanban(fallbackQueueData);
    return;
  }

  try {
    const response = await fetch(GOOGLE_SHEET_CSV_URL);
    if (!response.ok) throw new Error("Network response was not ok");
    const text = await response.text();
    const data = parseCSV(text);
    if (data && data.length > 0) {
      renderQueueKanban(data);
    } else {
      console.warn("Parsed CSV was empty. Using fallback data.");
      renderQueueKanban(fallbackQueueData);
    }
  } catch (err) {
    console.error("Failed to fetch queue data, falling back:", err);
    renderQueueKanban(fallbackQueueData);
  }
}

// Run fetcher immediately since script loads at the bottom of the body
fetchQueueData();



