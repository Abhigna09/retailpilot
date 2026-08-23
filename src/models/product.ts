export interface Product {
  productId: string;
  name: string;
  vendorId: string;
  costPrice: number;      // price we buy at
  sellPrice: number;      // price we sell at
  currentStock: number;
  createdAt: string;
}