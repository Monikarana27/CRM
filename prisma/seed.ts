import { PrismaClient, Role, Department } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash("Admin@123", 12);
  const salesPassword = await bcrypt.hash("Sales@123", 12);
  const servicePassword = await bcrypt.hash("Service@123", 12);

  await prisma.user.upsert({
    where: { email: "admin@sangamcrm.com" },
    update: {},
    create: {
      name: "Super Admin",
      email: "admin@sangamcrm.com",
      password: adminPassword,
      role: Role.ADMIN,
      active: true,
    },
  });

  await prisma.user.upsert({
    where: { email: "sales@sangamcrm.com" },
    update: {},
    create: {
      name: "Sales Executive",
      email: "sales@sangamcrm.com",
      password: salesPassword,
      role: Role.SALES,
      department: Department.SALES_EMP,
      active: true,
    },
  });

  await prisma.user.upsert({
    where: { email: "service@sangamcrm.com" },
    update: {},
    create: {
      name: "Service Executive",
      email: "service@sangamcrm.com",
      password: servicePassword,
      role: Role.SERVICE,
      department: Department.SERVICE_EMP,
      active: true,
    },
  });

  // --- Real employees ---
  const employees = [
    {
      name: "Maya Verma",
      email: "maya.verma@elitebandhan.com",
      role: Role.SERVICE,
      department: Department.SERVICE_EMP,
      password: "MayaVerma@123",
    },
    {
      name: "Ritika Singh",
      email: "ritika@elitebandhan.com",
      role: Role.SERVICE,
      department: Department.SERVICE_EMP,
      password: "RitikaSingh@123",
    },
    {
      name: "Chandeep Kaur",
      email: "Chandeep.kaur@elitebandhan.com",
      role: Role.SERVICE,
      department: Department.SERVICE_EMP,
      password: "ChandeepKaur@123",
    },
    {
      name: "Madhu bala",
      email: "madhubala.elitebandhan@gmail.com",
      role: Role.SERVICE,
      department: Department.SERVICE_EMP,
      password: "MadhuBala@123",
    },
    {
      name: "Vinita Sharma",
      email: "vinita.elitebandhan@gmail.com",
      role: Role.SALES,
      department: Department.SALES_EMP,
      password: "VinitaSharma@123",
    },
    {
      name: "Preeti Arya",
      email: "preetiarya.elitebandhan@gmail.com",
      role: Role.SALES,
      department: Department.SALES_EMP,
      password: "PreetiArya@123",
    },
    {
      name: "Sushil Kumar Kumar",
      email: "Sushil.elitebandhan@gmail.com",
      role: Role.SALES,
      department: Department.SALES_EMP,
      password: "SushilKumar@123",
    },
    {
      name: "Kunal Kunal",
      email: "Kunal.elitebandhan@gmail.com",
      role: Role.PROFILE_CREATOR,
      department: Department.PROFILE_EMP,
      password: "KunalKunal@123",
    },
  ];

  for (const emp of employees) {
    const hashedPassword = await bcrypt.hash(emp.password, 12);
    await prisma.user.upsert({
      where: { email: emp.email },
      update: {
        department: emp.department,
        role: emp.role,
      },
      create: {
        name: emp.name,
        email: emp.email,
        password: hashedPassword,
        role: emp.role,
        department: emp.department,
        active: true,
      },
    });
  }

  // --- Remove old/unwanted employees not in this list ---
  const keepEmails = [
    "admin@sangamcrm.com",
    "sales@sangamcrm.com",
    "service@sangamcrm.com",
    ...employees.map((e) => e.email),
  ];

  const oldUsers = await prisma.user.findMany({
    where: { email: { notIn: keepEmails } },
    select: { id: true, email: true },
  });
  const oldUserIds = oldUsers.map((u) => u.id);

  if (oldUserIds.length > 0) {
    const adminUser = await prisma.user.findUniqueOrThrow({
      where: { email: "admin@sangamcrm.com" },
      select: { id: true },
    });
    const adminId = adminUser.id;

    // Optional FKs — reassign so leads/profiles/meetings don't go unassigned
    await prisma.profile.updateMany({ where: { assignedToId: { in: oldUserIds } }, data: { assignedToId: adminId } });
    await prisma.lead.updateMany({ where: { assignedToId: { in: oldUserIds } }, data: { assignedToId: adminId } });
    await prisma.meeting.updateMany({ where: { assignedToId: { in: oldUserIds } }, data: { assignedToId: adminId } });
    await prisma.callLog.updateMany({ where: { createdById: { in: oldUserIds } }, data: { createdById: adminId } });
    await prisma.profileQueue.updateMany({ where: { sentById: { in: oldUserIds } }, data: { sentById: adminId } });

    // Required FKs (Restrict) — must reassign or the delete below will fail
    await prisma.leadRemark.updateMany({ where: { actorId: { in: oldUserIds } }, data: { actorId: adminId } });
    await prisma.workspaceMessage.updateMany({ where: { authorId: { in: oldUserIds } }, data: { authorId: adminId } });
    await prisma.workspaceMention.updateMany({ where: { mentionedUserId: { in: oldUserIds } }, data: { mentionedUserId: adminId } });
    await prisma.leadAssignmentHistory.updateMany({ where: { changedById: { in: oldUserIds } }, data: { changedById: adminId } });
    await prisma.leadAssignmentHistory.updateMany({ where: { fromEmployeeId: { in: oldUserIds } }, data: { fromEmployeeId: adminId } });
    await prisma.leadAssignmentHistory.updateMany({ where: { toEmployeeId: { in: oldUserIds } }, data: { toEmployeeId: adminId } });

    // Required FKs (Cascade) — these are per-employee personal history
    // (attendance, payroll, etc). Deleting the user cascades them anyway,
    // so we delete explicitly here for clarity/logging.
    await prisma.salesTarget.deleteMany({ where: { userId: { in: oldUserIds } } });
    await prisma.attendance.deleteMany({ where: { userId: { in: oldUserIds } } });
    await prisma.payroll.deleteMany({ where: { userId: { in: oldUserIds } } });
    await prisma.leaveRequest.deleteMany({ where: { userId: { in: oldUserIds } } });
    await prisma.performanceReview.deleteMany({ where: { userId: { in: oldUserIds } } });
    await prisma.loginEvent.deleteMany({ where: { userId: { in: oldUserIds } } });
    await prisma.activityLog.deleteMany({ where: { actorId: { in: oldUserIds } } });
    // Notification.recipientId/actorId are Cascade/SetNull — handled automatically on delete
  }

  const deleted = await prisma.user.deleteMany({
    where: { email: { notIn: keepEmails } },
  });

  console.log("Seed completed:");
  console.log("  admin@sangamcrm.com   / Admin@123   (ADMIN)");
  console.log("  sales@sangamcrm.com   / Sales@123   (SALES)");
  console.log("  service@sangamcrm.com / Service@123 (SERVICE)");
  console.log("  8 real employees seeded (SERVICE / SALES / PROFILE_CREATOR)");
  console.log(`  Removed ${deleted.count} old user(s); their leads/profiles/meetings reassigned to admin`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });


  