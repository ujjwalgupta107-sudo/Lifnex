/**
 * LIFNEX MOTION GRAPHICS & SCROLLTRIGGER ENGINE
 * Premium physics, text reveals, magnetic button cursor feedback, and stat counters
 */

import gsap from 'gsap';

export function initLifnexAnimations() {
  // 1. Magnetic button physics
  const magneticButtons = document.querySelectorAll('.btn-magnetic, .btn-primary');
  magneticButtons.forEach((btn) => {
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const x = (e.clientX - rect.left - rect.width / 2) * 0.25;
      const y = (e.clientY - rect.top - rect.height / 2) * 0.25;
      gsap.to(btn, { x: x, y: y, duration: 0.3, ease: 'power2.out' });
    });

    btn.addEventListener('mouseleave', () => {
      gsap.to(btn, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.4)' });
    });
  });

  // 2. Animated Numerical Counters
  const statNumbers = document.querySelectorAll('[data-counter]');
  statNumbers.forEach((el) => {
    const target = parseFloat(el.getAttribute('data-counter')) || 0;
    const prefix = el.getAttribute('data-prefix') || '';
    const suffix = el.getAttribute('data-suffix') || '';

    gsap.fromTo(
      { val: 0 },
      { val: target },
      {
        duration: 2.2,
        ease: 'power3.out',
        onUpdate: function () {
          el.textContent = `${prefix}${Math.floor(this.targets()[0].val).toLocaleString()}${suffix}`;
        }
      }
    );
  });

  // 3. 3D Tilt Card Interaction
  const tiltCards = document.querySelectorAll('.card-tilt, .dashboard-card, .stat-card');
  tiltCards.forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const xPercent = (x / rect.width - 0.5) * 12;
      const yPercent = (y / rect.height - 0.5) * -12;

      gsap.to(card, {
        rotationY: xPercent,
        rotationX: yPercent,
        transformPerspective: 1000,
        ease: 'power1.out',
        duration: 0.3
      });
    });

    card.addEventListener('mouseleave', () => {
      gsap.to(card, {
        rotationY: 0,
        rotationX: 0,
        ease: 'power2.out',
        duration: 0.6
      });
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initLifnexAnimations();
});

