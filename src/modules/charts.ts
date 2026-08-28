import { $, fmt } from './utils.ts';
import type { ChartDatum } from '../types/domain.ts';

export function drawBarChart(canvasId: string, data: ChartDatum[], opts: { height?: number } = {}): void {
  const canvas = $<HTMLCanvasElement>(canvasId);
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const height = opts.height ?? 220;
  canvas.width = rect.width * dpr;
  canvas.height = height * dpr;
  canvas.style.height = `${height}px`;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.scale(dpr, dpr);

  const W = rect.width, H = height;
  const pad = { top: 16, right: 12, bottom: 28, left: 44 };
  const plotW = W - pad.left - pad.right;
  const plotH = H - pad.top - pad.bottom;
  const max = Math.max(...data.map(d => d.value), 1) * 1.15;
  const barW = (plotW / data.length) * 0.58;
  const gap = plotW / data.length;

  ctx.clearRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(140,168,150,0.14)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = pad.top + plotH - (plotH / 4) * i;
    ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(W - pad.right, y); ctx.stroke();
    ctx.fillStyle = '#5E7268';
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.textAlign = 'right';
    ctx.fillText(fmt.format(Math.round((max / 4) * i)), pad.left - 8, y + 3);
  }

  data.forEach((d, i) => {
    const x = pad.left + gap * i + (gap - barW) / 2;
    const barH = (d.value / max) * plotH;
    const y = pad.top + plotH - barH;
    const grad = ctx.createLinearGradient(0, y, 0, pad.top + plotH);
    grad.addColorStop(0, d.color ?? '#5FBE8B');
    grad.addColorStop(1, 'rgba(95,190,139,0.15)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    const r = 4;
    ctx.moveTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.arcTo(x + barW, y, x + barW, y + r, r);
    ctx.lineTo(x + barW, pad.top + plotH);
    ctx.lineTo(x, pad.top + plotH);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#93A69B';
    ctx.font = '10.5px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(d.label, x + barW / 2, H - 10);
  });
}

export function drawRiskGauge(svgId: string, value: number): void {
  const svg = $<SVGSVGElement>(svgId);
  const pct = Math.max(0, Math.min(100, value));
  const r = 40;
  const circumference = Math.PI * r;
  const offset = circumference * (1 - pct / 100);
  const color = pct < 33 ? '#5FBE8B' : pct < 66 ? '#E8B94E' : '#FF6A39';

  svg.innerHTML = `
    <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="rgba(140,168,150,0.18)" stroke-width="8" stroke-linecap="round"/>
    <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="${color}" stroke-width="8" stroke-linecap="round"
      stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"
      style="transition: stroke-dashoffset 1.1s cubic-bezier(.16,.84,.44,1), stroke 1.1s;"/>
  `;
}
