export interface ExpiryBatch {
  batchId: string;
  productId: string;
  quantity: number;
  expiryDate: string;   // e.g. "2026-09-01"
}