const fs = require('fs');
const path = require('path');

const baseDir = __dirname;
const srcDir = path.join(baseDir, 'src');

function replaceInFile(filePath, replacements) {
    let fullPath = path.join(srcDir, filePath);
    if (!fs.existsSync(fullPath)) return;
    let content = fs.readFileSync(fullPath, 'utf8');
    let original = content;
    for (const [target, replacement] of replacements) {
        content = content.split(target).join(replacement);
    }
    if (content !== original) {
        fs.writeFileSync(fullPath, content);
        console.log(`Updated ${filePath}`);
    }
}

// Fix safety.service.ts trailing comma
replaceInFile('safety/safety.service.ts', [
    ['orderBy: { createdAt: \'desc\' },\n      ,', 'orderBy: { createdAt: \'desc\' }']
]);

// Fix roles.guard.ts decorator import
replaceInFile('auth/guards/roles.guard.ts', [
    ["'./decorators/roles.decorator'", "'../decorators/roles.decorator'"]
]);

// Fix auth.module.ts roles.guard import
replaceInFile('auth/auth.module.ts', [
    ["'./roles.guard'", "'./guards/roles.guard'"]
]);

// Fix all other controllers that still import '../auth/roles.guard'
const otherControllers = [
    'ai-coach/ai-coach.controller.ts',
    'analytics/analytics.controller.ts',
    'biometrics/biometrics.controller.ts',
    'calendar/calendar.controller.ts',
    'coach/coach.controller.ts',
    'performance/performance.controller.ts',
    'ranges/ranges.controller.ts',
    'schedule-requests/schedule-requests.controller.ts',
    'sessions/sessions.controller.ts',
    'shots/shots.controller.ts',
    'suggestions/suggestions.controller.ts'
];
for (const c of otherControllers) {
    replaceInFile(c, [
        ["'../auth/roles.guard'", "'../auth/guards/roles.guard'"]
    ]);
}
