const fs = require('fs');
const path = require('path');

const servicePath = path.join(__dirname, 'src', 'shooter-profile', 'shooter-profile.service.ts');
let serviceCode = fs.readFileSync(servicePath, 'utf8');

// Add missing imports
if (!serviceCode.includes('@nestjs/schedule')) {
    serviceCode = serviceCode.replace("import { Injectable", "import { Injectable, Logger }\nimport { Cron, CronExpression } from '@nestjs/schedule';\nimport { Injectable");
}

// Add Cron Job for Licenses
if (!serviceCode.includes('checkLicenseExpiries')) {
    const cronLogic = `
  private readonly logger = new Logger(ShooterProfileService.name);

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async checkLicenseExpiries() {
    this.logger.log('Running daily license expiry check...');
    // Real implementation would query prisma for licenses expiring in 60, 30, and 7 days
    // and send notifications to the shooter.
  }
  
  async getCompletenessScore(id: string) {
    const profile = await this.prisma.shooterProfile.findUnique({ where: { userId: id } });
    if (!profile) return 0;
    
    let score = 0;
    if (profile.bio) score += 20;
    if (profile.stance) score += 20;
    if (profile.dominantHand) score += 20;
    if (profile.eyeDominance) score += 20;
    if (profile.heightCm && profile.weightKg) score += 20;
    return score;
  }

  async getCompetitionEligibility(id: string) {
    const profile = await this.prisma.shooterProfile.findUnique({ where: { userId: id } });
    if (!profile) return { eligible: false, reasons: ['Profile not found'] };
    
    const reasons = [];
    if (!profile.dateOfBirth) reasons.push('Date of birth missing for age category check');
    if (profile.backgroundCheckStatus !== 'PASSED') reasons.push('Background check not passed');
    
    return {
      eligible: reasons.length === 0,
      reasons,
      autoAgeCategory: this.calculateAgeCategory(profile.dateOfBirth)
    };
  }

  calculateAgeCategory(dob: Date | null): string {
    if (!dob) return 'UNKNOWN';
    const age = new Date().getFullYear() - dob.getFullYear();
    if (age <= 14) return 'U14';
    if (age <= 17) return 'U17';
    if (age <= 21) return 'U21';
    if (age >= 50) return 'MASTER';
    return 'SENIOR';
  }
`;
    serviceCode = serviceCode.replace(/}\s*$/, `${cronLogic}\n}`);
    fs.writeFileSync(servicePath, serviceCode);
    console.log('Updated ShooterProfileService');
}

const controllerPath = path.join(__dirname, 'src', 'shooter-profile', 'shooter-profile.controller.ts');
let controllerCode = fs.readFileSync(controllerPath, 'utf8');

if (!controllerCode.includes('getCompletenessScore')) {
    const newEndpoints = `
  @Get(':id/completeness')
  async getCompletenessScore(@Param('id') id: string) {
    return this.shooterProfileService.getCompletenessScore(id);
  }

  @Get(':id/competition-eligibility')
  async getCompetitionEligibility(@Param('id') id: string) {
    return this.shooterProfileService.getCompetitionEligibility(id);
  }
`;
    controllerCode = controllerCode.replace(/}\s*$/, `${newEndpoints}\n}`);
    fs.writeFileSync(controllerPath, controllerCode);
    console.log('Updated ShooterProfileController');
}

// Update Ranges Controller
const rangesControllerPath = path.join(__dirname, 'src', 'ranges', 'ranges.controller.ts');
let rangesControllerCode = fs.readFileSync(rangesControllerPath, 'utf8');
if (!rangesControllerCode.includes('getLeaderboard')) {
    const leaderboardEndpoint = `
  @Get(':id/leaderboard')
  async getLeaderboard(@Param('id') id: string) {
    // In a real implementation, this would aggregate RangeRankings
    return [
      { rank: 1, alias: 'Sniper99', elo: 1850, discipline: '10m Air Rifle' },
      { rank: 2, alias: 'AlphaTarget', elo: 1810, discipline: '10m Air Rifle' },
    ];
  }
`;
    rangesControllerCode = rangesControllerCode.replace(/}\s*$/, `${leaderboardEndpoint}\n}`);
    fs.writeFileSync(rangesControllerPath, rangesControllerCode);
    console.log('Updated RangesController');
}
