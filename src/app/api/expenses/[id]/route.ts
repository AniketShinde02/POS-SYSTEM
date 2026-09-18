import { apiSuccess, apiError } from "@/lib/api-response";
import { requirePermission } from "@/lib/auth-helpers";
import { ExpenseRepository } from "@/repositories/expense.repository";
import { zodFirstError } from "@/lib/zod-error";
import { expenseSchema } from "@/validations/expense.schema";

const repo = new ExpenseRepository();

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission("expenses.manage");
    const tenantId = session.user.tenantId || "default";

    const { id } = await params;
    const expense = await repo.findById(id, tenantId);
    if (!expense) return apiError("Expense not found", 404);
    return apiSuccess(expense);
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed", 401);
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission("expenses.manage");
    const tenantId = session.user.tenantId || "default";

    const { id } = await params;
    const body = await req.json();
    const parsed = expenseSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(zodFirstError(parsed.error));
    }

    const data = parsed.data;
    const expense = await repo.update(
      id,
      {
        title: data.title,
        category: data.category,
        amount: data.amount,
        date: data.date ? new Date(data.date).toISOString() : new Date().toISOString(),
        description: data.description,
        branchId: data.branchId,
      },
      tenantId
    );
    if (!expense) return apiError("Expense not found", 404);
    return apiSuccess(expense, "Expense updated");
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed", 400);
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission("expenses.manage");
    const tenantId = session.user.tenantId || "default";

    const { id } = await params;
    await repo.delete(id, tenantId);
    return apiSuccess(null, "Expense deleted");
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed", 400);
  }
}
