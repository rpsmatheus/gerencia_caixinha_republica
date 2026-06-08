import { IPayment } from '../models/Payment.js';
import { DatabaseConnection } from '../config/database.js';

export class PaymentRepository {
    private getCollection() {
        return DatabaseConnection.getInstance().getDatabase().collection<IPayment>('payments');
    }

    async findByMonth(month: string): Promise<IPayment[]> {
        return this.getCollection().find({ month } as any).toArray();
    }

    async findByResidentAndMonth(residentId: string, month: string): Promise<IPayment[]> {
        return this.getCollection().find({ residentId, month } as any).toArray();
    }

    async save(payment: IPayment): Promise<IPayment> {
        await this.getCollection().insertOne(payment as any);
        return payment;
    }

    async delete(id: string): Promise<void> {
        await this.getCollection().deleteOne({ id } as any);
    }

    async sumByResidentAndMonth(residentId: string, month: string): Promise<number> {
        const payments = await this.findByResidentAndMonth(residentId, month);
        return payments.reduce((sum, p) => sum + p.amount, 0);
    }
}