/**
 * LIFNEX LUCIDE ICON INITIALIZER
 * Automatically renders Lucide SVG icons for elements with data-lucide attributes.
 */
import { createIcons, icons } from 'lucide';

export function initIcons(): void {
  try {
    createIcons({
      icons,
      attrs: {
        'stroke-width': '2',
        class: 'lucide-icon inline-block align-middle'
      }
    });
  } catch (err) {
    console.warn('Lucide icons initialization notice:', err);
  }
}

