import L from 'leaflet';
import { AMZ_BBOX } from './state.ts';

export interface MapHandles {
  map: L.Map;
  fireLayer: L.LayerGroup;
}

export function initMap(): MapHandles {
  const map = L.map('firemap', { zoomControl: true, attributionControl: true })
    .setView([-5.5, -60], 4.4);

  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap &copy; CARTO',
    maxZoom: 12
  }).addTo(map);

  L.rectangle(
    [[AMZ_BBOX.south, AMZ_BBOX.west], [AMZ_BBOX.north, AMZ_BBOX.east]],
    { color: '#5FBE8B', weight: 1, fill: false, dashArray: '4,6', opacity: 0.5 }
  ).addTo(map);

  const fireLayer = L.layerGroup().addTo(map);
  setTimeout(() => map.invalidateSize(), 300);

  return { map, fireLayer };
}
