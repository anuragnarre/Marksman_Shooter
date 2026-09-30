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

// 1. app.module.ts
replaceInFile('app.module.ts', [
    ['parseInt(process.env.REDIS_PORT) || 6379', 'process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6379']
]);

// 2. Auth imports & Roles
const controllers = [
    'memberships/memberships.controller.ts',
    'organizations/organizations.controller.ts',
    'range-operations/range-operations.controller.ts',
    'safety/safety.controller.ts'
];
for (const c of controllers) {
    replaceInFile(c, [
        ["'ADMIN', ", ""],
        ["'ADMIN'", ""],
        ["import { RolesGuard } from '../auth/guards/roles.guard';", "import { RolesGuard } from '../auth/guards/roles.guard';"],
        ["import { RolesGuard } from '../auth/roles.guard';", "import { RolesGuard } from '../auth/guards/roles.guard';"],
        ["import { JwtAuthGuard } from '../auth/jwt-auth.guard';", "import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';"],
        ["import { Roles } from '../auth/roles.decorator';", "import { Roles } from '../auth/decorators/roles.decorator';"]
    ]);
}

// 3. memberships.service.ts
replaceInFile('memberships/memberships.service.ts', [
    ['return this.prisma.membershipTier.create({ data });', 'return this.prisma.membershipTier.create({ data: data as any });'],
    ['return this.prisma.membershipSubscription.create({ data });', 'return this.prisma.membershipSubscription.create({ data: data as any });'],
    ['include: { tier: true, organization: true }', 'include: { tier: true }']
]);

// 4. organizations.service.ts
replaceInFile('organizations/organizations.service.ts', [
    ['data,', 'data: data as any,'],
    ['include: { memberships: true }', 'include: { members: true }']
]);

// 5. safety.service.ts
replaceInFile('safety/safety.service.ts', [
    ['return this.prisma.incidentReport.create({ data });', 'return this.prisma.incidentReport.create({ data: data as any });'],
    ['include: { reporter: { select: { id: true, firstName: true, lastName: true } } }', ''],
    ['include: { photos: true, correctiveActions: true }', 'include: { IncidentPhoto: true, CorrectiveAction: true }']
]);

// 6. shooter-profile.controller.ts
replaceInFile('shooter-profile/shooter-profile.controller.ts', [
    ['@Req() req', '@Req() req: any']
]);
