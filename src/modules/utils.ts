export function $<T extends Element = HTMLElement>(selector: string): T {
  const el = document.querySelector<T>(selector);
  if (!el) throw new Error(`Elemento não encontrado: ${selector}`);
  return el;
}

export function $opt<T extends Element = HTMLElement>(selector: string): T | null {
  return document.querySelector<T>(selector);
}

export const fmt = new Intl.NumberFormat('pt-BR');

let toastTimer: ReturnType<typeof setTimeout> | undefined;
export function toast(msg: string, ms = 4200): void {
  const el = $opt<HTMLDivElement>('#statusToast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), ms);
}

export function debounce<A extends unknown[]>(fn: (...args: A) => void, wait = 300): (...args: A) => void {
  let t: ReturnType<typeof setTimeout>;
  return (...a: A) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...a), wait);
  };
}
