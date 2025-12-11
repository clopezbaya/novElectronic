export interface Brand {
    id: number;
    name: string;
}

export interface Category {
    id: number;
    name: string;
}

export interface Product {
    id: string;
    name: string;
    description?: string;
    originalPrice: number;
    resalePrice: number;
    imageUrl: string;
    sourceUrl: string;
    stock: number;
    brandId: number;
    brand: Brand;
    categories: Category[];
}

export interface ProductFormData {
    name: string;
    description: string;
    originalPrice: number;
    resalePrice: number;
    imageUrl: string;
    sourceUrl: string;
    stock: number;
    brandId: string | number;
    categoryIds: number[];
}
