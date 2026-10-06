import { ShotInput } from '@shooting-platform/shared-types';
export declare function parseCsv(buffer: Buffer): Promise<ShotInput[]>;
export declare function parseJson(buffer: Buffer): ShotInput[];
export declare function parsePdf(buffer: Buffer): Promise<ShotInput[]>;
export declare function parseFile(buffer: Buffer, mimetype: string, originalname: string): Promise<ShotInput[]>;
