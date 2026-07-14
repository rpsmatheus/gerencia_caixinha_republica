export interface IRepository<T> {
  findAll(filter: any, page: number, limit: number): Promise<{ data: T[]; total: number }>;
  findById(id: string): Promise<T | null>;
  save(entity: T): Promise<T>;
  update(id: string, entity: Partial<T>): Promise<T>;
}