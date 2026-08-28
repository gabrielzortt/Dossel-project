import { $ } from './utils.ts';

export function startClock(): void {
  const clockEl = $('#clockLabel');
  const tick = () => {
    const now = new Date();
    clockEl.textContent = now.toLocaleString('pt-BR', {
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    }) + ' — Manaus (UTC-4)';
  };
  tick();
  setInterval(tick, 1000);
}
