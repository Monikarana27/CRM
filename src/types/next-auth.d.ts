import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    role: string;
    active: boolean;
  }
  interface Session {
    user: {
      id: string;
      role: string;
      active: boolean;
      impersonating?: boolean;
      originalUserId?: string;
      originalUserName?: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string;
    active: boolean;
    impersonating?: boolean;
    originalUserId?: string;
    originalUserName?: string;
  }
}