import { randomUUID } from "crypto";
import { AgentAction, AgentActionEvent, AgentActionType, DecisionOutcome, ActionStatus } from "../models/agentAction";
import { putItem, getItem, queryByPrefix } from "./dbClient";

export interface CreateActionInput {
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
}

function sk(createdAt: string, actionId: string) {
  return `ACTION#${createdAt}#${actionId}`;
}

export async function createAction(input: CreateActionInput): Promise<AgentAction> {
  const actionId = randomUUID();
  const now = new Date().toISOString();

  const events: AgentActionEvent[] = [
    { timestamp: now, type: "detected", detail: `${input.type} issue detected for ${input.productName}` },
    { timestamp: now, type: "reasoned", detail: input.reasoning },
    {
      timestamp: now,
      type: "decision_made",
      detail: input.decisionOutcome === "autonomous"
        ? "Within autopay limits — routed for automatic execution"
        : "Outside autopay limits — routed for manual approval",
    },
  ];

  const action: AgentAction = {
    actionId,
    userId: input.userId,
    productId: input.productId,
    productName: input.productName,
    vendorId: input.vendorId,
    type: input.type,
    reasoning: input.reasoning,
    recommendedQty: input.recommendedQty,
    orderAmount: input.orderAmount,
    decisionOutcome: input.decisionOutcome,
    status: input.status,
    events,
    createdAt: now,
    updatedAt: now,
  };

  await putItem({
    PK: `USER#${input.userId}`,
    SK: sk(now, actionId),
    ...action,
  });

  return action;
}

export async function appendEvent(
  userId: string,
  actionId: string,
  createdAt: string,
  event: Omit<AgentActionEvent, "timestamp">,
  updates: Partial<Pick<AgentAction, "status" | "decisionOutcome" | "safetyCheckResults" | "razorpayOrderId">> = {}
): Promise<AgentAction | undefined> {
  const existing = await getItem(`USER#${userId}`, sk(createdAt, actionId)) as AgentAction | undefined;
  if (!existing) return undefined;

  const now = new Date().toISOString();
  const updated: AgentAction = {
    ...existing,
    ...updates,
    events: [...existing.events, { ...event, timestamp: now }],
    updatedAt: now,
  };

  await putItem({
    PK: `USER#${userId}`,
    SK: sk(createdAt, actionId),
    ...updated,
  });

  return updated;
}

export async function listActions(userId: string): Promise<AgentAction[]> {
  const items = await queryByPrefix(`USER#${userId}`, "ACTION#");
  return (items as AgentAction[]).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}