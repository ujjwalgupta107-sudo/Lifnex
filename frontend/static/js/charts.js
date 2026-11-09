/**
 * LIFNEX ANALYTICS & CHARTS CONTROLLER
 * Uses Chart.js for dashboard metrics and blood supply trends
 */

const LifnexCharts = {
  initAdminCharts: function() {
    if (typeof Chart === "undefined") return;

    // 1. Blood Group Request Distribution (Doughnut Chart)
    const bloodDistCanvas = document.getElementById("bloodDistributionChart");
    if (bloodDistCanvas) {
      new Chart(bloodDistCanvas, {
        type: "doughnut",
        data: {
          labels: ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"],
          datasets: [{
            data: [35, 22, 18, 8, 12, 5, 6, 2],
            backgroundColor: [
              "#e11d48", "#be123c", "#f43f5e", "#fb7185",
              "#0284c7", "#0ea5e9", "#10b981", "#8b5cf6"
            ],
            borderWidth: 2,
            borderColor: "#ffffff"
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: "bottom",
              labels: { boxWidth: 12, font: { size: 11 } }
            }
          }
        }
      });
    }

    // 2. Monthly Requests vs Fulfilled Donations (Bar / Line Chart)
    const trendCanvas = document.getElementById("monthlyTrendsChart");
    if (trendCanvas) {
      new Chart(trendCanvas, {
        type: "bar",
        data: {
          labels: ["Jun", "Jul", "Aug", "Sep", "Oct", "Nov (Demo)"],
          datasets: [
            {
              label: "Emergency Requests Dispatched",
              data: [65, 84, 92, 110, 145, 168],
              backgroundColor: "rgba(225, 29, 72, 0.8)",
              borderRadius: 6
            },
            {
              label: "Verified Blood Donations Completed",
              data: [58, 76, 85, 102, 138, 155],
              backgroundColor: "rgba(16, 185, 129, 0.8)",
              borderRadius: 6
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              grid: { color: "#f1f5f9" }
            },
            x: {
              grid: { display: false }
            }
          },
          plugins: {
            legend: {
              position: "top",
              labels: { boxWidth: 12, font: { size: 12 } }
            }
          }
        }
      });
    }

    // 3. Response Duration Speed (Radar / Polar Area)
    const speedCanvas = document.getElementById("responseSpeedChart");
    if (speedCanvas) {
      new Chart(speedCanvas, {
        type: "line",
        data: {
          labels: ["< 15 min", "15-30 min", "30-60 min", "1-2 hrs", "> 2 hrs"],
          datasets: [{
            label: "Average Donor Response Distribution (%)",
            data: [42, 36, 14, 6, 2],
            borderColor: "#e11d48",
            backgroundColor: "rgba(225, 29, 72, 0.1)",
            fill: true,
            tension: 0.3,
            pointBackgroundColor: "#e11d48",
            pointRadius: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            y: { beginAtZero: true, max: 50 }
          }
        }
      });
    }
  }
};

document.addEventListener("DOMContentLoaded", () => {
  LifnexCharts.initAdminCharts();
});

