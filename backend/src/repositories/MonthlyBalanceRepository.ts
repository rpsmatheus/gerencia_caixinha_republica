import { IMonthlyBalance, ICreateMonthlyBalanceDTO } from '../models/MonthlyBalance.js';
import { DatabaseConnection } from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

export class MonthlyBalanceRepository {
    private getCollection() {
        return DatabaseConnection.getInstance().getDatabase()
            .collection<IMonthlyBalance>('monthlyBalances');
    }

    async findByMonth(year: number, month: number): Promise<IMonthlyBalance[]> {
        return this.getCollection().find({ year, month } as any).toArray();
    }

    async findByResidentAndMonth(
        residentId: string, year: number, month: number
    ): Promise<IMonthlyBalance | null> {
        return this.getCollection().findOne({ residentId, year, month } as any);
    }

    async upsert(data: ICreateMonthlyBalanceDTO & Partial<IMonthlyBalance>): Promise<IMonthlyBalance> {
        const existing = await this.findByResidentAndMonth(
            data.residentId, data.year, data.month
        );
        if (existing) {
            await this.getCollection().updateOne(
                { id: existing.id } as any,
                { $set: { ...data, updatedAt: new Date() } }
            );
            return { ...existing, ...data };
        }
        const now = new Date();
        const doc: IMonthlyBalance = {
            id: uuidv4(),
            residentId: data.residentId,
            year: data.year,
            month: data.month,
            previousBalance: data.previousBalance ?? 0,
            monthlyShare: data.monthlyShare ?? 0,
            totalDue: data.totalDue ?? 0,
            amountPaid: data.amountPaid ?? 0,
            currentBalance: data.currentBalance ?? 0,
            isActive: data.isActive ?? true,
            exitDay: data.exitDay ?? null,
            proportionalFactor: data.proportionalFactor ?? 1,
            createdAt: now,
            updatedAt: now,
        };
        await this.getCollection().insertOne(doc as any);
        return doc;
    }
}