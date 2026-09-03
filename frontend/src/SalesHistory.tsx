import { useEffect, useState } from "react";
import { listProducts, recordSale, listAllSalesForUser } from "./api";

interface Props {
  userId: string;
}

export default function SalesHistory({ userId }: Props) {
  const [products, setProducts] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    refresh();
  }, []);

  async function refresh() {
    const [p, s] = await Promise.all([listProducts(userId), listAllSalesForUser(userId)]);
    setProducts(p);
    setSales(s.sort((a: any, b: any) => b.date.localeCompare(a.date)));
    if (p.length > 0 && !productId) setProductId(p[0].productId);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
       await recordSale(userId, productId, Number(quantity));
    setLoading(false);
    setQuantity("");
    refresh();
  }

  function productName(pid: string) {
    return products.find((p: any) => p.productId === pid)?.name || pid;
  }

  const totalRevenue = sales.reduce((sum: number, s: any) => {
    const product = products.find((p: any) => p.productId === s.productId);
    return sum + (product ? product.sellPrice * s.unitsSold : 0);
  }, 0);

  return (
    <div className="page">
      <h1 className="page-title-sm">Sales History</h1>
      <p className="page-subtitle">Record sales and review past performance.</p>

      <div className="section-card">
        <div className="section-card-header">Record a sale</div>
        <form onSubmit={handleSubmit} className="form-grid">
          <div className="form-field">
            <label>Product</label>
            <select value={productId} onChange={e => setProductId(e.target.value)}>
              {products.map((p: any) => <option key={p.productId} value={p.productId}>{p.name}</option>)}
            </select>
          </div>
          <div className="form-field">
            <label>Quantity</label>
            <input type="number" placeholder="5" value={quantity} onChange={e => setQuantity(e.target.value)} required />
          </div>
         
          <button type="submit" disabled={loading} className="btn-primary">
            + {loading ? "Recording..." : "Record sale"}
          </button>
        </form>
      </div>

      <div className="section-card">
        <div className="stat-label">Total recorded revenue</div>
        <div className="revenue-value">₹{totalRevenue.toFixed(0)}</div>
      </div>

      <div className="product-list">
        {sales.map((s: any) => (
          <div key={s.saleId} className="list-row">
            <div>
              <div className="list-row-title">{productName(s.productId)}</div>
              <div className="list-row-sub">{s.unitsSold} units · {new Date(s.date).toLocaleDateString()}</div>
            </div>
            <div className="list-row-stat">
              ₹{(products.find((p: any) => p.productId === s.productId)?.sellPrice || 0) * s.unitsSold}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}