import { $, toast, fmt } from './utils.ts';
import { drawBarChart } from './charts.ts';

interface OpenMeteoForecast {
  current: { temperature_2m: number; relative_humidity_2m: number; precipitation: number };
  daily: { time: string[]; precipitation_sum: number[] };
}

interface OpenMeteoFlood {
  daily?: { time: string[]; river_discharge: number[] };
}

export async function loadClimate(): Promise<void> {
  const opt = $<HTMLSelectElement>('#citySelect').selectedOptions[0];
  const lat = opt.dataset.lat;
  const lon = opt.dataset.lon;

  try {
    const wxUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
      `&current=temperature_2m,relative_humidity_2m,precipitation` +
      `&daily=precipitation_sum&timezone=America%2FManaus&forecast_days=7`;
    const wxRes = await fetch(wxUrl);
    const wx = await wxRes.json() as OpenMeteoForecast;

    $('#mTemp').textContent = `${Math.round(wx.current.temperature_2m)}°C`;
    $('#mHumidity').textContent = `${Math.round(wx.current.relative_humidity_2m)}%`;
    $('#mPrecip').textContent = `${wx.current.precipitation ?? 0} mm`;
    $('#tickTemp').textContent = `${Math.round(wx.current.temperature_2m)}°C`;

    const precipData = wx.daily.time.map((t, i) => ({
      label: t.slice(5).replace('-', '/'),
      value: wx.daily.precipitation_sum[i] || 0,
      color: '#3E9BC4'
    }));
    drawBarChart('#climChart', precipData, { height: 200 });
  } catch (err) {
    console.error(err);
    toast('Falha ao carregar dados climáticos do Open-Meteo.');
  }

  try {
    const floodUrl = `https://flood-api.open-meteo.com/v1/flood?latitude=${lat}&longitude=${lon}` +
      `&daily=river_discharge&forecast_days=14`;
    const floodRes = await fetch(floodUrl);
    const flood = await floodRes.json() as OpenMeteoFlood;

    if (flood.daily?.river_discharge?.length) {
      const latest = flood.daily.river_discharge[0];
      $('#mDischarge').textContent = fmt.format(Math.round(latest));
      $('#tickRiver').textContent = fmt.format(Math.round(latest));

      const hydroData = flood.daily.time.map((t, i) => ({
        label: t.slice(5).replace('-', '/'),
        value: flood.daily!.river_discharge[i] || 0,
        color: '#5FBE8B'
      }));
      drawBarChart('#hydroChart', hydroData, { height: 200 });
    } else {
      throw new Error('Sem série de vazão para este ponto.');
    }
  } catch (err) {
    console.error(err);
    $('#mDischarge').textContent = 'n/d';
    $('#tickRiver').textContent = 'n/d';
    toast('Dados de vazão indisponíveis para este ponto no momento.');
  }
}
