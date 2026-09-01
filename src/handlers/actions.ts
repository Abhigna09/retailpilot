import "dotenv/config";
import { listActions } from "../services/agentActionService";
import { jsonResponse } from "../shared/response";

export async function handler(event: any) {
  try {
    const userId = event.queryStringParameters?.userId;
    if (!userId) {
      return jsonResponse(400, { error: "userId is required" });
    }
    const actions = await listActions(userId);
    return jsonResponse(200, actions);
  } catch (err) {
    return jsonResponse(500, { error: err instanceof Error ? err.message : String(err) });
  }
}