import { randomUUID } from "crypto";
import { Sale } from "../models/sale";
import { putItem, queryByPrefix, getItem } from "./dbClient";

export interface RecordSaleInput {
  userId: string;
  productId: string;
  unitsSold: number;
  date?: string; // defaults to today
}

export async function recordSale(input: RecordSaleInput): Promise<Sale> {
  const date = input.date || new Date().toISOString().split("T")[0];
  const saleId = randomUUID();

  const sale: Sale = {
    saleId,
    productId: input.productId,
    date,
    unitsSold: input.unitsSold,
  };

  await putItem({
    PK: `USER#${input.userId}`,
    SK: `SALE#${input.productId}#${date}#${saleId}`,
    ...sale,
  });

  // decrease product's current stock to reflect the sale
  const product = await getItem(`USER#${input.userId}`, `PRODUCT#${input.productId}`);
  if (product) {
    const newStock = Math.max(0, (product.currentStock || 0) - input.unitsSold);
    await putItem({ ...product, currentStock: newStock });
  }

  return sale;
}

export async function listSales(userId: string, productId: string): Promise<Sale[]> {
  const items = await queryByPrefix(`USER#${userId}`, `SALE#${productId}#`);
  return items as Sale[];
}
export async function listAllSales(userId: string) {
  const items = await queryByPrefix(`USER#${userId}`, "SALE#");
  return items;
}