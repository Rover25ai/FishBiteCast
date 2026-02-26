'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import { formatHour } from '@/lib/format';
import type { ForecastResult } from '@/types/forecast';

interface HourlyChartProps {
  result: ForecastResult;
}

interface ChartPoint {
  epoch: number;
  score: number;
  precipitation: number;
  temperature: number;
  wind: number;
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

function toFinite(value: number, fallback = 0): number {
  return Number.isFinite(value) ? value : fallback;
}

function linePath(points: ChartPoint[], xFor: (epoch: number) => number, yFor: (value: number) => number, key: keyof ChartPoint): string {
  if (points.length === 0) {
    return '';
  }

  return points
    .map((point, index) => {
      const x = xFor(point.epoch).toFixed(2);
      const y = yFor(toFinite(point[key] as number)).toFixed(2);
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');
}

function areaPath(points: ChartPoint[], xFor: (epoch: number) => number, yFor: (value: number) => number, key: keyof ChartPoint, baselineY: number): string {
  if (points.length === 0) {
    return '';
  }

  const firstX = xFor(points[0].epoch).toFixed(2);
  const start = `M ${firstX} ${baselineY.toFixed(2)}`;

  const top = points
    .map((point) => {
      const x = xFor(point.epoch).toFixed(2);
      const y = yFor(toFinite(point[key] as number)).toFixed(2);
      return `L ${x} ${y}`;
    })
    .join(' ');

  const lastX = xFor(points[points.length - 1].epoch).toFixed(2);

  return `${start} ${top} L ${lastX} ${baselineY.toFixed(2)} Z`;
}

function rangeWithPadding(values: number[], ratio = 0.12): { min: number; max: number } {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min;
  const pad = Math.max(span * ratio, span === 0 ? 2 : 0.6);
  return {
    min: min - pad,
    max: max + pad,
  };
}

export function HourlyChart({ result }: HourlyChartProps): JSX.Element {
  const chartWrapRef = useRef<HTMLDivElement | null>(null);
  const [chartWidth, setChartWidth] = useState(0);

  const temperatureUnit = result.units === 'imperial' ? '°F' : '°C';
  const windUnit = result.units === 'imperial' ? 'mph' : 'km/h';

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

  const points = useMemo(
    () =>
      result.hourly
        .slice(0, 48)
        .map((hour) => ({
          epoch: toFinite(hour.epoch, 0),
          score: toFinite(Number(hour.score.toFixed(1)), 0),
          precipitation: toFinite(Math.round(hour.inputs.precipitationProbability), 0),
          temperature: toFinite(Number(convertTemp(hour.inputs.temperatureC, result.units).toFixed(1)), 0),
          wind: toFinite(Number(convertWind(hour.inputs.windSpeedKmh, result.units).toFixed(1)), 0),
        }))
        .filter((point) => point.epoch > 0),
    [result.hourly, result.units],
  );

  const hasData = points.length > 1;

  if (!hasData) {
    return (
      <section className="card chart-card">
        <h2 className="section-title">48h Hourly Forecast + Bite Score</h2>
        <p className="helper-text">Not enough hourly data to draw the chart yet.</p>
      </section>
    );
  }

  const width = Math.max(chartWidth, 320);
  const height = 360;
  const margin = {
    top: 14,
    right: 56,
    bottom: 32,
    left: 42,
  };

  const innerWidth = Math.max(width - margin.left - margin.right, 1);
  const innerHeight = Math.max(height - margin.top - margin.bottom, 1);

  const startEpoch = points[0].epoch;
  const endEpoch = points[points.length - 1].epoch;
  const epochSpan = Math.max(endEpoch - startEpoch, 1);

  const xFor = (epoch: number): number => margin.left + ((epoch - startEpoch) / epochSpan) * innerWidth;
  const yForScore = (value: number): number => margin.top + (1 - Math.max(0, Math.min(100, value)) / 100) * innerHeight;

  const tempWindRange = rangeWithPadding([...points.map((point) => point.temperature), ...points.map((point) => point.wind)]);
  const tempWindSpan = Math.max(tempWindRange.max - tempWindRange.min, 1);
  const yForTempWind = (value: number): number =>
    margin.top + (1 - (Math.max(tempWindRange.min, Math.min(tempWindRange.max, value)) - tempWindRange.min) / tempWindSpan) * innerHeight;

  const rainArea = areaPath(points, xFor, yForScore, 'precipitation', yForScore(0));
  const scoreLine = linePath(points, xFor, yForScore, 'score');
  const tempLine = linePath(points, xFor, yForTempWind, 'temperature');
  const windLine = linePath(points, xFor, yForTempWind, 'wind');

  const xTickCount = 6;
  const xTicks = Array.from({ length: xTickCount }, (_, index) => {
    const ratio = index / (xTickCount - 1);
    const epoch = Math.round(startEpoch + epochSpan * ratio);
    return {
      epoch,
      x: xFor(epoch),
      label: formatHour(epoch, result.timezone),
    };
  });

  const scoreTicks = [0, 25, 50, 75, 100].map((value) => ({
    value,
    y: yForScore(value),
  }));

  const rightTickCount = 5;
  const rightTicks = Array.from({ length: rightTickCount }, (_, index) => {
    const ratio = index / (rightTickCount - 1);
    const value = tempWindRange.max - ratio * tempWindSpan;
    return {
      value,
      y: yForTempWind(value),
    };
  });

  const solunarInChartRange = result.solunar.windows.filter(
    (window) => window.endEpoch >= startEpoch && window.startEpoch <= endEpoch,
  );

  return (
    <section className="card chart-card">
      <h2 className="section-title">48h Hourly Forecast + Bite Score</h2>
      <p className="chart-kicker">Amber shading marks major solunar windows. Mint shading marks minor windows.</p>
      <div className="chart-wrap" ref={chartWrapRef}>
        {chartWidth > 0 ? (
          <svg className="chart-svg" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="48 hour hourly fishing forecast chart">
            <defs>
              <linearGradient id="rainFillNative" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#45b9de" stopOpacity="0.44" />
                <stop offset="100%" stopColor="#45b9de" stopOpacity="0.08" />
              </linearGradient>
            </defs>

            {scoreTicks.map((tick) => (
              <line key={`grid-${tick.value}`} x1={margin.left} x2={width - margin.right} y1={tick.y} y2={tick.y} stroke="#8db6c540" strokeDasharray="4 4" />
            ))}

            {solunarInChartRange.map((window) => {
              const x1 = xFor(Math.max(window.startEpoch, startEpoch));
              const x2 = xFor(Math.min(window.endEpoch, endEpoch));
              return (
                <rect
                  key={`${window.type}-${window.peakEpoch}`}
                  x={Math.min(x1, x2)}
                  y={margin.top}
                  width={Math.max(Math.abs(x2 - x1), 1)}
                  height={innerHeight}
                  fill={window.type === 'major' ? '#ffbf6982' : '#98f5b082'}
                />
              );
            })}

            <path d={rainArea} fill="url(#rainFillNative)" stroke="#2b9ec4" strokeWidth="1.4" />
            <path d={scoreLine} fill="none" stroke="#ee8a03" strokeWidth="3.2" strokeLinecap="round" />
            <path d={tempLine} fill="none" stroke="#028090" strokeWidth="2.1" strokeLinecap="round" />
            <path d={windLine} fill="none" stroke="#003049" strokeWidth="2.1" strokeLinecap="round" />

            <line x1={margin.left} x2={margin.left} y1={margin.top} y2={height - margin.bottom} stroke="#6f92a2" />
            <line x1={width - margin.right} x2={width - margin.right} y1={margin.top} y2={height - margin.bottom} stroke="#6f92a2" />
            <line x1={margin.left} x2={width - margin.right} y1={height - margin.bottom} y2={height - margin.bottom} stroke="#6f92a2" />

            {scoreTicks.map((tick) => (
              <text key={`left-${tick.value}`} x={margin.left - 8} y={tick.y + 4} textAnchor="end" fill="#2f4f5b" fontSize="12">
                {tick.value}
              </text>
            ))}

            {rightTicks.map((tick, index) => (
              <text key={`right-${index}`} x={width - margin.right + 8} y={tick.y + 4} textAnchor="start" fill="#2f4f5b" fontSize="12">
                {tick.value.toFixed(1)}
              </text>
            ))}

            {xTicks.map((tick, index) => (
              <g key={`x-${index}`}>
                <line x1={tick.x} x2={tick.x} y1={height - margin.bottom} y2={height - margin.bottom + 5} stroke="#6f92a2" />
                <text x={tick.x} y={height - margin.bottom + 18} textAnchor="middle" fill="#2f4f5b" fontSize="12">
                  {tick.label}
                </text>
              </g>
            ))}
          </svg>
        ) : (
          <p className="helper-text">Preparing chart...</p>
        )}
      </div>
      <div className="chart-legend" aria-hidden>
        <span><i className="legend-dot legend-score" /> Bite Score</span>
        <span><i className="legend-dot legend-temp" /> Temp ({temperatureUnit})</span>
        <span><i className="legend-dot legend-wind" /> Wind ({windUnit})</span>
        <span><i className="legend-dot legend-rain" /> Rain %</span>
      </div>
    </section>
  );
}
