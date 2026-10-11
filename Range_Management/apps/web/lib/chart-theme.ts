import React from 'react';

export const CHART_COLORS = {
  amber:   '#F5A623',
  blue:    '#4FC3F7',
  emerald: '#00E5A0',
  red:     '#FF4D6D',
  muted:   '#4A5168',
};

export const tooltipStyle = {
  contentStyle: {
    background: '#161B26', border: '1px solid rgba(245,166,35,0.3)',
    borderRadius: '8px', fontFamily: 'JetBrains Mono',
    fontSize: '12px', color: '#F0F2F5',
  },
  labelStyle: { color: '#8B92A5', fontFamily: 'DM Sans', fontSize: '11px', marginBottom: '4px' },
  cursor: { stroke: 'rgba(245,166,35,0.2)', strokeWidth: 1 },
};

export const axisStyle = {
  tick:     { fill: '#4A5168', fontFamily: 'JetBrains Mono', fontSize: 11 },
  axisLine: { stroke: 'rgba(255,255,255,0.06)' },
  tickLine: false as const,
};

export const gridStyle = {
  strokeDasharray: '3 3',
  stroke: 'rgba(255,255,255,0.04)',
  vertical: false,
};

export function AmberGradient() {
  return React.createElement('defs', null,
    React.createElement('linearGradient', { id: 'amberGradient', x1: '0', y1: '0', x2: '0', y2: '1' },
      React.createElement('stop', { offset: '5%', stopColor: '#F5A623', stopOpacity: 0.25 }),
      React.createElement('stop', { offset: '95%', stopColor: '#F5A623', stopOpacity: 0 })
    ),
    React.createElement('linearGradient', { id: 'blueGradient', x1: '0', y1: '0', x2: '0', y2: '1' },
      React.createElement('stop', { offset: '5%', stopColor: '#4FC3F7', stopOpacity: 0.25 }),
      React.createElement('stop', { offset: '95%', stopColor: '#4FC3F7', stopOpacity: 0 })
    ),
    React.createElement('linearGradient', { id: 'emeraldGradient', x1: '0', y1: '0', x2: '0', y2: '1' },
      React.createElement('stop', { offset: '5%', stopColor: '#00E5A0', stopOpacity: 0.25 }),
      React.createElement('stop', { offset: '95%', stopColor: '#00E5A0', stopOpacity: 0 })
    )
  );
}
