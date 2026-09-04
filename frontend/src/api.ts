const API_BASE = "https://4nyjyl4oa9.execute-api.ap-south-1.amazonaws.com/prod";

export async function signup(email: string, password: string, storeName: string) {
  const res = await fetch(`${API_BASE}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, storeName }),
  });
  return res.json();
}

export async function login(email: string, password: string) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return res.json();
}

export async function addProduct(input: any) {
  const res = await fetch(`${API_BASE}/products`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return res.json();
}

export async function addVendor(input: any) {
  const res = await fetch(`${API_BASE}/vendors`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return res.json();
}

export async function listProducts(userId: string) {
  const res = await fetch(`${API_BASE}/products?userId=${userId}`);
  return res.json();
}
export async function listVariants(userId: string, productId: string) {
  const res = await fetch(
    `${API_BASE}/variants?userId=${userId}&productId=${productId}`
  );
  return res.json();
}
export async function addVariant(input: {
  userId: string;
  productId: string;
  name: string;
  unit: string;
  costPrice: number;
  sellPrice?: number;
  currentStock: number;
  expiryDate: string;
}) {
  const res = await fetch(`${API_BASE}/variants`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  return res.json();
}
export async function listVendors(userId: string) {
  const res = await fetch(`${API_BASE}/vendors?userId=${userId}`);
  return res.json();
}

export async function reviewProduct(
  userId: string,
  productId: string,
  sales: any[],
  expiryBatches: any[],
  retries = 2
): Promise<any> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(
        `${API_BASE}/review?userId=${userId}&productId=${productId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sales,
            expiryBatches,
          }),
        }
      );

      if (!res.ok) {
        const errorBody = await res.text();

        throw new Error(
          `Status ${res.status}: ${errorBody}`
        );
      }

      return res.json();
    } catch (err) {
      if (attempt === retries) {
        throw err;
      }

      await new Promise((resolve) =>
        setTimeout(resolve, 800)
      );
    }
  }
}

export async function executePayment(input: any) {
  const res = await fetch(`${API_BASE}/pay`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return res.json();
}
export async function recordSale(
  userId: string,
  productId: string,
  variantId: string,
  unitsSold: number
) {
  const res = await fetch(`${API_BASE}/sales`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId,
      productId,
      variantId,
      unitsSold,
    }),
  });

  return res.json();
}
export async function addExpiryBatch(userId: string, productId: string, quantity: number, expiryDate: string) {
  const res = await fetch(`${API_BASE}/expiry`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, productId, quantity, expiryDate }),
  });
  return res.json();
}
export async function checkStatus(userId: string, productId: string) {
  const res = await fetch(`${API_BASE}/status?userId=${userId}&productId=${productId}`);
  return res.json();
}
export async function listActions(userId: string) {
  const res = await fetch(`${API_BASE}/actions?userId=${userId}`);
  return res.json();
}
export async function listAllExpiry(userId: string) {
  const res = await fetch(`${API_BASE}/expiry/all?userId=${userId}`);
  return res.json();
}

export async function listAllSalesForUser(userId: string) {
  const res = await fetch(`${API_BASE}/sales/all?userId=${userId}`);
  return res.json();
}

export async function previewChecks(product: any, vendor: any, request: any, recentOrders: any[], poAmount: number) {
  const res = await fetch(`${API_BASE}/preview-checks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ product, vendor, request, recentOrders, poAmount }),
  });
  return res.json();
}
export async function deleteProduct(userId: string, productId: string) {
  const res = await fetch(`${API_BASE}/products/${productId}?userId=${userId}`, {
    method: "DELETE",
  });
  return res.json();
}