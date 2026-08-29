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

export async function listVendors(userId: string) {
  const res = await fetch(`${API_BASE}/vendors?userId=${userId}`);
  return res.json();
}

export async function reviewProduct(userId: string, productId: string, sales: any[], expiryBatches: any[]) {
  const res = await fetch(`${API_BASE}/review?userId=${userId}&productId=${productId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sales, expiryBatches }),
  });
  return res.json();
}

export async function executePayment(input: any) {
  const res = await fetch(`${API_BASE}/pay`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return res.json();
}