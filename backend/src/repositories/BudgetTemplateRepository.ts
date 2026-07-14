import { v4 as uuidv4 } from 'uuid';
import { IBudgetTemplate } from '../models/BudgetTemplate.js';
import { DatabaseConnection } from '../config/database.js';
import { ExpenseCategory } from '../models/Expense.js';

const DEFAULT_TEMPLATES: Array<{ description: string; category: string; amount: number }> = [
    { description: 'Água', category: ExpenseCategory.UTILITIES, amount: 80 },
    { description: 'Luz', category: ExpenseCategory.UTILITIES, amount: 150 },
    { description: 'Internet', category: ExpenseCategory.INTERNET, amount: 100 },
    { description: 'Compras', category: ExpenseCategory.FOOD, amount: 400 },
    { description: 'Ração do gato', category: ExpenseCategory.PETS, amount: 60 },
];

export class BudgetTemplateRepository {
    private getCollection() {
        return DatabaseConnection.getInstance().getDatabase().collection<IBudgetTemplate>('budgetTemplates');
    }

    async findAllByRepublic(republicId: string): Promise<IBudgetTemplate[]> {
        const collection = this.getCollection();
        const existing = await collection.find({ republicId } as any).sort({ createdAt: 1 }).toArray();
        if (existing.length > 0) return existing;

        // Primeira vez que esta república pede modelos: semeia um ponto de partida padrão.
        const now = new Date();
        const defaults: IBudgetTemplate[] = DEFAULT_TEMPLATES.map((t) => ({
            id: uuidv4(),
            republicId,
            description: t.description,
            category: t.category,
            amount: t.amount,
            createdAt: now,
        }));
        await collection.insertMany(defaults as any);
        return defaults;
    }

    async create(data: { republicId: string; description: string; category: string; amount: number }): Promise<IBudgetTemplate> {
        const template: IBudgetTemplate = {
            id: uuidv4(),
            republicId: data.republicId,
            description: data.description,
            category: data.category,
            amount: data.amount,
            createdAt: new Date(),
        };
        await this.getCollection().insertOne(template as any);
        return template;
    }

    async delete(id: string, republicId: string): Promise<void> {
        await this.getCollection().deleteOne({ id, republicId } as any);
    }
}
