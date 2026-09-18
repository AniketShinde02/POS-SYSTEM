import { apiSuccess, apiError } from "@/lib/api-response";
import { adminAuth } from "@/lib/firebase/admin";
import { zodFirstError } from "@/lib/zod-error";
import { forgotPasswordSchema } from "@/validations/auth.schema";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = forgotPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(zodFirstError(parsed.error, "Invalid email"));
    }

    try {
      const resetLink = await adminAuth.generatePasswordResetLink(parsed.data.email);
      console.log("[Firebase Auth] Password reset link:", resetLink);
    } catch {
      // Don't leak whether user exists or not
    }

    return apiSuccess(null, "If the email exists, a reset link was sent");
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed", 500);
  }
}
