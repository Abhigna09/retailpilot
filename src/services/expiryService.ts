import { randomUUID } from "crypto";
import { ExpiryBatch } from "../models/expiryBatch";
import { putItem, queryByPrefix } from "./dbClient";

export interface AddExpiryBatchInput {
  userId: string;
  productId: string;
  variantId: string;
  quantity: number;
  expiryDate: string;
}
export async function addExpiryBatch(input: AddExpiryBatchInput): Promise<ExpiryBatch> {
  const batchId = randomUUID();

 const batch: ExpiryBatch = {
  batchId,
  productId: input.productId,
  variantId: input.variantId,
  quantity: input.quantity,
  expiryDate: input.expiryDate,
  createdAt: new Date().toISOString(),
};

  await putItem({
    PK: `USER#${input.userId}`,
    SK: `EXPIRY#${input.productId}#${input.expiryDate}#${batchId}`,
    ...batch,
  });

  return batch;
}

export async function listExpiryBatches(userId: string, productId: string): Promise<ExpiryBatch[]> {
  const items = await queryByPrefix(`USER#${userId}`, `EXPIRY#${productId}#`);
  return items as ExpiryBatch[];
}
export async function listAllExpiryBatches(userId: string) {
  const items = await queryByPrefix(`USER#${userId}`, "EXPIRY#");
  return items;
}