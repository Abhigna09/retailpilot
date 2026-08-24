import "dotenv/config";
import { signup, login } from "../services/authService";

export async function signupHandler(event: any) {
  try {
    const body = JSON.parse(event.body);
    const result = await signup(body);
    return {
      statusCode: result.success ? 200 : 400,
      body: JSON.stringify(result),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
    };
  }
}

export async function loginHandler(event: any) {
  try {
    const body = JSON.parse(event.body);
    const result = await login(body.email, body.password);
    return {
      statusCode: result.success ? 200 : 401,
      body: JSON.stringify(result),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
    };
  }
}