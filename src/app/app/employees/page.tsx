import { requireWorkspaceProduct } from "@/lib/workspace/product-actions";
import {
  addEmployeeAction,
  removeEmployeeAction,
} from "@/lib/employees/actions";
import { getEmployees } from "@/lib/employees/queries";
import { PageHeader } from "@/components/recruiter/recruiter-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default async function EmployeesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const membership = await requireWorkspaceProduct("employees");
  const employees = await getEmployees(membership.workspace.id);
  const { error } = await searchParams;

  return (
    <>
      <PageHeader
        title="Employees"
        subtitle={`${employees.length} people on your roster`}
      />

      <div className="grid gap-6 px-8 py-6 lg:grid-cols-[1fr_1.2fr]">
        <form
          action={addEmployeeAction}
          className="rounded-2xl border border-hairline p-6"
        >
          <h2 className="text-[15px] font-semibold">Add employee</h2>
          <p className="mt-1.5 text-[13px] text-muted">
            Track name and email for people already on your team.
          </p>

          {error === "invalid" && (
            <p className="mt-4 rounded-[10px] bg-[#FDF5F0] px-3 py-2.5 text-sm font-medium text-pass">
              Enter a name and a valid email.
            </p>
          )}
          {error === "duplicate" && (
            <p className="mt-4 rounded-[10px] bg-[#FDF5F0] px-3 py-2.5 text-sm font-medium text-pass">
              That email is already on the roster.
            </p>
          )}
          {error === "forbidden" && (
            <p className="mt-4 rounded-[10px] bg-[#FDF5F0] px-3 py-2.5 text-sm font-medium text-pass">
              You don’t have permission to change the roster.
            </p>
          )}

          <label className="mt-5 block text-[12.5px] font-semibold text-muted">
            Full name
            <Input name="name" required className="mt-1.5" placeholder="Alex Rivera" />
          </label>
          <label className="mt-4 block text-[12.5px] font-semibold text-muted">
            Work email
            <Input
              name="email"
              type="email"
              required
              className="mt-1.5"
              placeholder="alex@company.com"
            />
          </label>
          <Button type="submit" className="mt-5">
            Add employee
          </Button>
        </form>

        <div className="overflow-hidden rounded-2xl border border-hairline">
          {employees.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <h2 className="font-display text-[22px] font-medium">No employees yet</h2>
              <p className="mt-2 text-[14px] text-muted">
                Add people to build your internal roster.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-hairline-2">
              {employees.map((employee) => (
                <li
                  key={employee.id}
                  className="flex items-center justify-between gap-4 px-5 py-4"
                >
                  <div className="min-w-0">
                    <div className="truncate text-[14px] font-semibold">
                      {employee.name}
                    </div>
                    <div className="truncate text-[13px] text-faint">{employee.email}</div>
                  </div>
                  <form action={removeEmployeeAction}>
                    <input type="hidden" name="employeeId" value={employee.id} />
                    <Button type="submit" variant="secondary" size="sm">
                      Remove
                    </Button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
