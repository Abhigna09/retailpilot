import { useState, useEffect } from "react";
import AuthForm from "./AuthForm";
import Sidebar from "./Sidebar";
import Home from "./Home";
import Analysis from "./Analysis";
import ActivityLog from "./ActivityLog";
import Products from "./Products";
import Vendors from "./Vendors";
import ProductExpiry from "./ProductExpiry";
import SalesHistory from "./SalesHistory";
import ProductDetail from "./ProductDetail";
import "./App.css";

function App() {
  const [userId, setUserId] = useState<string | null>(null);
  const [storeName, setStoreName] = useState<string>("");
  const [page, setPage] = useState("home");
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const savedId = localStorage.getItem("retailpilot_userId");
    const savedName = localStorage.getItem("retailpilot_storeName");
    if (savedId) setUserId(savedId);
    if (savedName) setStoreName(savedName);
  }, []);

  function handleAuthed(id: string, name: string) {
    localStorage.setItem("retailpilot_userId", id);
    localStorage.setItem("retailpilot_storeName", name || "");
    setUserId(id);
    setStoreName(name || "");
  }

  function handleLogout() {
    localStorage.removeItem("retailpilot_userId");
    localStorage.removeItem("retailpilot_storeName");
    setUserId(null);
    setStoreName("");
  }

  function openProduct(productId: string) {
    setSelectedProductId(productId);
    setPage("productDetail");
  }

  if (!userId) {
    return <AuthForm onAuthed={handleAuthed} />;
  }

  function renderPage() {
    switch (page) {
      case "home":
        return <Home userId={userId!} storeName={storeName} onOpenProduct={openProduct} />;
      case "analysis":
        return <Analysis userId={userId!} onOpenProduct={openProduct} />;
      case "activity":
        return <ActivityLog userId={userId!} onBack={() => setPage("home")} />;
      case "products":
        return <Products userId={userId!} />;
      case "vendors":
        return <Vendors userId={userId!} />;
      case "expiry":
        return <ProductExpiry userId={userId!} />;
      case "sales":
        return <SalesHistory userId={userId!} />;
      case "productDetail":
        return (
          <ProductDetail
            userId={userId!}
            productId={selectedProductId!}
            onBack={() => setPage("home")}
          />
        );
      default:
        return <Home userId={userId!} storeName={storeName} onOpenProduct={openProduct} />;
    }
  }

    return (
    <div className="app-shell">
           {sidebarOpen && <Sidebar currentPage={page} onNavigate={setPage} storeName={storeName} />}
      <div className="main-content">
        <div className="topbar">
          <button className="hamburger-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>☰</button>
          <span className="topbar-store">{storeName}</span>
          <button className="topbar-logout" onClick={handleLogout}>Log out</button>
        </div>
        {renderPage()}
      </div>
    </div>
  );
}

export default App;