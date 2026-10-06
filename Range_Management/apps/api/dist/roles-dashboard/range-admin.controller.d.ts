export declare class RangeAdminController {
    getDashboard(): Promise<{
        totalRanges: number;
        totalUsers: number;
        activeIncidents: number;
        financialSummary: {
            revenue: number;
            currency: string;
        };
    }>;
}
