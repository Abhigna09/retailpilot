import { useState } from "react";
import { login, signup } from "./api";

interface Props {
  onAuthed: (userId: string, storeName: string) => void;
}

export default function AuthForm({ onAuthed }: Props) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [storeName, setStoreName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = mode === "login"
      ? await login(email, password)
      : await signup(email, password, storeName);

    setLoading(false);

    if (result.success) {
      if (mode === "signup") {
        setMode("login");
        setPassword("");
        setError("");
      } else {
        onAuthed(result.userId, result.storeName);
      }
    } else {
      setError(result.reason || "Something went wrong.");
    }
  }

  return (
    <div className="auth-container">
      <h1>RetailPilot</h1>
      <p className="page-subtitle">AI agent for inventory reordering &amp; vendor payments</p>

      <form onSubmit={handleSubmit} className="auth-form">
        {mode === "signup" && (
          <div className="form-field">
            <label>Store name</label>
            <input
              type="text"
              placeholder="Sharma General Store"
              value={storeName}
              onChange={e => setStoreName(e.target.value)}
              required
            />
          </div>
        )}
        <div className="form-field">
          <label>Email</label>
          <input
            type="email"
            placeholder="you@store.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="form-field">
          <label>Password</label>
          <input
            type="password"
            placeholder="At least 6 characters"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <p className="error-text">{error}</p>}
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? "Please wait..." : mode === "login" ? "Sign in" : "Create account"}
        </button>
      </form>

      <p className="toggle-mode">
        {mode === "login" ? "New store owner?" : "Already have an account?"}{" "}
        <span onClick={() => setMode(mode === "login" ? "signup" : "login")}>
          {mode === "login" ? "Sign up" : "Login"}
        </span>
      </p>
    </div>
  );
}