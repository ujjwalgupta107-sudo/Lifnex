import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';

export default defineConfig({
  root: resolve(import.meta.dirname, 'frontend'),
  plugins: [
    tailwindcss(),
  ],
  build: {
    outDir: resolve(import.meta.dirname, 'frontend/dist'),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'frontend/index.html'),
        about: resolve(import.meta.dirname, 'frontend/about.html'),
        howItWorks: resolve(import.meta.dirname, 'frontend/how-it-works.html'),
        hospitals: resolve(import.meta.dirname, 'frontend/hospitals.html'),
        contact: resolve(import.meta.dirname, 'frontend/contact.html'),
        login: resolve(import.meta.dirname, 'frontend/login.html'),
        register: resolve(import.meta.dirname, 'frontend/register.html'),
        forgotPassword: resolve(import.meta.dirname, 'frontend/forgot-password.html'),
        patientDashboard: resolve(import.meta.dirname, 'frontend/patient-dashboard.html'),
        donorDashboard: resolve(import.meta.dirname, 'frontend/donor-dashboard.html'),
        hospitalDashboard: resolve(import.meta.dirname, 'frontend/hospital-dashboard.html'),
        adminDashboard: resolve(import.meta.dirname, 'frontend/admin-dashboard.html'),
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      },
    },
  },
});
