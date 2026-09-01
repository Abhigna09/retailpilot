import { useEffect, useState } from "react";
import { listProducts, checkStatus } from "./api";

interface Props {
  userId: string;
  onOpenProduct: (productId: string) => void;
}

interface CheckedProduct {
  productId: string;
  name: string;
  unit: string;
  costPrice: number;
  currentStock: number;
  flag: "reorder" | "deadStock" | "healthy";
}

export default function Analysis({ userId, onOpenProduct }: Props) {
  const [checked, setChecked] = useState<CheckedProduct[]>([]);
  const [tab, setTab] = useState<"attention" | "healthy">("attention");
  const [loading, setLoading] = useState(true);
  

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const products = await listProducts(userId);

    const results = await Promise.all(
      products.map(async (p: any) => {
        try {
          const status = await checkStatus(userId, p.productId);
          const flag = status.reorderNeeded ? "reorder" as const : status.isDeadStock ? "deadStock" as const : "healthy" as const;
          return { productId: p.productId, name: p.name, unit: p.unit || "units", costPrice: p.costPrice, currentStock: p.currentStock, flag };
        } catch {
          return { productId: p.productId, name: p.name, unit: p.unit || "units", costPrice: p.costPrice, currentStock: p.currentStock, flag: "healthy" as const };
        }
      })
    );

    setChecked(results);
    setLoading(false);
  }

  const attention = checked.filter(c => c.flag !== "healthy");
  const healthy = checked.filter(c => c.flag === "healthy");

  return (
    <div className="page">
      <p className="greeting">Good afternoon.</p>
      <h1 className="page-title">Here's what your store needs to know today.</h1>

      <div className="stat-cards">
        <div className="stat-card">
          <div className="stat-label">Products</div>
          <div className="stat-value">{checked.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Needs Attention</div>
          <div className="stat-value danger">{attention.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Healthy</div>
          <div className="stat-value success">{healthy.length}</div>
        </div>
      </div>

      <div className="tabs">
        <div className={`tab ${tab === "attention" ? "tab-active" : ""}`} onClick={() => setTab("attention")}>
          Needs Attention <span className="tab-count count-danger">{attention.length}</span>
        </div>
        <div className={`tab ${tab === "healthy" ? "tab-active" : ""}`} onClick={() => setTab("healthy")}>
          Healthy <span className="tab-count count-success">{healthy.length}</span>
        </div>
      </div>

      {loading && <p className="hint">Loading...</p>}

      {!loading && tab === "attention" && (
        <div className="product-list">
          {attention.length === 0 && <p className="hint">Nothing needs attention.</p>}
          {attention.map(p => (
            <div key={p.productId} className="list-row" onClick={() => onOpenProduct(p.productId)}>
              <div>
                <div className="list-row-title">{p.name}</div>
                <div className="list-row-sub">{p.currentStock} {p.unit} in stock · ₹{p.costPrice}</div>
              </div>
              <span className={`badge ${p.flag === "reorder" ? "badge-high" : "badge-medium"}`}>
                {p.flag === "reorder" ? "Stockout risk" : "Slow-moving"}
              </span>
            </div>
          ))}
        </div>
      )}

      {!loading && tab === "healthy" && (
        <div className="product-list">
          {healthy.length === 0 && <p className="hint">No healthy products yet.</p>}
          {healthy.map(p => (
            <div key={p.productId} className="list-row" onClick={() => onOpenProduct(p.productId)}>
              <div>
                <div className="list-row-title">{p.name}</div>
                <div className="list-row-sub">{p.currentStock} {p.unit} in stock · ₹{p.costPrice}</div>
              </div>
              <span className="badge badge-healthy">Healthy</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}