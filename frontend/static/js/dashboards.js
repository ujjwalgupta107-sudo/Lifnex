/**
 * LIFNEX DASHBOARDS & REQUEST WORKFLOWS
 * Manages donor availability, request responses, filterings, and emergency submissions
 */

document.addEventListener("DOMContentLoaded", () => {
  // 1. Donor Availability Toggle Switch
  const availToggle = document.getElementById("donorAvailabilityToggle");
  const availStatusText = document.getElementById("availabilityStatusLabel");
  if (availToggle && availStatusText) {
    availToggle.addEventListener("change", () => {
      const isAvailable = availToggle.checked;
      const statusValue = isAvailable ? "available" : "inactive";

      if (isAvailable) {
        availStatusText.textContent = "Available for Emergency Dispatch";
        availStatusText.className = "text-sm font-semibold text-emerald-600";
        Toast.show("Status Updated", "You are now marked AVAILABLE for compatible emergency requests.", "success");
      } else {
        availStatusText.textContent = "Temporarily Inactive / Busy";
        availStatusText.className = "text-sm font-semibold text-slate-500";
        Toast.show("Status Updated", "You are now marked INACTIVE. Emergency notifications paused.", "info");
      }

      // Sync with Flask backend API
      const token = typeof LifnexAuth !== "undefined" ? LifnexAuth.getToken() : null;
      fetch("/api/v1/donors/availability", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ availability_status: statusValue })
      }).catch(err => console.debug("Availability API sync (offline/fallback mode):", err));
    });
  }

  // 2. Accept / Decline Donor Responses
  document.querySelectorAll("[data-action='accept-request']").forEach(btn => {
    btn.addEventListener("click", () => {
      const card = btn.closest(".emergency-item-card");
      const reqId = card?.getAttribute("data-id") || "REQ-SAMPLE";
      
      const modal = document.getElementById("donorResponseModal");
      if (modal) {
        document.getElementById("modalReqId").textContent = reqId;
        Modal.open("donorResponseModal");
      } else {
        Toast.show("Response Recorded", `You accepted request ${reqId}. Healthcare desk notified.`, "success");
        if (card) {
          card.style.opacity = "0.7";
          btn.outerHTML = `<span class="badge badge-success font-semibold">Accepted - En Route</span>`;
        }
      }
    });
  });

  const confirmAcceptBtn = document.getElementById("confirmDonorAcceptBtn");
  if (confirmAcceptBtn) {
    confirmAcceptBtn.addEventListener("click", () => {
      const eta = document.getElementById("donorEtaInput")?.value || "30";
      Modal.close("donorResponseModal");
      Toast.show("Dispatch Confirmed", `Response registered. Hospital informed of your arrival in ${eta} minutes.`, "success");
    });
  }

  document.querySelectorAll("[data-action='decline-request']").forEach(btn => {
    btn.addEventListener("click", () => {
      const card = btn.closest(".emergency-item-card");
      if (card) {
        card.style.transition = "opacity 0.3s";
        card.style.opacity = "0.4";
        Toast.show("Request Declined", "We will alert alternative compatible donors.", "info");
        setTimeout(() => {
          card.style.display = "none";
        }, 300);
      }
    });
  });

  // 3. Emergency Request Creation Form (Patient & Hospital)
  const reqForm = document.getElementById("createRequestForm");
  if (reqForm) {
    reqForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const bloodGroup = document.getElementById("reqBloodGroup").value;
      const units = document.getElementById("reqUnits").value;
      const hospital = document.getElementById("reqHospital").value;
      const urgency = document.getElementById("reqUrgency").value;
      const notes = document.getElementById("reqNotes").value;

      if (!bloodGroup || !units || !hospital) {
        Toast.show("Missing Fields", "Please specify blood group, units, and target hospital.", "error");
        return;
      }

      const newRecord = {
        id: "REQ-" + Math.floor(100 + Math.random() * 900),
        patient_name: "Self / Family Proxy (Demo)",
        hospital: hospital,
        city: "Metropolis",
        blood_group: bloodGroup,
        units: parseInt(units, 10),
        urgency: urgency,
        status: "open",
        distance: "1.8 km",
        time_left: urgency === "critical" ? "45 mins" : "3 hrs",
        clinical_note: notes || "Emergency clinical requirement.",
        created_at: "Just now"
      };

      // Send API Request to Flask backend if user is authenticated
      const token = typeof LifnexAuth !== "undefined" ? LifnexAuth.getToken() : null;
      if (token) {
        fetch("/api/v1/blood-requests", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            hospital_id: hospital.includes("-") ? hospital : "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
            blood_group: bloodGroup,
            units_required: parseInt(units, 10),
            urgency_level: urgency,
            clinical_notes: notes || "Emergency clinical requirement.",
            latitude: 28.6145,
            longitude: 77.2100,
            required_by: new Date(Date.now() + 12 * 3600 * 1000).toISOString()
          })
        }).then(res => res.json()).then(respData => {
          if (respData.success) {
            Toast.show("Emergency Broadcast Live", `Requisition created for ${units} units of ${bloodGroup}.`, "success", 4000);
          }
        }).catch(err => {
          console.error("Error creating request via API:", err);
        });
      }

      LifnexDemoStore.addRequest(newRecord);
      Toast.show("Emergency Broadcast Live", `Alert dispatched for ${units} units of ${bloodGroup} to nearby donors.`, "success", 4000);
      
      const modal = document.getElementById("createRequestModal");
      if (modal) Modal.close("createRequestModal");
      reqForm.reset();

      // Refresh table or feed if present
      setTimeout(() => {
        window.location.reload();
      }, 1200);
    });
  }

  // 4. Gemini AI Request Triage Assistant
  const aiTriageBtn = document.getElementById("runAiTriageBtn");
  const aiTriageInput = document.getElementById("aiTriageInput");
  const aiTriageResult = document.getElementById("aiTriageResult");

  if (aiTriageBtn && aiTriageInput && aiTriageResult) {
    aiTriageBtn.addEventListener("click", () => {
      const text = aiTriageInput.value.trim();
      if (!text) {
        Toast.show("Empty Input", "Please paste doctor's notes or clinical emergency message.", "warning");
        return;
      }

      aiTriageBtn.disabled = true;
      aiTriageBtn.textContent = "Analyzing clinical text with Gemini AI...";

      fetch("/api/v1/ai/triage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text })
      })
      .then(res => res.json())
      .then(data => {
        aiTriageBtn.disabled = false;
        aiTriageBtn.textContent = "Analyze with Gemini AI";

        const bg = data.detected_blood_group || "O-";
        const urgency = data.recommended_urgency || "critical";
        const units = data.recommended_units || 2;
        const analysis = data.analysis || "Parameters extracted from clinical description.";
        const disclaimer = data.disclaimer || "Emergency coordination only. Clinical verification required.";

        aiTriageResult.style.display = "block";
        aiTriageResult.innerHTML = `
          <div class="p-3 bg-white rounded border border-rose-200 text-sm">
            <div class="flex items-center gap-2 text-crimson-600 font-bold mb-1">
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              Gemini AI Structured Extraction
            </div>
            <p class="text-xs text-slate-600 mb-2">${analysis}</p>
            <ul class="text-xs space-y-1 text-slate-800">
              <li><strong>Detected Blood Group:</strong> ${bg}</li>
              <li><strong>Recommended Urgency:</strong> ${urgency.toUpperCase()}</li>
              <li><strong>Recommended Units:</strong> ${units} Units</li>
              <li class="text-muted italic"><strong>Notice:</strong> ${disclaimer}</li>
            </ul>
            <button class="btn btn-sm btn-primary mt-3 w-full" id="applyAiTriageBtn">Apply Values to Request Form</button>
          </div>
        `;

        document.getElementById("applyAiTriageBtn")?.addEventListener("click", () => {
          const bgSelect = document.getElementById("reqBloodGroup");
          const urgencySelect = document.getElementById("reqUrgency");
          const unitsInput = document.getElementById("reqUnits");
          if (bgSelect) bgSelect.value = bg;
          if (urgencySelect) urgencySelect.value = urgency;
          if (unitsInput) unitsInput.value = units;
          Toast.show("Parameters Applied", "Form populated with Gemini AI recommendations.", "success");
        });
      })
      .catch(err => {
        aiTriageBtn.disabled = false;
        aiTriageBtn.textContent = "Analyze with Gemini AI";
        console.error("AI Triage error:", err);
        Toast.show("AI Assistant", "Could not complete AI triage. Check network connection.", "error");
      });
    });
  }

  // 5. Donor Hub Gemini AI Guidance Assistant
  const donorAiInput = document.getElementById("donorAiInput");
  const donorAiAskBtn = document.getElementById("donorAiAskBtn");
  const donorAiResponse = document.getElementById("donorAiResponse");

  if (donorAiInput && donorAiAskBtn && donorAiResponse) {
    donorAiAskBtn.addEventListener("click", () => {
      const query = donorAiInput.value.trim();
      if (!query) {
        Toast.show("Empty Query", "Please ask a question about donation protocols.", "warning");
        return;
      }

      donorAiAskBtn.disabled = true;
      donorAiAskBtn.textContent = "Thinking...";

      fetch("/api/v1/ai/donor-guidance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query })
      })
      .then(res => res.json())
      .then(data => {
        donorAiAskBtn.disabled = false;
        donorAiAskBtn.textContent = "Ask";
        donorAiResponse.style.display = "block";
        donorAiResponse.innerHTML = `
          <p class="font-medium text-slate-800 mb-1">${data.guidance || "No guidance available."}</p>
          <p class="text-slate-400 text-[10px] italic">${data.disclaimer || ""}</p>
        `;
      })
      .catch(err => {
        donorAiAskBtn.disabled = false;
        donorAiAskBtn.textContent = "Ask";
        console.error("Donor AI error:", err);
        Toast.show("Error", "Could not reach AI assistant.", "error");
      });
    });
  }
});

