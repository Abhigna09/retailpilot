import { useEffect, useState } from "react";
import { listProducts, addExpiryBatch, listAllExpiry } from "./api";

interface Props {
  userId: string;
}

export default function ProductExpiry({ userId }: Props) {
  const [products, setProducts] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [productId, setProductId] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [quantity, setQuantity] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    refresh();
  }, []);

  async function refresh() {
    const [p, b] = await Promise.all([listProducts(userId), listAllExpiry(userId)]);
    setProducts(p);
    setBatches(b);
    if (p.length > 0 && !productId) setProductId(p[0].productId);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await addExpiryBatch(userId, productId, Number(quantity), expiryDate);
    setLoading(false);
    setQuantity("");
    setExpiryDate("");
    refresh();
  }

  function daysUntil(dateStr: string) {
    const diff = Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return diff;
  }

  function productName(pid: string) {
    return products.find((p: any) => p.productId === pid)?.name || pid;
  }

  return (
    <div className="page">
      <h1 className="page-title-sm">Product Expiry</h1>
      <p className="page-subtitle">Track batch expiry dates to prevent waste.</p>

      <div className="section-card">
        <div className="section-card-header">Record an expiry batch</div>
        <form onSubmit={handleSubmit} className="form-stack">
          <div className="form-field">
            <label>Product</label>
            <select value={productId} onChange={e => setProductId(e.target.value)}>
              {products.map((p: any) => <option key={p.productId} value={p.productId}>{p.name}</option>)}
            </select>
          </div>
          <div className="form-field">
            <label>Expiry date</label>
            <input type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} required />
          </div>
          <div className="form-field">
            <label>Quantity</label>
            <input type="number" placeholder="20" value={quantity} onChange={e => setQuantity(e.target.value)} required />
          </div>
          <button type="submit" disabled={loading} className="btn-primary">
            + {loading ? "Adding..." : "Add batch"}
          </button>
        </form>
      </div>

      <div className="product-list">
        {batches.map((b: any) => {
          const days = daysUntil(b.expiryDate);
          return (
            <div key={b.batchId} className="list-row">
              <div>
                <div className="list-row-title">{productName(b.productId)}</div>
                <div className="list-row-sub">{b.quantity} units · expires {new Date(b.expiryDate).toLocaleDateString()}</div>
              </div>
              <span className={`badge ${days <= 2 ? "badge-critical" : days <= 5 ? "badge-high" : "badge-medium"}`}>
                Expires in {days} day{days === 1 ? "" : "s"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}