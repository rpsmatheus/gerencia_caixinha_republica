import { Router } from 'express';
import { asyncHandler } from '../../shared/middlewares/asyncHandler.js';
import { PaymentFactory } from '../../factories/PaymentFactory.js';
import { paymentRepo } from '../../app/appContext.js';

export const paymentRoutes: Router = Router();

// GET /api/payments?month=YYYY-MM
paymentRoutes.get('/', asyncHandler(async (req, res) => {
    const { month, residentId } = req.query as Record<string, string>;
    if (!month) return res.status(400).json({ error: 'month obrigatório (?month=YYYY-MM)' });
    const data = residentId
        ? await paymentRepo.findByResidentAndMonth(residentId, month)
        : await paymentRepo.findByMonth(month);
    res.json({ success: true, data });
}));

// POST /api/payments
paymentRoutes.post('/', asyncHandler(async (req, res) => {
    const payment = PaymentFactory.create(req.body);
    const saved = await paymentRepo.save(payment);
    res.status(201).json({ success: true, data: saved });
}));

// DELETE /api/payments/:id
paymentRoutes.delete('/:id', asyncHandler(async (req, res) => {
    await paymentRepo.delete(req.params.id);
    res.json({ success: true, message: 'Pagamento removido' });
}));