export declare class StaffController {
    checkInShooter(shooterId: string): Promise<{
        message: string;
        timestamp: Date;
    }>;
    issueDayPass(name: string): Promise<{
        passCode: string;
        validUntil: Date;
    }>;
}
