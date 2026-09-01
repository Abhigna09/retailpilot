export type ProductCategory = "perishable" | "dairy" | "dry-goods" | "other";

export interface Product {
  productId: string;
  userId: string;
  name: string;
  unit: string;
  vendorId: string;
  category: ProductCategory;
  costPrice: number;
  sellPrice: number;
  currentStock: number;
  autopayEnabled: boolean;
  autopayThreshold: number;
  createdAt: string;
}