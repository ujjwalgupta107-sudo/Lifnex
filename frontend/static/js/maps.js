/**
 * LIFNEX GEOSPATIAL MAPS CONTROLLER
 * Integrates Leaflet.js with OpenStreetMap for hospital and donor discovery
 */

const LifnexMaps = {
  // Demo coordinates centered on Metropolis Medical District
  centerLat: 28.6139,
  centerLng: 77.2090,

  demoHospitals: [
    { name: "City Care Super Specialty Hospital", lat: 28.6145, lng: 77.2100, bloodBank: true, emergencyPhone: "+1 (555) 019-2831", stock: "O+, B+, A+" },
    { name: "Metro Central Trauma Center", lat: 28.6220, lng: 77.2005, bloodBank: true, emergencyPhone: "+1 (555) 019-4422", stock: "O-, AB+, B+" },
    { name: "St. Jude Memorial Blood Bank", lat: 28.6080, lng: 77.2180, bloodBank: true, emergencyPhone: "+1 (555) 019-7788", stock: "All Types Reserved" },
    { name: "Apex Regional Medical Center", lat: 28.6290, lng: 77.2250, bloodBank: false, emergencyPhone: "+1 (555) 019-9901", stock: "Transit Only" }
  ],

  demoDonors: [
    { name: "Verified Voluntary Donor (Demo)", bloodGroup: "O-", lat: 28.6170, lng: 77.2050, status: "Available" },
    { name: "Verified Voluntary Donor (Demo)", bloodGroup: "B+", lat: 28.6110, lng: 77.2140, status: "Available" },
    { name: "Verified Voluntary Donor (Demo)", bloodGroup: "A+", lat: 28.6250, lng: 77.2190, status: "Available" }
  ],

  initHospitalsMap: function(elementId = "hospitalsMap") {
    const mapElement = document.getElementById(elementId);
    if (!mapElement || typeof L === "undefined") return;

    const map = L.map(elementId).setView([this.centerLat, this.centerLng], 13);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Custom Hospital Pin Icon
    const hospitalIcon = L.divIcon({
      className: "custom-map-pin hospital-pin",
      html: `<div style="background-color:#e11d48;color:white;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 8px rgba(0,0,0,0.3);border:2px solid white;font-weight:bold;font-size:14px;">H</div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 32]
    });

    // Custom Donor Pin Icon
    const donorIcon = L.divIcon({
      className: "custom-map-pin donor-pin",
      html: `<div style="background-color:#10b981;color:white;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 8px rgba(0,0,0,0.3);border:2px solid white;font-weight:bold;font-size:12px;">+</div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 28]
    });

    // Plot Hospitals
    this.demoHospitals.forEach(h => {
      const popupHtml = `
        <div style="font-family:sans-serif;font-size:13px;min-width:180px;">
          <h4 style="margin:0 0 4px;color:#0f172a;font-size:14px;font-weight:700;">${h.name}</h4>
          <p style="margin:0 0 4px;color:#64748b;">Emergency: <strong>${h.emergencyPhone}</strong></p>
          <p style="margin:0 0 6px;color:#059669;font-weight:600;">Blood Bank: ${h.bloodBank ? 'Yes (Cold Storage Active)' : 'No'}</p>
          <span style="display:inline-block;background:#fee2e2;color:#991b1b;padding:2px 6px;border-radius:4px;font-size:11px;font-weight:bold;">Stock: ${h.stock}</span>
          <div style="margin-top:8px;font-size:10px;color:#94a3b8;">*Synthetic Demo Facility</div>
        </div>
      `;
      L.marker([h.lat, h.lng], { icon: hospitalIcon }).addTo(map).bindPopup(popupHtml);
    });

    // Plot Demo Donors
    this.demoDonors.forEach(d => {
      const popupHtml = `
        <div style="font-family:sans-serif;font-size:12px;">
          <h4 style="margin:0 0 2px;color:#0f172a;font-weight:700;">${d.name}</h4>
          <p style="margin:0;color:#e11d48;font-weight:bold;">Blood Group: ${d.bloodGroup}</p>
          <p style="margin:2px 0 0;color:#059669;">Status: ${d.status}</p>
          <div style="margin-top:4px;font-size:10px;color:#94a3b8;">*Anonymized Synthetic Donor</div>
        </div>
      `;
      L.marker([d.lat, d.lng], { icon: donorIcon }).addTo(map).bindPopup(popupHtml);
    });

    // Dispatch Radius Circle
    L.circle([this.centerLat, this.centerLng], {
      color: "#e11d48",
      fillColor: "#fecdd3",
      fillOpacity: 0.15,
      radius: 4000 // 4 km radius
    }).addTo(map);

    return map;
  }
};

document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("hospitalsMap")) {
    LifnexMaps.initHospitalsMap("hospitalsMap");
  }
  if (document.getElementById("dashboardMap")) {
    LifnexMaps.initHospitalsMap("dashboardMap");
  }
});

