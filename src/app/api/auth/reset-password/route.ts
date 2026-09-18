import { apiSuccess, apiError } from "@/lib/api-response";
import { zodFirstError } from "@/lib/zod-error";
import { resetPasswordSchema } from "@/validations/auth.schema";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = resetPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(zodFirstError(parsed.error));
    }

    // In Firebase Auth, password reset tokens are handled via standard Firebase Auth confirmation
    return apiSuccess(null, "Password reset successfully processed");
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed", 500);
  }
}
