import { v4 as uuidv4 } from 'uuid';
import { ICategory } from '../models/Category.js';
import { DatabaseConnection } from '../config/database.js';
import { ExpenseCategory } from '../models/Expense.js';

const DEFAULT_CATEGORY_NAMES = Object.values(ExpenseCategory);

export class CategoryRepository {
    private getCollection() {
        return DatabaseConnection.getInstance().getDatabase().collection<ICategory>('categories');
    }

    async findAllByRepublic(republicId: string): Promise<ICategory[]> {
        const collection = this.getCollection();
        const existing = await collection.find({ republicId } as any).sort({ createdAt: 1 }).toArray();
        if (existing.length > 0) return existing;

        // Primeira vez que esta república pede categorias: semeia as categorias padrão.
        const now = new Date();
        const defaults: ICategory[] = DEFAULT_CATEGORY_NAMES.map((name) => ({
            id: uuidv4(),
            name,
            republicId,
            createdAt: now,
        }));
        await collection.insertMany(defaults as any);
        return defaults;
    }

    async create(name: string, republicId: string): Promise<ICategory> {
        const category: ICategory = {
            id: uuidv4(),
            name,
            republicId,
            createdAt: new Date(),
        };
        await this.getCollection().insertOne(category as any);
        return category;
    }

    async findByNameAndRepublic(name: string, republicId: string): Promise<ICategory | null> {
        const escaped = name.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return this.getCollection().findOne({
            republicId,
            name: { $regex: `^${escaped}$`, $options: 'i' },
        } as any);
    }

    async delete(id: string, republicId: string): Promise<void> {
        await this.getCollection().deleteOne({ id, republicId } as any);
    }
}
