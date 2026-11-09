/**
 * LIFNEX REQUESTS & FILTERING CONTROLLER
 * Dynamic request list rendering, search, and status filters
 */

const LifnexRequests = {
  renderFeed: function(containerId = "emergencyFeedContainer", filterGroup = "ALL", filterUrgency = "ALL") {
    const container = document.getElementById(containerId);
    if (!container) return;

    let list = LifnexDemoStore.getRequests();

    if (filterGroup !== "ALL") {
      list = list.filter(r => r.blood_group === filterGroup);
    }
    if (filterUrgency !== "ALL") {
      list = list.filter(r => r.urgency === filterUrgency);
    }

    if (list.length === 0) {
      container.innerHTML = `
        <div class="card text-center p-8">
          <p class="text-slate-500 font-semibold mb-1">No emergency blood requests match your selected filters.</p>
          <p class="text-xs text-muted">Try clearing the blood type or urgency filter.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = list.map(req => `
      <div class="emergency-item-card" data-id="${req.id}">
        <div class="emergency-badge-column">
          <span class="blood-type-display">${req.blood_group}</span>
          <span class="units-req-label">${req.units} Units</span>
        </div>

        <div class="emergency-detail-column">
          <div class="flex items-center gap-2 mb-1">
            <span class="badge ${req.urgency === 'critical' ? 'badge-critical pulse-critical' : (req.urgency === 'urgent' ? 'badge-urgent' : 'badge-normal')}">
              ${req.urgency}
            </span>
            <span class="badge badge-demo">Demo</span>
            <span class="text-xs text-muted font-mono">${req.id}</span>
          </div>
          <h4 class="emergency-hospital-name">${req.hospital}</h4>
          <div class="emergency-meta-tags">
            <span>📍 ${req.distance} away (${req.city})</span>
            <span>⏱ Expires in ${req.time_left}</span>
            <span>🏥 Patient: ${req.patient_name}</span>
          </div>
          <p class="text-xs text-slate-500 mt-1 italic">"${req.clinical_note}"</p>
        </div>

        <div class="emergency-actions">
          <button class="btn btn-sm btn-secondary" onclick="Toast.show('Hospital Route', 'Directing to ${req.hospital} navigation...', 'info')">
            View Route
          </button>
          <button class="btn btn-sm btn-primary" data-action="accept-request">
            Respond Now
          </button>
        </div>
      </div>
    `).join("");

    // Reattach accept/decline handlers
    container.querySelectorAll("[data-action='accept-request']").forEach(btn => {
      btn.addEventListener("click", () => {
        const card = btn.closest(".emergency-item-card");
        const reqId = card?.getAttribute("data-id") || "REQ-SAMPLE";
        Modal.open("donorResponseModal");
        const targetSpan = document.getElementById("modalReqId");
        if (targetSpan) targetSpan.textContent = reqId;
      });
    });
  },

  initFilters: function() {
    const bgFilter = document.getElementById("filterBloodGroup");
    const urgencyFilter = document.getElementById("filterUrgency");

    const triggerFilter = () => {
      const bg = bgFilter ? bgFilter.value : "ALL";
      const urg = urgencyFilter ? urgencyFilter.value : "ALL";
      this.renderFeed("emergencyFeedContainer", bg, urg);
    };

    if (bgFilter) bgFilter.addEventListener("change", triggerFilter);
    if (urgencyFilter) urgencyFilter.addEventListener("change", triggerFilter);
  }
};

document.addEventListener("DOMContentLoaded", () => {
  LifnexRequests.renderFeed();
  LifnexRequests.initFilters();
});

