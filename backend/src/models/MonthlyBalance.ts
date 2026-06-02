/**
 * Modelo de MonthlyBalance (Saldo Mensal)
 * 
 * Define as interfaces e tipos para o modelo de Saldo Mensal.
 * Rastreia quanto cada morador deve pagar em cada mês.
 * 
 * @author Manus AI
 * @version 1.0.0
 */

/**
 * Interface que representa o Saldo Mensal de um Morador
 */
export interface IMonthlyBalance {
  /** Identificador único do saldo (UUID) */
  id: string;
  
  /** ID do morador */
  residentId: string;
  
  /** Ano do saldo */
  year: number;
  
  /** Mês do saldo (1-12) */
  month: number;
  
  /** Saldo anterior (do mês passado) */
  previousBalance: number;
  
  /** Valor da caixinha mensal (divisão de despesas) */
  monthlyShare: number;
  
  /** Valor total a pagar (saldo anterior + caixinha) */
  totalDue: number;
  
  /** Valor já pago */
  amountPaid: number;
  
  /** Saldo atual (total devido - pago) */
  currentBalance: number;
  
  /** URL do comprovante de pagamento */
  paymentProofUrl?: string;
  
  /** Data do pagamento */
  paymentDate?: Date;
  
  /** Notas sobre o pagamento */
  notes?: string;
  
  /** Data de criação */
  createdAt: Date;
  
  /** Data da última atualização */
  updatedAt: Date;
}

/**
 * DTO para criação/atualização de MonthlyBalance
 */
export interface ICreateMonthlyBalanceDTO {
  /** ID do morador */
  residentId: string;
  
  /** Ano */
  year: number;
  
  /** Mês (1-12) */
  month: number;
  
  /** Saldo anterior (opcional, padrão 0) */
  previousBalance?: number;
}

/**
 * DTO para atualização de pagamento
 */
export interface IUpdatePaymentDTO {
  /** Novo valor pago */
  amountPaid: number;
  
  /** URL do comprovante (opcional) */
  paymentProofUrl?: string;
  
  /** Data do pagamento (opcional) */
  paymentDate?: Date;
  
  /** Notas sobre o pagamento */
  notes?: string;
}

/**
 * Interface para filtros de busca de MonthlyBalance
 */
export interface IMonthlyBalanceFilter {
  /** Filtrar por ID do morador */
  residentId?: string;
  
  /** Filtrar por ano */
  year?: number;
  
  /** Filtrar por mês */
  month?: number;
  
  /** Filtrar por status de pagamento (pago/pendente) */
  isPaid?: boolean;
}

/**
 * Interface para resumo de saldos mensais
 */
export interface IMonthlyBalanceSummary {
  /** Total devido por todos os moradores */
  totalDue: number;
  
  /** Total pago */
  totalPaid: number;
  
  /** Total pendente */
  totalPending: number;
  
  /** Quantidade de moradores */
  residentCount: number;
  
  /** Quantidade de moradores que pagaram */
  paidCount: number;
  
  /** Quantidade de moradores com pendência */
  pendingCount: number;
}

/**
 * Interface para resposta paginada de MonthlyBalance
 */
export interface IMonthlyBalancePaginatedResponse {
  /** Lista de saldos mensais */
  data: IMonthlyBalance[];
  
  /** Total de registros */
  total: number;
  
  /** Página atual */
  page: number;
  
  /** Registros por página */
  limit: number;
  
  /** Total de páginas */
  totalPages: number;
  
  /** Resumo dos saldos */
  summary?: IMonthlyBalanceSummary;
}

/**
 * Interface para relatório mensal detalhado
 */
export interface IMonthlyReport {
  /** Ano do relatório */
  year: number;
  
  /** Mês do relatório */
  month: number;
  
  /** Total de despesas do mês */
  totalExpenses: number;
  
  /** Quantidade de despesas */
  expenseCount: number;
  
  /** Despesas extras do mês anterior */
  previousExtras: number;
  
  /** Saldos de cada morador */
  balances: IMonthlyBalance[];
  
  /** Resumo geral */
  summary: IMonthlyBalanceSummary;
  
  /** Data do relatório */
  generatedAt: Date;
}
