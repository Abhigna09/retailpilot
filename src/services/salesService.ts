import { randomUUID } from "crypto";
import { Sale } from "../models/sale";
import { putItem, queryByPrefix, getItem } from "./dbClient";

export interface RecordSaleInput {
  userId: string;
  productId: string;
  variantId: string;
  unitsSold: number;
  date?: string;
}

export async function recordSale(
  input: RecordSaleInput
): Promise<Sale> {
  const date =
    input.date ||
    new Date().toISOString().split("T")[0];

  const saleId = randomUUID();

  // Get the selected variant so we can lock in
  // the selling price at the time of sale.
  const variant = await getItem(
    `USER#${input.userId}`,
    `VARIANT#${input.variantId}`
  );

  if (!variant) {
    throw new Error("Variant not found");
  }

  const unitPrice = Number(variant.sellPrice);

  if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
    throw new Error("Invalid selling price for variant");
  }

  const sale: Sale = {
    saleId,
    productId: input.productId,
    variantId: input.variantId,
    date,
    unitsSold: input.unitsSold,
    unitPrice,
  };

  await putItem({
    PK: `USER#${input.userId}`,
    SK: `SALE#${input.productId}#${date}#${saleId}`,
    ...sale,
  });

  // Decrease the parent product's stock.
  const product = await getItem(
    `USER#${input.userId}`,
    `PRODUCT#${input.productId}`
  );

  if (product) {
    const newStock = Math.max(
      0,
      (product.currentStock || 0) -
        input.unitsSold
    );

    await putItem({
      ...product,
      currentStock: newStock,
    });
  }

  return sale;
}

export async function listSales(
  userId: string,
  productId: string
): Promise<Sale[]> {
  const items = await queryByPrefix(
    `USER#${userId}`,
    `SALE#${productId}#`
  );

  return items as Sale[];
}

export async function listAllSales(userId: string) {
  const items = await queryByPrefix(
    `USER#${userId}`,
    "SALE#"
  );

  return items;
}