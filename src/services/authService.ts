import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { User } from "../models/user";
import { putItem, getItem } from "./dbClient";

export interface SignupInput {
  email: string;
  password: string;
  storeName: string;
}

export interface AuthResult {
  success: boolean;
  userId?: string;
  storeName?: string;
  reason: string;
}

export async function signup(input: SignupInput): Promise<AuthResult> {
  const existing = await findUserByEmail(input.email);
  if (existing) {
    return { success: false, reason: "An account with this email already exists." };
  }

  const userId = randomUUID();
  const passwordHash = await bcrypt.hash(input.password, 10);

  const user: User = {
    userId,
    email: input.email,
    passwordHash,
    storeName: input.storeName,
    createdAt: new Date().toISOString(),
  };

  await putItem({
    PK: `USER#${userId}`,
    SK: "PROFILE",
    ...user,
  });

  await putItem({
    PK: `EMAIL#${input.email}`,
    SK: "MAPPING",
    userId,
  });

  return { success: true, userId, storeName: user.storeName, reason: "Account created." };
}

export async function login(email: string, password: string): Promise<AuthResult> {
  const user = await findUserByEmail(email);
  if (!user) {
    return { success: false, reason: "No account found with this email." };
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return { success: false, reason: "Incorrect password." };
  }

  return { success: true, userId: user.userId, storeName: user.storeName, reason: "Login successful." };
}

async function findUserByEmail(email: string): Promise<User | undefined> {
  const mapping = await getItem(`EMAIL#${email}`, "MAPPING");
  if (!mapping) return undefined;
  const profile = await getItem(`USER#${mapping.userId}`, "PROFILE");
  return profile as User | undefined;
}