import { useNotifySettings } from '../store/notify.store';

export function playBeep() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.value = 880;
    o.connect(g); g.connect(ctx.destination);
    g.gain.setValueAtTime(0.001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
    o.start(); o.stop(ctx.currentTime + 0.3);
  } catch {}
}

export function notifyMessage(title: string, body: string, force = false) {
  const s = useNotifySettings.getState();
  if (s.sound) playBeep();
  if (s.browser && (force || document.hidden) && 'Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body: s.preview ? body : 'Новое сообщение' });
  }
}

(window as any).__nexusNotify = notifyMessage;
