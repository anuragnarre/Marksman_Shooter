// apps/api/src/shots/shots.parser.ts
import { BadRequestException } from '@nestjs/common';
import * as Papa from 'papaparse';
import * as pdfParse from 'pdf-parse';
import { ShotInput } from '@shooting-platform/shared-types';

// ── Types ─────────────────────────────────────────────────────────────────────

interface RawShotRow {
  shotNumber?: string | number;
  shot_number?: string | number;
  shot?: string | number;
  score?: string | number;
  x?: string | number;
  y?: string | number;
}

// ── CSV Parser ────────────────────────────────────────────────────────────────

/**
 * Parse CSV file. Expected columns: shotNumber, score, x (optional), y (optional)
 * Also accepts alternate header: shot_number, shot
 */
export async function parseCsv(buffer: Buffer): Promise<ShotInput[]> {
  const text = buffer.toString('utf-8');

  const result = Papa.parse<RawShotRow>(text, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true,
  });

  if (result.errors.length > 0) {
    throw new BadRequestException(
      `CSV parse error: ${result.errors[0].message}`,
    );
  }

  return result.data.map((row, index) => normalizeRow(row, index));
}

// ── JSON Parser ────────────────────────────────────────────────────────────────

/**
 * Parse a JSON file containing an array of shot objects.
 * Validates structure and normalizes to ShotInput[].
 */
export function parseJson(buffer: Buffer): ShotInput[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(buffer.toString('utf-8'));
  } catch {
    throw new BadRequestException('Invalid JSON file');
  }

  if (!Array.isArray(parsed)) {
    throw new BadRequestException('JSON root must be an array of shot objects');
  }

  return (parsed as RawShotRow[]).map((row, index) => normalizeRow(row, index));
}

// ── PDF Parser ────────────────────────────────────────────────────────────────

/**
 * Parse a PDF file containing shot data.
 * Expected text format per line: "<shotNumber>,<score>[,<x>,<y>]"
 * e.g. "1,9.5,-1.2,0.8" or "1,9.5"
 */
export async function parsePdf(buffer: Buffer): Promise<ShotInput[]> {
  const data = await pdfParse(buffer);
  const lines = data.text.split('\n').filter((line) => line.trim().length > 0);

  const shots: ShotInput[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    // Skip header-like lines that are non-numeric
    if (!/^\d/.test(trimmed)) continue;

    const parts = trimmed.split(',').map((p) => p.trim());
    if (parts.length < 2) continue;

    const shotNumber = parseInt(parts[0], 10);
    const score = parseFloat(parts[1]);

    if (isNaN(shotNumber) || isNaN(score)) continue;

    shots.push({
      shotNumber,
      score,
      x: parts[2] !== undefined ? parseFloat(parts[2]) : 0,
      y: parts[3] !== undefined ? parseFloat(parts[3]) : 0,
    });
  }

  if (shots.length === 0) {
    throw new BadRequestException(
      'No valid shot data found in PDF. Expected lines: "shotNumber,score[,x,y]"',
    );
  }

  return shots;
}

// ── Dispatcher ────────────────────────────────────────────────────────────────

export async function parseFile(
  buffer: Buffer,
  mimetype: string,
  originalname: string,
): Promise<ShotInput[]> {
  const ext = originalname.split('.').pop()?.toLowerCase();

  if (
    mimetype === 'text/csv' ||
    mimetype === 'application/csv' ||
    ext === 'csv'
  ) {
    return parseCsv(buffer);
  }

  if (
    mimetype === 'application/json' ||
    mimetype === 'text/json' ||
    ext === 'json'
  ) {
    return parseJson(buffer);
  }

  if (
    mimetype === 'application/pdf' ||
    ext === 'pdf'
  ) {
    return parsePdf(buffer);
  }

  throw new BadRequestException(
    `Unsupported file type: ${mimetype}. Supported: PDF, CSV, JSON`,
  );
}

// ── Normalizer ────────────────────────────────────────────────────────────────

function normalizeRow(row: RawShotRow, index: number): ShotInput {
  const shotNumber =
    Number(row.shotNumber ?? row.shot_number ?? row.shot ?? index + 1);
  const score = Number(row.score);
  const x = row.x !== undefined && row.x !== '' ? Number(row.x) : 0;
  const y = row.y !== undefined && row.y !== '' ? Number(row.y) : 0;

  if (isNaN(shotNumber) || isNaN(score)) {
    throw new BadRequestException(
      `Row ${index + 1} has invalid shotNumber or score`,
    );
  }

  if (score < 0 || score > 10.9) {
    throw new BadRequestException(
      `Row ${index + 1}: score ${score} out of valid range (0–10.9)`,
    );
  }

  return { shotNumber, score, x, y };
}
