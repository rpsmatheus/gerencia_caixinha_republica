import { ObjectId } from "mongodb";
import { IRepository } from './IRepository.js';
import { IResident } from '../models/Resident.js';
import { DatabaseConnection } from '../config/database.js'; 
export class ResidentRepository implements IRepository<IResident> {
  private getCollection() {
    const db = DatabaseConnection.getInstance().getDatabase();
    return db.collection<IResident>('residents');
  }

  async findAll(
    filter: any,
    page: number,
    limit: number
  ): Promise<{ data: IResident[]; total: number }> {

    const collection = this.getCollection();
    const skip = (page - 1) * limit;

    const query = {
      isActive: true,
      ...filter
    };

    const data = await collection
      .find(query)
      .skip(skip)
      .limit(limit)
      .toArray();

    const total = await collection.countDocuments(query);

    return { data, total };
  }

  async findById(id: string): Promise<IResident | null> {
    const collection = this.getCollection();

    return await collection.findOne({
      _id: new ObjectId(id),
      isActive: true
    } as any);
  }

  async save(entity: IResident): Promise<IResident> {
    const collection = this.getCollection();
    await collection.insertOne(entity as any);
    return entity;
  }

  async update(id: string, entity: Partial<IResident>): Promise<IResident> {
    const collection = this.getCollection();

    await collection.updateOne(
      { _id: new ObjectId(id) } as any,
      { $set: { ...entity, updatedAt: new Date() } }
    );

    const updated = await this.findById(id);
    if (!updated) throw new Error("Erro ao atualizar morador");

    return updated;
  }

  async delete(id: string): Promise<void> {
    const collection = this.getCollection();

    await collection.updateOne(
      { _id: new ObjectId(id) } as any,
      { $set: { isActive: false, updatedAt: new Date() } }
    );
  }
}