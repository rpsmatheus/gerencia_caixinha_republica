import { IExpense } from '../models/Expense.js';
import { DatabaseConnection } from '../config/database.js';

export class ExpenseRepository {
  private getCollection() {
    const db = DatabaseConnection.getInstance().getDatabase();
    return db.collection<IExpense>('expenses');
  }

  // 📌 LISTAR (paginado)
  async findAll(page = 1, limit = 10): Promise<{ data: IExpense[]; total: number }> {
    const collection = this.getCollection();

    const skip = (page - 1) * limit;

    const data = await collection
      .find()
      .sort({ createdAt: -1 }) // mais recentes primeiro
      .skip(skip)
      .limit(limit)
      .toArray();

    const total = await collection.countDocuments();

    return { data, total };
  }

  // 📌 BUSCAR POR ID
  async findById(id: string): Promise<IExpense | null> {
    const collection = this.getCollection();

    return await collection.findOne({ id } as any);
  }

  // 📌 CRIAR
  async save(expense: IExpense): Promise<IExpense> {
    const collection = this.getCollection();

    await collection.insertOne(expense as any);

    return expense;
  }

  // 📌 ATUALIZAR
  async update(id: string, data: Partial<IExpense>): Promise<IExpense | null> {
    const collection = this.getCollection();

    await collection.updateOne(
      { id } as any,
      {
        $set: {
          ...data,
          updatedAt: new Date(),
        },
      }
    );

    return await this.findById(id);
  }

  // 📌 DELETAR
  async delete(id: string): Promise<void> {
    const collection = this.getCollection();

    await collection.deleteOne({ id } as any);
  }
}