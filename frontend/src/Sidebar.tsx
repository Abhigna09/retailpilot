interface Props {
  currentPage: string;
  onNavigate: (page: string) => void;
  storeName: string;
}

const mainItems = [
  { key: "home", label: "Home" },
  { key: "analysis", label: "Analysis" },
  { key: "activity", label: "Activity Log" },
];

const inventoryItems = [
  { key: "products", label: "Products" },
  { key: "vendors", label: "Vendors" },
  { key: "expiry", label: "Product Expiry" },
  { key: "sales", label: "Sales History" },
];

export default function Sidebar({ currentPage, onNavigate }: Props) {
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <span className="sidebar-logo">RetailPilot</span>
      </div>

      <div className="sidebar-section-label">MAIN</div>
      {mainItems.map(item => (
        <div
          key={item.key}
          className={`sidebar-item ${currentPage === item.key ? "active" : ""}`}
          onClick={() => onNavigate(item.key)}
        >
          {item.label}
        </div>
      ))}

      <div className="sidebar-section-label">INVENTORY</div>
      {inventoryItems.map(item => (
        <div
          key={item.key}
          className={`sidebar-item ${currentPage === item.key ? "active" : ""}`}
          onClick={() => onNavigate(item.key)}
        >
          {item.label}
        </div>
      ))}
    </div>
  );
}