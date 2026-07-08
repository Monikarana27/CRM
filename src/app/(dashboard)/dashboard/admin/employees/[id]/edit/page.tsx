import { notFound } from "next/navigation";
import { DashboardHero } from "@/components/layout/dashboard-hero";
import { EmployeeForm } from "../../employee-form";
import {
  getEmployeeById,
  updateEmployeeAction,
} from "@/actions/employees/employee.actions";

export default async function EditEmployeePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const employee = await getEmployeeById(id);

  if (!employee) {
    notFound();
  }

  const boundAction = updateEmployeeAction.bind(null, id);

  return (
    <div className="space-y-6">
      <DashboardHero
        title="Edit Employee"
        subtitle={`Update details for ${employee.name}.`}
      />
      <EmployeeForm
        mode="edit"
        defaultValues={employee}
        action={boundAction}
      />
    </div>
  );
}