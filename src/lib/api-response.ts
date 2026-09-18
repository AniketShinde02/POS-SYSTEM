import { NextResponse } from "next/server";
import type { ApiResponse } from "@/types";

export function apiSuccess<T>(data: T, message?: string, status = 200) {
  const body: ApiResponse<T> = { success: true, data, message };
  return NextResponse.json(body, { status });
}

export function apiError(error: string, status = 400) {
  const body: ApiResponse = { success: false, error };
  return NextResponse.json(body, { status });
}

/**
 * Converts a thrown Error to the correct HTTP status code and returns an apiError response.
 * - "Unauthorized" → 401
 * - "Forbidden"    → 403
 * - anything else  → provided defaultStatus (400)
 */
export function apiAuthError(e: unknown, defaultStatus = 400) {
  if (e instanceof Error) {
    if (e.message === "Unauthorized") return apiError("Unauthorized", 401);
    if (e.message === "Forbidden") return apiError("Forbidden", 403);
    return apiError(e.message, defaultStatus);
  }
  return apiError("An unexpected error occurred", defaultStatus);
}
