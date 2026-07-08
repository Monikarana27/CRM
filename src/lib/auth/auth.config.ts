import type { NextAuthConfig } from "next-auth";

// Edge-safe config: NO Prisma / bcrypt imports here.
// Used by middleware for route protection checks only.
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8 hours
  },
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const isDashboard = request.nextUrl.pathname.startsWith("/dashboard");

      if (isDashboard) return isLoggedIn;
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.active = user.active;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.role = token.role as string;
        session.user.active = token.active as boolean;
      }
      return session;
    },
  },
  providers: [], // populated in auth.ts (Node runtime)
};