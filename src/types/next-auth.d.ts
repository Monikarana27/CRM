import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    role: string;
    active: boolean;
    accountType?: "staff" | "client";
    profileId?: string;
  }
  interface Session {
    user: {
      id: string;
      role: string;
      active: boolean;
      impersonating?: boolean;
      originalUserId?: string;
      originalUserName?: string;
      accountType?: "staff" | "client";
      profileId?: string;
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
    accountType?: "staff" | "client";
    profileId?: string;
  }
}