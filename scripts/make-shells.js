// Writes one HTML shell per public address so a direct load or refresh of any
// page (on Flask, Vercel or Vite) boots the same React app.
// Run with: npm run shells
import fs from 'fs';
import path from 'path';

const PAGES = {
  'index.html': ['Lifnex: Connecting Lives When Every Second Matters', 'AI-powered emergency blood donor coordination platform connecting patients requiring blood with verified voluntary donors, hospitals, and blood banks.'],
  'about.html': ['About Lifnex', 'Why Lifnex exists: modernizing emergency blood donation through intelligent coordination, clinical safety checkpoints and verified donor networks.'],
  'how-it-works.html': ['How Lifnex works', 'How Lifnex coordinates emergency blood requests between patients, nearby voluntary donors and accredited hospitals in five stages.'],
  'hospitals.html': ['Lifnex hospital network', 'Verified hospitals, trauma centers and accredited blood banks connected to the Lifnex emergency network.'],
  'contact.html': ['Contact Lifnex', 'Reach the Lifnex emergency coordination desk or request hospital onboarding.'],
  'login.html': ['Sign in to Lifnex', 'Sign in to your Lifnex portal.'],
  'register.html': ['Join Lifnex', 'Create a Lifnex account as a patient, voluntary donor or hospital.'],
  'verify-otp.html': ['Verify your email, Lifnex', 'Enter the 6-digit code to verify your Lifnex account.'],
  'forgot-password.html': ['Reset your Lifnex password', 'Reset the password of your Lifnex account.'],
  'patient-dashboard.html': ['Patient portal, Lifnex', 'Create and follow emergency blood requests.'],
  'donor-dashboard.html': ['Donor portal, Lifnex', 'See nearby alerts and respond to emergency requests.'],
  'hospital-dashboard.html': ['Hospital portal, Lifnex', 'Manage requisitions, donors and blood stock.'],
  'admin-dashboard.html': ['Admin portal, Lifnex', 'Oversee the Lifnex network.'],
  'dashboard/patient.html': ['Patient portal, Lifnex', 'Create and follow emergency blood requests.'],
  'dashboard/donor.html': ['Donor portal, Lifnex', 'See nearby alerts and respond to emergency requests.'],
  'dashboard/hospital.html': ['Hospital portal, Lifnex', 'Manage requisitions, donors and blood stock.'],
  'dashboard/admin.html': ['Admin portal, Lifnex', 'Oversee the Lifnex network.'],
};

const shell = (title, desc) => `<!DOCTYPE html>
<html lang="en" data-theme="day">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <meta name="description" content="${desc}">
  <meta name="theme-color" content="#f8f5f6">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${desc}">
  <link rel="icon" type="image/png" href="/static/assets/logo/lifnex-mark.png">
  <script>
    /* set day or night before first paint */
    (function () {
      var t;
      try { t = localStorage.getItem('lifnex_theme'); } catch (e) {}
      if (!t) t = matchMedia('(prefers-color-scheme: dark)').matches ? 'night' : 'day';
      document.documentElement.setAttribute('data-theme', t);
    })();
  </script>
  <style>
    html { background: #f8f5f6; }
    html[data-theme="night"] { background: #17080b; }
  </style>
</head>
<body>
  <div id="root">
    <div style="display:none;">
      <h1>Lifnex</h1>
      <p>Connecting Lives When Every Second Matters.</p>
    </div>
  </div>
  <noscript>Lifnex needs JavaScript to run. Emergency desk: 1800-LIFNEX-EMG.</noscript>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>
`;

const out = path.resolve('frontend');
for (const [file, [title, desc]] of Object.entries(PAGES)) {
  const dest = path.join(out, file);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, shell(title, desc));
}
console.log(`Wrote ${Object.keys(PAGES).length} HTML shells`);
