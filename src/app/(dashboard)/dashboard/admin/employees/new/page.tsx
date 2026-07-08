import { DashboardHero } from "@/components/layout/dashboard-hero";
import { EmployeeForm } from "../employee-form";
import { createEmployeeAction } from "@/actions/employees/employee.actions";

export default function NewEmployeePage() {
  return (
    <div className="space-y-6">
      <DashboardHero
        title="Add Employee"
        subtitle="Create a new team member account."
      />
      <EmployeeForm mode="create" action={createEmployeeAction} />
    </div>
  );
}