/**
 * LIFNEX ANALYTICS & CHARTS CONTROLLER
 * Aligned with Lifnex Healthcare UI Showcase specifications.
 * Uses Chart.js for emergency request trends, status donut, and donor velocity.
 */

const LifnexCharts = {
  initAdminCharts: function() {
    if (typeof Chart === "undefined") return;

    // Register center text plugin for Donut Chart
    const centerTextPlugin = {
      id: "centerText",
      beforeDraw: function(chart) {
        if (chart.config.type !== "doughnut" || !chart.config.options.plugins.centerText) return;
        
        const ctx = chart.ctx;
        const width = chart.width;
        const height = chart.chartArea ? chart.chartArea.height + chart.chartArea.top : chart.height;
        const centerX = chart.chartArea ? (chart.chartArea.left + chart.chartArea.right) / 2 : width / 2;
        const centerY = chart.chartArea ? (chart.chartArea.top + chart.chartArea.bottom) / 2 : height / 2;

        ctx.save();
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        const textOptions = chart.config.options.plugins.centerText;
        const mainText = textOptions.text || "368";
        const subText = textOptions.subtext || "Total";

        // Draw main number
        ctx.font = "bold 26px Inter, -apple-system, sans-serif";
        ctx.fillStyle = "#101b28";
        ctx.fillText(mainText, centerX, centerY - 8);

        // Draw subtext
        ctx.font = "500 12px Inter, -apple-system, sans-serif";
        ctx.fillStyle = "#64748b";
        ctx.fillText(subText, centerX, centerY + 14);

        ctx.restore();
      }
    };

    try {
      Chart.register(centerTextPlugin);
    } catch (e) {
      // plugin might already be registered
    }

    // 1. Emergency Requests (Last 30 Days) - Showcase Line Chart
    const trendCanvas = document.getElementById("emergencyRequestsTrendChart") || document.getElementById("monthlyTrendsChart");
    if (trendCanvas) {
      const ctx = trendCanvas.getContext("2d");
      const gradient = ctx.createLinearGradient(0, 0, 0, 260);
      gradient.addColorStop(0, "rgba(225, 29, 72, 0.22)");
      gradient.addColorStop(1, "rgba(225, 29, 72, 0.00)");

      new Chart(trendCanvas, {
        type: "line",
        data: {
          labels: ["Day 1", "Day 5", "Day 10", "Day 15", "Day 20", "Day 25", "Day 30"],
          datasets: [{
            label: "Emergency Requests Dispatched",
            data: [14, 22, 19, 38, 31, 45, 52],
            borderColor: "#e11d48",
            borderWidth: 2.5,
            backgroundColor: gradient,
            fill: true,
            tension: 0.35,
            pointBackgroundColor: "#ffffff",
            pointBorderColor: "#e11d48",
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: "#101b28",
              titleFont: { size: 12, weight: "bold" },
              bodyFont: { size: 12 },
              padding: 10,
              displayColors: false,
              callbacks: {
                label: function(context) {
                  return `${context.parsed.y} emergency requests`;
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: { color: "#f1f5f9" },
              ticks: { color: "#94a3b8", font: { size: 11 } }
            },
            x: {
              grid: { display: false },
              ticks: { color: "#94a3b8", font: { size: 11 } }
            }
          }
        }
      });
    }

    // 2. Request Status Donut Chart - Showcase Donut Chart (368 Total: 72% Matched, 18% Pending, 10% Cancelled)
    const statusCanvas = document.getElementById("requestStatusChart") || document.getElementById("bloodDistributionChart");
    if (statusCanvas) {
      new Chart(statusCanvas, {
        type: "doughnut",
        data: {
          labels: ["Matched (72%)", "Pending (18%)", "Cancelled (10%)"],
          datasets: [{
            data: [265, 66, 37],
            backgroundColor: [
              "#0f9d8a", // Emerald Teal - Matched
              "#e11d48", // Crimson Red - Pending
              "#cbd5e1"  // Soft Slate - Cancelled
            ],
            borderWidth: 3,
            borderColor: "#ffffff",
            hoverOffset: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: "74%",
          plugins: {
            legend: {
              position: "bottom",
              labels: {
                boxWidth: 10,
                boxHeight: 10,
                padding: 16,
                usePointStyle: true,
                pointStyle: "circle",
                color: "#475569",
                font: { size: 11, family: "Inter" }
              }
            },
            centerText: {
              text: "368",
              subtext: "Total"
            },
            tooltip: {
              backgroundColor: "#101b28",
              callbacks: {
                label: function(context) {
                  const val = context.parsed;
                  const pct = Math.round((val / 368) * 100);
                  return ` ${context.label.split(" ")[0]}: ${val} requests (${pct}%)`;
                }
              }
            }
          }
        }
      });
    }

    // 3. Proximity Latency Response Curve (Fallback / Extra Analytics)
    const speedCanvas = document.getElementById("responseSpeedChart");
    if (speedCanvas) {
      new Chart(speedCanvas, {
        type: "line",
        data: {
          labels: ["< 5 min", "5-15 min", "15-30 min", "30-45 min", "> 45 min"],
          datasets: [{
            label: "Response Distribution (%)",
            data: [48, 34, 12, 4, 2],
            borderColor: "#0f9d8a",
            backgroundColor: "rgba(15, 157, 138, 0.12)",
            fill: true,
            tension: 0.35,
            pointBackgroundColor: "#0f9d8a",
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
            y: { beginAtZero: true, max: 60, grid: { color: "#f1f5f9" } },
            x: { grid: { display: false } }
          }
        }
      });
    }
  }
};

document.addEventListener("DOMContentLoaded", () => {
  LifnexCharts.initAdminCharts();
});
