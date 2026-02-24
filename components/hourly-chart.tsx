'use client';

import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { formatHour } from '@/lib/format';
import type { ForecastResult } from '@/types/forecast';

interface HourlyChartProps {
  result: ForecastResult;
}

function convertTemp(value: number, units: ForecastResult['units']): number {
  if (units === 'imperial') {
    return (value * 9) / 5 + 32;
  }

  return value;
}

function convertWind(value: number, units: ForecastResult['units']): number {
  if (units === 'imperial') {
    return value * 0.621371;
  }

  return value;
}

function convertPressure(value: number, units: ForecastResult['units']): number {
  if (units === 'imperial') {
    return value * 0.02953;
  }

  return value;
}

export function HourlyChart({ result }: HourlyChartProps): JSX.Element {
  const temperatureUnit = result.units === 'imperial' ? '°F' : '°C';
  const windUnit = result.units === 'imperial' ? 'mph' : 'km/h';
  const pressureUnit = result.units === 'imperial' ? 'inHg' : 'hPa';

  const data = result.hourly.slice(0, 48).map((hour) => ({
    epoch: hour.epoch,
    score: Number(hour.score.toFixed(1)),
    precipitation: Math.round(hour.inputs.precipitationProbability),
    temperature: Number(convertTemp(hour.inputs.temperatureC, result.units).toFixed(1)),
    wind: Number(convertWind(hour.inputs.windSpeedKmh, result.units).toFixed(1)),
    pressure: Number(convertPressure(hour.inputs.pressureHpa, result.units).toFixed(2)),
  }));

  const chartStart = data[0]?.epoch ?? 0;
  const chartEnd = data[data.length - 1]?.epoch ?? 0;
  const solunarInChartRange = result.solunar.windows.filter(
    (window) => window.endEpoch >= chartStart && window.startEpoch <= chartEnd,
  );

  return (
    <section className="card chart-card">
      <h2 className="section-title">48h Hourly Forecast + Bite Score</h2>
      <p className="chart-kicker">Amber shading marks major solunar windows. Mint shading marks minor windows.</p>
      <div className="chart-wrap">
        <ResponsiveContainer width="100%" height={360}>
          <ComposedChart data={data} margin={{ top: 8, right: 24, left: 0, bottom: 8 }}>
            <defs>
              <linearGradient id="rainFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#45b9de" stopOpacity={0.44} />
                <stop offset="100%" stopColor="#45b9de" stopOpacity={0.08} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="4 4" stroke="#8db6c540" />
            <XAxis
              dataKey="epoch"
              type="number"
              domain={['dataMin', 'dataMax']}
              tickCount={12}
              tickFormatter={(value) => formatHour(Number(value), result.timezone)}
              tick={{ fill: '#2f4f5b', fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis yAxisId="score" domain={[0, 100]} width={40} tick={{ fill: '#2f4f5b', fontSize: 12 }} tickLine={false} axisLine={false} />
            <YAxis yAxisId="tempWind" orientation="right" width={54} tick={{ fill: '#2f4f5b', fontSize: 12 }} tickLine={false} axisLine={false} />
            <YAxis yAxisId="pressure" hide />
            <Tooltip
              labelFormatter={(value) => formatHour(Number(value), result.timezone)}
              contentStyle={{ borderRadius: 12, border: '1px solid #9fc9d8', boxShadow: '0 10px 20px rgba(7, 46, 68, 0.18)' }}
              cursor={{ stroke: '#03354a55', strokeWidth: 1.5 }}
            />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
            {solunarInChartRange.map((window) => (
              <ReferenceArea
                key={`${window.type}-${window.peakEpoch}`}
                yAxisId="score"
                x1={window.startEpoch}
                x2={window.endEpoch}
                fill={window.type === 'major' ? '#ffbf6982' : '#98f5b082'}
                strokeOpacity={0}
                ifOverflow="extendDomain"
              />
            ))}
            <Area yAxisId="score" dataKey="precipitation" name="Rain %" fill="url(#rainFill)" stroke="#2b9ec4" strokeWidth={1.4} />
            <Line yAxisId="score" type="monotone" dataKey="score" name="Bite Score" stroke="#ee8a03" strokeWidth={3.2} dot={false} />
            <Line yAxisId="tempWind" type="monotone" dataKey="temperature" name={`Temp (${temperatureUnit})`} stroke="#028090" strokeWidth={2.1} dot={false} />
            <Line yAxisId="tempWind" type="monotone" dataKey="wind" name={`Wind (${windUnit})`} stroke="#003049" strokeWidth={2.1} dot={false} />
            <Line yAxisId="pressure" type="monotone" dataKey="pressure" name={`Pressure (${pressureUnit})`} stroke="#5b6f7a" dot={false} strokeDasharray="3 3" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
