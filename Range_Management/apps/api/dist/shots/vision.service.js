"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var VisionService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.VisionService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const genai_1 = require("@google/genai");
let VisionService = VisionService_1 = class VisionService {
    constructor(configService) {
        this.configService = configService;
        this.ai = null;
        this.logger = new common_1.Logger(VisionService_1.name);
        const envKey = this.configService.get('GEMINI_API_KEY');
        if (envKey) {
            this.ai = new genai_1.GoogleGenAI({ apiKey: envKey });
        }
    }
    async analyzeImage(fileBuffer, mimeType, targetType) {
        if (!this.ai) {
            throw new common_1.InternalServerErrorException('Vision analysis requires a GEMINI_API_KEY in the environment variables.');
        }
        const prompt = `Analyze this shooting target image (type: ${targetType}). 
Identify all bullet holes on the target. 
Return ONLY a valid JSON object matching this exact structure:
{
  "target_detected": true,
  "shots": [
    { "shotNumber": 1, "score": 10.5, "x": 0.5, "y": -0.2 }
  ]
}
x and y should be the offset from the center of the target in millimeters (e.g., -10 to +10 range usually).
Score should be a decimal value like 10.5, 9.2, etc. based on the rings.
Do not include any markdown formatting like \`\`\`json. Return just the raw JSON text.`;
        const startTime = Date.now();
        try {
            this.logger.log(`Sending image to Gemini Vision (targetType: ${targetType})...`);
            const response = await this.ai.models.generateContent({
                model: 'gemini-1.5-pro',
                contents: [
                    prompt,
                    { inlineData: { data: fileBuffer.toString('base64'), mimeType } }
                ],
            });
            const processingTimeMs = Date.now() - startTime;
            const raw = response.text ?? '';
            const json = raw.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
            const parsed = JSON.parse(json);
            return {
                targetDetected: parsed.target_detected ?? true,
                shots: Array.isArray(parsed.shots) ? parsed.shots : [],
                processingTimeMs
            };
        }
        catch (err) {
            this.logger.error(`Gemini Vision failed: ${err.message}`);
            throw new common_1.InternalServerErrorException(`AI Vision analysis failed: ${err.message}`);
        }
    }
};
exports.VisionService = VisionService;
exports.VisionService = VisionService = VisionService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], VisionService);
//# sourceMappingURL=vision.service.js.map