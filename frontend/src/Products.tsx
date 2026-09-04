import { useEffect, useState } from "react";
import {
  listProducts,
  listVendors,
  listVariants,
  listAllExpiry,
  addVariant,
  addProduct,
  deleteProduct,
} from "./api";
interface Props {
  userId: string;
}

export default function Products({ userId }: Props) {
  const [products, setProducts] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [variants, setVariants] = useState<Record<string, any[]>>({});
  const [expiryBatches, setExpiryBatches] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("perishable");
  const [vendorId, setVendorId] = useState("");
  const [loading, setLoading] = useState(false);
  const [variantProductId, setVariantProductId] = useState("");
  const [variantName, setVariantName] = useState("");
  const [variantUnit, setVariantUnit] = useState("");
  const [variantCostPrice, setVariantCostPrice] = useState("");
  const [variantStock, setVariantStock] = useState("");
  const [variantLoading, setVariantLoading] = useState(false);
  const [variantExpiryDate, setVariantExpiryDate] = useState("");
  useEffect(() => {
    refresh();
  }, []);

  async function refresh() {
  try {
    const [p, v, batches] = await Promise.all([
  listProducts(userId),
  listVendors(userId),
  listAllExpiry(userId),
]);

    setProducts(p);
    setVendors(v);
    setExpiryBatches(batches);
    if (v.length > 0 && !vendorId) {
      setVendorId(v[0].vendorId);
    }

    const variantEntries = await Promise.all(
      p.map(async (product: any) => {
        try {
          const productVariants = await listVariants(
            userId,
            product.productId
          );

          return [product.productId, productVariants] as const;
        } catch (error) {
          console.error(
            `Failed to load variants for ${product.name}:`,
            error
          );

          return [product.productId, []] as const;
        }
      })
    );

    setVariants(Object.fromEntries(variantEntries));
  } catch (error) {
    console.error("Failed to load products:", error);
  }
}
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    await addProduct({
  userId,
  name,
  vendorId: vendorId || "",
  category,
});

    setLoading(false);
    setName("");
    refresh();
  }

  async function handleDelete(productId: string, name: string) {
    if (confirm(`Delete ${name}?`)) {
      await deleteProduct(userId, productId);
      refresh();
    }
  }
async function handleAddVariant(e: React.FormEvent) {
  e.preventDefault();

  if (!variantProductId) return;

  setVariantLoading(true);

  await addVariant({
    userId,
    productId: variantProductId,
    name: variantName,
    unit: variantUnit || "units",
    costPrice: Number(variantCostPrice),
    sellPrice: Number(variantCostPrice) * 1.3,
    currentStock: Number(variantStock),
    expiryDate: variantExpiryDate,
  });

  setVariantLoading(false);
  setVariantProductId("");
  setVariantName("");
  setVariantUnit("");
  setVariantCostPrice("");
  setVariantStock("");
  setVariantExpiryDate("");
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
<div className="section-card" style={{ marginTop: "20px" }}>
  <div className="section-card-header">Add a variant / pack size</div>

  <form onSubmit={handleAddVariant} className="form-grid">
    <div className="form-field">
      <label>Product</label>
      <select
        value={variantProductId}
        onChange={e => setVariantProductId(e.target.value)}
        required
      >
        <option value="">Select product</option>
        {products.map((p: any) => (
          <option key={p.productId} value={p.productId}>
            {p.name}
          </option>
        ))}
      </select>
    </div>

    <div className="form-field">
      <label>Variant / Pack size</label>
      <input
        type="text"
        placeholder="500ml"
        value={variantName}
        onChange={e => setVariantName(e.target.value)}
        required
      />
    </div>

    <div className="form-field">
      <label>Unit</label>
      <input
        type="text"
        placeholder="bottles"
        value={variantUnit}
        onChange={e => setVariantUnit(e.target.value)}
      />
    </div>

    <div className="form-field">
      <label>Cost price (₹)</label>
      <input
        type="number"
        placeholder="25"
        value={variantCostPrice}
        onChange={e => setVariantCostPrice(e.target.value)}
        required
      />
    </div>

    <div className="form-field">
      <label>Current stock</label>
      <input
        type="number"
        placeholder="50"
        value={variantStock}
        onChange={e => setVariantStock(e.target.value)}
        required
      />
    </div>
<div className="form-group">
  <label>Expiry date</label>
  <input
    type="date"
    value={variantExpiryDate}
    onChange={(e) => setVariantExpiryDate(e.target.value)}
    required
  />
</div>
    <button
      type="submit"
      disabled={variantLoading}
      className="btn-primary"
    >
      + {variantLoading ? "Adding..." : "Add variant"}
    </button>
  </form>
</div>
 <div className="product-list">
  {products.map((p: any) => {
    const productVariants = variants[p.productId] || [];

    return (
      <div key={p.productId} className="list-row">
        <div style={{ width: "100%" }}>
          <div className="list-row-title">{p.name}</div>

          <div className="list-row-sub" style={{ marginTop: "4px" }}>
            {p.category}
          </div>

          <div style={{ marginTop: "18px" }}>
            <div
              className="list-row-sub"
              style={{
                fontWeight: 600,
                marginBottom: "10px",
              }}
            >
              Variants / Pack sizes
            </div>

            {productVariants.length === 0 ? (
              <div
                className="list-row-sub"
                style={{ color: "#888" }}
              >
                No variants added yet
              </div>
            ) : (
              productVariants.map((variant: any) => (
                <div
                  key={variant.variantId}
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: "10px",
                    padding: "14px",
                    marginBottom: "10px",
                    background: "#fafafa",
                  }}
                >
                  <div
                    style={{
                      fontSize: "16px",
                      fontWeight: 600,
                      marginBottom: "10px",
                    }}
                  >
                    {variant.name}
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                      gap: "10px",
                      fontSize: "14px",
                    }}
                  >
                    <div>
                      <div className="list-row-sub">Stock</div>
                     <strong>
  {variant.currentStock} units
</strong>
                    </div>

                    <div>
                      <div className="list-row-sub">Cost price</div>
                      <strong>₹{variant.costPrice}</strong>
                    </div>

                    <div>
                      <div className="list-row-sub">Sell price</div>
                      <strong>
                        ₹{variant.sellPrice}
                      </strong>
                    </div>
                  </div>

                  <div
  style={{
    marginTop: "14px",
    paddingTop: "12px",
    borderTop: "1px solid #e5e7eb",
  }}
>
  <div
    style={{
      fontSize: "13px",
      fontWeight: 600,
      marginBottom: "8px",
      color: "#555",
    }}
  >
    Expiry batches
  </div>

  {expiryBatches.filter(
    (batch: any) =>
      batch.variantId === variant.variantId
  ).length === 0 ? (
    <div
      style={{
        fontSize: "13px",
        color: "#888",
      }}
    >
      No expiry batches recorded
    </div>
  ) : (
    expiryBatches
      .filter(
        (batch: any) =>
          batch.variantId === variant.variantId
      )
      .map((batch: any) => (
        <div
          key={batch.batchId}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "10px 12px",
            borderRadius: "8px",
            background: "#fff",
            border: "1px solid #e5e7eb",
            marginTop: "6px",
          }}
        >
          <div>
            <div
              style={{
                fontWeight: 600,
                fontSize: "14px",
              }}
            >
              {batch.quantity} units
            </div>

            <div
              style={{
                fontSize: "12px",
                color: "#777",
                marginTop: "3px",
              }}
            >
              Batch ID: {batch.batchId.slice(0, 8)}
            </div>
          </div>

          <div
            style={{
              textAlign: "right",
            }}
          >
            <div
              style={{
                fontSize: "12px",
                color: "#777",
              }}
            >
              Expires
            </div>

            <strong style={{ fontSize: "14px" }}>
              {new Date(batch.expiryDate).toLocaleDateString(
                "en-IN",
                {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                }
              )}
            </strong>
          </div>
        </div>
      ))
  )}
</div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="list-row-right">
          <button
            className="delete-btn"
            onClick={() => handleDelete(p.productId, p.name)}
          >
            Delete
          </button>
        </div>
      </div>
    );
  })}
</div>   
    </div>
  );
}