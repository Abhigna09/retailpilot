import { useState, useEffect } from "react";
import AuthForm from "./AuthForm";
import Dashboard from "./Dashboard";
import "./App.css";

function App() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("retailpilot_userId");
    if (saved) setUserId(saved);
  }, []);

  function handleAuthed(id: string) {
    localStorage.setItem("retailpilot_userId", id);
    setUserId(id);
  }

  function handleLogout() {
    localStorage.removeItem("retailpilot_userId");
    setUserId(null);
  }

  if (!userId) {
    return <AuthForm onAuthed={handleAuthed} />;
  }

  return <Dashboard userId={userId} onLogout={handleLogout} />;
}

export default App;