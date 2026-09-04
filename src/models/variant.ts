export interface ProductVariant {
  variantId: string;
  productId: string;
  name: string;
  unit: string;
  costPrice: number;
  sellPrice: number;
  currentStock: number;
  createdAt: string;
}