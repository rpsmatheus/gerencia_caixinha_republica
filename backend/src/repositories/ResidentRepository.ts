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

    if (filter.search) {
      const searchRegex = {
        $regex: filter.search,
        $options: 'i',
      };
      delete (query as any).search;
      (query as any).$or = [
        { fullName: searchRegex },
        { nickname: searchRegex },
      ];
    }

    const data = await collection
      .find(query, { projection: { passwordHash: 0 } })
      .skip(skip)
      .limit(limit)
      .toArray();

    const total = await collection.countDocuments(query);

    return { data, total };
  }

  async findById(id: string): Promise<IResident | null> {
    const collection = this.getCollection();

    return await collection.findOne(
      { _id: new ObjectId(id), isActive: true } as any,
      { projection: { passwordHash: 0 } }
    );
  }

  /** Busca por nickname incluindo o passwordHash — uso exclusivo do login */
  async findByNicknameWithPassword(nickname: string): Promise<IResident | null> {
    const collection = this.getCollection();

    return await collection.findOne({
      nickname: nickname.toLowerCase(),
      isActive: true,
    } as any);
  }

  async save(entity: IResident): Promise<IResident> {
    const collection = this.getCollection();
    await collection.insertOne(entity as any);
    const { passwordHash, ...safeEntity } = entity as any;
    return safeEntity as IResident;
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
}