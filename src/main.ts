import 'leaflet/dist/leaflet.css';
import './styles/tokens.css';
import './styles/layout.css';
import './styles/components.css';
import './styles/effects.css';

import { $, toast, debounce } from './modules/utils.ts';
import { initMap } from './modules/map.ts';
import { loadFires, initKeyField, saveCustomKey } from './modules/fires.ts';
import { drawDeforChart, updateStateList } from './modules/deforestation.ts';
import { loadClimate } from './modules/climate.ts';
import { startClock } from './modules/clock.ts';
import { initReveal } from './modules/reveal.ts';

startClock();
initReveal();

const handles = initMap();
initKeyField();

const refreshFires = () => loadFires(handles, updateStateList);

drawDeforChart();
updateStateList(null);

$<HTMLSelectElement>('#firePeriod').addEventListener('change', refreshFires);
$<HTMLSelectElement>('#citySelect').addEventListener('change', loadClimate);

$('#saveKeyBtn').addEventListener('click', () => {
  if (saveCustomKey()) refreshFires();
});

$('#ctaRefresh').addEventListener('click', () => {
  toast('Atualizando todos os painéis…');
  refreshFires();
  loadClimate();
});

window.addEventListener('resize', debounce(() => { drawDeforChart(); loadClimate(); }, 400));

refreshFires();
loadClimate();
