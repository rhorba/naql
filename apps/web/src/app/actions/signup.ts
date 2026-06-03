"use server";

import { signIn } from "@/auth";
import { db } from "@naql/db";
import { organizations, users } from "@naql/db/schema";
import argon2 from "argon2";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { z } from "zod";

const signupSchema = z.object({
  orgName: z.string().min(2).max(100),
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(100),
});

export type SignupResult = { success: true } | { success: false; error: string };

export async function signup(formData: FormData): Promise<SignupResult> {
  const raw = {
    orgName: formData.get("orgName"),
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const parsed = signupSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  const { orgName, name, email, password } = parsed.data;

  const passwordHash = await argon2.hash(password, { type: argon2.argon2id });

  try {
    await db.transaction(async (tx) => {
      const [org] = await tx
        .insert(organizations)
        .values({ name: orgName, plan: "trial", locale: "fr", currency: "MAD" })
        .returning({ id: organizations.id });

      if (!org) throw new Error("org insert failed");

      await tx.insert(users).values({
        organizationId: org.id,
        email: email.toLowerCase(),
        name,
        passwordHash,
        role: "owner",
        isActive: true,
      });
    });

    await signIn("credentials", { email, password, redirectTo: "/fr/dashboard" });

    return { success: true };
  } catch (err) {
    if (isRedirectError(err)) throw err;
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message.includes("unique") || message.includes("duplicate")) {
      return { success: false, error: "Email already registered" };
    }
    return { success: false, error: "Failed to create account" };
  }
}
