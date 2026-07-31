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

  console.log("Seed completed:");
  console.log("  admin@sangamcrm.com   / Admin@123   (ADMIN)");
  console.log("  sales@sangamcrm.com   / Sales@123   (SALES)");
  console.log("  service@sangamcrm.com / Service@123 (SERVICE)");
  console.log("  8 real employees seeded (SERVICE / SALES / PROFILE_CREATOR)");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });