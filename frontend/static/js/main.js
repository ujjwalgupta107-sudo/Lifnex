/**
 * LIFNEX CORE JAVASCRIPT
 * Global utilities: Toast manager, Modal controller, Navigation, Synthetic Store
 */

// 1. Synthetic Demo Store (LocalStorage safe demo data only)
const LifnexDemoStore = {
  // Never store sensitive personal records or credentials
  getRequests: function() {
    const defaultRequests = [
      {
        id: "REQ-701",
        patient_name: "Sarah Jenkins (Demo)",
        hospital: "City Care Super Specialty Hospital",
        city: "Metropolis",
        blood_group: "O-",
        units: 2,
        urgency: "critical",
        status: "open",
        distance: "2.4 km",
        time_left: "35 mins",
        clinical_note: "Immediate trauma unit resuscitation required.",
        created_at: "Just now"
      },
      {
        id: "REQ-702",
        patient_name: "Michael Chang (Demo)",
        hospital: "Metro Central Trauma Center",
        city: "Metropolis",
        blood_group: "B+",
        units: 3,
        urgency: "urgent",
        status: "in_progress",
        distance: "4.8 km",
        time_left: "2 hrs",
        clinical_note: "Orthopedic surgery preparation.",
        created_at: "18 mins ago"
      },
      {
        id: "REQ-703",
        patient_name: "Elena Rostova (Demo)",
        hospital: "St. Jude Memorial Blood Bank",
        city: "Metropolis",
        blood_group: "A-",
        units: 1,
        urgency: "normal",
        status: "open",
        distance: "6.1 km",
        time_left: "6 hrs",
        clinical_note: "Scheduled thalassemia transfusion unit.",
        created_at: "45 mins ago"
      },
      {
        id: "REQ-704",
        patient_name: "David Kumar (Demo)",
        hospital: "Apex Regional Medical Center",
        city: "Metropolis",
        blood_group: "AB+",
        units: 2,
        urgency: "urgent",
        status: "open",
        distance: "8.3 km",
        time_left: "3 hrs",
        clinical_note: "Cardiothoracic bypass support unit.",
        created_at: "1 hour ago"
      }
    ];

    const stored = localStorage.getItem("lifnex_demo_requests");
    if (!stored) {
      localStorage.setItem("lifnex_demo_requests", JSON.stringify(defaultRequests));
      return defaultRequests;
    }
    try {
      return JSON.parse(stored);
    } catch (e) {
      return defaultRequests;
    }
  },

  addRequest: function(newReq) {
    const list = this.getRequests();
    list.unshift(newReq);
    localStorage.setItem("lifnex_demo_requests", JSON.stringify(list));
    return newReq;
  },

  getDonorResponses: function() {
    const stored = localStorage.getItem("lifnex_demo_responses");
    if (!stored) {
      const defaultResponses = [
        { id: "RESP-101", requestId: "REQ-701", donorName: "Alex Rivera (Demo)", bloodGroup: "O-", eta: "25 mins", status: "accepted" },
        { id: "RESP-102", requestId: "REQ-702", donorName: "Priya Sharma (Demo)", bloodGroup: "B+", eta: "40 mins", status: "accepted" }
      ];
      localStorage.setItem("lifnex_demo_responses", JSON.stringify(defaultResponses));
      return defaultResponses;
    }
    return JSON.parse(stored);
  },

  saveDonorResponse: function(resp) {
    const list = this.getDonorResponses();
    list.unshift(resp);
    localStorage.setItem("lifnex_demo_responses", JSON.stringify(list));
  }
};

// 2. Global Toast Notification System
const Toast = {
  container: null,

  init: function() {
    if (!this.container) {
      this.container = document.createElement("div");
      this.container.className = "toast-container";
      document.body.appendChild(this.container);
    }
  },

  show: function(title, message, type = "info", duration = 4000) {
    this.init();
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    
    toast.innerHTML = `
      <div class="toast-content">
        <div class="toast-title">${this.escape(title)}</div>
        <div class="toast-message">${this.escape(message)}</div>
      </div>
      <button class="toast-close" aria-label="Close alert">&times;</button>
    `;

    toast.querySelector(".toast-close").addEventListener("click", () => {
      this.dismiss(toast);
    });

    this.container.appendChild(toast);
    // Trigger transition
    requestAnimationFrame(() => {
      toast.classList.add("show");
    });

    if (duration > 0) {
      setTimeout(() => {
        this.dismiss(toast);
      }, duration);
    }
  },

  dismiss: function(toast) {
    toast.classList.remove("show");
    setTimeout(() => {
      if (toast.parentElement) {
        toast.parentElement.removeChild(toast);
      }
    }, 300);
  },

  escape: function(text) {
    const div = document.createElement("div");
    div.textContent = text || "";
    return div.innerHTML;
  }
};

// 3. Modal Dialog Controller
const Modal = {
  open: function(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add("active");
      document.body.style.overflow = "hidden";
    }
  },

  close: function(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove("active");
      document.body.style.overflow = "";
    }
  },

  initListeners: function() {
    document.querySelectorAll("[data-modal-open]").forEach(trigger => {
      trigger.addEventListener("click", (e) => {
        e.preventDefault();
        const targetId = trigger.getAttribute("data-modal-open");
        Modal.open(targetId);
      });
    });

    document.querySelectorAll("[data-modal-close]").forEach(trigger => {
      trigger.addEventListener("click", (e) => {
        e.preventDefault();
        const targetId = trigger.getAttribute("data-modal-close");
        Modal.close(targetId);
      });
    });

    document.querySelectorAll(".modal-backdrop").forEach(backdrop => {
      backdrop.addEventListener("click", (e) => {
        if (e.target === backdrop) {
          backdrop.classList.remove("active");
          document.body.style.overflow = "";
        }
      });
    });
  }
};

// 4. Blood Compatibility Interactive Matrix Controller
const BloodCompatibility = {
  matrix: {
    "O-":  { donateTo: ["All Blood Types (Universal Donor)"], receiveFrom: ["O-"] },
    "O+":  { donateTo: ["O+", "A+", "B+", "AB+"], receiveFrom: ["O+", "O-"] },
    "A-":  { donateTo: ["A-", "A+", "AB-", "AB+"], receiveFrom: ["A-", "O-"] },
    "A+":  { donateTo: ["A+", "AB+"], receiveFrom: ["A+", "A-", "O+", "O-"] },
    "B-":  { donateTo: ["B-", "B+", "AB-", "AB+"], receiveFrom: ["B-", "O-"] },
    "B+":  { donateTo: ["B+", "AB+"], receiveFrom: ["B+", "B-", "O+", "O-"] },
    "AB-": { donateTo: ["AB-", "AB+"], receiveFrom: ["AB-", "A-", "B-", "O-"] },
    "AB+": { donateTo: ["AB+ Only"], receiveFrom: ["All Blood Types (Universal Recipient)"] }
  },

  init: function() {
    const cells = document.querySelectorAll(".matrix-cell");
    const detailBox = document.getElementById("matrixDetailBox");
    if (!cells.length || !detailBox) return;

    cells.forEach(cell => {
      cell.addEventListener("click", () => {
        cells.forEach(c => c.classList.remove("active"));
        cell.classList.add("active");
        const group = cell.getAttribute("data-group");
        const data = this.matrix[group];
        if (data) {
          detailBox.innerHTML = `
            <h4 class="font-bold text-crimson mb-1">Blood Group: ${group}</h4>
            <p class="text-sm mb-1"><strong>Can safely donate red blood cells to:</strong> ${data.donateTo.join(", ")}</p>
            <p class="text-sm"><strong>Can receive red blood cells from:</strong> ${data.receiveFrom.join(", ")}</p>
            <p class="text-xs text-muted mt-2"><em>*Final biological compatibility must always be verified via clinical cross-matching by certified healthcare professionals.</em></p>
          `;
        }
      });
    });
  }
};

// 5. General DOM Ready Initialization
document.addEventListener("DOMContentLoaded", () => {
  // Mobile Nav Toggle for public pages
  const navToggle = document.getElementById("mobileNavToggle");
  const navLinks = document.getElementById("navLinks");
  if (navToggle && navLinks) {
    navToggle.addEventListener("click", () => {
      navLinks.classList.toggle("mobile-open");
    });
  }

  // Dashboard Sidebar Toggle
  const sidebarToggle = document.getElementById("sidebarToggleBtn");
  const sidebar = document.querySelector(".dashboard-sidebar");
  if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener("click", () => {
      sidebar.classList.toggle("sidebar-open");
    });
  }

  // Notifications Toggle
  const notifBtn = document.getElementById("notificationsBtn");
  const notifDropdown = document.getElementById("notificationsDropdown");
  if (notifBtn && notifDropdown) {
    notifBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      notifDropdown.classList.toggle("active");
    });

    document.addEventListener("click", (e) => {
      if (!notifDropdown.contains(e.target) && e.target !== notifBtn) {
        notifDropdown.classList.remove("active");
      }
    });
  }

  // Initialize Modals and Compatibility Matrix
  Modal.initListeners();
  BloodCompatibility.init();
});

