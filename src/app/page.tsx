import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";

const ROLE_ROUTE_MAP: Record<string, string> = {
  SUPER_ADMIN: "admin",
  ADMIN: "admin",
  SALES: "sales",
  SERVICE: "service",
  PROFILE_CREATOR: "admin",
  HR: "admin",
};

export default async function HomePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const route = ROLE_ROUTE_MAP[session.user.role] ?? session.user.role.toLowerCase();
  redirect(`/dashboard/${route}`);
}
