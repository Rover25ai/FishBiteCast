'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceArea,
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
  const chartWrapRef = useRef<HTMLDivElement | null>(null);
  const [chartWidth, setChartWidth] = useState(0);

  const temperatureUnit = result.units === 'imperial' ? '°F' : '°C';
  const windUnit = result.units === 'imperial' ? 'mph' : 'km/h';
  const pressureUnit = result.units === 'imperial' ? 'inHg' : 'hPa';

  useEffect(() => {
    const updateChartWidth = (): void => {
      const nextWidth = Math.round(chartWrapRef.current?.getBoundingClientRect().width ?? 0);
      if (nextWidth > 0) {
        setChartWidth(nextWidth);
      }
    };

    updateChartWidth();
    const frame = window.requestAnimationFrame(updateChartWidth);

    const resizeObserver = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(updateChartWidth);
    if (resizeObserver && chartWrapRef.current) {
      resizeObserver.observe(chartWrapRef.current);
    }

    window.addEventListener('resize', updateChartWidth);
    window.addEventListener('orientationchange', updateChartWidth);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('resize', updateChartWidth);
      window.removeEventListener('orientationchange', updateChartWidth);
      resizeObserver?.disconnect();
    };
  }, []);

  const data = useMemo(
    () =>
      result.hourly
        .slice(0, 48)
        .map((hour) => ({
          epoch: Number.isFinite(hour.epoch) ? hour.epoch : 0,
          score: Number.isFinite(hour.score) ? Number(hour.score.toFixed(1)) : 0,
          precipitation: Number.isFinite(hour.inputs.precipitationProbability)
            ? Math.round(hour.inputs.precipitationProbability)
            : 0,
          temperature: Number.isFinite(hour.inputs.temperatureC)
            ? Number(convertTemp(hour.inputs.temperatureC, result.units).toFixed(1))
            : 0,
          wind: Number.isFinite(hour.inputs.windSpeedKmh)
            ? Number(convertWind(hour.inputs.windSpeedKmh, result.units).toFixed(1))
            : 0,
          pressure: Number.isFinite(hour.inputs.pressureHpa)
            ? Number(convertPressure(hour.inputs.pressureHpa, result.units).toFixed(2))
            : 0,
        }))
        .filter((hour) => hour.epoch > 0),
    [result.hourly, result.units],
  );

  const chartStart = data[0]?.epoch ?? 0;
  const chartEnd = data[data.length - 1]?.epoch ?? 0;
  const solunarInChartRange = result.solunar.windows.filter(
    (window) => window.endEpoch >= chartStart && window.startEpoch <= chartEnd,
  );
  const effectiveWidth = Math.max(chartWidth, 320);
  const canRenderChart = data.length > 0 && chartWidth > 0;

  return (
    <section className="card chart-card">
      <h2 className="section-title">48h Hourly Forecast + Bite Score</h2>
      <p className="chart-kicker">Amber shading marks major solunar windows. Mint shading marks minor windows.</p>
      <div className="chart-wrap" ref={chartWrapRef}>
        {canRenderChart ? (
          <ComposedChart width={effectiveWidth} height={360} data={data} margin={{ top: 8, right: 24, left: 0, bottom: 8 }}>
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
            <Line yAxisId="score" type="monotone" dataKey="score" name="Bite Score" stroke="#ee8a03" strokeWidth={3.2} dot={false} isAnimationActive={false} />
            <Line yAxisId="tempWind" type="monotone" dataKey="temperature" name={`Temp (${temperatureUnit})`} stroke="#028090" strokeWidth={2.1} dot={false} isAnimationActive={false} />
            <Line yAxisId="tempWind" type="monotone" dataKey="wind" name={`Wind (${windUnit})`} stroke="#003049" strokeWidth={2.1} dot={false} isAnimationActive={false} />
            <Line yAxisId="pressure" type="monotone" dataKey="pressure" name={`Pressure (${pressureUnit})`} stroke="#5b6f7a" dot={false} strokeDasharray="3 3" />
          </ComposedChart>
        ) : (
          <p className="helper-text">Preparing chart...</p>
        )}
      </div>
    </section>
  );
}
