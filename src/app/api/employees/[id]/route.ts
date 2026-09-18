import { apiSuccess, apiError } from "@/lib/api-response";
import { requirePermission } from "@/lib/auth-helpers";
import { adminAuth } from "@/lib/firebase/admin";
import { zodFirstError } from "@/lib/zod-error";
import { EmployeeRepository } from "@/repositories/employee.repository";
import { employeeUpdateSchema } from "@/validations/employee.schema";

const repo = new EmployeeRepository();

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission("employees.manage");
    const tenantId = session.user.tenantId || "default";

    const { id } = await params;
    const employee = await repo.findById(id, tenantId);
    if (!employee) return apiError("Employee not found", 404);
    return apiSuccess(employee);
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed", 401);
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission("employees.manage");
    const tenantId = session.user.tenantId || "default";

    const { id } = await params;
    const body = await req.json();
    const parsed = employeeUpdateSchema.safeParse(body);
    if (!parsed.success) return apiError(zodFirstError(parsed.error));

    // Update password in Firebase Auth if provided
    if (parsed.data.password) {
      try {
        await adminAuth.updateUser(id, { password: parsed.data.password });
      } catch (err: unknown) {
        const e = err as Error;
        return apiError(e.message || "Failed to update user password in Firebase Auth", 400);
      }
    }

    const updateData = {
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone,
      role: parsed.data.role,
      branchId: parsed.data.branchId,
    };

    const employee = await repo.update(id, updateData, tenantId);
    if (!employee) return apiError("Employee not found", 404);

    return apiSuccess(employee, "Employee updated");
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed", 400);
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission("employees.manage");
    const tenantId = session.user.tenantId || "default";

    const { id } = await params;
    await repo.delete(id, tenantId);

    try {
      await adminAuth.updateUser(id, { disabled: true });
    } catch {
      // Ignore if user doesn't exist in Auth
    }

    return apiSuccess(null, "Employee deactivated");
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed", 401);
  }
}
