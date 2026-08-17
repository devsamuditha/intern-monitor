/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type NotificationSoundType = 'reminder' | 'warning';

export function playNotificationSound(type: NotificationSoundType): void {
  if (typeof window === 'undefined' || typeof AudioContext === 'undefined' && typeof (window as any).webkitAudioContext === 'undefined') {
    return;
  }

  try {
    const AudioContextClass = (window as any).webkitAudioContext || AudioContext;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    if (type === 'reminder') {
      const frequencies = [523.25, 659.25, 783.99];
      frequencies.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.001, now + i * 0.12);
        gain.gain.linearRampToValueAtTime(0.3, now + i * 0.12 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.12);
        osc.stop(now + i * 0.12 + 0.4);
      });
    } else {
      const frequencies = [220, 220];
      frequencies.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.001, now + i * 0.15);
        gain.gain.linearRampToValueAtTime(0.2, now + i * 0.15 + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.15 + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.15);
        osc.stop(now + i * 0.15 + 0.25);
      });
    }

    setTimeout(() => ctx.close(), 1000);
  } catch (e) {
    console.warn('Notification sound playback failed:', e);
  }
}
