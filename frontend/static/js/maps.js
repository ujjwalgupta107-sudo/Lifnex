/**
 * LIFNEX GEOSPATIAL MAPS & ROUTING CONTROLLER (PHASE 7)
 * Integrates Leaflet.js with OpenStreetMap.
 * Strict Privacy:
 * - Donor locations are jittered / blurred by +/- ~0.005 deg (~500m) to prevent exact triangulation.
 * - Emergency requests display designated medical facility destination or general vicinity.
 * - Sensitive patient clinical notes and personal phone numbers are excluded from map popups.
 */

const LifnexMaps = {
  centerLat: 28.6139,
  centerLng: 77.2090,

  // Jitter coordinates to approximate location for privacy
  approximateLocation: function(lat, lng) {
    // Add deterministic pseudo-random offset within ~400-600 meters
    const offsetLat = ((Math.sin(lat * 1000) * 1000) % 5) * 0.001;
    const offsetLng = ((Math.cos(lng * 1000) * 1000) % 5) * 0.001;
    return [lat + offsetLat, lng + offsetLng];
  },

  // Calculate Haversine distance in km
  calculateDistance: function(lat1, lon1, lat2, lon2) {
    const R = 6371.0;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(1);
  },

  demoHospitals: [
    { name: "City Care Super Specialty Hospital", lat: 28.6145, lng: 77.2100, bloodBank: true, emergencyPhone: "+1 (555) 019-2831", stock: "O+, B+, A+" },
    { name: "Metro Central Trauma Center", lat: 28.6220, lng: 77.2005, bloodBank: true, emergencyPhone: "+1 (555) 019-4422", stock: "O-, AB+, B+" },
    { name: "St. Jude Memorial Blood Bank", lat: 28.6080, lng: 77.2180, bloodBank: true, emergencyPhone: "+1 (555) 019-7788", stock: "All Types Reserved" },
    { name: "Apex Regional Medical Center", lat: 28.6290, lng: 77.2250, bloodBank: false, emergencyPhone: "+1 (555) 019-9901", stock: "Transit Only" }
  ],

  demoDonors: [
    { name: "Verified Voluntary Donor", bloodGroup: "O-", lat: 28.6170, lng: 77.2050, status: "Available", radiusKm: 15 },
    { name: "Verified Voluntary Donor", bloodGroup: "B+", lat: 28.6110, lng: 77.2140, status: "Available", radiusKm: 10 },
    { name: "Verified Voluntary Donor", bloodGroup: "A+", lat: 28.6250, lng: 77.2190, status: "Available", radiusKm: 20 }
  ],

  demoRequests: [
    { id: "REQ-701", hospital: "City Care Super Specialty Hospital", bloodGroup: "O-", units: 2, urgency: "critical", lat: 28.6145, lng: 77.2100 },
    { id: "REQ-704", hospital: "Apex Regional Medical Center", bloodGroup: "O-", units: 1, urgency: "high", lat: 28.6290, lng: 77.2250 }
  ],

  initHospitalsMap: function(elementId = "hospitalsMap") {
    const mapElement = document.getElementById(elementId);
    if (!mapElement || typeof L === "undefined") return null;

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

    // Custom Approximate Donor Pin Icon
    const donorIcon = L.divIcon({
      className: "custom-map-pin donor-pin",
      html: `<div style="background-color:#10b981;color:white;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 8px rgba(0,0,0,0.3);border:2px solid white;font-weight:bold;font-size:12px;">+</div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 28]
    });

    // Custom Emergency Request Pin Icon
    const requestIcon = L.divIcon({
      className: "custom-map-pin request-pin",
      html: `<div style="background-color:#dc2626;color:white;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 0 10px rgba(220,38,38,0.8);border:2px solid white;font-weight:bold;font-size:11px;">SOS</div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 30]
    });

    // 1. Plot Hospitals
    this.demoHospitals.forEach(h => {
      const distFromCenter = this.calculateDistance(this.centerLat, this.centerLng, h.lat, h.lng);
      const directionsUrl = `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${this.centerLat}%2C${this.centerLng}%3B${h.lat}%2C${h.lng}`;

      const popupHtml = `
        <div style="font-family:sans-serif;font-size:13px;min-width:190px;">
          <h4 style="margin:0 0 4px;color:#0f172a;font-size:14px;font-weight:700;">${h.name}</h4>
          <p style="margin:0 0 4px;color:#64748b;">Emergency: <strong>${h.emergencyPhone}</strong></p>
          <p style="margin:0 0 4px;color:#059669;font-weight:600;">Distance: ~${distFromCenter} km away</p>
          <span style="display:inline-block;background:#fee2e2;color:#991b1b;padding:2px 6px;border-radius:4px;font-size:11px;font-weight:bold;">Stock: ${h.stock}</span>
          <div style="margin-top:8px;">
            <a href="${directionsUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;background:#e11d48;color:white;padding:3px 8px;border-radius:4px;font-size:11px;text-decoration:none;font-weight:bold;">View Directions &rarr;</a>
          </div>
        </div>
      `;
      L.marker([h.lat, h.lng], { icon: hospitalIcon }).addTo(map).bindPopup(popupHtml);
    });

    // 2. Plot Donors (with approximate fuzzy location)
    this.demoDonors.forEach(d => {
      const [approxLat, approxLng] = this.approximateLocation(d.lat, d.lng);
      const dist = this.calculateDistance(this.centerLat, this.centerLng, approxLat, approxLng);

      const popupHtml = `
        <div style="font-family:sans-serif;font-size:12px;">
          <h4 style="margin:0 0 2px;color:#0f172a;font-weight:700;">${d.name}</h4>
          <p style="margin:0;color:#e11d48;font-weight:bold;">Blood Group: ${d.bloodGroup}</p>
          <p style="margin:2px 0 0;color:#059669;">Approximate Distance: ~${dist} km</p>
          <div style="margin-top:4px;font-size:10px;color:#94a3b8;font-style:italic;">*Approximate radius (~500m blur for donor privacy)</div>
        </div>
      `;
      L.marker([approxLat, approxLng], { icon: donorIcon }).addTo(map).bindPopup(popupHtml);

      // Approximate Donor Coverage Circle
      L.circle([approxLat, approxLng], {
        color: "#10b981",
        fillColor: "#d1fae5",
        fillOpacity: 0.1,
        weight: 1,
        radius: 600 // 600m approximate area
      }).addTo(map);
    });

    // 3. Plot Active Emergency Requests
    this.demoRequests.forEach(r => {
      const directionsUrl = `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${this.centerLat}%2C${this.centerLng}%3B${r.lat}%2C${r.lng}`;
      const popupHtml = `
        <div style="font-family:sans-serif;font-size:12px;">
          <div style="display:inline-block;background:#dc2626;color:white;padding:2px 6px;border-radius:3px;font-size:10px;font-weight:bold;margin-bottom:4px;">${r.urgency.toUpperCase()} REQUISITION</div>
          <h4 style="margin:0 0 2px;color:#0f172a;font-weight:700;">${r.hospital}</h4>
          <p style="margin:0;color:#dc2626;font-weight:bold;">${r.units} Units of ${r.bloodGroup}</p>
          <p style="margin:2px 0 0;color:#64748b;font-size:11px;">Request ID: ${r.id}</p>
          <div style="margin-top:6px;">
            <a href="${directionsUrl}" target="_blank" rel="noopener noreferrer" style="color:#2563eb;font-weight:bold;font-size:11px;text-decoration:underline;">Hospital Route &rarr;</a>
          </div>
          <div style="margin-top:4px;font-size:9px;color:#94a3b8;font-style:italic;">*No private patient health details exposed</div>
        </div>
      `;
      L.marker([r.lat, r.lng], { icon: requestIcon }).addTo(map).bindPopup(popupHtml);
    });

    // Center Dispatch Coverage Zone
    L.circle([this.centerLat, this.centerLng], {
      color: "#e11d48",
      fillColor: "#fecdd3",
      fillOpacity: 0.12,
      radius: 4000
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
