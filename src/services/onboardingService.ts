import { randomUUID } from "crypto";
import { Product, ProductCategory } from "../models/product";
import { ProductVariant } from "../models/variant";
import { addExpiryBatch } from "./expiryService";
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
  const productId = randomUUID();
  const createdAt = new Date().toISOString();

  const product: Product = {
    productId,
    userId: input.userId,
    name: input.name,
    unit: "units",
    vendorId: input.vendorId,
    category: input.category,
    costPrice: 0,
    sellPrice: 0,
    currentStock: 0,
    autopayEnabled: false,
    autopayThreshold: 0,
    createdAt,
  };

  await putItem({
    PK: `USER#${input.userId}`,
    SK: `PRODUCT#${product.productId}`,
    ...product,
  });

  return product;
}

export async function listProducts(userId: string): Promise<Product[]> {
  const items = await queryByPrefix(`USER#${userId}`, "PRODUCT#");
  return items as Product[];
}

export async function addVendor(input: AddVendorInput): Promise<Vendor> {
  const vendor: Vendor = {
    vendorId: randomUUID(),
    userId: input.userId,
    name: input.name,
    leadTimeDays: input.leadTimeDays,
    contactEmail: input.contactEmail,
    contactPhone: input.contactPhone,
    bankAccountLast4: input.bankAccountLast4,
    paymentMethod: "razorpay",
  };

  await putItem({
    PK: `USER#${input.userId}`,
    SK: `VENDOR#${vendor.vendorId}`,
    ...vendor,
  });

  return vendor;
}

export async function listVendors(userId: string): Promise<Vendor[]> {
  const items = await queryByPrefix(`USER#${userId}`, "VENDOR#");
  return items as Vendor[];
}

export async function deleteProduct(
  userId: string,
  productId: string
): Promise<void> {
  const { deleteItem } = await import("./dbClient");

  await deleteItem(
    `USER#${userId}`,
    `PRODUCT#${productId}`
  );
}

export async function listVariants(
  userId: string,
  productId: string
): Promise<ProductVariant[]> {
  const items = await queryByPrefix(
    `USER#${userId}`,
    "VARIANT#"
  );

  return (items as ProductVariant[]).filter(
    (variant) => variant.productId === productId
  );
}

export interface AddVariantInput {
  userId: string;
  productId: string;
  name: string;
  unit: string;
  costPrice: number;
  sellPrice: number;
  currentStock: number;
  expiryDate: string;
}

export async function addVariant(
  input: AddVariantInput
): Promise<ProductVariant> {
  const variant: ProductVariant = {
    variantId: randomUUID(),
    productId: input.productId,
    name: input.name,
    unit: input.unit,
    costPrice: input.costPrice,
    sellPrice: input.sellPrice,
    currentStock: input.currentStock,
    createdAt: new Date().toISOString(),
  };

  await putItem({
    PK: `USER#${input.userId}`,
    SK: `VARIANT#${variant.variantId}`,
    ...variant,
  });

  await addExpiryBatch({
    userId: input.userId,
    productId: input.productId,
    variantId: variant.variantId,
    quantity: input.currentStock,
    expiryDate: input.expiryDate,
  });

  return variant;
}