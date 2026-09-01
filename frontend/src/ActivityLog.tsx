import { useEffect, useState } from "react";
import { listActions } from "./api";

interface Props {
  userId: string;
  onBack: () => void;
}

const eventLabels: Record<string, string> = {
  detected: "Detected",
  reasoned: "Analyzed",
  decision_made: "Decision",
  safety_checked: "Safety checked",
  executed: "Executed",
  blocked: "Blocked",
  rejected: "Rejected",
};

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString();
}

export default function ActivityLog({ userId, onBack }: Props) {
  const [actions, setActions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listActions(userId).then(data => {
      setActions(Array.isArray(data) ? data : []);
      setLoading(false);
    });
  }, [userId]);

  const statusClass: Record<string, string> = {
    completed: "ok",
    blocked: "alert",
    rejected: "alert",
    awaiting_approval: "",
    executing: "",
  };

  return (
    <div className="dashboard">
      <div className="detail-header">
        <span className="back-link" onClick={onBack}>‹ Back</span>
        <h2>Activity Log</h2>
      </div>

      {loading && <p className="hint">Loading activity...</p>}
      {!loading && actions.length === 0 && <p className="hint">No agent activity yet.</p>}

      {actions.map(action => (
        <div key={action.actionId} className={`card ${statusClass[action.status] || ""}`}>
          <h3>{action.productName} — {action.type}</h3>
          <p className="payment-headline">
            {action.decisionOutcome === "autonomous" ? "Autonomous" : action.decisionOutcome === "blocked" ? "Blocked" : "Needed approval"}
            {" · "}
            Status: {action.status.replace("_", " ")}
          </p>
          <div className="checks">
            {action.events.map((e: any, i: number) => (
              <div key={i} className="hint">
                <strong>{eventLabels[e.type] || e.type}</strong> — {formatTime(e.timestamp)}
                <br />
                {e.detail}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}