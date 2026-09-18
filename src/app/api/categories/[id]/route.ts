import { apiSuccess, apiError } from "@/lib/api-response";
import { requirePermission } from "@/lib/auth-helpers";
import { CategoryRepository } from "@/repositories/category.repository";
import { categorySchema } from "@/validations/category.schema";

const categoryRepo = new CategoryRepository();

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission("categories.view");
    const tenantId = session.user.tenantId || "default";

    const { id } = await params;
    const category = await categoryRepo.findById(id, tenantId);
    if (!category) return apiError("Category not found", 404);

    return apiSuccess(category);
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Unauthorized", 401);
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission("categories.manage");
    const tenantId = session.user.tenantId || "default";

    const { id } = await params;
    const body = await req.json();
    const parsed = categorySchema.partial().safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message ?? "Invalid category data");
    }

    const updated = await categoryRepo.update(id, parsed.data, tenantId);
    if (!updated) return apiError("Category not found", 404);

    return apiSuccess(updated, "Category updated successfully");
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to update category", 400);
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission("categories.manage");
    const tenantId = session.user.tenantId || "default";

    const { id } = await params;
    const deleted = await categoryRepo.delete(id, tenantId);
    if (!deleted) return apiError("Category not found", 404);

    return apiSuccess(deleted, "Category deleted successfully");
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to delete category", 400);
  }
}
