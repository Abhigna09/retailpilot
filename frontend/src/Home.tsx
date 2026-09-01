import { useEffect, useState } from "react";
import { listProducts, checkStatus } from "./api";

interface Props {
  userId: string;
  storeName: string;
  onOpenProduct: (productId: string) => void;
}

interface Issue {
  productId: string;
  name: string;
  type: string;
  reason: string;
  severity: "Critical" | "High" | "Medium";
}

export default function Home({ userId, storeName, onOpenProduct }: Props) {
  const [products, setProducts] = useState<any[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [healthyCount, setHealthyCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const productList = await listProducts(userId);
    setProducts(productList);

    const results = await Promise.all(
      productList.map(async (p: any) => {
        try {
          const status = await checkStatus(userId, p.productId);
          if (status.reorderNeeded) {
            return {
              productId: p.productId,
              name: p.name,
              type: "Stockout risk",
              reason: `Stockout predicted soon. Reorder ${status.recommendedQty} units.`,
              severity: "High" as const,
            };
          } else if (status.isDeadStock) {
            return {
              productId: p.productId,
              name: p.name,
              type: "Slow-moving stock",
              reason: `No recent sales — ${status.daysSinceLastSale ?? "many"} days.`,
              severity: "Medium" as const,
            };
          }
          return null;
        } catch {
          return null;
        }
      })
    );

    const flagged = results.filter(Boolean) as Issue[];
    setIssues(flagged);
    setHealthyCount(productList.length - flagged.length);
    setLoading(false);
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="page">
      <p className="greeting">{greeting}, {storeName || "there"}.</p>
      <h1 className="page-title">Here's what your store needs to know today.</h1>

      <div className="stat-cards">
        <div className="stat-card">
          <div className="stat-label">Products</div>
          <div className="stat-value">{products.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Needs Attention</div>
          <div className="stat-value danger">{issues.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Healthy</div>
          <div className="stat-value success">{healthyCount}</div>
        </div>
      </div>

      <div className="section-card">
        <div className="section-card-header">
          <span>Important issues right now</span>
        </div>

        {loading && <p className="hint">Checking your inventory...</p>}
        {!loading && issues.length === 0 && <p className="hint">Nothing needs attention right now.</p>}

        {issues.map(issue => (
          <div key={issue.productId} className="issue-row" onClick={() => onOpenProduct(issue.productId)}>
            <div className={`issue-dot ${issue.severity === "Critical" ? "dot-critical" : issue.severity === "High" ? "dot-high" : "dot-medium"}`} />
            <div className="issue-info">
              <div className="issue-name">{issue.name}</div>
              <div className="issue-reason">{issue.reason}</div>
            </div>
            <span className={`badge badge-${issue.severity.toLowerCase()}`}>{issue.severity}</span>
          </div>
        ))}
      </div>
    </div>
  );
}