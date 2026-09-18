import { apiSuccess, apiError } from "@/lib/api-response";
import { zodFirstError } from "@/lib/zod-error";
import { NotificationRepository } from "@/repositories/notification.repository";
import { notificationUpdateSchema } from "@/validations/notification.schema";

const repo = new NotificationRepository();

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const notification = await repo.findById(id);
    if (!notification) return apiError("Notification not found", 404);
    return apiSuccess(notification);
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed", 401);
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = notificationUpdateSchema.safeParse(body);
    if (!parsed.success) return apiError(zodFirstError(parsed.error));

    const notification = await repo.update(id, {
      read: parsed.data.isRead !== undefined ? parsed.data.isRead : undefined,
    });
    if (!notification) return apiError("Notification not found", 404);
    return apiSuccess(notification, "Notification updated");
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed", 400);
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await repo.delete(id);
    return apiSuccess(null, "Notification deleted");
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed", 401);
  }
}
