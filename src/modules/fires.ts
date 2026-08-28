import L from 'leaflet';
import { $, $opt, fmt, toast } from './utils.ts';
import { AMZ_BBOX, STATE_BOUNDS, stateFor } from './state.ts';
import { drawRiskGauge } from './charts.ts';
import type { FirePoint, RiskResult, YoyComparison } from '../types/domain.ts';
import type { MapHandles } from './map.ts';

const FIRMS_STORAGE_KEY = 'dossel_firms_map_key';

// Chave pessoal gratuita gerada em firms.modaps.eosdis.nasa.gov/api/map_key —
// sujeita a limite de requisições por transação; troque pela sua se o limite for atingido.
const DEFAULT_MAP_KEY = '4ff6af3d31db2472488b7bd0c28eafa7';

export function getStoredKey(): string {
  return localStorage.getItem(FIRMS_STORAGE_KEY) ?? DEFAULT_MAP_KEY;
}

export function initKeyField(): void {
  const stored = localStorage.getItem(FIRMS_STORAGE_KEY);
  const input = $<HTMLInputElement>('#firmsKeyInput');
  input.value = stored ?? '';
  input.placeholder = stored ? '' : 'Usando chave padrão do projeto';
}

export function saveCustomKey(): boolean {
  const v = $<HTMLInputElement>('#firmsKeyInput').value.trim();
  if (!v) { toast('Cole uma MAP_KEY válida antes de salvar.'); return false; }
  localStorage.setItem(FIRMS_STORAGE_KEY, v);
  toast('Chave salva neste navegador. Recarregando focos de calor…');
  return true;
}

function parseFirmsCsv(csv: string): FirePoint[] {
  const lines = csv.trim().split('\n');
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim());
  const latIdx = headers.indexOf('latitude');
  const lonIdx = headers.indexOf('longitude');
  const confIdx = headers.indexOf('confidence');
  const brightIdx = headers.indexOf('bright_ti4') !== -1 ? headers.indexOf('bright_ti4') : headers.indexOf('brightness');
  const dateIdx = headers.indexOf('acq_date');
  const timeIdx = headers.indexOf('acq_time');

  const points: FirePoint[] = [];
  for (const line of lines.slice(1)) {
    const cols = line.split(',');
    const lat = parseFloat(cols[latIdx] ?? '');
    const lon = parseFloat(cols[lonIdx] ?? '');
    if (Number.isNaN(lat) || Number.isNaN(lon)) continue;
    const confidence = cols[confIdx] ?? 'n/d';
    const isHighConfidence = confidence === 'h' || confidence === 'high' || Number(confidence) > 80;
    points.push({
      lat, lon, confidence,
      brightness: cols[brightIdx] ?? '—',
      date: cols[dateIdx] ?? '—',
      time: cols[timeIdx] ?? '—',
      isHighConfidence
    });
  }
  return points;
}

function bboxStr(): string {
  return `${AMZ_BBOX.west},${AMZ_BBOX.south},${AMZ_BBOX.east},${AMZ_BBOX.north}`;
}

async function fetchFirmsCsv(source: string, dayRange: string, date?: string): Promise<FirePoint[]> {
  const key = getStoredKey();
  const suffix = date ? `/${date}` : '';
  const url = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${key}/${source}/${bboxStr()}/${dayRange}${suffix}`;
  const res = await fetch(url);
  const text = await res.text();
  if (!res.ok || text.toLowerCase().includes('invalid') || text.toLowerCase().includes('error')) {
    throw new Error('Resposta inválida da API FIRMS — verifique a MAP_KEY ou o limite de uso.');
  }
  return parseFirmsCsv(text);
}

function computeRisk(points: FirePoint[]): RiskResult {
  const highConf = points.filter(p => p.isHighConfidence).length;
  const density = Math.min(100, (points.length / 400) * 100);
  const confidenceShare = points.length ? (highConf / points.length) * 100 : 0;
  const score = Math.round(density * 0.65 + confidenceShare * 0.35);
  const label: RiskResult['label'] = score < 33 ? 'Risco baixo' : score < 66 ? 'Risco moderado' : 'Risco elevado';
  return { score, label };
}

function isoDateMinusDays(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

function renderFires(points: FirePoint[], fireLayer: L.LayerGroup, onStateCounts: (c: Record<string, number>) => void): void {
  fireLayer.clearLayers();
  const stateCounts: Record<string, number> = {};
  let highConf = 0;
  let peak: FirePoint | null = null;

  points.forEach(p => {
    if (p.isHighConfidence) highConf++;
    const st = stateFor(p.lat, p.lon);
    if (st) stateCounts[st.uf] = (stateCounts[st.uf] ?? 0) + 1;
    if (p.isHighConfidence && (!peak || Number(p.brightness) > Number(peak.brightness || 0))) peak = p;

    L.circleMarker([p.lat, p.lon], {
      radius: p.isHighConfidence ? 3.6 : 2.4,
      color: p.isHighConfidence ? '#FF6A39' : '#E8B94E',
      weight: 0,
      fillOpacity: p.isHighConfidence ? 0.85 : 0.55
    }).bindPopup(
      `<div class="fpop"><b>${st ? st.name : 'Amazônia Legal'}</b><br>
       Data: ${p.date} ${p.time} UTC<br>
       Confiança: ${p.confidence}<br>
       Brilho: ${p.brightness}</div>`
    ).addTo(fireLayer);
  });

  if (peak) {
    const peakPoint = peak as FirePoint;
    L.circleMarker([peakPoint.lat, peakPoint.lon], {
      radius: 7, color: '#FF6A39', weight: 2, fillOpacity: 0.15, className: 'hotspot-ring'
    }).addTo(fireLayer);
  }

  $('#fireTotal').textContent = fmt.format(points.length);
  $('#fireHighConf').textContent = fmt.format(highConf);
  $('#tickFires').textContent = fmt.format(points.length);

  const top = Object.entries(stateCounts).sort((a, b) => b[1] - a[1])[0];
  $('#fireTopState').textContent = top
    ? `${STATE_BOUNDS.find(s => s.uf === top[0])?.name ?? top[0]} (${fmt.format(top[1])})`
    : '—';

  const risk = computeRisk(points);
  $('#riskValue').textContent = `${risk.score}/100`;
  $('#riskLabel').textContent = risk.label;
  drawRiskGauge('#riskGauge', risk.score);

  onStateCounts(stateCounts);
}

function renderYoy(comparison: YoyComparison | null): void {
  const el = $opt<HTMLDivElement>('#yoyCompare');
  if (!el) return;
  if (!comparison || comparison.deltaPct === null) {
    el.textContent = 'Comparativo com o mesmo período do ano passado indisponível no momento.';
    return;
  }
  const arrow = comparison.deltaPct >= 0 ? '↑' : '↓';
  const sign = comparison.deltaPct >= 0 ? '+' : '';
  el.innerHTML = `<span class="num" style="color:${comparison.deltaPct >= 0 ? 'var(--fire)' : 'var(--leaf)'}">${arrow} ${sign}${comparison.deltaPct.toFixed(1)}%</span> em relação ao mesmo período do ano passado (${fmt.format(comparison.previousCount)} focos)`;
}

export async function loadFires(handles: MapHandles, onStateCounts: (c: Record<string, number>) => void): Promise<void> {
  const days = $<HTMLSelectElement>('#firePeriod').value;

  try {
    const points = await fetchFirmsCsv('VIIRS_SNPP_NRT', days);
    renderFires(points, handles.fireLayer, onStateCounts);
    $opt('#keySetup')?.style.setProperty('display', 'none');
    toast(`${fmt.format(points.length)} focos de calor carregados via NASA FIRMS.`);

    // Comparativo ano a ano: mesmo período, ~364 dias atrás, usando a fonte histórica padrão (SP),
    // já que a fonte NRT só cobre os últimos ~60 dias.
    try {
      const lastYearDate = isoDateMinusDays(364);
      const lastYearPoints = await fetchFirmsCsv('VIIRS_SNPP_SP', days, lastYearDate);
      const deltaPct = lastYearPoints.length > 0
        ? ((points.length - lastYearPoints.length) / lastYearPoints.length) * 100
        : null;
      renderYoy({ currentCount: points.length, previousCount: lastYearPoints.length, deltaPct });
    } catch {
      renderYoy(null);
    }
  } catch (err) {
    console.error(err);
    toast('Não foi possível carregar o NASA FIRMS agora (chave inválida, limite de uso ou rede).');
    $('#fireTotal').textContent = '0';
    $('#tickFires').textContent = 'indisponível';
    $opt('#keySetup')?.style.setProperty('display', 'block');
    renderYoy(null);
  }
}
