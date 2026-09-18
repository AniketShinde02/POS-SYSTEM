import { apiSuccess, apiError } from "@/lib/api-response";
import { requirePermission } from "@/lib/auth-helpers";
import { ProductRepository } from "@/repositories/product.repository";
import { productSchema } from "@/validations/product.schema";
import { zodFirstError } from "@/lib/zod-error";

const repo = new ProductRepository();

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission("products.view");
    const tenantId = session.user.tenantId || "default";

    const { id } = await params;
    const product = await repo.findById(id, tenantId);
    if (!product) return apiError("Product not found", 404);

    return apiSuccess(product);
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Unauthorized", 401);
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission("products.update");
    const tenantId = session.user.tenantId || "default";

    const { id } = await params;
    const body = await req.json();

    const parsed = productSchema.partial().safeParse(body);
    if (!parsed.success) {
      return apiError(zodFirstError(parsed.error));
    }

    const updated = await repo.update(id, parsed.data, tenantId);
    if (!updated) return apiError("Product not found", 404);

    return apiSuccess(updated, "Product updated successfully");
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to update product", 400);
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission("products.delete");
    const tenantId = session.user.tenantId || "default";

    const { id } = await params;
    const deleted = await repo.delete(id, tenantId);
    if (!deleted) return apiError("Product not found", 404);

    return apiSuccess(deleted, "Product deleted successfully");
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to delete product", 400);
  }
}
