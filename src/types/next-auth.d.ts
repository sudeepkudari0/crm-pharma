import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "SYS_ADMIN" | "ADMIN" | "ASSOCIATE";
      avatar: string | null;
      phone: string | null;
      territory: string | null;
      firstLogin: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    role: "SYS_ADMIN" | "ADMIN" | "ASSOCIATE";
    avatar: string | null;
    phone: string | null;
    territory: string | null;
    firstLogin: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: "SYS_ADMIN" | "ADMIN" | "ASSOCIATE";
    avatar: string | null;
    phone: string | null;
    territory: string | null;
    firstLogin: boolean;
  }
}
