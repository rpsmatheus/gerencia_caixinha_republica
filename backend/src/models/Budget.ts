/**
 * Modelo de Budget (Orçamento / Limite de Gastos)
 * 
 * Define as interfaces e tipos para o controle de tetos de gastos da república.
 */

/**
 * Interface que representa um Orçamento no banco de dados
 */
export interface IBudget {
  /** Identificador único do orçamento (UUID) */
  id: string;
  
  /** ID da República à qual este orçamento pertence (Associação e isolamento de dados) */
  republicaId: string; 
  
  /** Descrição do teto de gasto (Ex: "Feira do Mês", "Conta de Luz") */
  description: string;
  
  /** Valor máximo/limite estipulado em reais */
  amount: number;      
  
  /** Nome ou identificador da categoria vinculada (Ex: "Utilidades", "Alimentação") */
  category: string;
  
  /** Mês de vigência do limite de gastos (Formato YYYY-MM) */
  month: string;       
  
  /** Indica se o orçamento já foi convertido/aplicado em uma despesa real */
  isApplied: boolean;
  
  /** Data de criação do registro */
  createdAt: Date;
  
  /** Data da última atualização */
  updatedAt: Date;
}

/**
 * DTO para criação de um novo Orçamento
 */
export interface ICreateBudgetDTO {
  republicaId: string;
  description: string;
  amount: number;
  category: string;
  month: string;
}

/**
 * DTO para atualização de limites ou descrições de um Orçamento existente
 */
export interface IUpdateBudgetDTO {
  description?: string;
  amount?: number;
  category?: string;
  month?: string;
  isApplied?: boolean;
}