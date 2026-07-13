import { PrismaClient, Role, PermissionAction } from "@prisma/client";
const prisma = new PrismaClient();

const MODULES = ["Leads", "Conversion", "ProfileCreation", "Profiles", "Service", "Employees", "Settings"];

const MATRIX: Record<Role, Record<string, PermissionAction>> = {
  SUPER_ADMIN: Object.fromEntries(MODULES.map((m) => [m, "FULL"])) as any,
  ADMIN: {
    Leads: "FULL", Conversion: "VIEW", ProfileCreation: "APPROVE", Profiles: "FULL",
    Service: "ASSIGN", Employees: "FULL", Settings: "VIEW",
  },
  SALES: { Leads: "EDIT", Conversion: "CREATE", Profiles: "VIEW" } as any,
  PROFILE_CREATOR: { ProfileCreation: "CREATE", Profiles: "CREATE" } as any,
  SERVICE: { Profiles: "VIEW", Service: "FULL" } as any,
  HR: { Employees: "FULL" } as any,
};

async function main() {
  for (const module of MODULES) {
    for (const action of ["VIEW", "CREATE", "EDIT", "APPROVE", "ASSIGN", "FULL"] as PermissionAction[]) {
      await prisma.permission.upsert({
        where: { module_action: { module, action } },
        update: {},
        create: { module, action },
      });
    }
  }

  for (const [role, modules] of Object.entries(MATRIX)) {
    for (const [module, action] of Object.entries(modules)) {
      const perm = await prisma.permission.findUnique({ where: { module_action: { module, action: action as PermissionAction } } });
      if (!perm) continue;
      await prisma.rolePermission.upsert({
        where: { role_permissionId: { role: role as Role, permissionId: perm.id } },
        update: {},
        create: { role: role as Role, permissionId: perm.id },
      });
    }
  }
  console.log("Permission matrix seeded.");
}

main().then(() => prisma.$disconnect());