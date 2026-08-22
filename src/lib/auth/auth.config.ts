import type { NextAuthConfig } from "next-auth";
import { canAccessRoute, type Role } from "@/lib/permissions/roles";

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60,
  },
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const path = request.nextUrl.pathname;
      const isProtected = path.startsWith("/dashboard") || path.startsWith("/portal");
      if (!isProtected) return true;
      if (!isLoggedIn) return false;
      if (!auth.user.active) return false;
      return canAccessRoute(auth.user.role as Role, path, auth.user.extraModules ?? []);
    },
    jwt({ token, user, trigger, session }) {
      if (user) {
        token.role = user.role;
        token.active = user.active;
        token.extraModules = user.extraModules ?? [];
      }
      if (trigger === "update" && session) {
        Object.assign(token, session);
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.role = token.role as Role;
        session.user.active = token.active as boolean;
        session.user.impersonating = token.impersonating as boolean | undefined;
        session.user.originalUserId = token.originalUserId as string | undefined;
        session.user.originalUserName = token.originalUserName as string | undefined;
        session.user.extraModules = token.extraModules as string[] | undefined;
      }
      return session;
    },
  },
  providers: [],
};
