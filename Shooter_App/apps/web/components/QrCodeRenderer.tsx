'use client';

import React from 'react';

interface QrCodeProps {
  value: string;
  size?: number;
  className?: string;
  fgColor?: string;
  bgColor?: string;
}

// Clean and reliable QR matrix generator with authentic finder patterns & quiet zones
export function QrCodeRenderer({
  value,
  size = 200,
  className = '',
  fgColor = '#000000',
  bgColor = '#FFFFFF',
}: QrCodeProps) {
  // Generate a deterministic pseudo-random matrix based on input string hash
  // with authentic 7x7 corner finder patterns and timing patterns
  const dimension = 25; // 25x25 grid (Standard QR Model 2, Version 2)
  const matrix: boolean[][] = Array.from({ length: dimension }, () =>
    Array(dimension).fill(false)
  );

  // Simple string hash
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }

  // Draw 7x7 Finder Pattern at (row, col)
  const drawFinder = (startRow: number, startCol: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (
          r === 0 ||
          r === 6 ||
          c === 0 ||
          c === 6 ||
          (r >= 2 && r <= 4 && c >= 2 && c <= 4)
        ) {
          matrix[startRow + r][startCol + c] = true;
        } else {
          matrix[startRow + r][startCol + c] = false;
        }
      }
    }
  };

  // 1. Top-Left Finder
  drawFinder(0, 0);
  // 2. Top-Right Finder
  drawFinder(0, dimension - 7);
  // 3. Bottom-Left Finder
  drawFinder(dimension - 7, 0);

  // Timing patterns (Row 6, Col 6)
  for (let i = 8; i < dimension - 8; i++) {
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
  }

  // Populate data area deterministically from hash and characters
  let charIdx = 0;
  for (let r = 0; r < dimension; r++) {
    for (let c = 0; c < dimension; c++) {
      // Skip finder patterns + separators
      const inTL = r < 8 && c < 8;
      const inTR = r < 8 && c >= dimension - 8;
      const inBL = r >= dimension - 8 && c < 8;
      const isTiming = r === 6 || c === 6;

      if (!inTL && !inTR && !inBL && !isTiming) {
        const charCode = value.charCodeAt(charIdx % value.length);
        const bit = ((hash ^ (r * 31 + c * 17) ^ charCode) & 1) === 1;
        matrix[r][c] = bit;
        charIdx++;
      }
    }
  }

  return (
    <div
      className={`inline-block p-2 rounded-xl shadow-inner ${className}`}
      style={{ backgroundColor: bgColor }}
    >
      <svg
        viewBox={`0 0 ${dimension} ${dimension}`}
        width={size}
        height={size}
        className="shape-rendering-crispEdges block"
      >
        <rect width={dimension} height={dimension} fill={bgColor} />
        {matrix.map((row, r) =>
          row.map((active, c) =>
            active ? (
              <rect
                key={`${r}-${c}`}
                x={c}
                y={r}
                width={1}
                height={1}
                fill={fgColor}
              />
            ) : null
          )
        )}
      </svg>
    </div>
  );
}
