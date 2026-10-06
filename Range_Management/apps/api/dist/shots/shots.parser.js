"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseCsv = parseCsv;
exports.parseJson = parseJson;
exports.parsePdf = parsePdf;
exports.parseFile = parseFile;
const common_1 = require("@nestjs/common");
const Papa = require("papaparse");
const pdfParse = require("pdf-parse");
async function parseCsv(buffer) {
    const text = buffer.toString('utf-8');
    const result = Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
    });
    if (result.errors.length > 0) {
        throw new common_1.BadRequestException(`CSV parse error: ${result.errors[0].message}`);
    }
    return result.data.map((row, index) => normalizeRow(row, index));
}
function parseJson(buffer) {
    let parsed;
    try {
        parsed = JSON.parse(buffer.toString('utf-8'));
    }
    catch {
        throw new common_1.BadRequestException('Invalid JSON file');
    }
    if (!Array.isArray(parsed)) {
        throw new common_1.BadRequestException('JSON root must be an array of shot objects');
    }
    return parsed.map((row, index) => normalizeRow(row, index));
}
async function parsePdf(buffer) {
    const data = await pdfParse(buffer);
    const lines = data.text.split('\n').filter((line) => line.trim().length > 0);
    const shots = [];
    for (const line of lines) {
        const trimmed = line.trim();
        if (!/^\d/.test(trimmed))
            continue;
        const parts = trimmed.split(',').map((p) => p.trim());
        if (parts.length < 2)
            continue;
        const shotNumber = parseInt(parts[0], 10);
        const score = parseFloat(parts[1]);
        if (isNaN(shotNumber) || isNaN(score))
            continue;
        shots.push({
            shotNumber,
            score,
            x: parts[2] !== undefined ? parseFloat(parts[2]) : 0,
            y: parts[3] !== undefined ? parseFloat(parts[3]) : 0,
        });
    }
    if (shots.length === 0) {
        throw new common_1.BadRequestException('No valid shot data found in PDF. Expected lines: "shotNumber,score[,x,y]"');
    }
    return shots;
}
async function parseFile(buffer, mimetype, originalname) {
    const ext = originalname.split('.').pop()?.toLowerCase();
    if (mimetype === 'text/csv' ||
        mimetype === 'application/csv' ||
        ext === 'csv') {
        return parseCsv(buffer);
    }
    if (mimetype === 'application/json' ||
        mimetype === 'text/json' ||
        ext === 'json') {
        return parseJson(buffer);
    }
    if (mimetype === 'application/pdf' ||
        ext === 'pdf') {
        return parsePdf(buffer);
    }
    throw new common_1.BadRequestException(`Unsupported file type: ${mimetype}. Supported: PDF, CSV, JSON`);
}
function normalizeRow(row, index) {
    const shotNumber = Number(row.shotNumber ?? row.shot_number ?? row.shot ?? index + 1);
    const score = Number(row.score);
    const x = row.x !== undefined && row.x !== '' ? Number(row.x) : 0;
    const y = row.y !== undefined && row.y !== '' ? Number(row.y) : 0;
    if (isNaN(shotNumber) || isNaN(score)) {
        throw new common_1.BadRequestException(`Row ${index + 1} has invalid shotNumber or score`);
    }
    if (score < 0 || score > 10.9) {
        throw new common_1.BadRequestException(`Row ${index + 1}: score ${score} out of valid range (0–10.9)`);
    }
    return { shotNumber, score, x, y };
}
//# sourceMappingURL=shots.parser.js.map