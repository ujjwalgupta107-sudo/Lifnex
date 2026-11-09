/**
 * LIFNEX PRIMARY CLIENT RUNTIME
 */
import { initIcons } from './icons.ts';
import { initNavigation } from './navigation.ts';
import gsap from 'gsap';

export function showToast(message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info'): void {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

function initAnimatedCounters(): void {
  // Respect user preference for reduced motion
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  const counters = document.querySelectorAll<HTMLElement>('[data-counter]');
  counters.forEach(counter => {
    const target = parseFloat(counter.getAttribute('data-counter') || '0');
    const suffix = counter.getAttribute('data-counter-suffix') || '';
    if (isNaN(target)) return;

    gsap.fromTo(
      { val: 0 },
      { val: target },
      {
        duration: 1.6,
        ease: 'power2.out',
        onUpdate: function () {
          counter.textContent = Math.floor(this.targets()[0].val).toLocaleString() + suffix;
        }
      }
    );
  });
}

function initCompatibilityMatrix(): void {
  const cells = document.querySelectorAll<HTMLElement>('.matrix-cell');
  const detailsTitle = document.getElementById('matrixSelectedGroup');
  const detailsCanGive = document.getElementById('matrixCanGive');
  const detailsCanReceive = document.getElementById('matrixCanReceive');

  const compatibilityMap: Record<string, { canGive: string[]; canReceive: string[] }> = {
    'O-': { canGive: ['All Blood Types (Universal Red Cell Donor)'], canReceive: ['O-'] },
    'O+': { canGive: ['O+', 'A+', 'B+', 'AB+'], canReceive: ['O+', 'O-'] },
    'A-': { canGive: ['A-', 'A+', 'AB-', 'AB+'], canReceive: ['A-', 'O-'] },
    'A+': { canGive: ['A+', 'AB+'], canReceive: ['A+', 'A-', 'O+', 'O-'] },
    'B-': { canGive: ['B-', 'B+', 'AB-', 'AB+'], canReceive: ['B-', 'O-'] },
    'B+': { canGive: ['B+', 'AB+'], canReceive: ['B+', 'B-', 'O+', 'O-'] },
    'AB-': { canGive: ['AB-', 'AB+'], canReceive: ['AB-', 'A-', 'B-', 'O-'] },
    'AB+': { canGive: ['AB+ only'], canReceive: ['All Blood Types (Universal Recipient)'] }
  };

  cells.forEach(cell => {
    cell.addEventListener('click', () => {
      cells.forEach(c => c.classList.remove('active'));
      cell.classList.add('active');
      const group = cell.getAttribute('data-group');
      if (group && compatibilityMap[group]) {
        if (detailsTitle) detailsTitle.textContent = `Compatibility Profile: Blood Group ${group}`;
        if (detailsCanGive) detailsCanGive.textContent = compatibilityMap[group].canGive.join(', ');
        if (detailsCanReceive) detailsCanReceive.textContent = compatibilityMap[group].canReceive.join(', ');
      }
    });
  });
}

// Global initialization on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  initIcons();
  initNavigation();
  initAnimatedCounters();
  initCompatibilityMatrix();
});

