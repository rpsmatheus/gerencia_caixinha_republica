export interface IBudgetTemplate {
    id: string;
    republicId: string;
    description: string;
    category: string;
    amount: number;
    createdAt: Date;
}

export interface ICreateBudgetTemplateDTO {
    republicId: string;
    description: string;
    category: string;
    amount: number;
}
