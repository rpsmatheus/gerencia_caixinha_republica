import { v4 as uuidv4 } from 'uuid';
import { IBudget, ICreateBudgetDTO, IUpdateBudgetDTO } from '../models/Budget.js';
import { DatabaseConnection } from '../config/database.js';

export class BudgetRepository {
    private getCollection() {
        return DatabaseConnection.getInstance().getDatabase().collection<IBudget>('budgets');
    }

    async findByMonth(republicId: string, year: number, month: number): Promise<IBudget[]> {
        return this.getCollection().find({ republicId, year, month } as any).sort({ createdAt: 1 }).toArray();
    }

    async findById(id: string, republicId: string): Promise<IBudget | null> {
        return this.getCollection().findOne({ id, republicId } as any);
    }

    async findByDescriptionForMonth(
        republicId: string, year: number, month: number, description: string
    ): Promise<IBudget | null> {
        const escaped = description.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return this.getCollection().findOne({
            republicId, year, month,
            description: { $regex: `^${escaped}$`, $options: 'i' },
        } as any);
    }

    async create(data: ICreateBudgetDTO): Promise<IBudget> {
        const now = new Date();
        const budget: IBudget = {
            id: uuidv4(),
            republicId: data.republicId,
            year: data.year,
            month: data.month,
            description: data.description,
            category: data.category,
            amount: data.amount,
            isApplied: false,
            createdAt: now,
            updatedAt: now,
        };
        await this.getCollection().insertOne(budget as any);
        return budget;
    }

    async update(id: string, republicId: string, data: IUpdateBudgetDTO): Promise<IBudget | null> {
        await this.getCollection().updateOne(
            { id, republicId } as any,
            { $set: { ...data, updatedAt: new Date() } }
        );
        return this.findById(id, republicId);
    }

    async delete(id: string, republicId: string): Promise<void> {
        await this.getCollection().deleteOne({ id, republicId } as any);
    }
}
