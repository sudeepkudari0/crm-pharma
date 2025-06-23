import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import authConfig from "@/lib/auth/auth.config";
import { getUserById } from "@/data/user";

export const {
  handlers: { GET, POST },
  signIn,
  signOut,
  auth,
} = NextAuth({
  adapter: PrismaAdapter(prisma) as any,
  session: { strategy: "jwt" },
  secret: process.env.AUTH_SECRET,
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") return true;

      if (account?.provider !== "credentials") return true;
      const existingUser = await getUserById(user.id as string);

      if (!existingUser) return false;

      return true;
    },
    async jwt({ token, user, trigger, session: newSessionData }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.name = user.name;
        token.email = user.email;
        token.avatar = user.avatar;
        token.phone = user.phone;
        token.territory = user.territory;
        token.firstLogin = user.firstLogin;
      }

      if (token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: {
            name: true,
            email: true,
            avatar: true,
            role: true,
            phone: true,
            territory: true,
            firstLogin: true,
          },
        });
        if (dbUser) {
          token.name = dbUser.name;
          token.email = dbUser.email;
          token.avatar = dbUser.avatar;
          token.role = dbUser.role;
          token.phone = dbUser.phone;
          token.territory = dbUser.territory;
          token.firstLogin = dbUser.firstLogin;
        } else {
          return null;
        }
      }

      if (trigger === "update" && newSessionData) {
        token = { ...token, ...newSessionData };
      }

      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!;
        session.user.role = token.role as "SYS_ADMIN" | "ADMIN" | "ASSOCIATE";
        session.user.avatar = token.avatar as string | null;
        session.user.name = token.name as string | null;
        session.user.phone = token.phone as string | null;
        session.user.territory = token.territory as string | null;
        session.user.firstLogin = token.firstLogin as boolean;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
  ...authConfig,
});
