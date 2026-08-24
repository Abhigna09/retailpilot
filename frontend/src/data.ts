export const products = [
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

export const vendors = [
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

// same fake sales pattern as backend seed data
function generateSales(productId: string, base: number, trend: number) {
  const sales = [];
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];
    const units = productId === "p1"
      ? Math.floor(base + (29 - i) * trend + Math.random() * 4)
      : 0;
    sales.push({ saleId: `s-${productId}-${i}`, productId, date: dateStr, unitsSold: units });
  }
  return sales;
}

export const sales = [
  ...generateSales("p1", 12, 0.2),
  ...generateSales("p2", 0, 0),
];

export const expiryBatches = [
  {
    batchId: "b1",
    productId: "p1",
    quantity: 20,
    expiryDate: (() => {
      const d = new Date();
      d.setDate(d.getDate() + 8);
      return d.toISOString().split("T")[0];
    })(),
  },
];

export const API_BASE = "https://4nyjyl4oa9.execute-api.ap-south-1.amazonaws.com/prod";