import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';
import { VisionShotResult } from '@shooting-platform/shared-types';

@Injectable()
export class VisionService {
  private readonly ai: GoogleGenAI | null = null;
  private readonly logger = new Logger(VisionService.name);

  constructor(private readonly configService: ConfigService) {
    const envKey = this.configService.get<string>('GEMINI_API_KEY');
    if (envKey) {
      this.ai = new GoogleGenAI({ apiKey: envKey });
    }
  }

  async analyzeImage(
    fileBuffer: Buffer,
    mimeType: string,
    targetType: string
  ): Promise<{ shots: VisionShotResult[]; targetDetected: boolean; processingTimeMs: number }> {
    if (!this.ai) {
      throw new InternalServerErrorException('Vision analysis requires a GEMINI_API_KEY in the environment variables.');
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
      
      // Clean up markdown fences if Gemini added them anyway
      const json = raw.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
      const parsed = JSON.parse(json);
      
      return {
        targetDetected: parsed.target_detected ?? true,
        shots: Array.isArray(parsed.shots) ? parsed.shots : [],
        processingTimeMs
      };
    } catch (err) {
      this.logger.error(`Gemini Vision failed: ${(err as Error).message}`);
      throw new InternalServerErrorException(`AI Vision analysis failed: ${(err as Error).message}`);
    }
  }
}
