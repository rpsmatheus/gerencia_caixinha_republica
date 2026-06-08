
import { ResidentRepository } from '../repositories/ResidentRepository.js';
import { ExpenseRepository } from '../repositories/ExpenseRepository.js';
import { PaymentRepository } from '../repositories/PaymentRepository.js';
import { MonthlyBalanceRepository } from '../repositories/MonthlyBalanceRepository.js';


// Instanciação global para o projeto usar
export const residentRepo = new ResidentRepository();
export const expenseRepo = new ExpenseRepository();
export const paymentRepo = new PaymentRepository();
export const monthlyBalanceRepo = new MonthlyBalanceRepository(); 