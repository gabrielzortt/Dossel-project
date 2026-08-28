import type { StateBounds, ProdesYear, StateShare, City } from '../types/domain.ts';

// Amazônia Legal — bounding box (west, south, east, north)
export const AMZ_BBOX = { west: -73.99, south: -18.04, east: -43.99, north: 5.27 } as const;

export const STATE_BOUNDS: StateBounds[] = [
  { uf: 'AM', name: 'Amazonas',    latMin: -9.9,  latMax: 2.3,  lonMin: -73.99, lonMax: -56.0 },
  { uf: 'PA', name: 'Pará',        latMin: -9.9,  latMax: 2.6,  lonMin: -58.9,  lonMax: -46.0 },
  { uf: 'MT', name: 'Mato Grosso', latMin: -18.04,latMax: -7.3, lonMin: -61.6,  lonMax: -50.2 },
  { uf: 'RO', name: 'Rondônia',    latMin: -13.7, latMax: -7.9, lonMin: -66.8,  lonMax: -59.8 },
  { uf: 'AC', name: 'Acre',        latMin: -11.1, latMax: -7.1, lonMin: -73.99, lonMax: -66.6 },
  { uf: 'RR', name: 'Roraima',     latMin: -1.5,  latMax: 5.27, lonMin: -64.9,  lonMax: -58.9 },
  { uf: 'AP', name: 'Amapá',       latMin: -1.2,  latMax: 4.5,  lonMin: -54.9,  lonMax: -49.9 },
  { uf: 'TO', name: 'Tocantins',   latMin: -13.5, latMax: -5.0, lonMin: -50.7,  lonMax: -45.7 },
  { uf: 'MA', name: 'Maranhão',    latMin: -10.3, latMax: -1.0, lonMin: -48.8,  lonMax: -41.8 }
];

export function stateFor(lat: number, lon: number): StateBounds | undefined {
  return STATE_BOUNDS.find(s => lat >= s.latMin && lat <= s.latMax && lon >= s.lonMin && lon <= s.lonMax);
}

// Referência PRODES/INPE — série consolidada mais recente disponível (km²/ano).
// O painel tenta primeiro buscar o dado corrente via TerraBrasilis; isto é o fallback.
export const PRODES_SERIES: ProdesYear[] = [
  { year: 2016, km2: 7893 },
  { year: 2017, km2: 6947 },
  { year: 2018, km2: 7536 },
  { year: 2019, km2: 10129 },
  { year: 2020, km2: 10851 },
  { year: 2021, km2: 13038 },
  { year: 2022, km2: 11594 },
  { year: 2023, km2: 9064 },
  { year: 2024, km2: 6288 }
];

export const STATE_SHARE: StateShare[] = [
  { uf: 'Pará', pct: 32 },
  { uf: 'Amazonas', pct: 21 },
  { uf: 'Mato Grosso', pct: 17 },
  { uf: 'Rondônia', pct: 11 },
  { uf: 'Acre', pct: 7 },
  { uf: 'Maranhão', pct: 5 },
  { uf: 'Roraima', pct: 4 },
  { uf: 'Amapá', pct: 2 },
  { uf: 'Tocantins', pct: 1 }
];

export const CITIES: City[] = [
  { id: 'manaus', label: 'Manaus, AM', lat: -3.10, lon: -60.02 },
  { id: 'belem', label: 'Belém, PA', lat: -1.46, lon: -48.50 },
  { id: 'riobranco', label: 'Rio Branco, AC', lat: -9.97, lon: -67.82 },
  { id: 'santarem', label: 'Santarém, PA', lat: -2.44, lon: -54.71 },
  { id: 'portovelho', label: 'Porto Velho, RO', lat: -8.76, lon: -63.90 }
];
