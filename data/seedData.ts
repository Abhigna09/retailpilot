import { Product } from "../src/models/product";
import { Vendor } from "../src/models/vendor";
import { Sale } from "../src/models/sale";
import { ExpiryBatch } from "../src/models/expiryBatch";

export const vendors: Vendor[] = [
  {
    vendorId: "v1",
    name: "FreshJuice Distributors",
    leadTimeDays: 4,
    paymentMethod: "razorpay",
    contactEmail: "orders@freshjuice.com",
  },
  {
    vendorId: "v2",
    name: "GrainWorld Cereals",
    leadTimeDays: 6,
    paymentMethod: "razorpay",
    contactEmail: "orders@grainworld.com",
  },
];

export const products: Product[] = [
  {
    productId: "p1",
    name: "Orange Juice 1L",
    vendorId: "v1",
    costPrice: 60,
    sellPrice: 90,
    currentStock: 100,
    createdAt: "2026-01-01",
  },
  {
    productId: "p2",
    name: "Bran Cereal 500g",
    vendorId: "v2",
    costPrice: 80,
    sellPrice: 120,
    currentStock: 60,
    createdAt: "2026-01-01",
  },
];

// generate last 30 days of sales — p1 selling fast (~15/day, increasing), p2 dead (0 sales)
function generateSales(): Sale[] {
  const sales: Sale[] = [];
  const today = new Date();

  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];

    // p1: increasing trend, ~12-18 units/day
    const p1Units = Math.floor(12 + (29 - i) * 0.2 + Math.random() * 4);
    sales.push({
      saleId: `s-p1-${i}`,
      productId: "p1",
      date: dateStr!,
      unitsSold: p1Units,
    });

    // p2: dead stock, no sales in last 30 days
  }

  return sales;
}

export const sales: Sale[] = generateSales();

export const expiryBatches: ExpiryBatch[] = [
  {
    batchId: "b1",
    productId: "p1",
    quantity: 20,
    expiryDate: (() => {
      const d = new Date();
      d.setDate(d.getDate() + 8);
      return d.toISOString().split("T")[0]!;
    })(),
  },
];