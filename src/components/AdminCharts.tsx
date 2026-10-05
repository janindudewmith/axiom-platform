'use client';

import React from 'react';

interface ChartProps {
  data: { name: string; value: number }[];
  title: string;
  color?: string;
  prefix?: string;
}

export default function AdminCharts({ data, title, color = '#3b82f6', prefix = '' }: ChartProps) {
  const maxValue = Math.max(...data.map(d => d.value), 1);
  const chartHeight = 200;
  const chartWidth = 400;
  const padding = 30;
  
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * (chartWidth - padding * 2) + padding;
    const y = chartHeight - ((d.value / maxValue) * (chartHeight - padding * 2) + padding);
    return `${x},${y}`;
  }).join(' ');

  const areaPoints = `${points} ${chartWidth - padding},${chartHeight - padding} ${padding},${chartHeight - padding}`;

  return (
    <div className="feature-card" style={{ padding: '1.5rem', flex: 1 }}>
      <h3 style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '1.5rem', fontWeight: 600 }}>{title}</h3>
      
      <div style={{ position: 'relative', width: '100%', height: `${chartHeight}px` }}>
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
          {/* Gradients */}
          <defs>
            <linearGradient id={`grad-${title}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.3" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Grid Lines */}
          {[0, 0.25, 0.5, 0.75, 1].map(v => {
            const y = chartHeight - (v * (chartHeight - padding * 2) + padding);
            return (
              <line key={v} x1={padding} y1={y} x2={chartWidth - padding} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
            );
          })}

          {/* Area */}
          <polyline points={areaPoints} fill={`url(#grad-${title})`} />
          
          {/* Line */}
          <polyline
            points={points}
            fill="none"
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Points */}
          {data.map((d, i) => {
            const x = (i / (data.length - 1)) * (chartWidth - padding * 2) + padding;
            const y = chartHeight - ((d.value / maxValue) * (chartHeight - padding * 2) + padding);
            return (
              <circle key={i} cx={x} cy={y} r="4" fill="var(--color-bg)" stroke={color} strokeWidth="2" />
            );
          })}
        </svg>

        {/* X-Axis Labels */}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 10px 0', fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
          {data.map((d, i) => <span key={i}>{d.name}</span>)}
        </div>
      </div>

      <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
        <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'white' }}>{prefix}{data[data.length - 1].value.toLocaleString()}</span>
        <span style={{ fontSize: '0.8rem', color: '#10b981' }}>Current Month</span>
      </div>
    </div>
  );
}
