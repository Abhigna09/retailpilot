import { randomUUID } from "crypto";
import { Product, ProductCategory } from "../models/product";
import { Vendor } from "../models/vendor";
import { putItem, queryByPrefix } from "./dbClient";

export interface AddProductInput {
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
}

export interface AddVendorInput {
  userId: string;
  name: string;
  leadTimeDays: number;
  contactEmail: string;
  contactPhone: string;
  bankAccountLast4: string;
}

export async function addProduct(input: AddProductInput): Promise<Product> {
    const product: Product = {
    productId: randomUUID(),
    userId: input.userId,
    name: input.name,
    unit: input.unit,
    vendorId: input.vendorId,
    category: input.category,
    costPrice: input.costPrice,
    sellPrice: input.sellPrice,
    currentStock: input.currentStock,
    autopayEnabled: input.autopayEnabled,
    autopayThreshold: input.autopayThreshold,
    createdAt: new Date().toISOString(),
  };

  await putItem({
    PK: `USER#${input.userId}`,
    SK: `PRODUCT#${product.productId}`,
    ...product,
  });

  return product;
}

export async function addVendor(input: AddVendorInput): Promise<Vendor> {
  const vendor: Vendor = {
    vendorId: randomUUID(),
    userId: input.userId,
    name: input.name,
    leadTimeDays: input.leadTimeDays,
    paymentMethod: "razorpay",
    contactEmail: input.contactEmail,
    contactPhone: input.contactPhone,
    bankAccountLast4: input.bankAccountLast4,
  };

  await putItem({
    PK: `USER#${input.userId}`,
    SK: `VENDOR#${vendor.vendorId}`,
    ...vendor,
  });

  return vendor;
}

export async function listProducts(userId: string): Promise<Product[]> {
  const items = await queryByPrefix(`USER#${userId}`, "PRODUCT#");
  return items as Product[];
}

export async function listVendors(userId: string): Promise<Vendor[]> {
  const items = await queryByPrefix(`USER#${userId}`, "VENDOR#");
  return items as Vendor[];
}
export async function deleteProduct(userId: string, productId: string): Promise<void> {
  const { deleteItem } = await import("./dbClient");
  await deleteItem(`USER#${userId}`, `PRODUCT#${productId}`);
}