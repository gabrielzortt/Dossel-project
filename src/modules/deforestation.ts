import { $, fmt } from './utils.ts';
import { PRODES_SERIES, STATE_SHARE, STATE_BOUNDS } from './state.ts';
import { drawBarChart } from './charts.ts';

// NOTA DE ENGENHARIA: tentamos, na primeira versão deste painel, buscar o dado do ano
// corrente diretamente da API do TerraBrasilis. O cliente oficial que expunha essa API
// em formato REST simples (terrabrasilisAnalyticsAPI) foi descontinuado pelo próprio INPE,
// e o serviço geoespacial que resta (GeoServer/WFS) não garante cabeçalho CORS para chamadas
// de navegador nem uma contagem agregada pronta — só geometria bruta. Por isso este painel
// usa a série consolidada do PRODES como fonte primária, e não finge uma chamada "ao vivo"
// que dependeria de um endpoint que não é público nem estável.

export function drawDeforChart(): void {
  const avg = PRODES_SERIES.reduce((a, b) => a + b.km2, 0) / PRODES_SERIES.length;
  const data = PRODES_SERIES.map(d => ({
    label: String(d.year),
    value: d.km2,
    color: d.km2 > avg ? '#FF6A39' : '#5FBE8B'
  }));
  drawBarChart('#deforChart', data, { height: 240 });
  $('#tickDefor').textContent = fmt.format(PRODES_SERIES[PRODES_SERIES.length - 1].km2);
}

export function updateStateList(fireCounts: Record<string, number> | null): void {
  const list = $<HTMLDivElement>('#stateList');
  list.innerHTML = '';

  const source = fireCounts && Object.keys(fireCounts).length
    ? Object.entries(fireCounts).map(([uf, count]) => {
        const name = STATE_BOUNDS.find(s => s.uf === uf)?.name ?? uf;
        return { uf: name, count };
      }).sort((a, b) => b.count - a.count)
    : null;

  if (source) {
    const max = Math.max(...source.map(s => s.count));
    source.forEach(s => {
      list.insertAdjacentHTML('beforeend', `
        <div class="state-row">
          <span class="state-name">${s.uf}</span>
          <div class="bar-track"><div class="bar-fill" style="width:${(s.count / max) * 100}%"></div></div>
          <span class="state-pct">${fmt.format(s.count)}</span>
        </div>`);
    });
  } else {
    STATE_SHARE.forEach(s => {
      list.insertAdjacentHTML('beforeend', `
        <div class="state-row">
          <span class="state-name">${s.uf}</span>
          <div class="bar-track"><div class="bar-fill" style="width:${s.pct * 2.6}%"></div></div>
          <span class="state-pct">${s.pct}%</span>
        </div>`);
    });
  }
}
