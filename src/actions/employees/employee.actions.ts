"use server";

import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth/auth";
import { hashPassword } from "@/lib/auth/password";
import { employeeSchema } from "@/lib/validations/employee.schema";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    throw new Error("Unauthorized");
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
      role: true,
      active: true,
      createdAt: true,
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
      role: true,
      active: true,
    },
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
    password: formData.get("password"),
    role: formData.get("role"),
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
      password: hashedPassword,
      role: parsed.data.role,
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
    password: formData.get("password"),
    role: formData.get("role"),
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

  const updateData: {
  name: string;
  email: string;
  role: "SUPER_ADMIN" | "ADMIN" | "SALES" | "PROFILE_CREATOR" | "SERVICE" | "HR";
  active: boolean;
  password?: string;
} = {
    name: parsed.data.name,
    email: parsed.data.email,
    role: parsed.data.role,
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
