import { apiSuccess, apiError } from "@/lib/api-response";
import { requireAuth, requirePermission } from "@/lib/auth-helpers";
import { CategoryRepository } from "@/repositories/category.repository";
import { categorySchema } from "@/validations/category.schema";

const categoryRepo = new CategoryRepository();

export async function GET() {
  try {
    const session = await requireAuth();
    const tenantId = session.user.tenantId || "default";
    const categories = await categoryRepo.findAll(tenantId);
    return apiSuccess(categories);
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to load categories", 401);
  }
}

export async function POST(req: Request) {
  try {
    const session = await requirePermission("products.manage");
    const tenantId = session.user.tenantId || "default";

    const body = await req.json();
    const parsed = categorySchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message ?? "Invalid category data");
    }

    const data = parsed.data;
    const slug = data.slug?.trim()
      ? data.slug.trim().toLowerCase().replace(/\s+/g, "-")
      : data.name.trim().toLowerCase().replace(/\s+/g, "-");

    const category = await categoryRepo.create(
      {
        name: data.name,
        slug,
        description: data.description,
        image: data.image,
        parentId: data.parentId,
        isActive: data.isActive ?? true,
        branchId: data.branchId,
      },
      tenantId
    );

    return apiSuccess(category, "Category created", 201);
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to create category", 400);
  }
}
