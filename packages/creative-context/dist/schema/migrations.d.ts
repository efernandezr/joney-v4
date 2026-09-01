export interface CreativeContextMigration {
    version: number;
    name: string;
    sql: string | {
        postgres?: string;
        sqlite?: string;
    };
}
export declare const creativeContextMigrations: CreativeContextMigration[];
//# sourceMappingURL=migrations.d.ts.map