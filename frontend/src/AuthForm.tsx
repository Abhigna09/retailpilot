import { useState } from "react";
import { login, signup } from "./api";

interface Props {
  onAuthed: (userId: string) => void;
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
        onAuthed(result.userId);
      }
    } else {
      setError(result.reason || "Something went wrong.");
    }
  }

  return (
    <div className="auth-container">
      <h1>RetailPilot</h1>
      <p className="subtitle">AI agent for inventory reordering &amp; vendor payments</p>

      <form onSubmit={handleSubmit} className="auth-form">
        {mode === "signup" && (
          <input
            type="text"
            placeholder="Store name"
            value={storeName}
            onChange={e => setStoreName(e.target.value)}
            required
          />
        )}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        {error && <p className="error-text">{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? "Please wait..." : mode === "login" ? "Log in" : "Sign up"}
        </button>
      </form>

      <p className="toggle-mode">
        {mode === "login" ? "New store owner?" : "Already have an account?"}{" "}
        <span onClick={() => setMode(mode === "login" ? "signup" : "login")}>
          {mode === "login" ? "Sign up" : "Log in"}
        </span>
      </p>
    </div>
  );
}