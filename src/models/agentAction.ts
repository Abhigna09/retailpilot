export type AgentActionType = "reorder" | "deadStock" | "expiryRisk";
export type DecisionOutcome = "autonomous" | "approval_required" | "blocked";
export type ActionStatus = "awaiting_approval" | "executing" | "completed" | "blocked" | "rejected";

export interface AgentActionEvent {
  timestamp: string;
  type: string; // e.g. "detected", "reasoned", "decision_made", "safety_checked", "approved", "rejected", "executed", "blocked"
  detail: string;
}

export interface AgentAction {
  actionId: string;
  userId: string;
  productId: string;
  productName: string;
  vendorId: string;
  type: AgentActionType;
  reasoning: string;
  recommendedQty?: number;
  orderAmount?: number;
  decisionOutcome: DecisionOutcome;
  status: ActionStatus;
  safetyCheckResults?: { passed: boolean; reason: string }[];
  razorpayOrderId?: string;
  events: AgentActionEvent[];
  createdAt: string;
  updatedAt: string;
}