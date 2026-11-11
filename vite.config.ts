import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';

export default defineConfig({
  root: resolve(__dirname, 'frontend'),
  plugins: [
    tailwindcss(),
  ],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: resolve(__dirname, 'frontend/dist'),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'frontend/index.html'),
        about: resolve(__dirname, 'frontend/about.html'),
        howItWorks: resolve(__dirname, 'frontend/how-it-works.html'),
        hospitals: resolve(__dirname, 'frontend/hospitals.html'),
        contact: resolve(__dirname, 'frontend/contact.html'),
        login: resolve(__dirname, 'frontend/login.html'),
        register: resolve(__dirname, 'frontend/register.html'),
        forgotPassword: resolve(__dirname, 'frontend/forgot-password.html'),
        patientDashboard: resolve(__dirname, 'frontend/patient-dashboard.html'),
        donorDashboard: resolve(__dirname, 'frontend/donor-dashboard.html'),
        hospitalDashboard: resolve(__dirname, 'frontend/hospital-dashboard.html'),
        adminDashboard: resolve(__dirname, 'frontend/admin-dashboard.html'),
      },
    },
  },
});
