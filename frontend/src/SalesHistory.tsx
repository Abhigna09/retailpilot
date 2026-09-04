import { useEffect, useState } from "react";
import {
  listProducts,
  listVariants,
  recordSale,
  listAllSalesForUser,
} from "./api";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

interface Props {
  userId: string;
}

export default function SalesHistory({ userId }: Props) {
  const [products, setProducts] = useState<any[]>([]);
  const [variants, setVariants] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);

  const [productId, setProductId] = useState("");
  const [variantId, setVariantId] = useState("");
  const [quantity, setQuantity] = useState("");

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    refresh();
  }, []);

  async function refresh() {
    try {
      const [p, s] = await Promise.all([
        listProducts(userId),
        listAllSalesForUser(userId),
      ]);

      setProducts(p);

      setSales(
        s.sort((a: any, b: any) =>
          b.date.localeCompare(a.date)
        )
      );

      if (p.length > 0 && !productId) {
        setProductId(p[0].productId);

        const productVariants = await listVariants(
          userId,
          p[0].productId
        );

        setVariants(productVariants);

        if (productVariants.length > 0) {
          setVariantId(productVariants[0].variantId);
        }
      }
    } catch (error) {
      console.error("Failed to load sales:", error);
    }
  }

  async function handleProductChange(
    newProductId: string
  ) {
    setProductId(newProductId);
    setVariantId("");

    try {
      const productVariants = await listVariants(
        userId,
        newProductId
      );

      setVariants(productVariants);

      if (productVariants.length > 0) {
        setVariantId(productVariants[0].variantId);
      }
    } catch (error) {
      console.error("Failed to load variants:", error);
      setVariants([]);
    }
  }

  async function handleSubmit(
    e: React.FormEvent
  ) {
    e.preventDefault();

    if (!productId || !variantId) {
      alert("Please select a product and variant.");
      return;
    }

    if (Number(quantity) <= 0) {
      alert("Quantity must be greater than 0.");
      return;
    }

    setLoading(true);

    try {
      await recordSale(
        userId,
        productId,
        variantId,
        Number(quantity)
      );

      setQuantity("");

      await refresh();
    } catch (error) {
      console.error("Failed to record sale:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Failed to record sale."
      );
    } finally {
      setLoading(false);
    }
  }

  function productName(pid: string) {
    return (
      products.find(
        (p: any) => p.productId === pid
      )?.name || pid
    );
  }

  

  function saleRevenue(sale: any) {
    const unitsSold = Number(sale.unitsSold);
    const unitPrice = Number(sale.unitPrice);

    if (
      !Number.isFinite(unitsSold) ||
      !Number.isFinite(unitPrice)
    ) {
      return 0;
    }

    return unitsSold * unitPrice;
  }

  const totalRevenue = sales.reduce(
    (sum: number, sale: any) =>
      sum + saleRevenue(sale),
    0
  );

  function getDateDaysAgo(daysAgo: number) {
    const date = new Date();

    date.setDate(
      date.getDate() - daysAgo
    );

    return date
      .toISOString()
      .split("T")[0];
  }

  const today = new Date()
    .toISOString()
    .split("T")[0];

  const todayRevenue = sales
    .filter(
      (sale: any) =>
        sale.date === today
    )
    .reduce(
      (sum: number, sale: any) =>
        sum + saleRevenue(sale),
      0
    );

  const weekStart = getDateDaysAgo(6);

  const weekRevenue = sales
    .filter(
      (sale: any) =>
        sale.date >= weekStart &&
        sale.date <= today
    )
    .reduce(
      (sum: number, sale: any) =>
        sum + saleRevenue(sale),
      0
    );

  const currentMonth = today.slice(0, 7);

  const monthRevenue = sales
    .filter(
      (sale: any) =>
        sale.date.startsWith(currentMonth)
    )
    .reduce(
      (sum: number, sale: any) =>
        sum + saleRevenue(sale),
      0
    );

  const chartData = Array.from(
    { length: 7 },
    (_, index) => {
      const date = new Date();

      date.setDate(
        date.getDate() -
          (6 - index)
      );

      const dateString = date
        .toISOString()
        .split("T")[0];

      const revenue = sales
        .filter(
          (sale: any) =>
            sale.date === dateString
        )
        .reduce(
          (sum: number, sale: any) =>
            sum + saleRevenue(sale),
          0
        );

      return {
        date: dateString,
        day: date.toLocaleDateString(
          "en-US",
          {
            weekday: "short",
          }
        ),
        revenue,
      };
    }
  );

  return (
    <div className="page">
      <h1 className="page-title-sm">
        Sales History
      </h1>

      <p className="page-subtitle">
        Record sales and review past
        performance.
      </p>

      <div className="section-card">
        <div className="section-card-header">
          Record a sale
        </div>

        <form
          onSubmit={handleSubmit}
          className="form-grid"
        >
          <div className="form-field">
            <label>Product</label>

            <select
              value={productId}
              onChange={(e) =>
                handleProductChange(
                  e.target.value
                )
              }
              required
            >
              <option value="">
                Select product
              </option>

              {products.map(
                (p: any) => (
                  <option
                    key={p.productId}
                    value={p.productId}
                  >
                    {p.name}
                  </option>
                )
              )}
            </select>
          </div>

          <div className="form-field">
            <label>
              Variant / Pack size
            </label>

            <select
              value={variantId}
              onChange={(e) =>
                setVariantId(
                  e.target.value
                )
              }
              required
              disabled={
                variants.length === 0
              }
            >
              <option value="">
                Select variant
              </option>

              {variants.map(
                (variant: any) => (
                  <option
                    key={
                      variant.variantId
                    }
                    value={
                      variant.variantId
                    }
                  >
                    {variant.name} — ₹
                    {variant.sellPrice}
                  </option>
                )
              )}
            </select>
          </div>

          <div className="form-field">
            <label>Quantity</label>

            <input
              type="number"
              min="1"
              placeholder="5"
              value={quantity}
              onChange={(e) =>
                setQuantity(
                  e.target.value
                )
              }
              required
            />
          </div>

          <button
            type="submit"
            disabled={
              loading ||
              !variantId
            }
            className="btn-primary"
          >
            +{" "}
            {loading
              ? "Recording..."
              : "Record sale"}
          </button>
        </form>
      </div>

      <div className="section-card">
        <div className="section-card-header">
          Sales Overview
        </div>

        <div className="sales-metrics">
          <div className="sales-main-metric">
            <div className="stat-label">
              Total recorded revenue
            </div>

            <div className="revenue-value">
              ₹{totalRevenue.toFixed(0)}
            </div>
          </div>

          <div className="sales-small-metric">
            <div className="stat-label">
              Today
            </div>

            <div className="metric-value">
              ₹{todayRevenue.toFixed(0)}
            </div>
          </div>

          <div className="sales-small-metric">
            <div className="stat-label">
              Last 7 days
            </div>

            <div className="metric-value">
              ₹{weekRevenue.toFixed(0)}
            </div>
          </div>

          <div className="sales-small-metric">
            <div className="stat-label">
              This month
            </div>

            <div className="metric-value">
              ₹{monthRevenue.toFixed(0)}
            </div>
          </div>
        </div>

        <div className="sales-chart-section">
          <div className="chart-title">
            Sales Trend
          </div>

          <div className="sales-chart">
            <div className="sales-chart-container">
              <LineChart
                width={700}
                height={240}
                data={chartData}
                margin={{
                  top: 10,
                  right: 10,
                  left: 0,
                  bottom: 5,
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                />

                <XAxis dataKey="day" />

                <YAxis />

                <Tooltip
                  formatter={(value) => [
                    `₹${Number(
                      value
                    ).toFixed(0)}`,
                    "Revenue",
                  ]}
                />

                <Line
                  type="monotone"
                  dataKey="revenue"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </div>
          </div>
        </div>
      </div>

      <div className="product-list">
        {sales.map(
          (s: any) => (
            <div
              key={s.saleId}
              className="list-row"
            >
              <div>
                <div className="list-row-title">
                  {productName(
                    s.productId
                  )}
                </div>

                <div className="list-row-sub">
                  {s.unitsSold} units · ₹
                  {s.unitPrice} per unit ·{" "}
                  {new Date(
                    s.date
                  ).toLocaleDateString()}
                </div>

                <div className="list-row-sub">
                  Variant:{" "}
                  {s.variantId}
                </div>
              </div>

              <div className="list-row-stat">
                ₹
                {saleRevenue(
                  s
                ).toFixed(0)}
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}