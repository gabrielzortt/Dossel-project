import { JSDOM } from 'jsdom';
import fs from 'node:fs';

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf-8');
const dom = new JSDOM(html, { url: 'https://dossel.local/', pretendToBeVisual: true });

// @ts-expect-error — populating Node's global scope with a DOM for the modules under test
global.window = dom.window;
// @ts-expect-error
global.document = dom.window.document;
Object.defineProperty(global, 'navigator', { value: dom.window.navigator, configurable: true });
// @ts-expect-error
global.localStorage = dom.window.localStorage;
// @ts-expect-error
global.HTMLElement = dom.window.HTMLElement;
// @ts-expect-error
global.SVGSVGElement = dom.window.SVGSVGElement;
// @ts-expect-error
global.customElements = dom.window.customElements;

let pass = 0, fail = 0;
function check(label: string, cond: boolean) {
  if (cond) { pass++; console.log(`  ✓ ${label}`); }
  else { fail++; console.log(`  ✗ ${label}`); }
}

// ---------- fixtures shaped exactly like the real API responses ----------
const FIRMS_CSV_FIXTURE =
  'latitude,longitude,bright_ti4,confidence,acq_date,acq_time\n' +
  '-3.45,-62.10,335.2,h,2026-08-27,0312\n' +
  '-9.80,-56.40,310.5,n,2026-08-27,0314\n' +
  '-8.10,-64.90,342.8,h,2026-08-27,0316\n';

const OPEN_METEO_FORECAST_FIXTURE = {
  current: { temperature_2m: 31.4, relative_humidity_2m: 68, precipitation: 0.2 },
  daily: {
    time: ['2026-08-28', '2026-08-29', '2026-08-30', '2026-08-31', '2026-09-01', '2026-09-02', '2026-09-03'],
    precipitation_sum: [0, 2.1, 5.4, 0, 0, 12.3, 3.2]
  }
};

const OPEN_METEO_FLOOD_FIXTURE = {
  daily: {
    time: Array.from({ length: 14 }, (_, i) => `2026-08-${String(28 + i).padStart(2, '0')}`),
    river_discharge: Array.from({ length: 14 }, (_, i) => 18000 + i * 120)
  }
};

let callLog: string[] = [];
// @ts-expect-error — mock fetch for offline smoke testing (sandbox has no route to these hosts)
global.fetch = async (url: string) => {
  callLog.push(url);
  if (url.includes('firms.modaps.eosdis.nasa.gov')) {
    return { ok: true, text: async () => FIRMS_CSV_FIXTURE } as Response;
  }
  if (url.includes('flood-api.open-meteo.com')) {
    return { ok: true, json: async () => OPEN_METEO_FLOOD_FIXTURE } as Response;
  }
  if (url.includes('api.open-meteo.com')) {
    return { ok: true, json: async () => OPEN_METEO_FORECAST_FIXTURE } as Response;
  }
  throw new Error(`fetch não simulado para: ${url}`);
};

async function run() {
  console.log('\n[1/5] Módulos utilitários (utils, state, charts)');
  const { $, fmt } = await import('../src/modules/utils.ts');
  const state = await import('../src/modules/state.ts');
  check('AMZ_BBOX cobre a Amazônia Legal', state.AMZ_BBOX.west < state.AMZ_BBOX.east && state.AMZ_BBOX.south < state.AMZ_BBOX.north);
  check('stateFor() resolve Manaus como Amazonas', state.stateFor(-3.10, -60.02)?.uf === 'AM');
  check('stateFor() resolve Belém como Pará', state.stateFor(-1.46, -48.50)?.uf === 'PA');
  check('fmt formata número em pt-BR', fmt.format(12345) === '12.345');
  check('$ encontra elemento existente (#firePeriod)', !!$('#firePeriod'));

  const { drawBarChart, drawRiskGauge } = await import('../src/modules/charts.ts');
  // jsdom canvas 2D context não é implementado nativamente — cobrimos o "não deve lançar exceção"
  try {
    drawBarChart('#deforChart', [{ label: '2024', value: 100, color: '#5FBE8B' }]);
    check('drawBarChart executa sem lançar exceção', true);
  } catch (e) {
    // jsdom sem canvas: getContext('2d') retorna null — a função já trata isso com `if (!ctx) return;`
    check('drawBarChart executa sem lançar exceção', false);
    console.error(e);
  }
  drawRiskGauge('#riskGauge', 72);
  check('drawRiskGauge escreve o path no SVG', document.querySelector('#riskGauge')!.innerHTML.includes('<path'));
  check('drawRiskGauge usa cor de risco elevado (>=66) em laranja', document.querySelector('#riskGauge')!.innerHTML.includes('#FF6A39'));

  console.log('\n[2/5] Painel de desmatamento (dados de referência PRODES)');
  const defor = await import('../src/modules/deforestation.ts');
  defor.drawDeforChart();
  check('tickDefor preenchido com o último ano da série PRODES', $('#tickDefor').textContent === fmt.format(state.PRODES_SERIES.at(-1)!.km2));
  defor.updateStateList(null);
  check('lista de estados usa fallback STATE_SHARE quando não há contagem de focos', document.querySelectorAll('#stateList .state-row').length === state.STATE_SHARE.length);
  defor.updateStateList({ PA: 40, AM: 12 });
  check('lista de estados reordena por contagem real quando fornecida', document.querySelectorAll('#stateList .state-row')[0].textContent!.includes('Pará'));

  console.log('\n[3/5] Painel de clima e hidrologia (Open-Meteo, respostas simuladas)');
  const { loadClimate } = await import('../src/modules/climate.ts');
  await loadClimate();
  check('temperatura atual populada a partir do fixture', $('#mTemp').textContent === '31°C');
  check('umidade populada a partir do fixture', $('#mHumidity').textContent === '68%');
  check('vazão do rio populada a partir do fixture de flood', $('#mDischarge').textContent === fmt.format(18000));
  check('ticker de temperatura no hero também é atualizado', $('#tickTemp').textContent === '31°C');

  console.log('\n[4/5] Painel de queimadas (NASA FIRMS, CSV simulado) — sem inicializar o mapa Leaflet completo');
  const L = (await import('leaflet')).default;
  const fireLayer = L.layerGroup();
  const { loadFires, getStoredKey } = await import('../src/modules/fires.ts');
  check('chave padrão embutida é usada quando não há chave salva no navegador', getStoredKey() === '4ff6af3d31db2472488b7bd0c28eafa7');

  let capturedCounts: Record<string, number> | null = null;
  await loadFires({ map: undefined as unknown as L.Map, fireLayer }, (c) => { capturedCounts = c; });
  check('total de focos bate com o fixture (3 pontos)', $('#fireTotal').textContent === '3');
  check('contagem de alta confiança bate com o fixture (2 pontos "h")', $('#fireHighConf').textContent === '2');
  check('marcadores foram de fato adicionados à camada do mapa', fireLayer.getLayers().length >= 3);
  check('contagem por estado foi repassada ao callback (usada pela lista de desmatamento)', capturedCounts !== null && Object.keys(capturedCounts).length > 0);
  check('índice de risco foi calculado e exibido', /\d+\/100/.test($('#riskValue').textContent ?? ''));
  check('comparativo ano a ano tentou uma segunda chamada à API (fonte histórica)', callLog.filter(u => u.includes('firms.modaps.eosdis.nasa.gov')).length === 2);

  console.log('\n[5/5] Tratamento de erro — API fora do ar não deve quebrar o painel');
  // @ts-expect-error — simula indisponibilidade total da API nesta chamada
  global.fetch = async () => { throw new Error('network down'); };
  await loadFires({ map: undefined as unknown as L.Map, fireLayer }, () => {});
  check('painel mostra estado de indisponibilidade sem lançar exceção', $('#tickFires').textContent === 'indisponível');

  console.log(`\n${pass} passaram, ${fail} falharam.\n`);
  if (fail > 0) process.exit(1);
}

run().catch((err) => { console.error('Smoke test falhou com exceção não tratada:', err); process.exit(1); });
