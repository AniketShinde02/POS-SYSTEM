"use client";

import { useEffect, useState } from "react";
import { Plus, Edit3, Trash2 } from "lucide-react";
import { EmployeeFormDialog, type EmployeeRecord } from "@/components/employees/employee-form-dialog";
import { ModulePage } from "@/components/shared/module-page";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/use-debounce";

export function EmployeesPage() {
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeRecord | null>(null);

  const loadEmployees = async (query = "") => {
    setIsLoading(true);
    try {
      const url = `/api/employees${query ? `?search=${encodeURIComponent(query)}` : ""}`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        setEmployees(json.data.items ?? []);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees(debouncedSearch);
  }, [debouncedSearch]);

  const openCreate = () => {
    setSelectedEmployee(null);
    setDialogOpen(true);
  };

  const openEdit = (employee: EmployeeRecord) => {
    setSelectedEmployee(employee);
    setDialogOpen(true);
  };

  const handleDelete = async (employee: EmployeeRecord) => {
    const confirmed = window.confirm(`Delete employee "${employee.name}"?`);
    if (!confirmed) return;

    const res = await fetch(`/api/employees/${employee._id}`, { method: "DELETE" });
    const json = await res.json();
    if (json.success) {
      setEmployees((current) => current.filter((item) => item._id !== employee._id));
    }
  };

  return (
    <ModulePage title="Employees" description="Manage employee accounts, roles, and access.">
      <Card className="border-zinc-800 bg-zinc-950 shadow-xl">
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-zinc-800/80 pb-4">
          <div>
            <CardTitle className="text-zinc-100">Employee Directory</CardTitle>
            <p className="text-sm text-zinc-400">
              Add, edit, or deactivate team members and assign the right access role.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Input
              placeholder="Search employees..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="max-w-sm bg-zinc-900 border-zinc-800 text-zinc-100 focus:border-[#E85002]"
            />
            <Button variant="brandGradient" onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Add Employee
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto rounded-xl border border-zinc-800/80 bg-zinc-950">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/60 text-left text-zinc-400">
                  <th className="py-3 px-4 font-medium">ID</th>
                  <th className="py-3 px-4 font-medium">Name</th>
                  <th className="py-3 px-4 font-medium">Email</th>
                  <th className="py-3 px-4 font-medium">Role</th>
                  <th className="py-3 px-4 font-medium">Phone</th>
                  <th className="py-3 px-4 font-medium">Status</th>
                  <th className="py-3 px-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {employees.map((employee) => (
                  <tr key={employee._id} className="hover:bg-zinc-900/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="font-mono text-xs font-semibold text-[#E85002]">
                        {employee.employeeId || "—"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-zinc-100">{employee.name}</td>
                    <td className="py-3.5 px-4 text-zinc-400">{employee.email}</td>
                    <td className="py-3.5 px-4">
                      <Badge variant="outline" className="capitalize font-medium border-zinc-800 text-zinc-300">
                        {employee.role}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-zinc-400">{employee.phone || "—"}</td>
                    <td className="py-3.5 px-4">
                      <Badge variant={employee.isActive ? "success" : "secondary"}>
                        {employee.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <Button type="button" variant="outline" size="sm" className="h-8 w-8 p-0 border-zinc-800 text-zinc-300 hover:bg-zinc-800" onClick={() => openEdit(employee)} aria-label="Edit employee">
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button type="button" variant="destructive" size="sm" className="h-8 w-8 p-0" onClick={() => handleDelete(employee)} aria-label="Delete employee">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Responsive Cards */}
          <div className="space-y-3 md:hidden">
            {employees.map((employee) => (
              <div
                key={employee._id}
                className="flex flex-col gap-2.5 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-zinc-100 text-sm">{employee.name}</h3>
                    <p className="text-xs text-zinc-400">{employee.email}</p>
                  </div>
                  <Badge variant={employee.isActive ? "success" : "secondary"}>
                    {employee.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="font-mono text-xs font-semibold text-[#E85002] bg-[#E85002]/10 border border-[#E85002]/20 px-2 py-0.5 rounded">
                    {employee.employeeId || "No ID"}
                  </span>
                  <Badge variant="outline" className="capitalize font-medium text-xs border-zinc-800 text-zinc-300">
                    {employee.role}
                  </Badge>
                  {employee.phone && (
                    <span className="text-xs text-zinc-400">
                      📞 {employee.phone}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-end gap-2 border-t border-zinc-800 pt-2.5">
                  <Button type="button" variant="outline" size="sm" className="h-8 text-xs border-zinc-800 text-zinc-300 hover:bg-zinc-800" onClick={() => openEdit(employee)}>
                    <Edit3 className="mr-1.5 h-3.5 w-3.5" />
                    Edit
                  </Button>
                  <Button type="button" variant="destructive" size="sm" className="h-8 text-xs" onClick={() => handleDelete(employee)}>
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {!isLoading && employees.length === 0 && (
            <p className="py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
              No employees found. Add your first employee to get started.
            </p>
          )}
          {isLoading && (
            <p className="py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">Loading employees...</p>
          )}
        </CardContent>
      </Card>

      <EmployeeFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        employee={selectedEmployee}
        onSuccess={() => loadEmployees(debouncedSearch)}
      />
    </ModulePage>
  );
}
