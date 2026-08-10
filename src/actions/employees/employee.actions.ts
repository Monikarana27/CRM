"use server";

import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth/auth";
import { hashPassword } from "@/lib/auth/password";
import { employeeSchema } from "@/lib/validations/employee.schema";
import { generateTempPassword } from "@/lib/utils/generate-password";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const ALL_ROLES = [
  "SUPER_ADMIN",
  "ADMIN",
  "SALES",
  "SALES_TL",
  "SALES_MANAGER",
  "PROFILE_CREATOR",
  "SERVICE",
  "SERVICE_TL",
  "SERVICE_MANAGER",
  "HR",
] as const;
type AnyRole = (typeof ALL_ROLES)[number];

const MANAGER_CANDIDATE_ROLES = [
  "SALES_TL",
  "SALES_MANAGER",
  "SERVICE_TL",
  "SERVICE_MANAGER",
  "ADMIN",
  "SUPER_ADMIN",
] as const;

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    redirect(`/dashboard/${(session?.user?.role ?? "login").toLowerCase()}`);
  }
  return session;
}
async function logActivity(actorId: string, action: string, entityId: string) {
  await prisma.activityLog.create({
    data: {
      actorId,
      action,
      entityType: "User",
      entityId,
    },
  });
}

export async function getEmployees() {
  await requireAdmin();
  return prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      department: true,
      role: true,
      active: true,
      createdAt: true,
      managerId: true,
      manager: { select: { id: true, name: true } },
      _count: {
        select: {
          assignedLeads: true,
          assignedProfiles: true,
        },
      },
    },
  });
}

export async function getEmployeeById(id: string) {
  await requireAdmin();
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      department: true,
      role: true,
      active: true,
      managerId: true,
    },
  });
}

/**
 * Returns active users who are structurally eligible to be someone's
 * manager (i.e. hold a TL/Manager/Admin role). The employee-form
 * component filters this list further client-side, based on the
 * currently selected role, so only the correct "next level up" shows.
 */
export async function getEligibleManagerCandidates(excludeUserId?: string) {
  await requireAdmin();
  return prisma.user.findMany({
    where: {
      active: true,
      role: { in: [...MANAGER_CANDIDATE_ROLES] },
      ...(excludeUserId ? { NOT: { id: excludeUserId } } : {}),
    },
    select: { id: true, name: true, role: true },
    orderBy: { name: "asc" },
  });
}

export async function createEmployeeAction(
  _prevState: unknown,
  formData: FormData
) {
  const session = await requireAdmin();

  const parsed = employeeSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    password: formData.get("password"),
    role: formData.get("role"),
    department: formData.get("department"),
    managerId: formData.get("managerId"),
    active: formData.get("active") === "on",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  if (!parsed.data.password) {
    return { error: "Password is required for new employees" };
  }

  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });
  if (existing) {
    return { error: "An employee with this email already exists" };
  }

  const hashedPassword = await hashPassword(parsed.data.password);

  const employee = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone || null,
      password: hashedPassword,
      role: parsed.data.role,
      department: parsed.data.department || null,
      managerId: parsed.data.managerId || null,
      active: parsed.data.active,
    },
  });

  await logActivity(session.user.id, "CREATE_EMPLOYEE", employee.id);

  revalidatePath("/dashboard/admin/employees");
  redirect("/dashboard/admin/employees");
}

export async function updateEmployeeAction(
  id: string,
  _prevState: unknown,
  formData: FormData
) {
  const session = await requireAdmin();

  const parsed = employeeSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    password: formData.get("password"),
    role: formData.get("role"),
    department: formData.get("department"),
    managerId: formData.get("managerId"),
    active: formData.get("active") === "on",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const existing = await prisma.user.findFirst({
    where: { email: parsed.data.email, NOT: { id } },
  });
  if (existing) {
    return { error: "Another employee already uses this email" };
  }

  if (parsed.data.managerId === id) {
    return { error: "An employee cannot report to themselves" };
  }

  const updateData: {
    name: string;
    email: string;
    phone: string | null;
    role: AnyRole;
    department: "SALES_EMP" | "PROFILE_EMP" | "SERVICE_EMP" | "HR_EMP" | null;
    managerId: string | null;
    active: boolean;
    password?: string;
  } = {
    name: parsed.data.name,
    email: parsed.data.email,
    phone: parsed.data.phone || null,
    role: parsed.data.role,
    department: parsed.data.department || null,
    managerId: parsed.data.managerId || null,
    active: parsed.data.active,
  };

  if (parsed.data.password) {
    updateData.password = await hashPassword(parsed.data.password);
  }

  await prisma.user.update({
    where: { id },
    data: updateData,
  });

  await logActivity(session.user.id, "UPDATE_EMPLOYEE", id);

  revalidatePath("/dashboard/admin/employees");
  redirect("/dashboard/admin/employees");
}

export async function toggleEmployeeActiveAction(id: string, active: boolean) {
  const session = await requireAdmin();

  await prisma.user.update({
    where: { id },
    data: { active },
  });

  await logActivity(
    session.user.id,
    active ? "ACTIVATE_EMPLOYEE" : "DEACTIVATE_EMPLOYEE",
    id
  );

  revalidatePath("/dashboard/admin/employees");
}

export async function resetEmployeePasswordAction(id: string) {
  const session = await requireAdmin();

  const tempPassword = generateTempPassword();
  const hashedPassword = await hashPassword(tempPassword);

  await prisma.user.update({
    where: { id },
    data: { password: hashedPassword },
  });

  await logActivity(session.user.id, "RESET_PASSWORD", id);

  revalidatePath("/dashboard/admin/employees");

  return { password: tempPassword };
}