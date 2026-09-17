/**
 * Confetti Animation
 * Success celebration animation
 */

import confetti from 'canvas-confetti';

export function celebrateSuccess(type: 'recipe_saved' | 'badge_unlocked' | 'streak_milestone' = 'recipe_saved') {
  const duration = 3000;
  const end = Date.now() + duration;

  const colors = {
    recipe_saved: ['#10B981', '#059669', '#34D399'],
    badge_unlocked: ['#F59E0B', '#FBBF24', '#FCD34D'],
    streak_milestone: ['#EF4444', '#F97316', '#FB923C'],
  };

  (function frame() {
    confetti({
      particleCount: 2,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: colors[type],
    });
    confetti({
      particleCount: 2,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: colors[type],
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  })();
}

export function celebrateBadge() {
  celebrateSuccess('badge_unlocked');
}

export function celebrateStreak() {
  celebrateSuccess('streak_milestone');
}

export function triggerConfetti(options?: any) {
  confetti(options);
}
