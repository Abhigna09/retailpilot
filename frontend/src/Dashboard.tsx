import { useEffect, useState } from "react";
import { listProducts, listVendors, reviewProduct } from "./api";
import { generateDemoSales, generateDemoExpiry } from "./demoData";
import AddProduct from "./AddProduct";
import AddVendor from "./AddVendor";
import ReviewDetail from "./ReviewDetail";

interface Props {
  userId: string;
  onLogout: () => void;
}

interface FlaggedProduct {
  productId: string;
  name: string;
  type: "reorder" | "deadStock";
  reason: string;
}

export default function Dashboard({ userId, onLogout }: Props) {
  const [products, setProducts] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [flagged, setFlagged] = useState<FlaggedProduct[]>([]);
  const [healthyNames, setHealthyNames] = useState<string[]>([]);
  const [checking, setChecking] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [showForms, setShowForms] = useState(false);

  async function refresh() {
    const [p, v] = await Promise.all([listProducts(userId), listVendors(userId)]);
    setProducts(p);
    setVendors(v);
    await checkAllProducts(p);
  }

  async function checkAllProducts(productList: any[]) {
    setChecking(true);
    const flaggedResults: FlaggedProduct[] = [];
    const healthy: string[] = [];

    for (const product of productList) {
      const sales = generateDemoSales(product.productId);
      const expiryBatches = generateDemoExpiry(product.productId, product.currentStock);
      const result = await reviewProduct(userId, product.productId, sales, expiryBatches);

      if (result.analysis?.reorder?.result?.reorderNeeded) {
        flaggedResults.push({
          productId: product.productId,
          name: product.name,
          type: "reorder",
          reason: `Almost out — ${product.currentStock} units left, reorder ${result.analysis.reorder.result.recommendedQty}`,
        });
      } else if (result.analysis?.deadStock?.result?.isDeadStock) {
        flaggedResults.push({
          productId: product.productId,
          name: product.name,
          type: "deadStock",
          reason: `Not moving — ${result.analysis.deadStock.result.daysSinceLastSale === Infinity ? "no" : result.analysis.deadStock.result.daysSinceLastSale} days no sale`,
        });
      } else {
        healthy.push(product.name);
      }
    }

    setFlagged(flaggedResults);
    setHealthyNames(healthy);
    setChecking(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  if (selectedProductId) {
    return (
      <ReviewDetail
        userId={userId}
        productId={selectedProductId}
        onBack={() => { setSelectedProductId(null); refresh(); }}
      />
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>RetailPilot</h1>
          <p className="subtitle">{products.length} products in your store</p>
        </div>
        <button className="logout-btn" onClick={onLogout}>Log out</button>
      </div>

      <div className="action-row">
        <button onClick={() => setShowForms(!showForms)}>
          {showForms ? "Hide forms" : "+ Add product / vendor"}
        </button>
      </div>

      {showForms && (
        <div className="forms-row">
          <AddVendor userId={userId} onAdded={refresh} />
          <AddProduct userId={userId} vendors={vendors} onAdded={refresh} />
        </div>
      )}

      {checking && <p className="hint">Analyzing your inventory...</p>}

      {!checking && products.length === 0 && (
        <p className="hint">No products yet — add one above to get started.</p>
      )}

      {!checking && flagged.length > 0 && (
        <>
          <div className="section-label danger">Needs attention ({flagged.length})</div>
          <div className="product-list">
            {flagged.map(f => (
              <div
                key={f.productId}
                className={`product-row ${f.type === "reorder" ? "flag-danger" : "flag-warning"}`}
                onClick={() => setSelectedProductId(f.productId)}
              >
                <div>
                  <div className="product-name">{f.name}</div>
                  <div className={`product-meta ${f.type === "reorder" ? "text-danger" : "text-warning"}`}>
                    {f.reason}
                  </div>
                </div>
                <span className="chevron">›</span>
              </div>
            ))}
          </div>
        </>
      )}

      {!checking && healthyNames.length > 0 && (
        <>
          <div className="section-label muted">Healthy ({healthyNames.length})</div>
          <div className="healthy-list">{healthyNames.join(", ")} — all stocked and selling normally</div>
        </>
      )}
    </div>
  );
}