import { useEffect, useState } from "react";
import { listProducts, listVendors, addProduct } from "./api";

interface Props {
  userId: string;
}

export default function Products({ userId }: Props) {
  const [products, setProducts] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("perishable");
  const [costPrice, setCostPrice] = useState("");
  const [currentStock, setCurrentStock] = useState("");
  const [unit, setUnit] = useState("");
  const [avgDailySales, setAvgDailySales] = useState("");
  const [vendorId, setVendorId] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    refresh();
  }, []);

  async function refresh() {
    const [p, v] = await Promise.all([listProducts(userId), listVendors(userId)]);
    setProducts(p);
    setVendors(v);
    if (v.length > 0 && !vendorId) setVendorId(v[0].vendorId);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    await addProduct({
      userId,
      name,
      unit: unit || "units",
      vendorId: vendorId || "",
      category,
      costPrice: Number(costPrice),
      sellPrice: Number(costPrice) * 1.3,
      currentStock: Number(currentStock),
      autopayEnabled: false,
      autopayThreshold: 0,
    });

    setLoading(false);
    setName("");
    setCostPrice("");
    setCurrentStock("");
    setUnit("");
    setAvgDailySales("");
    refresh();
  }

  return (
    <div className="page">
      <h1 className="page-title-sm">Products</h1>
      <p className="page-subtitle">Your store inventory at a glance.</p>

      <div className="section-card">
        <div className="section-card-header">Add a product</div>
        <form onSubmit={handleSubmit} className="form-grid">
          <div className="form-field">
            <label>Product name</label>
            <input type="text" placeholder="Milk 500ml" value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div className="form-field">
            <label>Category</label>
            <select value={category} onChange={e => setCategory(e.target.value)}>
              <option value="dairy">Dairy</option>
              <option value="perishable">Perishable</option>
              <option value="dry-goods">Dry goods</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="form-field">
            <label>Price (₹)</label>
            <input type="number" placeholder="25" value={costPrice} onChange={e => setCostPrice(e.target.value)} required />
          </div>
          <div className="form-field">
            <label>Current stock</label>
            <input type="number" placeholder="50" value={currentStock} onChange={e => setCurrentStock(e.target.value)} required />
          </div>
          <div className="form-field">
            <label>Unit</label>
            <input type="text" placeholder="bottles" value={unit} onChange={e => setUnit(e.target.value)} />
          </div>
          <div className="form-field">
            <label>Vendor</label>
            <select value={vendorId} onChange={e => setVendorId(e.target.value)}>
              {vendors.length === 0 && <option value="">No vendor</option>}
              {vendors.map((v: any) => <option key={v.vendorId} value={v.vendorId}>{v.name}</option>)}
            </select>
          </div>
          <button type="submit" disabled={loading} className="btn-primary">
            + {loading ? "Adding..." : "Add product"}
          </button>
        </form>
      </div>

      <div className="product-list">
        {products.map((p: any) => (
          <div key={p.productId} className="list-row">
            <div>
              <div className="list-row-title">{p.name}</div>
              <div className="list-row-sub">{p.category} · ₹{p.costPrice}</div>
            </div>
            <div className="list-row-right">
              <div className="list-row-stat">{p.currentStock} {p.unit || "units"}</div>
              <span className={`badge ${p.currentStock > 20 ? "badge-healthy" : "badge-medium"}`}>
                {p.currentStock > 20 ? "In stock" : "Low stock"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}