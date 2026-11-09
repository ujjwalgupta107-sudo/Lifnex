/**
 * LIFNEX AUTHENTICATION UI LOGIC
 * Client-side validation, password toggles, and role-based redirect simulations
 * (Does not store sensitive credentials or bypass Supabase Auth)
 */

document.addEventListener("DOMContentLoaded", () => {
  // Password Visibility Toggles
  document.querySelectorAll(".password-toggle-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const input = btn.closest(".input-with-action").querySelector("input");
      if (input.type === "password") {
        input.type = "text";
        btn.innerHTML = `<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"></path></svg>`;
      } else {
        input.type = "password";
        btn.innerHTML = `<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>`;
      }
    });
  });

  // Login Form Submission UI Handler
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = document.getElementById("loginEmail").value.trim();
      const password = document.getElementById("loginPassword").value;
      const roleSelect = document.getElementById("demoRoleSelect")?.value || "patient";

      if (!email || !password) {
        Toast.show("Validation Error", "Please provide both email and password.", "error");
        return;
      }

      Toast.show("Signing In...", "Simulating credential verification (Demo UI Mode)...", "info", 1500);

      setTimeout(() => {
        Toast.show("Success", "Welcome back to Lifnex Demo Platform!", "success", 1500);
        setTimeout(() => {
          if (roleSelect === "donor") window.location.href = "donor-dashboard.html";
          else if (roleSelect === "hospital") window.location.href = "hospital-dashboard.html";
          else if (roleSelect === "admin") window.location.href = "admin-dashboard.html";
          else window.location.href = "patient-dashboard.html";
        }, 800);
      }, 1000);
    });
  }

  // Registration Form Conditional Fields and Submission
  const regForm = document.getElementById("registrationForm");
  const roleCards = document.querySelectorAll(".role-selector-card");
  const donorFields = document.getElementById("donorSpecificFields");
  const hospitalFields = document.getElementById("hospitalSpecificFields");

  if (regForm && roleCards.length) {
    roleCards.forEach(card => {
      card.addEventListener("click", () => {
        roleCards.forEach(c => c.classList.remove("selected"));
        card.classList.add("selected");
        const role = card.getAttribute("data-role");
        const roleInput = document.getElementById("selectedRoleInput");
        if (roleInput) roleInput.value = role;

        if (donorFields) donorFields.style.display = role === "donor" ? "block" : "none";
        if (hospitalFields) hospitalFields.style.display = role === "hospital" ? "block" : "none";
      });
    });

    regForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const role = document.getElementById("selectedRoleInput")?.value || "patient";
      const name = document.getElementById("regFullName").value.trim();
      const email = document.getElementById("regEmail").value.trim();
      const password = document.getElementById("regPassword").value;
      const terms = document.getElementById("regTerms").checked;

      if (!name || !email || !password) {
        Toast.show("Incomplete Form", "Please fill in all mandatory fields.", "error");
        return;
      }
      if (!terms) {
        Toast.show("Notice", "You must acknowledge the terms and clinical disclaimer.", "warning");
        return;
      }

      Toast.show("Account Created", "Your demo profile has been initialized.", "success", 2000);
      setTimeout(() => {
        if (role === "donor") window.location.href = "donor-dashboard.html";
        else if (role === "hospital") window.location.href = "hospital-dashboard.html";
        else window.location.href = "patient-dashboard.html";
      }, 1000);
    });
  }

  // Forgot Password Handler
  const forgotForm = document.getElementById("forgotPasswordForm");
  if (forgotForm) {
    forgotForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = document.getElementById("resetEmail").value.trim();
      if (!email) {
        Toast.show("Error", "Please enter your registered email address.", "error");
        return;
      }
      Toast.show("Recovery Email Sent", `Demo password recovery instructions dispatched to ${email}`, "success", 4000);
      forgotForm.reset();
    });
  }
});

