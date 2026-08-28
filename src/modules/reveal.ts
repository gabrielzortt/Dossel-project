export function initReveal(): void {
  const targets = document.querySelectorAll<HTMLElement>('.reveal');
  if (!('IntersectionObserver' in window) || !targets.length) {
    targets.forEach(el => el.classList.add('in'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });

  targets.forEach(el => io.observe(el));
}
