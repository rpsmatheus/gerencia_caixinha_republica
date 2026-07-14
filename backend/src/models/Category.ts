export interface ICategory {
    id: string;
    name: string;
    republicId: string;
    createdAt: Date;
}

export interface ICreateCategoryDTO {
    name: string;
    republicId: string;
}
