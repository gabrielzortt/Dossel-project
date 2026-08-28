export interface StateBounds {
  uf: string;
  name: string;
  latMin: number;
  latMax: number;
  lonMin: number;
  lonMax: number;
}

export interface FirePoint {
  lat: number;
  lon: number;
  confidence: string;
  brightness: string;
  date: string;
  time: string;
  isHighConfidence: boolean;
}

export interface ProdesYear {
  year: number;
  km2: number;
}

export interface StateShare {
  uf: string;
  pct: number;
}

export interface City {
  id: string;
  label: string;
  lat: number;
  lon: number;
}

export interface ChartDatum {
  label: string;
  value: number;
  color?: string;
}

export interface RiskResult {
  score: number;
  label: 'Risco baixo' | 'Risco moderado' | 'Risco elevado';
}

export interface YoyComparison {
  currentCount: number;
  previousCount: number;
  deltaPct: number | null;
}
