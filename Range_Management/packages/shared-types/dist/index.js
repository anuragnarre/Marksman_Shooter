"use strict";
// packages/shared-types/index.ts
// Shared TypeScript interfaces mirroring every Prisma model.
// Consumed by both /apps/web and /apps/api.
Object.defineProperty(exports, "__esModule", { value: true });
exports.EVENT_TYPE_META = exports.TRAINING_MODE_COLORS = exports.TRAINING_MODES = exports.ARMY_WEAPONS = void 0;
// ── Army / Soldier constants ──────────────────────────────────────────────────
exports.ARMY_WEAPONS = [
    'AK-203',
    'Sig Sauer SIG716',
    'Tavor X95',
    'Dragunov (SVD)',
    'Glock 17',
    'Glock 19',
    'Pistol Auto 9mm 1A',
    'ASMI',
    'Beretta Px4 Storm',
    'INSAS',
    'AK-47',
    'Custom Gun',
];
exports.TRAINING_MODES = [
    'Marksmanship',
    'Rapid Fire',
    'Field Exercise',
    'Combat Simulation',
    'Qualification',
];
exports.TRAINING_MODE_COLORS = {
    Marksmanship: '#4FC3F7',
    'Rapid Fire': '#FF4D6D',
    'Field Exercise': '#00E5A0',
    'Combat Simulation': '#F5A623',
    Qualification: '#8892A4',
};
exports.EVENT_TYPE_META = {
    SESSION: { label: 'Session', color: '#F5A623', bg: 'rgba(245,166,35,0.15)' },
    TASK: { label: 'Task', color: '#4FC3F7', bg: 'rgba(79,195,247,0.15)' },
    PLAN: { label: 'Plan', color: '#00E5A0', bg: 'rgba(0,229,160,0.15)' },
    REMINDER: { label: 'Reminder', color: '#8892A4', bg: 'rgba(136,146,164,0.15)' },
    COMPETITION: { label: 'Competition', color: '#FF4D6D', bg: 'rgba(255,77,109,0.15)' },
};
