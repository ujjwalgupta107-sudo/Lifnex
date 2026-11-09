/**
 * LIFNEX REALTIME & NOTIFICATION CONTROLLER (PHASE 7)
 * Manages:
 * - Supabase Realtime channel subscriptions with graceful fallback
 * - Automatic Patient Dashboard response updates when donors respond
 * - Automatic Donor Hub updates when matching emergency requests arrive
 * - Notification bell badge, dropdown toggle, and mark-as-read syncing
 * - Connection-loss detection, status indicator, and exponential backoff retries
 * - Clean teardown of active channels to avoid memory leaks
 */

const LifnexRealtime = {
  supabaseClient: null,
  activeChannels: [],
  isConnected: true,
  retryAttempts: 0,
  maxRetries: 5,

  init: function() {
    this.initSupabaseClient();
    this.bindConnectionMonitor();
    this.initNotificationDropdown();
    this.fetchNotifications();

    // Subscribe to live channels based on user role and current page
    const userRole = this.getUserRole();
    if (userRole === "patient" || document.getElementById("patientActiveRequestCard")) {
      this.subscribePatientUpdates();
    }
    if (userRole === "donor" || document.getElementById("donorAvailabilityToggle")) {
      this.subscribeDonorFeedUpdates();
    }

    // Clean up subscriptions when navigating away
    window.addEventListener("beforeunload", () => {
      this.cleanup();
    });
  },

  getUserRole: function() {
    try {
      const userStr = localStorage.getItem("lifnex_user");
      if (userStr) {
        const u = JSON.parse(userStr);
        return u.role;
      }
    } catch (e) {}
    return null;
  },

  getAuthToken: function() {
    try {
      return localStorage.getItem("lifnex_token");
    } catch (e) {
      return null;
    }
  },

  initSupabaseClient: function() {
    // If Supabase JS library is loaded in window
    if (typeof supabase !== "undefined" && window.LIFNEX_CONFIG) {
      try {
        this.supabaseClient = supabase.createClient(
          window.LIFNEX_CONFIG.SUPABASE_URL,
          window.LIFNEX_CONFIG.SUPABASE_ANON_KEY
        );
      } catch (e) {
        console.debug("Supabase Realtime client init (running in demo mode):", e);
      }
    }
  },

  // Online / Offline and Connection Loss Monitor
  bindConnectionMonitor: function() {
    const updateStatus = (online) => {
      this.isConnected = online;
      let bar = document.getElementById("lifnexConnectionBanner");
      if (!online) {
        if (!bar) {
          bar = document.createElement("div");
          bar.id = "lifnexConnectionBanner";
          bar.className = "bg-rose-600 text-white text-xs py-1 px-4 text-center font-bold sticky top-0 z-50 flex items-center justify-center gap-2";
          bar.innerHTML = `
            <span>⚠️ Realtime Connection Lost. Retrying automatic reconnection...</span>
            <button onclick="LifnexRealtime.reconnect()" class="underline hover:text-rose-100 text-xs">Reconnect Now</button>
          `;
          document.body.prepend(bar);
        }
      } else {
        if (bar) {
          bar.className = "bg-emerald-600 text-white text-xs py-1 px-4 text-center font-bold sticky top-0 z-50";
          bar.textContent = "✓ Realtime Connection Restored";
          setTimeout(() => bar.remove(), 2500);
        }
      }
    };

    window.addEventListener("online", () => updateStatus(true));
    window.addEventListener("offline", () => updateStatus(false));
  },

  reconnect: function() {
    if (this.retryAttempts >= this.maxRetries) {
      Toast.show("Connection Failed", "Unable to establish realtime connection. Operating in cached mode.", "warning");
      return;
    }
    this.retryAttempts++;
    Toast.show("Reconnecting", `Attempting to reconnect (${this.retryAttempts}/${this.maxRetries})...`, "info");
    this.cleanup();
    setTimeout(() => {
      this.init();
      const bar = document.getElementById("lifnexConnectionBanner");
      if (bar) bar.remove();
    }, 1000 * Math.pow(2, this.retryAttempts));
  },

  // 1. Patient Dashboard Realtime Subscription
  subscribePatientUpdates: function() {
    if (!this.supabaseClient) return;

    try {
      const channel = this.supabaseClient
        .channel("patient-responses")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "donor_responses" },
          (payload) => {
            this.handleIncomingDonorResponse(payload.new);
          }
        )
        .subscribe();

      this.activeChannels.push(channel);
    } catch (e) {
      console.debug("Patient Realtime subscription fallback:", e);
    }
  },

  handleIncomingDonorResponse: function(responseRecord) {
    if (!responseRecord) return;
    const toastTitle = "Donor En Route!";
    const toastMsg = `A voluntary donor has responded with ETA ~${responseRecord.eta_minutes || 30} minutes.`;
    if (typeof Toast !== "undefined") {
      Toast.show(toastTitle, toastMsg, "success", 6000);
    }

    // Dynamically append or update donor list on patient dashboard
    const respContainer = document.getElementById("patientDonorResponsesContainer");
    if (respContainer) {
      const itemHtml = `
        <div class="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between mb-2">
          <div>
            <div class="font-bold text-xs text-emerald-900">Verified Voluntary Donor Matched</div>
            <div class="text-[11px] text-emerald-700">Status: En Route | Estimated Arrival: ${responseRecord.eta_minutes || 30} mins</div>
          </div>
          <span class="badge badge-success text-xs font-semibold">Accepted</span>
        </div>
      `;
      respContainer.insertAdjacentHTML("afterbegin", itemHtml);
    }

    this.fetchNotifications();
  },

  // 2. Donor Feed Realtime Subscription
  subscribeDonorFeedUpdates: function() {
    if (!this.supabaseClient) return;

    try {
      const channel = this.supabaseClient
        .channel("donor-feed")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "blood_requests" },
          (payload) => {
            this.handleNewEmergencyRequest(payload.new);
          }
        )
        .subscribe();

      this.activeChannels.push(channel);
    } catch (e) {
      console.debug("Donor Feed Realtime subscription fallback:", e);
    }
  },

  handleNewEmergencyRequest: function(newReq) {
    if (!newReq) return;
    if (typeof Toast !== "undefined") {
      Toast.show(
        "Critical Emergency Request!",
        `New ${newReq.urgency_level || 'urgent'} requirement for ${newReq.blood_group} blood.`,
        "error",
        6000
      );
    }

    // Refresh donor feed if present
    if (typeof LifnexRequests !== "undefined" && typeof LifnexRequests.renderFeed === "function") {
      LifnexRequests.renderFeed();
    }
    this.fetchNotifications();
  },

  // 3. In-App Notifications Fetching & Read Status
  fetchNotifications: function() {
    const token = this.getAuthToken();
    if (!token) return;

    fetch("/api/v1/notifications", {
      headers: { "Authorization": `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        this.renderNotifications(data.data, data.unread_count);
      }
    })
    .catch(err => console.debug("Notifications fetch (fallback mode):", err));
  },

  renderNotifications: function(list, unreadCount) {
    const bubble = document.querySelector(".unread-bubble");
    if (bubble) {
      if (unreadCount > 0) {
        bubble.style.display = "block";
        bubble.textContent = unreadCount > 9 ? "9+" : unreadCount;
      } else {
        bubble.style.display = "none";
      }
    }

    const dropdown = document.getElementById("notificationsDropdown");
    if (!dropdown) return;

    let container = dropdown.querySelector(".notifications-list");
    if (!container) {
      container = document.createElement("div");
      container.className = "notifications-list";
      dropdown.appendChild(container);
    }

    if (!list || list.length === 0) {
      container.innerHTML = `<div class="p-4 text-center text-xs text-slate-400">No emergency notifications.</div>`;
      return;
    }

    container.innerHTML = list.map(n => `
      <div class="notif-item ${n.is_read ? '' : 'unread'}" data-id="${n.id}">
        <div class="notif-title font-bold text-xs">${n.title}</div>
        <div class="notif-desc text-xs text-slate-600">${n.message}</div>
        <div class="flex justify-between items-center mt-1">
          <span class="text-[10px] text-slate-400">${n.created_at ? new Date(n.created_at).toLocaleTimeString() : 'Just now'}</span>
          ${!n.is_read ? `<button class="text-[10px] text-crimson-600 font-semibold hover:underline" onclick="LifnexRealtime.markAsRead('${n.id}')">Mark as read</button>` : ''}
        </div>
      </div>
    `).join("");
  },

  markAsRead: function(notificationId) {
    const token = this.getAuthToken();
    fetch(`/api/v1/notifications/${notificationId}/read`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { "Authorization": `Bearer ${token}` } : {})
      }
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        this.fetchNotifications();
      }
    })
    .catch(err => console.error("Error marking notification read:", err));
  },

  markAllRead: function() {
    const token = this.getAuthToken();
    fetch("/api/v1/notifications/mark-all-read", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { "Authorization": `Bearer ${token}` } : {})
      }
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        this.fetchNotifications();
      }
    })
    .catch(err => console.error("Error marking all read:", err));
  },

  initNotificationDropdown: function() {
    const notifBtn = document.getElementById("notificationsBtn");
    const dropdown = document.getElementById("notificationsDropdown");

    if (notifBtn && dropdown) {
      notifBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        dropdown.classList.toggle("open");
      });

      document.addEventListener("click", (e) => {
        if (!dropdown.contains(e.target) && !notifBtn.contains(e.target)) {
          dropdown.classList.remove("open");
        }
      });
    }
  },

  cleanup: function() {
    if (this.supabaseClient && this.activeChannels.length > 0) {
      this.activeChannels.forEach(ch => {
        try {
          this.supabaseClient.removeChannel(ch);
        } catch (e) {}
      });
      this.activeChannels = [];
    }
  }
};

document.addEventListener("DOMContentLoaded", () => {
  LifnexRealtime.init();
});

