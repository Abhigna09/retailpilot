import "dotenv/config";
import { signup, login } from "../services/authService";
import { jsonResponse } from "../shared/response";

export async function signupHandler(event: any) {
  try {
    const body = JSON.parse(event.body);
    const result = await signup(body);
    return jsonResponse(result.success ? 200 : 400, result);
  } catch (err) {
    return jsonResponse(500, { error: err instanceof Error ? err.message : String(err) });
  }
}

export async function loginHandler(event: any) {
  try {
    const body = JSON.parse(event.body);
    const result = await login(body.email, body.password);
    return jsonResponse(result.success ? 200 : 401, result);
  } catch (err) {
    return jsonResponse(500, { error: err instanceof Error ? err.message : String(err) });
  }
}