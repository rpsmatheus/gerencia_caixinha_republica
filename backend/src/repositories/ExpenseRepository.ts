import { IExpense } from '../models/Expense.js';
import { IExpenseFilter } from '../models/Expense.js';
import { DatabaseConnection } from '../config/database.js';

export class ExpenseRepository {
  private getCollection() {
    const db = DatabaseConnection.getInstance().getDatabase();
    return db.collection<IExpense>('expenses');
  }

  // 📌 LISTAR COM FILTROS + PAGINAÇÃO
  async findAll(
    page = 1,
    limit = 10,
    filters: IExpenseFilter = {}
  ): Promise<{ data: IExpense[]; total: number }> {
    const collection = this.getCollection();

    const skip = (page - 1) * limit;

    // 🧠 QUERY DINÂMICA (FILTROS)
    const query: any = {};

    if (filters.category) {
      query.category = filters.category;
    }

    if (filters.isExtra !== undefined) {
      query.isExtra = filters.isExtra;
    }

    if (filters.search) {
      query.description = {
        $regex: filters.search,
        $options: 'i',
      };
    }

    if (filters.minAmount || filters.maxAmount) {
      query.amount = {};
      if (filters.minAmount !== undefined) {
        query.amount.$gte = filters.minAmount;
      }
      if (filters.maxAmount !== undefined) {
        query.amount.$lte = filters.maxAmount;
      }
    }

    if (filters.startDate || filters.endDate) {
      query.expenseDate = {};

      if (filters.startDate) {
        query.expenseDate.$gte = new Date(filters.startDate);
      }

      if (filters.endDate) {
        query.expenseDate.$lte = new Date(filters.endDate);
      }
    }

    const data = await collection
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const total = await collection.countDocuments(query);

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