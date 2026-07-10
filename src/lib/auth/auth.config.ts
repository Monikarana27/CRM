
import type { NextAuthConfig } from "next-auth";

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
      const isDashboard = request.nextUrl.pathname.startsWith("/dashboard");
      if (isDashboard) return isLoggedIn;
      return true;
    },
    jwt({ token, user, trigger, session }) {
      if (user) {
        token.role = user.role;
        token.active = user.active;
      }
      if (trigger === "update" && session) {
        Object.assign(token, session);
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.role = token.role as string;
        session.user.active = token.active as boolean;
        session.user.impersonating = token.impersonating as boolean | undefined;
        session.user.originalUserId = token.originalUserId as string | undefined;
        session.user.originalUserName = token.originalUserName as string | undefined;
      }
      return session;
    },
  },
  providers: [],
};
