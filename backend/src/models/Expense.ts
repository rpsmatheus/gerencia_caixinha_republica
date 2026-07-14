import { ObjectId } from 'mongodb';

/**
 * Modelo de Expense (Despesa)
 * 
 * Define as interfaces e tipos para o modelo de Despesa.
 * As despesas podem ser regulares (da caixinha) ou extras (cobradas no próximo mês).
 * 
 */

/**
 * Categorias disponíveis para despesas
 */
export enum ExpenseCategory {
  HOUSING = "Moradia",
  FOOD = "Alimentação",
  TRANSPORT = "Transporte",
  UTILITIES = "Utilidades",
  CLEANING = "Limpeza",
  INTERNET = "Internet",
  PETS = "Pets",
  OTHER = "Outros",
}

/**
 * Interface que representa uma Despesa no banco de dados
 */
export interface IExpense {
  _id?: ObjectId;
  userId: string;
  republicId: string;
  
  /** Descrição da despesa */
  description: string;
  
  /** Categoria da despesa */
  category: string;
  
  /** Valor da despesa em reais */
  amount: number;
  
  /** Data da despesa */
  expenseDate: Date;
  
  /** Indica se é uma despesa extra (cobrada no próximo mês) */
  isExtra: boolean;
  
  /** URL do comprovante no Google Drive ou S3 (opcional) */
  proofUrl?: string;
  
  /** Notas adicionais sobre a despesa */
  notes?: string;
  
  /** Data de criação do registro */
  createdAt: Date;
  
  /** Data da última atualização */
  updatedAt: Date;
}

/**
 * DTO para criação de uma nova Despesa
 */
export interface ICreateExpenseDTO {
  /** Descrição da despesa */
  description: string;
  
  /** Categoria da despesa */
  category: string;
  
  /** Valor da despesa em reais */
  amount: number;
  
  /** Data da despesa */
  expenseDate: Date;
  
  /** Indica se é uma despesa extra */
  isExtra?: boolean;
  
  /** Notas adicionais */
  notes?: string;
}

/**
 * DTO para atualização de uma Despesa
 */
export interface IUpdateExpenseDTO {
  /** Nova descrição (opcional) */
  description?: string;
  
  /** Nova categoria (opcional) */
  category?: string;
  
  /** Novo valor (opcional) */
  amount?: number;
  
  /** Nova data (opcional) */
  expenseDate?: Date;
  
  /** Novo status de extra (opcional) */
  isExtra?: boolean;
  
  /** Novas notas (opcional) */
  notes?: string;
  
  /** Nova URL de comprovante (opcional) */
  proofUrl?: string;
}

/**
 * Interface para filtros de busca de Despesas
 */
export interface IExpenseFilter {
  /** Filtrar por categoria */
  category?: string;
  
  /** Filtrar por tipo (extra ou regular) */
  isExtra?: boolean;
  
  /** Filtrar por data inicial */
  startDate?: Date;
  
  /** Filtrar por data final */
  endDate?: Date;
  
  /** Valor mínimo */
  minAmount?: number;
  
  /** Valor máximo */
  maxAmount?: number;
  
  /** Buscar por descrição (busca parcial) */
  search?: string;
}

/**
 * Interface para resumo de despesas
 */
export interface IExpenseSummary {
  /** Total de despesas regulares */
  regularTotal: number;
  
  /** Total de despesas extras */
  extraTotal: number;
  
  /** Total geral */
  grandTotal: number;
  
  /** Quantidade de despesas */
  count: number;
  
  /** Despesas por categoria */
  byCategory: Record<string, number>;
}

/**
 * Interface para resposta paginada de Despesas
 */
export interface IExpensePaginatedResponse {
  /** Lista de despesas */
  data: IExpense[];
  
  /** Total de registros encontrados */
  total: number;
  
  /** Página atual */
  page: number;
  
  /** Quantidade de registros por página */
  limit: number;
  
  /** Total de páginas */
  totalPages: number;
  
  /** Resumo das despesas */
  summary?: IExpenseSummary;
}
