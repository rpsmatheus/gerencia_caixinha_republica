
import { ResidentRepository } from '../repositories/ResidentRepository.js';
import { ExpenseRepository } from '../repositories/ExpenseRepository.js';
import { PaymentRepository } from '../repositories/PaymentRepository.js';
import { MonthlyBalanceRepository } from '../repositories/MonthlyBalanceRepository.js';
import { CategoryRepository } from '../repositories/CategoryRepository.js';
import { BudgetRepository } from '../repositories/BudgetRepository.js';
import { BudgetTemplateRepository } from '../repositories/BudgetTemplateRepository.js';


// Instanciação global para o projeto usar
export const residentRepo = new ResidentRepository();
export const expenseRepo = new ExpenseRepository();
export const paymentRepo = new PaymentRepository();
export const monthlyBalanceRepo = new MonthlyBalanceRepository();
export const categoryRepo = new CategoryRepository();
export const budgetRepo = new BudgetRepository();
export const budgetTemplateRepo = new BudgetTemplateRepository();