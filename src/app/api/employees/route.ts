import { apiSuccess, apiError, apiAuthError } from "@/lib/api-response";
import { requirePermission } from "@/lib/auth-helpers";
import { adminAuth } from "@/lib/firebase/admin";
import { zodFirstError } from "@/lib/zod-error";
import { EmployeeRepository } from "@/repositories/employee.repository";
import { employeeCreateSchema } from "@/validations/employee.schema";

const repo = new EmployeeRepository();

export async function GET(req: Request) {
  try {
    const session = await requirePermission("employees.manage");
    const tenantId = session.user.tenantId || "default";

    const { searchParams } = new URL(req.url);
    const result = await repo.paginate(
      {
        page: Number(searchParams.get("page") ?? 1),
        limit: Number(searchParams.get("limit") ?? 50),
        search: searchParams.get("search") ?? undefined,
      },
      tenantId
    );
    return apiSuccess(result);
  } catch (e) {
    return apiAuthError(e);
  }
}

export async function POST(req: Request) {
  try {
    const session = await requirePermission("employees.manage");
    const tenantId = session.user.tenantId || "default";

    const body = await req.json();
    const parsed = employeeCreateSchema.safeParse(body);
    if (!parsed.success) return apiError(zodFirstError(parsed.error));

    // 1. Create Firebase Auth user
    let uid: string;
    try {
      const fbUser = await adminAuth.createUser({
        email: parsed.data.email,
        password: parsed.data.password,
        displayName: parsed.data.name,
      });
      uid = fbUser.uid;

      // Assign custom claims server-side
      await adminAuth.setCustomUserClaims(uid, {
        role: parsed.data.role,
        tenantId,
        branchId: parsed.data.branchId || "",
      });
    } catch (err: unknown) {
      const e = err as Error;
      return apiError(e.message || "Failed to create user in Firebase Auth", 400);
    }

    // 2. Save Firestore user profile
    const employee = await repo.create(
      {
        id: uid,
        _id: uid,
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone,
        role: parsed.data.role,
        employeeId: parsed.data.employeeId,
        branchId: parsed.data.branchId,
        isActive: parsed.data.isActive,
        permissions: parsed.data.permissions || [],
      },
      tenantId
    );

    return apiSuccess(employee, "Employee created successfully", 201);
  } catch (e) {
    return apiAuthError(e);
  }
}
