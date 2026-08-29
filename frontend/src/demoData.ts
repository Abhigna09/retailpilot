// Deterministic seeded generator — same productId always produces the
// same sales pattern, so dashboard badges and detail screen always agree.

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function hashId(id: string): number {
  let sum = 0;
  for (let i = 0; i < id.length; i++) sum += id.charCodeAt(i);
  return sum;
}

export function generateDemoSales(productId: string) {
  const seed = hashId(productId);
  const rand = seededRandom(seed);
  const pattern = seed % 3; // 0 = fast-moving, 1 = moderate, 2 = dead stock

  const sales = [];
  const today = new Date();

  for (let i = 13; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];

    let units = 0;
    if (pattern === 0) units = Math.floor(6 + rand() * 3);
    else if (pattern === 1) units = Math.floor(2 + rand() * 2);
    else units = i > 3 ? 0 : Math.floor(rand());

    sales.push({ saleId: `s-${productId}-${i}`, productId, date: dateStr, unitsSold: units });
  }
  return sales;
}

export function generateDemoExpiry(productId: string, currentStock: number) {
  const seed = hashId(productId);
  const pattern = seed % 3;
  if (pattern !== 0) return [];

  const d = new Date();
  d.setDate(d.getDate() + 6);

  return [{
    batchId: `b-${productId}`,
    productId,
    quantity: Math.floor(currentStock * 0.3),
    expiryDate: d.toISOString().split("T")[0],
  }];
}